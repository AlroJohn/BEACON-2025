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

    // Check if email exists in user_accounts for the specific registration type
    const existingUsers = await prisma.user_accounts.findMany({
      where: {
        email: email
      }
    });

    if (existingUsers.length === 0) {
      return NextResponse.json({
        exists: false,
        message: "Email is available"
      });
    }

    // If registration type is specified, check specific boolean flag across all users with this email
    if (registrationType) {
      let alreadyRegistered = false;
      let registrationTypeName = '';

      // Check if any user with this email already has the specific registration type
      for (const existingUser of existingUsers) {
        switch (registrationType) {
          case 'conference':
            if (existingUser.conference) alreadyRegistered = true;
            registrationTypeName = 'conference';
            break;
          case 'visitor':
            if (existingUser.visitor) alreadyRegistered = true;
            registrationTypeName = 'visitor';
            break;
          case 'exhibitor':
            if (existingUser.exhibitor) alreadyRegistered = true;
            registrationTypeName = 'exhibitor';
            break;
          case 'sponsor':
            if (existingUser.sponsor) alreadyRegistered = true;
            registrationTypeName = 'sponsor';
            break;
          default:
            // If invalid type, fall back to general email exists check
            return NextResponse.json({
              exists: true,
              message: "Email already exists"
            });
        }

        if (alreadyRegistered) break; // Exit loop if already registered
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