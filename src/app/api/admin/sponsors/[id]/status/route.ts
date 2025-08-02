import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendSponsorConfirmationEmail, SponsorConfirmationEmailData } from '@/lib/email';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sponsorId = params.id;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be ACTIVE or INACTIVE.' },
        { status: 400 }
      );
    }

    // Find the sponsor registration
    const sponsorRegistration = await prisma.sponsor_registrations.findUnique({
      where: { id: sponsorId },
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true,
          },
        },
      },
    });

    if (!sponsorRegistration) {
      return NextResponse.json(
        { success: false, message: 'Sponsor registration not found' },
        { status: 404 }
      );
    }

    // Update the user account status
    await prisma.user_accounts.update({
      where: { userId: sponsorRegistration.userId },
      data: { status: status as 'ACTIVE' | 'INACTIVE' },
    });

    // If status is ACTIVE, send confirmation email
    if (status === 'ACTIVE') {
      const emailData: SponsorConfirmationEmailData = {
        userEmail: sponsorRegistration.user.user_accounts[0]?.email || '',
        userName: `${sponsorRegistration.user.user_details[0]?.firstName || ''} ${sponsorRegistration.user.user_details[0]?.lastName || ''}`,
        userId: sponsorRegistration.userId,
        sponsorId: sponsorRegistration.id,
        companyName: sponsorRegistration.companyName,
        sponsorshipCategories: sponsorRegistration.sponsorshipCategories,
        budgetRange: sponsorRegistration.budgetRange,
        status: 'CONFIRMED',
        notes,
      };

      await sendSponsorConfirmationEmail(emailData);
    } else if (status === 'INACTIVE') {
      // Send rejection email
      const emailData: SponsorConfirmationEmailData = {
        userEmail: sponsorRegistration.user.user_accounts[0]?.email || '',
        userName: `${sponsorRegistration.user.user_details[0]?.firstName || ''} ${sponsorRegistration.user.user_details[0]?.lastName || ''}`,
        userId: sponsorRegistration.userId,
        sponsorId: sponsorRegistration.id,
        companyName: sponsorRegistration.companyName,
        sponsorshipCategories: sponsorRegistration.sponsorshipCategories,
        budgetRange: sponsorRegistration.budgetRange,
        status: 'REJECTED',
        notes,
      };

      await sendSponsorConfirmationEmail(emailData);
    }

    return NextResponse.json({
      success: true,
      message: `Sponsor status updated to ${status} successfully`,
    });

  } catch (error) {
    console.error('Error updating sponsor status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}