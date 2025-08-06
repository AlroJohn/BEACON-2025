import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendCustomBulkMessage } from "@/lib/code-email";

const prisma = new PrismaClient();

// Validation schema for TML bulk message request
const tmlBulkMessageSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  htmlContent: z.string().min(1, "Message content is required"),
  selectedMemberIds: z.array(z.string()).optional(),
  filters: z.object({
    isActive: z.boolean().optional(),
  }).optional(),
  testMode: z.boolean().default(false),
});

// POST /api/members/tml/bulk-message - Send bulk message to TML members
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = tmlBulkMessageSchema.parse(body);

    const {
      subject,
      htmlContent,
      selectedMemberIds = [],
      filters = {},
      testMode = false,
    } = validatedData;

    console.log(`Starting TML bulk message send...`);
    console.log(`Test mode: ${testMode}`);

    let whereClause: any = {};

    // If specific member IDs are selected, use those
    if (selectedMemberIds.length > 0) {
      whereClause.id = { in: selectedMemberIds };
    }

    // Apply filters
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Fetch TML members
    const tmlMembers = await prisma.tmlMembers.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`Found ${tmlMembers.length} TML members`);

    if (tmlMembers.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No TML members found matching the specified criteria",
      }, { status: 400 });
    }

    // Format recipients for email service
    const recipients = tmlMembers.map(member => ({
      email: member.email,
      name: `${member.firstName} ${member.lastName}`,
      memberType: 'tml' as const,
    }));

    // In test mode, send only to admin email
    let finalRecipients = recipients;
    if (testMode) {
      finalRecipients = [{
        email: 'mlbeacon2023@gmail.com', // Admin email for testing
        name: 'Test Admin',
        memberType: 'tml' as const,
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
             <p style="margin: 5px 0 0 0; color: #78350f; font-size: 14px;">This is a test message. In production, this would be sent to ${recipients.length} TML members.</p>
           </div>
           ${htmlContent}`
        : htmlContent,
    });

    // Log results
    console.log(`TML bulk message completed:`, {
      totalRecipients: testMode ? recipients.length : finalRecipients.length,
      actualSent: emailResults.totalSent,
      successful: emailResults.successfulSends,
      failed: emailResults.failedSends,
      testMode,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRecipients: testMode ? recipients.length : finalRecipients.length,
        successfulSends: emailResults.successfulSends,
        failedSends: emailResults.failedSends,
        errors: emailResults.errors,
        testMode,
      },
      message: testMode 
        ? `Test message sent successfully to admin. Would reach ${recipients.length} TML members in production.`
        : `Bulk message sent successfully to ${emailResults.successfulSends} TML members`,
    });

  } catch (error) {
    console.error("Error sending TML bulk message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to send TML bulk message" },
      { status: 500 }
    );
  }
}

// GET /api/members/tml/bulk-message/stats - Get TML bulk message statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    // Build where clause
    const whereClause: any = {};

    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const totalMembers = await prisma.tmlMembers.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      data: {
        totalMembers,
        activeMembers: await prisma.tmlMembers.count({ 
          where: { ...whereClause, isActive: true } 
        }),
        inactiveMembers: await prisma.tmlMembers.count({ 
          where: { ...whereClause, isActive: false } 
        }),
      },
    });

  } catch (error) {
    console.error("Error fetching TML bulk message stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}