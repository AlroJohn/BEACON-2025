import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for event updates - Updated for eventDates array
const eventUpdateSchema = z.object({
  eventName: z.string().min(1, 'Event name is required').optional(),
  eventDates: z.array(z.string().pipe(z.coerce.date())).min(1, 'At least one event date is required').optional(),
  eventPrice: z.number().min(0, 'Event price must be non-negative').optional(),
  eventStatus: z.enum(['CONFERENCE', 'SHOW', 'WORKSHOP', 'SEMINAR', 'EXHIBITION']).optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

// GET - Get single event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        summaryOfPayments: {
          include: {
            conference: {
              select: {
                id: true,
                isMaritimeLeagueMember: true,
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update single event by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();

    const validatedData = eventUpdateSchema.parse(body);

    // Check if event exists
    const existingEvent = await prisma.events.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const updatedEvent = await prisma.events.update({
      where: { id: eventId },
      data: validatedData,
      include: {
        summaryOfPayments: {
          include: {
            conference: {
              select: {
                id: true,
                isMaritimeLeagueMember: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
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

// DELETE - Delete single event by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Check if event exists
    const existingEvent = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        summaryOfPayments: true
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event has associated registrations
    if (existingEvent.summaryOfPayments.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete event with existing registrations',
          registrations: existingEvent.summaryOfPayments.length
        },
        { status: 409 }
      );
    }

    await prisma.events.delete({
      where: { id: eventId }
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}