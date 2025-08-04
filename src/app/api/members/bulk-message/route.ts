import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendCustomBulkMessage } from "@/lib/code-email";

const prisma = new PrismaClient();

// Validation schema for bulk message request
const bulkMessageSchema = z.object({
  memberTypes: z.array(z.enum(['tml', 'exhibitor'])).min(1, "At least one member type is required"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  htmlContent: z.string().min(1, "Message content is required"),
  filters: z.object({
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }).optional(),
  testMode: z.boolean().default(false),
});

// POST /api/members/bulk-message - Send bulk message to members
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bulkMessageSchema.parse(body);

    const {
      memberTypes,
      subject,
      htmlContent,
      filters = {},
      testMode = false,
    } = validatedData;

    console.log(`Starting bulk message send to ${memberTypes.join(', ')} members...`);
    console.log(`Test mode: ${testMode}`);

    // Build where clause for filtering
    const buildWhereClause = () => {
      const where: any = {};

      if (filters.status) {
        where.membershipStatus = filters.status;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      return where;
    };

    const whereClause = buildWhereClause();
    let allRecipients: Array<{
      email: string;
      name?: string;
      memberType?: 'tml' | 'exhibitor';
    }> = [];

    // Fetch TML members if requested
    if (memberTypes.includes('tml')) {
      const tmlMembers = await prisma.tmlMembers.findMany({
        where: whereClause,
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const tmlRecipients = tmlMembers.map(member => ({
        email: member.email,
        name: `${member.firstName} ${member.lastName}`,
        memberType: 'tml' as const,
      }));

      allRecipients.push(...tmlRecipients);
      console.log(`Found ${tmlMembers.length} TML members`);
    }

    // Fetch Exhibitor members if requested
    if (memberTypes.includes('exhibitor')) {
      const exhibitorMembers = await prisma.exhibitorMembers.findMany({
        where: whereClause,
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const exhibitorRecipients = exhibitorMembers.map(member => ({
        email: member.email,
        name: `${member.firstName} ${member.lastName}`,
        memberType: 'exhibitor' as const,
      }));

      allRecipients.push(...exhibitorRecipients);
      console.log(`Found ${exhibitorMembers.length} Exhibitor members`);
    }

    // Remove duplicate emails (in case someone is both TML and Exhibitor)
    const uniqueRecipients = allRecipients.reduce((unique, recipient) => {
      const exists = unique.find(r => r.email.toLowerCase() === recipient.email.toLowerCase());
      if (!exists) {
        unique.push(recipient);
      }
      return unique;
    }, [] as typeof allRecipients);

    console.log(`Total unique recipients: ${uniqueRecipients.length}`);

    if (uniqueRecipients.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No recipients found matching the specified criteria",
      }, { status: 400 });
    }

    // In test mode, send only to admin email
    let finalRecipients = uniqueRecipients;
    if (testMode) {
      finalRecipients = [{
        email: 'mlbeacon2023@gmail.com', // Admin email for testing
        name: 'Test Admin',
        memberType: 'tml',
      }];
      console.log('Test mode enabled - sending to admin email only');
    }

    // Send bulk messages
    const emailResults = await sendCustomBulkMessage({
      recipients: finalRecipients,
      subject: testMode ? `[TEST] ${subject}` : subject,
      customContent: testMode 
        ? `<div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
             <p style="margin: 0; color: #92400e; font-weight: bold;">🧪 TEST MODE</p>
             <p style="margin: 5px 0 0 0; color: #78350f; font-size: 14px;">This is a test message. In production, this would be sent to ${uniqueRecipients.length} recipients.</p>
           </div>
           ${htmlContent}`
        : htmlContent,
    });

    // Log results
    console.log(`Bulk message completed:`, {
      totalRecipients: testMode ? uniqueRecipients.length : finalRecipients.length,
      actualSent: emailResults.totalSent,
      successful: emailResults.successfulSends,
      failed: emailResults.failedSends,
      testMode,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRecipients: testMode ? uniqueRecipients.length : finalRecipients.length,
        successfulSends: emailResults.successfulSends,
        failedSends: emailResults.failedSends,
        errors: emailResults.errors,
        testMode,
        memberTypes,
        filters,
      },
      message: testMode 
        ? `Test message sent successfully to admin. Would reach ${uniqueRecipients.length} members in production.`
        : `Bulk message sent successfully to ${emailResults.successfulSends} members`,
    });

  } catch (error) {
    console.error("Error sending bulk message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to send bulk message" },
      { status: 500 }
    );
  }
}

// GET /api/members/bulk-message/stats - Get bulk message statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberTypes = searchParams.get('memberTypes')?.split(',') || ['tml', 'exhibitor'];
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    // Build where clause
    const buildWhereClause = () => {
      const where: any = {};

      if (status) {
        where.membershipStatus = status;
      }

      if (isActive !== null && isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      return where;
    };

    const whereClause = buildWhereClause();
    const stats = {
      tml: 0,
      exhibitor: 0,
      total: 0,
    };

    // Count TML members
    if (memberTypes.includes('tml')) {
      stats.tml = await prisma.tmlMembers.count({ where: whereClause });
    }

    // Count Exhibitor members
    if (memberTypes.includes('exhibitor')) {
      stats.exhibitor = await prisma.exhibitorMembers.count({ where: whereClause });
    }

    stats.total = stats.tml + stats.exhibitor;

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error("Error fetching bulk message stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}