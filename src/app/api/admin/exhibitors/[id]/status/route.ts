import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendExhibitorConfirmationEmail, ExhibitorConfirmationEmailData } from '@/lib/email';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be ACTIVE or INACTIVE.' },
        { status: 400 }
      );
    }

    // Find the exhibitor registration
    const exhibitorRegistration = await prisma.exhibitor_registrations.findUnique({
      where: { id: eventId },
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true,
          },
        },
      },
    });

    if (!exhibitorRegistration) {
      return NextResponse.json(
        { success: false, message: 'Exhibitor registration not found' },
        { status: 404 }
      );
    }

    // Update the user account status
    await prisma.user_accounts.updateMany({
      where: { userId: exhibitorRegistration.userId },
      data: { status: status as 'ACTIVE' | 'INACTIVE' },
    });

    // If status is ACTIVE, send confirmation email
    if (status === 'ACTIVE') {
      const emailData: ExhibitorConfirmationEmailData = {
        userEmail: exhibitorRegistration.user.user_accounts[0]?.email || '',
        userName: `${exhibitorRegistration.user.user_details[0]?.firstName || ''} ${exhibitorRegistration.user.user_details[0]?.lastName || ''}`,
        userId: exhibitorRegistration.userId,
        exhibitorId: exhibitorRegistration.id,
        companyName: exhibitorRegistration.companyName,
        participationTypes: exhibitorRegistration.participationTypes,
        boothSize: exhibitorRegistration.boothSize || '',
        confirmIntent: exhibitorRegistration.confirmIntent,
        status: 'CONFIRMED',
        notes,
      };

      await sendExhibitorConfirmationEmail(emailData);
    } else if (status === 'INACTIVE') {
      // Send rejection email
      const emailData: ExhibitorConfirmationEmailData = {
        userEmail: exhibitorRegistration.user.user_accounts[0]?.email || '',
        userName: `${exhibitorRegistration.user.user_details[0]?.firstName || ''} ${exhibitorRegistration.user.user_details[0]?.lastName || ''}`,
        userId: exhibitorRegistration.userId,
        exhibitorId: exhibitorRegistration.id,
        companyName: exhibitorRegistration.companyName,
        participationTypes: exhibitorRegistration.participationTypes,
        boothSize: exhibitorRegistration.boothSize || '',
        confirmIntent: exhibitorRegistration.confirmIntent,
        status: 'REJECTED',
        notes,
      };

      await sendExhibitorConfirmationEmail(emailData);
    }

    return NextResponse.json({
      success: true,
      message: `Exhibitor status updated to ${status} successfully`,
    });

  } catch (error) {
    console.error('Error updating exhibitor status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}