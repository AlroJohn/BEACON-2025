import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for exhibitor codes
const exhibitorCodeSchema = z.object({
  code: z.string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, underscores, and hyphens"),
  isActive: z.boolean().default(false),
});

// GET /api/exhibitor-codes - Fetch all exhibitor codes
export async function GET() {
  try {
    const codes = await prisma.exhibitorCodeDistribution.findMany({
      include: {
        user: {
          select: {
            id: true,
            user_details: {
              select: {
                firstName: true,
                lastName: true,
              }
            },
            user_accounts: {
              select: {
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: codes,
    });
  } catch (error) {
    console.error("Error fetching exhibitor codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch exhibitor codes" },
      { status: 500 }
    );
  }
}

// POST /api/exhibitor-codes - Create new exhibitor code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = exhibitorCodeSchema.parse(body);

    // Check if code already exists
    const existingCode = await prisma.exhibitorCodeDistribution.findUnique({
      where: { code: validatedData.code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Exhibitor code already exists" },
        { status: 400 }
      );
    }

    const newCode = await prisma.exhibitorCodeDistribution.create({
      data: {
        code: validatedData.code.toUpperCase(),
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: newCode,
      message: "Exhibitor code created successfully",
    });

  } catch (error) {
    console.error("Error creating exhibitor code:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create exhibitor code" },
      { status: 500 }
    );
  }
}

// PUT /api/exhibitor-codes - Update existing exhibitor code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      code,
      isActive,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Exhibitor code ID is required" },
        { status: 400 }
      );
    }

    // Check if code exists
    const existingCode = await prisma.exhibitorCodeDistribution.findUnique({
      where: { id },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Exhibitor code not found" },
        { status: 404 }
      );
    }

    // If code is being changed, check if new code already exists
    if (code && code.toUpperCase() !== existingCode.code) {
      const duplicateCode = await prisma.exhibitorCodeDistribution.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { error: "Exhibitor code already exists" },
          { status: 400 }
        );
      }
    }

    // Update the code
    const updatedCode = await prisma.exhibitorCodeDistribution.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCode,
      message: "Exhibitor code updated successfully",
    });

  } catch (error) {
    console.error("Error updating exhibitor code:", error);
    return NextResponse.json(
      { error: "Failed to update exhibitor code" },
      { status: 500 }
    );
  }
}

// DELETE /api/exhibitor-codes - Delete exhibitor code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Exhibitor code ID is required" },
        { status: 400 }
      );
    }

    // Check if code exists
    const existingCode = await prisma.exhibitorCodeDistribution.findUnique({
      where: { id },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Exhibitor code not found" },
        { status: 404 }
      );
    }

    // Check if code has been used (has userId)
    if (existingCode.userId) {
      return NextResponse.json(
        {
          error: "Cannot delete exhibitor code that has been used by a member. Please deactivate the code instead."
        },
        { status: 400 }
      );
    }

    // Delete the code
    await prisma.exhibitorCodeDistribution.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Exhibitor code deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting exhibitor code:", error);
    return NextResponse.json(
      { error: "Failed to delete exhibitor code" },
      { status: 500 }
    );
  }
}