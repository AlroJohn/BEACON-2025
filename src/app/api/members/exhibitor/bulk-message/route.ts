import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateExhibitorCodeEmail, sendMemberEmail } from '@/lib/code-email';
import sgMail from '@sendgrid/mail';

const prisma = new PrismaClient();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

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
    const members = await prisma.exhibitorMembers.findMany({
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

    // If test mode, only send to admin emails (you can configure this)
    const testEmails = ['admin@thebeaconexpo.com']; // Add actual admin emails
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
          // Find an available exhibitor code
          const availableCode = await prisma.exhibitorCodeDistribution.findFirst({
            where: {
              isActive: true,
              userId: null,
              isSent: false,
            },
            orderBy: { createdAt: 'asc' },
          });

          if (availableCode) {
            // Generate standard exhibitor code email
            emailContent = generateExhibitorCodeEmail({
              memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Exhibitor',
              companyName: member.companyName || 'Company',
              exhibitorCode: availableCode.code,
              email: member.email,
            });
            emailSubject = `Your BEACON 2025 Exhibitor Code: ${availableCode.code}`;

            // Update code and member in transaction
            await prisma.$transaction([
              prisma.exhibitorCodeDistribution.update({
                where: { id: availableCode.id },
                data: {
                  isSent: true,
                  sentAt: new Date(),
                  sentTo: member.email,
                },
              }),
              prisma.exhibitorMembers.update({
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
              error: 'No available exhibitor codes'
            });
            continue;
          }
        } else if (member.sentCode) {
          // Member already has a code, skip
          failedSends++;
          errors.push({
            email: member.email,
            error: 'Member already has an exhibitor code'
          });
          continue;
        } else {
          // Test mode or other scenario
          emailContent = generateExhibitorCodeEmail({
            memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Exhibitor',
            companyName: member.companyName || 'Company',
            exhibitorCode: 'TEST-CODE-123',
            email: member.email,
          });
          emailSubject = 'Your BEACON 2025 Exhibitor Code (Test)';
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
        ? `Test completed: ${successfulSends} exhibitor code emails would be sent, ${codesSent} codes would be assigned`
        : `Bulk operation completed: ${successfulSends} exhibitor code emails sent, ${codesSent} codes assigned`,
    });

  } catch (error) {
    console.error('Error in bulk message operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk message operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}