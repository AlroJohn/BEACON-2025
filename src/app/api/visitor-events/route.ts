import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EventStatusEnum } from '@prisma/client';
import { visitorEventSchema, CreateVisitorEventRequest, UpdateVisitorEventRequest } from '@/types/visitor-events';
import { z } from 'zod';

const prisma = new PrismaClient();

// API schema that handles string dates from HTTP requests
const apiVisitorEventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventDates: z.array(z.string().pipe(z.coerce.date())).min(1, "At least one event date is required"),
  eventStartTime: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  eventEndTime: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  eventStatus: z.nativeEnum(EventStatusEnum),
  isActive: z.boolean().default(true),
  description: z.string().optional().nullable(),
});

// POST - Create new visitor event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = apiVisitorEventSchema.parse(body);

    const visitorEvent = await prisma.visitorEvents.create({
      data: {
        eventName: validatedData.eventName,
        eventDates: validatedData.eventDates,
        eventStartTime: validatedData.eventStartTime,
        eventEndTime: validatedData.eventEndTime,
        eventStatus: validatedData.eventStatus,
        isActive: validatedData.isActive ?? true,
        description: validatedData.description,
      }
    });

    return NextResponse.json({
      success: true,
      data: visitorEvent
    }, { status: 201 });

  } catch (error) {
    console.error('Visitor event creation error:', error);
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.issues);
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

// GET - Retrieve visitor events
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

    const visitorEvents = await prisma.visitorEvents.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    return NextResponse.json({
      success: true,
      data: visitorEvents,
      count: visitorEvents.length
    });

  } catch (error) {
    console.error('Error fetching visitor events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

