import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for events - Updated for eventDates array
const eventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  eventDates: z.array(z.string().pipe(z.coerce.date())).min(1, 'At least one event date is required'),
  eventStartTime: z.string().optional().nullable(),
  eventEndTime: z.string().optional().nullable(),
  eventPrice: z.number().min(0, 'Event price must be non-negative'),
  eventStatus: z.enum(['CONFERENCE', 'SHOW', 'WORKSHOP', 'SEMINAR', 'EXHIBITION']),
  isActive: z.boolean().default(true),
  description: z.string().optional().nullable(),
});

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = eventSchema.parse(body);

    const event = await prisma.events.create({
      data: {
        eventName: validatedData.eventName,
        eventDates: validatedData.eventDates,
        eventStartTime: validatedData.eventStartTime ? new Date(validatedData.eventStartTime) : null,
        eventEndTime: validatedData.eventEndTime ? new Date(validatedData.eventEndTime) : null,
        eventPrice: validatedData.eventPrice,
        eventStatus: validatedData.eventStatus,
        isActive: validatedData.isActive,
        description: validatedData.description,
      }
    });

    return NextResponse.json({
      success: true,
      data: event
    }, { status: 201 });

  } catch (error) {
    console.error('Event creation error:', error);

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

// GET - Retrieve events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let whereClause: any = {};

    if (active === 'true') {
      whereClause.isActive = true;
    } else if (active === 'false') {
      whereClause.isActive = false;
    }

    if (status) {
      whereClause.eventStatus = status;
    }

    const events = await prisma.events.findMany({
      where: whereClause,
      include: {
        summaryOfPayments: {
          include: {
            conference: {
              select: {
                id: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Validate update data with partial schema
    const partialSchema = eventSchema.partial();
    const validatedData = partialSchema.parse(updateData);

    const updatedEvent = await prisma.events.update({
      where: { id },
      data: validatedData,
      include: {
        summaryOfPayments: {
          include: {
            conference: {
              select: {
                id: true,

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

// DELETE - Remove event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required' },
        { status: 400 }
      );
    }

    // Check if event has associated registrations
    const summaryCount = await prisma.summaryOfPayments.count({
      where: { eventId }
    });

    if (summaryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with existing registrations' },
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