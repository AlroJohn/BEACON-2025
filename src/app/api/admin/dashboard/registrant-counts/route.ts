import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get counts for each user_type
    const counts = await prisma.user_accounts.groupBy({
      by: ['user_type'],
      _count: {
        user_type: true,
      },
    });

    // Transform the data into a more readable format
    const registrantCounts = counts.reduce((acc, item) => {
      acc[item.user_type] = item._count.user_type;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all user types are included with 0 if they don't exist
    const allUserTypes = ['VISITOR', 'CONFERENCE', 'EXHIBITOR', 'SPONSOR'];
    const result = allUserTypes.reduce((acc, userType) => {
      acc[userType] = registrantCounts[userType] || 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching registrant counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrant counts' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}