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
      include: {
        user: {
          select: {
            id: true,
            user_accounts: {
              select: {
                email: true
              }
            },
            user_details: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // If code doesn't exist
    if (!exhibitorCode) {
      return NextResponse.json({
        success: false,
        isValid: false,
        isActive: false,
        message: "The Exhibitor member code you entered is not valid.",
        error: "Invalid code"
      }, { status: 400 });
    }

    // If code exists but is inactive
    if (!exhibitorCode.isActive) {
      return NextResponse.json({
        success: false,
        isValid: false,
        isActive: false,
        message: "This Exhibitor member code is not active anymore and cannot be used for registration.",
        error: "Inactive code"
      }, { status: 400 });
    }

    // If code is already used
    if (exhibitorCode.userId) {
      return NextResponse.json({
        success: false,
        isValid: false,
        isActive: true,
        message: "This Exhibitor member code has already been used by another user.",
        error: "Code already used",
        usedBy: exhibitorCode.user ? {
          name: `${exhibitorCode.user.user_details[0]?.firstName} ${exhibitorCode.user.user_details[0]?.lastName}`,
          email: exhibitorCode.user.user_accounts[0]?.email
        } : null
      }, { status: 409 });
    }

    // Code is valid and available
    return NextResponse.json({
      success: true,
      message: "Valid Exhibitor member code",
      data: {
        code: exhibitorCode.code,
        isValid: true,
        benefits: [
          'Early access to booth selection',
          'Exhibitor lounge access',
          'Discounted booth rates',
          'Priority marketing opportunities',
          'Extended setup/teardown periods'
        ]
      }
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
      include: {
        user: {
          select: {
            id: true,
            user_accounts: {
              select: {
                email: true
              }
            },
            user_details: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!exhibitorCode) {
      return NextResponse.json({
        success: false,
        isValid: false,
        isActive: false,
        message: "The Exhibitor member code you entered is not valid.",
        error: "Invalid code"
      }, { status: 400 });
    }

    if (!exhibitorCode.isActive) {
      return NextResponse.json({
        success: false,
        isValid: false,
        isActive: false,
        message: "This Exhibitor member code is not active anymore and cannot be used for registration.",
        error: "Inactive code"
      }, { status: 400 });
    }

    if (exhibitorCode.userId) {
      return NextResponse.json({
        success: false,
        isValid: false,
        isActive: true,
        message: "This Exhibitor member code has already been used by another user.",
        error: "Code already used",
        usedBy: exhibitorCode.user ? {
          name: `${exhibitorCode.user.user_details[0]?.firstName} ${exhibitorCode.user.user_details[0]?.lastName}`,
          email: exhibitorCode.user.user_accounts[0]?.email
        } : null
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: "Valid Exhibitor member code",
      data: {
        code: exhibitorCode.code,
        isValid: true,
        benefits: [
          'Early access to booth selection',
          'Exhibitor lounge access',
          'Discounted booth rates',
          'Priority marketing opportunities',
          'Extended setup/teardown periods'
        ]
      }
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
  } finally {
    await prisma.$disconnect();
  }
}