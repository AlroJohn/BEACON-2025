import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is not set in environment variables');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Member messaging email service interface
export interface MemberEmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  memberName?: string;
  memberType?: 'tml' | 'exhibitor';
}

// Bulk member email data
export interface BulkMemberEmailData {
  recipients: Array<{
    email: string;
    name?: string;
    memberType?: 'tml' | 'exhibitor';
  }>;
  subject: string;
  html: string;
  from?: string;
}

// Helper function to convert HTML to plain text
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove style tags
    .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
    .trim();
}

// Send single member email
export async function sendMemberEmail({
  to,
  subject,
  html,
  from,
  memberName,
  memberType
}: MemberEmailData): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('Cannot send email: SENDGRID_API_KEY not configured');
      return false;
    }

    // Generate plain text version of the email
    const plainText = htmlToPlainText(html);

    const msg: any = {
      to,
      from: {
        email: from || 'noreply@thebeaconexpo.com',
        name: 'BEACON 2025 Team'
      },
      replyTo: 'mlbeacon2023@gmail.com',
      subject,
      content: [
        {
          type: 'text/plain',
          value: plainText
        },
        {
          type: 'text/html',
          value: html
        }
      ],
      // Improved deliverability settings
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: false
        }
      },
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      },
      // Add custom headers for tracking
      headers: {
        'X-BEACON-Member-Type': memberType || 'unknown',
        'X-BEACON-Email-Type': 'member-communication'
      }
    };

    console.log(`Attempting to send member email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Member Type: ${memberType || 'unknown'}`);

    const result = await sgMail.send(msg);
    console.log(`Member email sent successfully to ${to}`);
    console.log('SendGrid response:', JSON.stringify(result[0]?.statusCode));
    return true;
  } catch (error) {
    console.error(`Error sending member email to ${to}:`, error);
    return false;
  }
}

