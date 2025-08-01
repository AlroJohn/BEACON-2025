import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const registrationType = searchParams.get('type'); // 'conference', 'visitor', 'exhibitor', 'sponsor'

    if (!email) {
      return NextResponse.json({
        exists: false,
        message: "Email parameter is required"
      }, { status: 400 });
    }

    // If registration type is specified, check for specific user_type
    if (registrationType) {
      // Map registration type to UserType enum
      let userType: string;
      switch (registrationType) {
        case 'conference':
          userType = 'CONFERENCE';
          break;
        case 'visitor':
          userType = 'VISITOR';
          break;
        case 'exhibitor':
          userType = 'EXHIBITOR';
          break;
        case 'sponsor':
          userType = 'SPONSOR';
          break;
        default:
          return NextResponse.json({
            exists: false,
            message: "Invalid registration type"
          }, { status: 400 });
      }

      // Check if email already exists for this specific registration type
      const existingUserForType = await prisma.user_accounts.findFirst({
        where: {
          email: email,
          user_type: userType as any
        }
      });

      if (existingUserForType) {
        return NextResponse.json({
          exists: true,
          message: `This email is already registered for ${registrationType} registration`,
          registrationType: registrationType
        });
      } else {
        // Check if email exists for other registration types
        const existingUserAnyType = await prisma.user_accounts.findFirst({
          where: {
            email: email
          }
        });

        return NextResponse.json({
          exists: false,
          message: "Email is available for this registration type",
          existingUser: !!existingUserAnyType // Email exists but not for this registration type
        });
      }
    }

    // If no registration type specified, check if email exists at all
    const existingUser = await prisma.user_accounts.findFirst({
      where: {
        email: email
      }
    });

    return NextResponse.json({
      exists: !!existingUser,
      message: existingUser ? "Email already exists" : "Email is available"
    });

  } catch (error) {
    console.error('Email check error:', error);

    return NextResponse.json({
      exists: false,
      message: "Error checking email"
    }, { status: 500 });
  }
}