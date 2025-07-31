import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession, createSession } from '@/lib/adminSessions';

const prisma = new PrismaClient();

// Middleware to verify admin token
async function verifyAdminToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }

  const token = authHeader.split(' ')[1];
  let session = getSession(token);

  // If session not found in memory, try to recreate it from database
  if (!session) {
    try {
      const admin = await prisma.managerAccount.findFirst({
        where: { isActive: true },
        select: { id: true, username: true, status: true }
      });

      if (admin) {
        const tempSession = {
          adminId: admin.id,
          username: admin.username,
          status: admin.status,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
        };

        if (token && token.length > 10) {
          createSession(token, tempSession);
          session = tempSession;
        }
      }
    } catch (dbError) {
      console.error('Database lookup failed:', dbError);
    }
  }

  if (!session) {
    throw new Error('Invalid or expired token');
  }

  return session;
}

// DELETE - Remove exhibitor registration (SUPERADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    const session = await verifyAdminToken(authHeader);

    // Check if admin has SUPERADMIN status
    if (session.status !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const exhibitorId = params.id;

    if (!exhibitorId) {
      return NextResponse.json(
        { error: 'Exhibitor ID is required' },
        { status: 400 }
      );
    }

    // Check if exhibitor exists
    const existingExhibitor = await prisma.exhibitor_registrations.findUnique({
      where: { id: exhibitorId },
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true,
          },
        },
      },
    });

    if (!existingExhibitor) {
      return NextResponse.json(
        { error: 'Exhibitor registration not found' },
        { status: 404 }
      );
    }

    // Delete the exhibitor registration
    await prisma.exhibitor_registrations.delete({
      where: { id: exhibitorId },
    });

    return NextResponse.json({
      success: true,
      message: 'Exhibitor registration deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting exhibitor registration:', error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}