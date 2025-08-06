import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateTmlCodeEmail } from '@/lib/code-email';
import sgMail from '@sendgrid/mail';

const prisma = new PrismaClient();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Get member details with database error handling
    let member;
    try {
      member = await prisma.tmlMembers.findUnique({
        where: { id: memberId },
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Unable to connect to database. Please try again later.' },
        { status: 503 }
      );
    }

    if (!member) {
      return NextResponse.json(
        { error: 'TML member not found' },
        { status: 404 }
      );
    }

    // Check if member already has a code in their record first (faster check)
    if (member.sentCode) {
      return NextResponse.json(
        { 
          error: 'This TML member already has a code assigned',
          codeSent: member.sentCode 
        },
        { status: 400 }
      );
    }

    // Check if a code has already been sent to this member's email
    let existingSentCode;
    try {
      existingSentCode = await prisma.codeDistribution.findFirst({
        where: {
          sentTo: member.email,
          isSent: true,
        },
      });
    } catch (dbError) {
      console.error('Database error checking existing codes:', dbError);
      return NextResponse.json(
        { error: 'Unable to verify existing codes. Please try again later.' },
        { status: 503 }
      );
    }

    if (existingSentCode) {
      return NextResponse.json(
        { 
          error: 'A TML code has already been sent to this member',
          codeSent: existingSentCode.code,
          sentAt: existingSentCode.sentAt 
        },
        { status: 400 }
      );
    }

    // Find an available TML code (isActive: true and not used)
    let availableCode;
    try {
      availableCode = await prisma.codeDistribution.findFirst({
        where: {
          isActive: true,
          userId: null,
          isSent: false, // Code hasn't been sent yet
        },
        orderBy: {
          createdAt: 'asc', // Get the oldest available code first
        },
      });
    } catch (dbError) {
      console.error('Database error finding available codes:', dbError);
      return NextResponse.json(
        { error: 'Unable to check available codes. Please try again later.' },
        { status: 503 }
      );
    }

    if (!availableCode) {
      return NextResponse.json(
        { error: 'No available TML codes found. Please contact admin to generate more codes.' },
        { status: 404 }
      );
    }

    // Generate email content
    const emailContent = generateTmlCodeEmail({
      memberName: [member.firstName, member.lastName].filter(Boolean).join(' ') || 'TML Member',
      companyName: member.companyName || '',
      tmlCode: availableCode.code,
      email: member.email,
    });

    // Send email using SendGrid
    const msg = {
      to: member.email,
      from: {
        email: 'noreply@thebeaconexpo.com',
        name: 'BEACON 2025 Team'
      },
      replyTo: 'mlbeacon2023@gmail.com',
      subject: 'Your BEACON 2025 TML Code - Registration Access',
      html: emailContent,
    };

    // Check if SendGrid API key is available
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured. Please contact admin.' },
        { status: 500 }
      );
    }

    await sgMail.send(msg);

    // Update both the code distribution table and the member record in a transaction
    try {
      await prisma.$transaction([
        // Update the code as sent
        prisma.codeDistribution.update({
          where: { id: availableCode.id },
          data: {
            isSent: true,
            sentAt: new Date(),
            sentTo: member.email,
          },
        }),
        // Update the member's sentCode field
        prisma.tmlMembers.update({
          where: { id: memberId },
          data: {
            sentCode: availableCode.code,
          },
        }),
      ]);
    } catch (dbError) {
      console.error('Database error updating code status:', dbError);
      return NextResponse.json(
        { error: 'Email sent but failed to update records. Please contact admin.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `TML code sent successfully to ${member.email}`,
      codeSent: availableCode.code,
    });

  } catch (error) {
    console.error('Error sending TML code:', error);

    // Handle SendGrid specific errors
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('SendGrid error details:', {
        status: sgError.response?.status,
        body: sgError.response?.body,
        headers: sgError.response?.headers
      });
      
      // Return more specific SendGrid error messages
      if (sgError.response?.status === 401) {
        return NextResponse.json(
          { error: 'Email service authentication failed. Please contact admin.' },
          { status: 500 }
        );
      } else if (sgError.response?.status === 403) {
        return NextResponse.json(
          { error: 'Email service access denied. Please contact admin.' },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to send email. Please try again or contact admin.' },
          { status: 500 }
        );
      }
    }

    // Handle database connection errors specifically
    if (error instanceof Error && (
      error.message.includes('Can\'t reach database server') ||
      error.message.includes('database server') ||
      error.message.includes('connection') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('timeout')
    )) {
      return NextResponse.json(
        { error: 'Unable to connect to database. Please try again later.' },
        { status: 503 }
      );
    }

    // Handle other database or general errors
    if (error instanceof Error) {
      // Don't expose technical error details to the user
      return NextResponse.json(
        { error: 'Unable to process request. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}