// Send bulk member emails with rate limiting
export async function sendBulkMemberEmails({
  recipients,
  subject,
  html,
  from
}: BulkMemberEmailData): Promise<{
  totalSent: number;
  successfulSends: number;
  failedSends: number;
  errors: Array<{ email: string; error: string; }>;
}> {
  const results = {
    totalSent: 0,
    successfulSends: 0,
    failedSends: 0,
    errors: [] as Array<{ email: string; error: string; }>
  };

  // Process emails in batches to avoid rate limiting
  const batchSize = 10; // SendGrid allows up to 1000 recipients per request, but we'll be conservative
  const delayBetweenBatches = 1000; // 1 second delay between batches

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recipients.length / batchSize)}`);

    // Process batch in parallel but with controlled concurrency
    const batchPromises = batch.map(async (recipient) => {
      try {
        const success = await sendMemberEmail({
          to: recipient.email,
          subject,
          html,
          from,
          memberName: recipient.name,
          memberType: recipient.memberType
        });

        results.totalSent++;

        if (success) {
          results.successfulSends++;
        } else {
          results.failedSends++;
          results.errors.push({
            email: recipient.email,
            error: 'Failed to send email (unknown error)'
          });
        }
      } catch (error) {
        results.totalSent++;
        results.failedSends++;
        results.errors.push({
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    });

    // Wait for batch to complete
    await Promise.allSettled(batchPromises);

    // Delay between batches to respect rate limits
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`Bulk email send completed:`, results);
  return results;
}

// Generate member code notification email
export function generateMemberCodeEmail(data: {
  memberName: string;
  memberType: 'tml' | 'exhibitor';
  code: string;
  codeType: string;
}): string {
  const { memberName, memberType, code, codeType } = data;

  const memberTypeLabel = memberType === 'tml' ? 'TML Member' : 'Exhibitor';
  const codeTypeLabel = memberType === 'tml' ? 'TML Member Code' : 'Exhibitor Access Code';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your BEACON 2025 ${codeTypeLabel}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">${codeTypeLabel} Notification</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <!-- Welcome Message -->
          <div style="margin-bottom: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">Hello ${memberName !== '' || null ? 'memberName' : 'exhibitor!'}!</h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.5;">
              You have received your ${codeTypeLabel} for BEACON 2025. Please keep this code safe as you'll need it for registration and access.
            </p>
          </div>

          <!-- Code Display -->
          <div style="background-color: #f8fafc; border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
            <div style="margin-bottom: 16px;">
              <h3 style="color: #1e40af; margin: 0; font-size: 18px; font-weight: 600;">Your ${codeTypeLabel}</h3>
            </div>
            <div style="background-color: white; border: 2px dashed #93c5fd; border-radius: 8px; padding: 20px; margin: 16px 0;">
              <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px;">
                ${code}
              </div>
            </div>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Copy this code exactly as shown above
            </p>
          </div>

          <!-- Instructions -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">How to Use Your Code</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">🎟️ <strong>Registration:</strong> Use this code during BEACON 2025 registration</li>
                <li style="margin-bottom: 8px;">🎫 <strong>Event Access:</strong> Present this code at event check-in</li>
                <li style="margin-bottom: 8px;">💳 <strong>Member Benefits:</strong> Enjoy ${memberTypeLabel} privileges and discounts</li>
                <li style="margin-bottom: 8px;">📧 <strong>Keep Safe:</strong> Save this email for your records</li>
                <li>🔐 <strong>Security:</strong> Do not share this code with unauthorized persons</li>
              </ul>
            </div>
          </div>

          <!-- Event Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">BEACON 2025 Event Details</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">📅 Dates:</span>
                  <span style="color: #1f2937;">September 29 - October 1, 2025</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">📍 Venue:</span>
                  <span style="color: #1f2937;">SMX Convention Center, MOA Complex, Pasay City</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">🕘 Hours:</span>
                  <span style="color: #1f2937;">9:00 AM - 6:00 PM daily</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">🎭 Type:</span>
                  <span style="color: #1f2937;">${memberTypeLabel} Access</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Need Help?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              If you have any questions about your code or BEACON 2025, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Code:</strong> ${code}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 BEACON Conference & Exhibition. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send member code notification email
export async function sendMemberCodeEmail(data: {
  email: string;
  memberName: string;
  memberType: 'tml' | 'exhibitor';
  code: string;
  codeType: string;
}): Promise<boolean> {
  const emailHTML = generateMemberCodeEmail(data);
  const codeTypeLabel = data.memberType === 'tml' ? 'TML Member Code' : 'Exhibitor Access Code';

  const subject = `Your BEACON 2025 ${codeTypeLabel}: ${data.code}`;

  return await sendMemberEmail({
    to: data.email,
    subject,
    html: emailHTML,
    memberName: data.memberName,
    memberType: data.memberType
  });
}

// Generate custom bulk message template
export function generateBulkMessageEmail(data: {
  memberName?: string;
  memberType?: 'tml' | 'exhibitor';
  customContent: string;
  subject: string;
}): string {
  const { memberName, memberType, customContent, subject } = data;

  const memberTypeLabel = memberType === 'tml' ? 'TML Member' :
    memberType === 'exhibitor' ? 'Exhibitor' : 'Member';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">${memberTypeLabel} Communication</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          ${memberName ? `
          <!-- Personalized Greeting -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0; font-size: 20px;">Hello ${memberName},</h2>
          </div>
          ` : ''}

          <!-- Custom Message Content -->
          <div style="color: #374151; line-height: 1.6; font-size: 16px;">
            ${customContent}
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Questions?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For any inquiries, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 BEACON Conference & Exhibition. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send custom bulk message to members
export async function sendCustomBulkMessage(data: {
  recipients: Array<{
    email: string;
    name?: string;
    memberType?: 'tml' | 'exhibitor';
  }>;
  subject: string;
  customContent: string;
}): Promise<{
  totalSent: number;
  successfulSends: number;
  failedSends: number;
  errors: Array<{ email: string; error: string; }>;
}> {
  // Generate personalized emails for each recipient
  const emailPromises = data.recipients.map(recipient => ({
    email: recipient.email,
    subject: data.subject,
    html: generateBulkMessageEmail({
      memberName: recipient.name,
      memberType: recipient.memberType,
      customContent: data.customContent,
      subject: data.subject
    }),
    memberName: recipient.name,
    memberType: recipient.memberType
  }));

  return await sendBulkMemberEmails({
    recipients: data.recipients,
    subject: data.subject,
    html: emailPromises[0].html, // This will be overridden per recipient
    from: 'noreply@thebeaconexpo.com'
  });
}

// Generate exhibitor code email
export function generateExhibitorCodeEmail(data: {
  memberName: string;
  companyName: string;
  exhibitorCode: string;
  email: string;
}): string {
  const { memberName, companyName, exhibitorCode, email } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your BEACON 2025 Exhibitor Access Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Exhibitor Access Code</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <!-- Welcome Message -->
          <div style="margin-bottom: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">Hello ${memberName}!</h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.5;">
              Welcome to BEACON 2025! Your exhibitor access code for <strong>${companyName}</strong> is ready. 
              Use this code to register and access exclusive exhibitor features.
            </p>
          </div>

          <!-- Code Display -->
          <div style="background-color: #f0fdfa; border: 2px solid #10b981; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
            <div style="margin-bottom: 16px;">
              <h3 style="color: #059669; margin: 0; font-size: 18px; font-weight: 600;">Your Exhibitor Access Code</h3>
            </div>
            <div style="background-color: white; border: 2px dashed #6ee7b7; border-radius: 8px; padding: 20px; margin: 16px 0;">
              <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 4px;">
                ${exhibitorCode}
              </div>
            </div>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Copy this code exactly as shown above
            </p>
          </div>

          <!-- Instructions -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">How to Use Your Exhibitor Code</h3>
            <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">🏢 <strong>Exhibitor Registration:</strong> Use this code during BEACON 2025 exhibitor registration</li>
                <li style="margin-bottom: 8px;">🎪 <strong>Booth Setup:</strong> Present this code during booth setup and installation</li>
                <li style="margin-bottom: 8px;">🎟️ <strong>Staff Access:</strong> Your team can use this code for staff registration</li>
                <li style="margin-bottom: 8px;">📋 <strong>Exhibitor Services:</strong> Access exclusive exhibitor resources and support</li>
                <li style="margin-bottom: 8px;">💼 <strong>Business Privileges:</strong> Enjoy exhibitor-only networking events and benefits</li>
                <li>🔐 <strong>Security:</strong> Keep this code confidential and share only with authorized team members</li>
              </ul>
            </div>
          </div>

          <!-- Exhibitor Benefits -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Exhibitor Benefits & Features</h3>
            <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px;">
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; align-items: center;">
                  <span style="color: #059669; font-weight: 500; width: 180px;">🎪 Booth Space:</span>
                  <span style="color: #1f2937;">Premium exhibition space allocation</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #059669; font-weight: 500; width: 180px;">👥 Staff Passes:</span>
                  <span style="color: #1f2937;">Multiple staff member registrations</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #059669; font-weight: 500; width: 180px;">📊 Lead Generation:</span>
                  <span style="color: #1f2937;">Access to visitor contact information</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #059669; font-weight: 500; width: 180px;">🍽️ Networking Events:</span>
                  <span style="color: #1f2937;">Exclusive exhibitor dinners and meetups</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #059669; font-weight: 500; width: 180px;">📈 Marketing Support:</span>
                  <span style="color: #1f2937;">Digital and print marketing opportunities</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Event Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">BEACON 2025 Event Details</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">📅 Dates:</span>
                  <span style="color: #1f2937;">September 29 - October 1, 2025</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">📍 Venue:</span>
                  <span style="color: #1f2937;">SMX Convention Center, MOA Complex, Pasay City</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">🕘 Setup:</span>
                  <span style="color: #1f2937;">September 28, 2025 (8:00 AM - 6:00 PM)</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500; width: 120px;">🎪 Exhibition:</span>
                  <span style="color: #1f2937;">September 29 - October 1 (9:00 AM - 6:00 PM)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Exhibitor Support</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For exhibitor-specific inquiries, setup assistance, or technical support:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #059669;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Company:</strong> ${companyName}<br>
              <strong>Code:</strong> ${exhibitorCode}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 BEACON Conference & Exhibition. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate TML member code email
export function generateTmlCodeEmail(data: {
  memberName: string;
  companyName: string;
  tmlCode: string;
  email: string;
}): string {
  const { memberName, companyName, tmlCode, email } = data;
  const displayCompany = companyName ? ` from ${companyName}` : "";

  return `
    <\!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your BEACON 2025 TML Access Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <\!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🚢 BEACON 2025</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px;">TML Member Access Code</p>
        </div>

        <\!-- Main Content -->
        <div style="padding: 30px;">
          <\!-- Welcome Message -->
          <div style="margin-bottom: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">Hello ${memberName}\!</h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.5;">
              Welcome to BEACON 2025\! Your TML (The Maritime League) access code${displayCompany} is ready. 
              Use this code to register and access exclusive TML member benefits.
            </p>
          </div>

          <\!-- Code Display -->
          <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
            <div style="margin-bottom: 16px;">
              <h3 style="color: #1e40af; margin: 0; font-size: 18px; font-weight: 600;">Your TML Access Code</h3>
            </div>
            <div style="background-color: white; border: 2px dashed #93c5fd; border-radius: 8px; padding: 20px; margin: 16px 0;">
              <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px;">
                ${tmlCode}
              </div>
            </div>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Copy this code exactly as shown above
            </p>
          </div>

          <\!-- Instructions -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">How to Use Your TML Code</h3>
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">🚢 <strong>Conference Registration:</strong> Use this code during BEACON 2025 conference registration</li>
                <li style="margin-bottom: 8px;">👥 <strong>TML Member Events:</strong> Access exclusive TML member sessions and networking</li>
                <li style="margin-bottom: 8px;">🎟️ <strong>Special Discounts:</strong> Enjoy TML member pricing and benefits</li>
                <li style="margin-bottom: 8px;">📋 <strong>Member Resources:</strong> Access TML member-only content and materials</li>
                <li style="margin-bottom: 8px;">💼 <strong>Maritime Network:</strong> Connect with fellow maritime professionals</li>
                <li>🔐 <strong>Security:</strong> Keep this code confidential and for your personal use only</li>
              </ul>
            </div>
          </div>

          <\!-- Contact Information -->
          <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">Need assistance? Contact our support team:</p>
            <p style="margin: 0;">📧 mlbeacon2023@gmail.com</p>
          </div>
        </div>

        <\!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">BEACON 2025  < /dev/null |  Maritime Industry Expo & Conference</p>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Building Excellence, Advancing Careers, Optimizing Networks</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
