import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for code validation request
const validateCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

// POST /api/exhibitor-codes/validate - Validate exhibitor code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = validateCodeSchema.parse(body);

    // Find the code in the database
    const exhibitorCode = await prisma.exhibitorCodeDistribution.findUnique({
      where: { 
        code: code.toUpperCase() 
      },
    });

    // If code doesn't exist
    if (!exhibitorCode) {
      return NextResponse.json({
        success: true,
        isValid: false,
        isActive: false,
        message: "Exhibitor code not found",
      });
    }

    // If code exists but is inactive
    if (!exhibitorCode.isActive) {
      return NextResponse.json({
        success: true,
        isValid: false,
        isActive: false,
        message: "Exhibitor code is inactive",
      });
    }

    // If code is already used
    if (exhibitorCode.userId) {
      return NextResponse.json({
        success: true,
        isValid: false,
        isActive: true,
        message: "Exhibitor code has already been used",
      });
    }

    // Code is valid and available
    return NextResponse.json({
      success: true,
      isValid: true,
      isActive: true,
      message: "Exhibitor code is valid and available",
    });

  } catch (error) {
    console.error("Error validating exhibitor code:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to validate exhibitor code" 
      },
      { status: 500 }
    );
  }
}

// GET /api/exhibitor-codes/validate?code=EXHIBITOR123 - Alternative GET method for validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { 
          success: false,
          error: "Code parameter is required" 
        },
        { status: 400 }
      );
    }

    const exhibitorCode = await prisma.exhibitorCodeDistribution.findUnique({
      where: { 
        code: code.toUpperCase() 
      },
    });

    if (!exhibitorCode) {
      return NextResponse.json({
        success: true,
        isValid: false,
        isActive: false,
        message: "Exhibitor code not found",
      });
    }

    if (!exhibitorCode.isActive) {
      return NextResponse.json({
        success: true,
        isValid: false,
        isActive: false,
        message: "Exhibitor code is inactive",
      });
    }

    if (exhibitorCode.userId) {
      return NextResponse.json({
        success: true,
        isValid: false,
        isActive: true,
        message: "Exhibitor code has already been used",
      });
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      isActive: true,
      message: "Exhibitor code is valid and available",
    });

  } catch (error) {
    console.error("Error validating exhibitor code:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to validate exhibitor code" 
      },
      { status: 500 }
    );
  }
}