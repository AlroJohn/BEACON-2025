import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for quick add - only email required
const quickAddSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  companyName: z.string().max(255, "Company name too long").optional().nullable(),
  isActive: z.boolean().default(true),
});

// POST /api/members/exhibitor/quick-add - Create minimal exhibitor member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = quickAddSchema.parse(body);

    // Check if email already exists
    const existingMember = await prisma.exhibitorMembers.findUnique({
      where: { email: validatedData.email },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "Email address already exists" },
        { status: 400 }
      );
    }

    const newMember = await prisma.exhibitorMembers.create({
      data: {
        email: validatedData.email,
        companyName: validatedData.companyName,
        isActive: validatedData.isActive,
        // All other fields are optional and will be null by default
      },
    });

    return NextResponse.json({
      success: true,
      data: newMember,
      message: "Exhibitor member created successfully with minimal info",
    });

  } catch (error) {
    console.error("Error creating minimal exhibitor member:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create exhibitor member" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}