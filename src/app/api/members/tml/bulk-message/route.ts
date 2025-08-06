import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { generateTmlCodeEmail, sendCustomBulkMessage } from "@/lib/code-email";
import sgMail from '@sendgrid/mail';

const prisma = new PrismaClient();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Validation schema for TML bulk message request
const tmlBulkMessageSchema = z.object({
  filterActive: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional(),
  filterCodeStatus: z.enum(["ALL", "HAS_CODE", "NO_CODE"]).optional(),
  sendCodesToMembers: z.boolean().default(true),
  testMode: z.boolean().default(false),
  selectedRecipientIds: z.array(z.string()).optional(),
});

// POST /api/members/tml/bulk-message - Send TML codes to selected members
export async function POST(request: NextRequest) {
  try {
    const {
      filterActive,
      filterCodeStatus,
      sendCodesToMembers,
      testMode,
      selectedRecipientIds,
    } = await request.json();

    // Get only selected members by IDs
    const members = await prisma.tmlMembers.findMany({
      where: {
        id: {
          in: selectedRecipientIds || [],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (members.length === 0) {
      return NextResponse.json({
        success: true,
        totalSent: 0,
        successfulSends: 0,
        failedSends: 0,
        codesSent: 0,
        message: 'No members selected or found',
      });
    }

    let totalSent = 0;
    let successfulSends = 0;
    let failedSends = 0;
    let codesSent = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // If test mode, only send to admin emails
    const testEmails = ['mlbeacon2023@gmail.com'];
    const membersToProcess = testMode ? 
      members.slice(0, 1).map(member => ({ ...member, email: testEmails[0] })) : 
      members;

    for (const member of membersToProcess) {
      totalSent++;
      
      try {
        let emailContent = '';
        let emailSubject = '';
        let codeSentToMember = false;

        // Always try to send codes to members without codes
        if (!member.sentCode && !testMode) {
          // Find an available TML code
          const availableCode = await prisma.codeDistribution.findFirst({
            where: {
              isActive: true,
              userId: null,
              isSent: false,
            },
            orderBy: { createdAt: 'asc' },
          });

          if (availableCode) {
            // Generate standard TML code email
            emailContent = generateTmlCodeEmail({
              memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'TML Member',
              companyName: member.companyName || 'Company',
              tmlCode: availableCode.code,
              email: member.email,
            });
            emailSubject = `Your BEACON 2025 TML Code: ${availableCode.code}`;

            // Update code and member in transaction
            await prisma.$transaction([
              prisma.codeDistribution.update({
                where: { id: availableCode.id },
                data: {
                  isSent: true,
                  sentAt: new Date(),
                  sentTo: member.email,
                },
              }),
              prisma.tmlMembers.update({
                where: { id: member.id },
                data: {
                  sentCode: availableCode.code,
                },
              }),
            ]);

            codesSent++;
            codeSentToMember = true;
          } else {
            // No available codes
            failedSends++;
            errors.push({
              email: member.email,
              error: 'No available TML codes'
            });
            continue;
          }
        } else if (member.sentCode) {
          // Member already has a code, skip
          failedSends++;
          errors.push({
            email: member.email,
            error: 'Member already has a TML code'
          });
          continue;
        } else {
          // Test mode or other scenario
          emailContent = generateTmlCodeEmail({
            memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'TML Member',
            companyName: member.companyName || 'Company',
            tmlCode: 'TEST-TML-123',
            email: member.email,
          });
          emailSubject = 'Your BEACON 2025 TML Code (Test)';
        }

        // Send email using SendGrid
        const msg = {
          to: testMode ? testEmails[0] : member.email,
          from: {
            email: 'noreply@thebeaconexpo.com',
            name: 'BEACON 2025 Team'
          },
          replyTo: 'mlbeacon2023@gmail.com',
          subject: emailSubject,
          html: emailContent,
        };

        await sgMail.send(msg);
        successfulSends++;
        
      } catch (error) {
        console.error(`Error processing member ${member.email}:`, error);
        failedSends++;
        errors.push({
          email: member.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalSent,
      successfulSends,
      failedSends,
      codesSent,
      errors: errors.slice(0, 10), // Limit error details
      message: testMode 
        ? `Test completed: ${successfulSends} TML code emails would be sent, ${codesSent} codes would be assigned`
        : `Bulk operation completed: ${successfulSends} TML code emails sent, ${codesSent} codes assigned`,
    });

  } catch (error) {
    console.error('Error in TML bulk message operation:', error);
    return NextResponse.json(
      { error: 'Failed to process TML bulk message operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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