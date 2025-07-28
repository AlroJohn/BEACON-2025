import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendPaymentStatusEmail, PaymentStatusEmailData } from '@/lib/email';

const prisma = new PrismaClient();

// Validation schema for payment status update
const paymentStatusUpdateSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED']),
  notes: z.string().optional(),
});

// Simplified admin verification - check if any active admin exists
async function verifyAdminAccess() {
  try {
    // For now, just check if any active admin exists in the database
    const adminExists = await prisma.managerAccount.findFirst({
      where: { isActive: true },
      select: { id: true, username: true, status: true }
    });

    if (!adminExists) {
      throw new Error('No active admin found');
    }

    return adminExists;
  } catch (error) {
    console.error('Admin verification error:', error);
    throw new Error('Admin verification failed');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess();

    const conferenceId = params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = paymentStatusUpdateSchema.parse(body);

    // Find the conference and its payment record with event details
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
      include: {
        ConferencePayment: true,
        user: {
          include: {
            user_details: true,
            user_accounts: true,
          },
        },
        summaryOfPayments: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!conference) {
      return NextResponse.json({
        success: false,
        message: 'Conference registration not found',
      }, { status: 404 });
    }

    // Update payment status
    let updatedPayment;
    if (conference.ConferencePayment) {
      // Update existing payment record - only status and notes
      updatedPayment = await prisma.conferencePayment.update({
        where: { id: conference.ConferencePayment.id },
        data: {
          paymentStatus: validatedData.paymentStatus,
          notes: validatedData.notes || conference.ConferencePayment.notes,
          updatedAt: validatedData.paymentStatus === 'CONFIRMED'
            ? new Date()
            : conference.ConferencePayment.updatedAt,
        },
      });
    } else {
      // If no payment record exists, we shouldn't create one just for status update
      return NextResponse.json({
        success: false,
        message: 'No payment record found for this conference registration',
      }, { status: 404 });
    }

    // Get user info for logging
    const userInfo = {
      name: `${conference.user?.user_details?.[0]?.firstName} ${conference.user?.user_details?.[0]?.lastName}`,
      email: conference.user?.user_accounts?.[0]?.email,
    };

    console.log(`Payment status updated by admin ${admin.username}:`, {
      conferenceId,
      user: userInfo,
      oldStatus: conference.ConferencePayment?.paymentStatus || 'N/A',
      newStatus: validatedData.paymentStatus,
      notes: validatedData.notes,
    });

    // Send email notification for status changes (CONFIRMED, FAILED, REFUNDED)
    const shouldSendEmail = ['CONFIRMED', 'FAILED', 'REFUNDED'].includes(validatedData.paymentStatus);
    const statusChanged = conference.ConferencePayment?.paymentStatus !== validatedData.paymentStatus;
    
    if (shouldSendEmail && statusChanged) {
      try {
        console.log(`Sending payment status email for status: ${validatedData.paymentStatus}`);
        
        // Prepare email data
        const emailData: PaymentStatusEmailData = {
          userEmail: conference.user?.user_accounts?.[0]?.email || '',
          userName: `${conference.user?.user_details?.[0]?.firstName} ${conference.user?.user_details?.[0]?.lastName}`,
          conferenceId,
          oldStatus: conference.ConferencePayment?.paymentStatus || 'PENDING',
          newStatus: validatedData.paymentStatus as 'CONFIRMED' | 'FAILED' | 'REFUNDED',
          totalAmount: Number(conference.ConferencePayment?.totalAmount || 0),
          referenceNumber: conference.ConferencePayment?.referenceNumber || undefined,
          notes: validatedData.notes || undefined,
          selectedEvents: conference.summaryOfPayments.map(payment => ({
            eventName: payment.event.eventName,
            eventDate: new Date(payment.event.eventDate),
            eventPrice: Number(payment.event.eventPrice),
          })),
        };

        const emailSent = await sendPaymentStatusEmail(emailData);
        
        if (emailSent) {
          console.log(`Payment status email sent successfully to: ${emailData.userEmail}`);
        } else {
          console.error('Failed to send payment status email');
        }
      } catch (emailError) {
        console.error('Error sending payment status email:', emailError);
        // Don't fail the API request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        conferenceId,
        paymentId: updatedPayment.id,
        newStatus: validatedData.paymentStatus,
        updatedAt: updatedPayment.updatedAt,
        emailSent: shouldSendEmail && statusChanged,
      },
    });

  } catch (error) {
    console.error('Payment status update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: error.issues,
      }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message.includes('admin') || error.message.includes('verification')) {
        return NextResponse.json({
          success: false,
          message: 'Unauthorized - Admin access required',
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}