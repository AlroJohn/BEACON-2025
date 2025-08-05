import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { exhibitorMemberSchema } from "@/types/members";

const prisma = new PrismaClient();

// GET /api/members/exhibitor - Fetch all Exhibitor members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const isActive = searchParams.get('isActive');
    const codeStatus = searchParams.get('codeStatus');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const countOnly = searchParams.get('countOnly') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { sentCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Remove status filter since membershipStatus doesn't exist in schema

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Filter by code status
    if (codeStatus) {
      if (codeStatus === 'HAS_CODE') {
        where.sentCode = { not: null };
      } else if (codeStatus === 'NO_CODE') {
        where.sentCode = null;
      }
    }

    // Get total count for pagination
    const total = await prisma.exhibitorMembers.count({ where });

    // If only count is requested, return just the count
    if (countOnly) {
      return NextResponse.json({
        success: true,
        count: total,
      });
    }

    // Get members
    const members = await prisma.exhibitorMembers.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching Exhibitor members:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Exhibitor members" },
      { status: 500 }
    );
  }
}

// POST /api/members/exhibitor - Create new Exhibitor member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = exhibitorMemberSchema.parse(body);

    // Check if email already exists
    const existingMember = await prisma.exhibitorMembers.findUnique({
      where: { email: validatedData.email },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "Email address already exists" },
        { status: 400 }
      );
    }



    const newMember = await prisma.exhibitorMembers.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: newMember,
      message: "Exhibitor member created successfully",
    });

  } catch (error) {
    console.error("Error creating Exhibitor member:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create Exhibitor member" },
      { status: 500 }
    );
  }
}

// PUT /api/members/exhibitor - Update existing Exhibitor member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = exhibitorMemberSchema.partial().parse(updateData);

    // Check if member exists
    const existingMember = await prisma.exhibitorMembers.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: "Exhibitor member not found" },
        { status: 404 }
      );
    }

    // Check for email conflicts (if email is being changed)
    if (validatedData.email && validatedData.email !== existingMember.email) {
      const emailConflict = await prisma.exhibitorMembers.findUnique({
        where: { email: validatedData.email },
      });

      if (emailConflict) {
        return NextResponse.json(
          { success: false, error: "Email address already exists" },
          { status: 400 }
        );
      }
    }


    const updatedMember = await prisma.exhibitorMembers.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: "Exhibitor member updated successfully",
    });

  } catch (error) {
    console.error("Error updating Exhibitor member:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update Exhibitor member" },
      { status: 500 }
    );
  }
}

// DELETE /api/members/exhibitor - Delete Exhibitor member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Check if member exists
    const existingMember = await prisma.exhibitorMembers.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: "Exhibitor member not found" },
        { status: 404 }
      );
    }

    // Delete the member
    await prisma.exhibitorMembers.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Exhibitor member deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting Exhibitor member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete Exhibitor member" },
      { status: 500 }
    );
  }
}