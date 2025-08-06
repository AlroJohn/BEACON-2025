import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { tmlMemberSchema } from "@/types/members";

const prisma = new PrismaClient();

// GET /api/members/tml - Fetch all TML members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const isActive = searchParams.get('isActive');
    const codeStatus = searchParams.get('codeStatus') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { tmlMemberCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.membershipStatus = status;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Filter by code status
    if (codeStatus === 'NO_CODE') {
      // Combine with existing OR condition if it exists
      const codeFilter = [
        { sentCode: null },
        { sentCode: '' }
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: codeFilter }
        ];
        delete where.OR;
      } else {
        where.OR = codeFilter;
      }
    } else if (codeStatus === 'HAS_CODE') {
      where.sentCode = {
        not: null,
        notIn: ['', null]
      };
    }

    // Get total count for pagination
    const total = await prisma.tmlMembers.count({ where });

    // Get members
    const members = await prisma.tmlMembers.findMany({
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
    console.error("Error fetching TML members:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch TML members" },
      { status: 500 }
    );
  }
}

// POST /api/members/tml - Create new TML member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = tmlMemberSchema.parse(body);

    // Check if email already exists
    const existingMember = await prisma.tmlMembers.findUnique({
      where: { email: validatedData.email },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "Email address already exists" },
        { status: 400 }
      );
    }


    const newMember = await prisma.tmlMembers.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: newMember,
      message: "TML member created successfully",
    });

  } catch (error) {
    console.error("Error creating TML member:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create TML member" },
      { status: 500 }
    );
  }
}

// PUT /api/members/tml - Update existing TML member
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
    const validatedData = tmlMemberSchema.partial().parse(updateData);

    // Check if member exists
    const existingMember = await prisma.tmlMembers.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: "TML member not found" },
        { status: 404 }
      );
    }

    // Check for email conflicts (if email is being changed)
    if (validatedData.email && validatedData.email !== existingMember.email) {
      const emailConflict = await prisma.tmlMembers.findUnique({
        where: { email: validatedData.email },
      });

      if (emailConflict) {
        return NextResponse.json(
          { success: false, error: "Email address already exists" },
          { status: 400 }
        );
      }
    }


    const updatedMember = await prisma.tmlMembers.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: "TML member updated successfully",
    });

  } catch (error) {
    console.error("Error updating TML member:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update TML member" },
      { status: 500 }
    );
  }
}

// DELETE /api/members/tml - Delete TML member
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
    const existingMember = await prisma.tmlMembers.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: "TML member not found" },
        { status: 404 }
      );
    }

    // Delete the member
    await prisma.tmlMembers.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "TML member deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting TML member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete TML member" },
      { status: 500 }
    );
  }
}