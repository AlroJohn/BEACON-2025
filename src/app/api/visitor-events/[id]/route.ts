import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EventStatusEnum } from '@prisma/client';
import { visitorEventSchema } from '@/types/visitor-events';
import { z } from 'zod';

const prisma = new PrismaClient();

// API schema that handles string dates from HTTP requests
const apiVisitorEventUpdateSchema = z.object({
  eventName: z.string().min(1, "Event name is required").optional(),
  eventDates: z.array(z.string().pipe(z.coerce.date())).min(1, "At least one event date is required").optional(),
  eventStartTime: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  eventEndTime: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  eventStatus: z.nativeEnum(EventStatusEnum).optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional().nullable(),
});

// GET - Get single visitor event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const visitorEvent = await prisma.visitorEvents.findUnique({
      where: { id: eventId }
    });

    if (!visitorEvent) {
      return NextResponse.json(
        { error: 'Visitor event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: visitorEvent
    });

  } catch (error) {
    console.error('Error fetching visitor event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update single visitor event by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();

    const validatedData = apiVisitorEventUpdateSchema.parse(body);

    // Check if visitor event exists
    const existingEvent = await prisma.visitorEvents.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Visitor event not found' },
        { status: 404 }
      );
    }

    const updatedVisitorEvent = await prisma.visitorEvents.update({
      where: { id: eventId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedVisitorEvent
    });

  } catch (error) {
    console.error('Error updating visitor event:', error);

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

// DELETE - Delete single visitor event by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Check if visitor event exists
    const existingEvent = await prisma.visitorEvents.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Visitor event not found' },
        { status: 404 }
      );
    }

    await prisma.visitorEvents.delete({
      where: { id: eventId }
    });

    return NextResponse.json({
      success: true,
      message: 'Visitor event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting visitor event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}