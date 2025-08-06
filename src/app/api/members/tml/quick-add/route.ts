import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Simplified schema for quick add - firstName/lastName now optional 
const quickAddSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// POST /api/members/tml/quick-add - Quick add TML member with minimal info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = quickAddSchema.parse(body);

    // Check if email already exists
    const existingMember = await prisma.tmlMembers.findUnique({
      where: { email: validatedData.email },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "Email address already exists" },
        { status: 400 }
      );
    }

    // Clean up empty strings to null
    const cleanData = {
      firstName: validatedData.firstName || null,
      lastName: validatedData.lastName || null,
      companyName: validatedData.companyName || null,
      email: validatedData.email,
      isActive: validatedData.isActive,
    };

    const newMember = await prisma.tmlMembers.create({
      data: cleanData,
    });

    return NextResponse.json({
      success: true,
      data: newMember,
      message: "TML member created successfully",
    });

  } catch (error) {
    console.error("Error creating TML member:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create TML member" },
      { status: 500 }
    );
  }
}