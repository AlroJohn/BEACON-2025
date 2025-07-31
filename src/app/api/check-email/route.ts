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

    // Check if email exists in user_accounts
    const existingUser = await prisma.user_accounts.findUnique({
      where: {
        email: email
      }
    });

    if (!existingUser) {
      return NextResponse.json({
        exists: false,
        message: "Email is available"
      });
    }

    // If registration type is specified, check specific boolean flag
    if (registrationType) {
      let alreadyRegistered = false;
      let registrationTypeName = '';

      switch (registrationType) {
        case 'conference':
          alreadyRegistered = existingUser.conference;
          registrationTypeName = 'conference';
          break;
        case 'visitor':
          alreadyRegistered = existingUser.visitor;
          registrationTypeName = 'visitor';
          break;
        case 'exhibitor':
          alreadyRegistered = existingUser.exhibitor;
          registrationTypeName = 'exhibitor';
          break;
        case 'sponsor':
          alreadyRegistered = existingUser.sponsor;
          registrationTypeName = 'sponsor';
          break;
        default:
          // If invalid type, fall back to general email exists check
          return NextResponse.json({
            exists: true,
            message: "Email already exists"
          });
      }

      if (alreadyRegistered) {
        return NextResponse.json({
          exists: true,
          message: `This email is already registered for ${registrationTypeName} registration`,
          registrationType: registrationTypeName
        });
      } else {
        return NextResponse.json({
          exists: false,
          message: "Email is available for this registration type",
          existingUser: true // Email exists but not for this registration type
        });
      }
    }

    // If no registration type specified, check if email exists at all
    return NextResponse.json({
      exists: true,
      message: "Email already exists"
    });

  } catch (error) {
    console.error('Email check error:', error);

    return NextResponse.json({
      exists: false,
      message: "Error checking email"
    }, { status: 500 });
  }
}