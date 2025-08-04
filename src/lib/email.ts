import sgMail from '@sendgrid/mail';
import QRCode from 'qrcode';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is not set in environment variables');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Generate high-quality QR code and convert to base64 (matching visitor email pattern)
const generateQRCodeAsBase64 = async (data: string): Promise<string> => {
  // First generate the QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(data, {
    width: 512,
    margin: 2,
    color: {
      dark: "#1e40af", // BEACON blue color
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
    type: "image/png",
  });

  // Convert data URL to base64 (remove data:image/png;base64, prefix)
  return qrCodeDataUrl.split(',')[1];
};

// Email service interface
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  templateData?: Record<string, any>;
  userId?: string; // Add userId for QR code generation
}

// Conference registration email data
export interface ConferenceRegistrationEmailData {
  userEmail: string;
  userName: string;
  userId: string; // Add userId for QR code
  conferenceId: string;
  isMaritimeLeagueMember: boolean;
  selectedEvents: Array<{
    eventName: string;
    eventDates: Date[];
    eventPrice: number;
    eventStatus: string;
  }>;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'FREE';
  requiresPayment: boolean;
  tmlMemberCode?: string;
  attendingDays?: Record<string, string[]>;
}

// Helper function to convert HTML to plain text
function htmlToPlainText(html: string): string {
  // Remove HTML tags and decode entities
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

// Send email function
export async function sendEmail({ to, subject, html, from, userId }: EmailData): Promise<boolean> {
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
        email: 'noreply@thebeaconexpo.com',
        name: 'BEACON 2025 Team'
      },
      replyTo: 'mlbeacon2023@gmail.com',
      subject,
      // Add both HTML and plain text content for better deliverability
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
      }
    };

    // Generate and attach QR code if userId is provided
    if (userId) {
      try {
        console.log(`Generating QR code for user: ${userId}`);
        const base64Image = await generateQRCodeAsBase64(userId);

        msg.attachments = [
          {
            content: base64Image,
            filename: `BEACON_2025_Conference_Pass_${userId.slice(-8)}.png`,
            type: 'image/png',
            disposition: 'attachment',
            contentId: 'qrcode'
          }
        ];
        console.log('QR code generated and attached successfully');
      } catch (qrError) {
        console.error('Failed to generate QR code, sending email without it:', qrError);
        // Continue sending email without QR code
      }
    }

    console.log(`Attempting to send email to: ${to}`);
    console.log(`Email subject: ${subject}`);
    console.log(`From address: ${msg.from}`);

    const result = await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    console.log('SendGrid response:', JSON.stringify(result[0]?.statusCode));
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // if (error && typeof error === 'object' && 'response' in error) {
    //   console.error('SendGrid error details:', error.response?.body);
    // }
    return false;
  }
}

// Generate conference registration confirmation email HTML
export function generateConferenceRegistrationEmail(data: ConferenceRegistrationEmailData): string {
  const {
    userName,
    conferenceId,
    isMaritimeLeagueMember,
    selectedEvents,
    totalAmount,
    paymentStatus,
    requiresPayment,
    tmlMemberCode,
  } = data;

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getStatusBadge = () => {
    if (paymentStatus === 'CONFIRMED') {
      return '<span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">CONFIRMED</span>';
    } else if (paymentStatus === 'FREE') {
      return '<span style="background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">FREE - TML MEMBER</span>';
    } else {
      return '<span style="background-color: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">PENDING REVIEW</span>';
    }
  };

  const eventsHTML = selectedEvents.map(event => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${event.eventName}</strong>
        <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">
          ${event.eventDates && event.eventDates.length > 0
      ? event.eventDates.length === 1
        ? formatDate(event.eventDates[0])
        : event.eventDates.map((date: Date) => formatDate(date)).join(', ')
      : 'No dates scheduled'
    } • ${event.eventStatus}
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
        ${formatCurrency(event.eventPrice)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BEACON 2025 Conference Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Conference Registration</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background-color: #fef3c7; border-bottom: 1px solid #e5e7eb;">
          <!-- circle -->
          <div style="
            width:60px;
            height:60px;
            background-color: #f59e0b;
            border-radius:50%;
            margin:0 auto 16px;    
            text-align:center;      
            line-height:60px;       
          ">
            <span style="color:#ffffff;font-size:24px;display:inline-block;">🎓</span>
          </div>
          <h2 style="color: #92400e; margin: 0 0 8px 0; font-size: 24px;">Conference Registration Submitted!</h2>
          <p style="color: #78350f; margin: 0; font-size: 16px;">Your conference registration has been received and is under review</p>
        </div>


        <!-- Registration Details -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Conference Details</h3>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Registration ID:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${conferenceId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Registrant:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Membership Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    ${isMaritimeLeagueMember ? `<span style="color: #059669; font-weight: bold;">TML Member</span>${tmlMemberCode ? ` (${tmlMemberCode})` : ''}` : '<span style="color: #dc2626; font-weight: bold;">Non-TML Member</span>'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">${getStatusBadge()}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Selected Events -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Selected Events</h3>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                ${eventsHTML}
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 16px; font-weight: bold; font-size: 16px;">Total Amount:</td>
                  <td style="padding: 16px; text-align: right; font-weight: bold; font-size: 18px; color: #1e40af;">
                    ${formatCurrency(totalAmount)}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Payment Status -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Payment Information</h3>
            
            ${paymentStatus === 'FREE' ? `
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af; font-weight: 500;">
                  <strong>🎉 Congratulations!</strong><br>
                  As a TML member, your registration is <strong>FREE</strong> and has been automatically confirmed.
                </p>
              </div>
            ` : requiresPayment ? `
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 500;">
                  <strong>⏳ Payment Pending Review</strong>
                </p>
                <p style="margin: 0; color: #78350f; line-height: 1.5;">
                  Your registration has been submitted successfully. Your payment receipt will be reviewed by our admin team within 24-48 hours. 
                  You will receive a confirmation email once your payment is verified.
                </p>
              </div>
            ` : `
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46; font-weight: 500;">
                  <strong>✅ Registration Complete</strong><br>
                  No payment required for your selected events.
                </p>
              </div>
            `}
          </div>

          <!-- Status Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">What Happens Next?</h3>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 500;">
                <strong>⏳ Your Application is Under Review</strong>
              </p>
              <p style="margin: 0; color: #78350f; line-height: 1.5;">
                Our BEACON 2025 Conference Team will review your registration and reach out within 2-3 business days to confirm your participation and provide event details.
              </p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Next Steps</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">📞 Our conference team will contact you within 2-3 business days</li>
                <li style="margin-bottom: 8px;">🎓 Conference schedule and session details will be provided</li>
                ${requiresPayment ? '<li style="margin-bottom: 8px;">💳 Payment confirmation will be processed within 24-48 hours</li>' : ''}
                <li style="margin-bottom: 8px;">📧 All conference updates will be sent to this email address</li>
                <li style="margin-bottom: 8px;">📋 Event guidelines and venue information will be shared</li>
                <li>🎯 Networking opportunities and additional activities will be announced</li>
              </ul>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Questions About the Conference?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For immediate conference inquiries, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Registration ID:</strong> ${conferenceId}
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

// Send conference registration confirmation email
export async function sendConferenceRegistrationEmail(data: ConferenceRegistrationEmailData): Promise<boolean> {
  const emailHTML = generateConferenceRegistrationEmail(data);

  const subject = `BEACON 2025 Conference Registration - Under Review`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com',
    userId: data.userId // Pass userId for QR code generation
  });
}

// Payment status notification email data
export interface PaymentStatusEmailData {
  userEmail: string;
  userName: string;
  conferenceId: string;
  oldStatus: string;
  newStatus: 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  totalAmount: number;
  referenceNumber?: string;
  notes?: string;
  selectedEvents: Array<{
    eventName: string;
    eventDates: Date[];
    eventPrice: number;
  }>;
  userId?: string; // Add userId for QR code generation when payment is CONFIRMED
}

// Generate payment status update email HTML
export function generatePaymentStatusEmail(data: PaymentStatusEmailData): string {
  const {
    userName,
    conferenceId,
    oldStatus,
    newStatus,
    totalAmount,
    referenceNumber,
    notes,
    selectedEvents,
  } = data;

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Status-specific configurations
  const statusConfig = {
    CONFIRMED: {
      color: '#10b981',
      bgColor: '#f0fdf4',
      borderColor: '#10b981',
      icon: '✅',
      title: 'Payment Confirmed!',
      description: 'Your payment has been successfully verified and confirmed.',
      message: 'Congratulations! Your payment has been confirmed. You can now attend all your selected BEACON 2025 events.',
      nextSteps: [
        '🎫 Your registration is now complete and confirmed',
        '📧 You will receive event schedules and venue details closer to the event dates',
        '🆔 Bring a valid ID for event check-in',
        '📱 Save this email for your records and event entry',
        '🎓 Digital certificates will be available after attending the events'
      ]
    },
    FAILED: {
      color: '#ef4444',
      bgColor: '#fef2f2',
      borderColor: '#ef4444',
      icon: '❌',
      title: 'Payment Not Verified',
      description: 'Unfortunately, we could not verify your payment.',
      message: 'We were unable to verify your payment. Please check the details below and contact our support team if you believe this is an error.',
      nextSteps: [
        '🔍 Please verify your payment details and receipt',
        '📞 Contact our support team with your reference number',
        '💳 You may need to resubmit your payment',
        '📧 Email us at payments@beacon2025.com for assistance',
        '⏰ Payment issues should be resolved at least 7 days before the event'
      ]
    },
    REFUNDED: {
      color: '#6b7280',
      bgColor: '#f9fafb',
      borderColor: '#6b7280',
      icon: '💰',
      title: 'Payment Refunded',
      description: 'Your payment has been processed for refund.',
      message: 'Your payment has been refunded as requested. The refund will be processed back to your original payment method.',
      nextSteps: [
        '💸 Refund will be processed within 5-10 business days',
        '🏦 Funds will be returned to your original payment method',
        '📧 You will receive a refund confirmation email separately',
        '📞 Contact us if you don\'t see the refund within 10 business days',
        '❓ Your event registration has been cancelled'
      ]
    }
  };

  const config = statusConfig[newStatus];

  const eventsHTML = selectedEvents.map(event => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${event.eventName}</strong>
        <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">
          ${event.eventDates && event.eventDates.length > 0
      ? event.eventDates.length === 1
        ? formatDate(event.eventDates[0])
        : event.eventDates.map((date: Date) => formatDate(date)).join(', ')
      : 'No dates scheduled'
    }
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
        ${formatCurrency(event.eventPrice)}
      </td>
    </tr>
  `).join('');

  const nextStepsHTML = config.nextSteps.map(step => `
    <li style="margin-bottom: 8px;">${step}</li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BEACON 2025 Payment Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Payment Status Update</p>
        </div>

        <!-- Status Message -->
        <div style="padding: 30px; text-align: center; background-color: ${config.bgColor}; border-bottom: 1px solid #e5e7eb;">
          <!-- circle -->
          <div style="
            width:60px;
            height:60px;
            background-color:${config.color};
            border-radius:50%;
            margin:0 auto 16px;    
            text-align:center;      
            line-height:60px;       
          ">
            <span style="color:#ffffff;font-size:24px;display:inline-block;">${config.icon}</span>
          </div>
          <h2 style="color: ${config.color}; margin: 0 0 8px 0; font-size: 24px;">${config.title}</h2>
          <p style="color: #374151; margin: 0; font-size: 16px;">${config.description}</p>
        </div>

        <!-- Payment Details -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Payment Update Details</h3>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Registration ID:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${conferenceId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Participant:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Previous Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${oldStatus}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">New Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: ${config.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${newStatus}</span>
                  </td>
                </tr>
                ${referenceNumber ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Reference Number:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; font-family: monospace;">${referenceNumber}</td>
                </tr>
                ` : ''}
              </table>
            </div>
          </div>

          <!-- Message -->
          <div style="margin-bottom: 30px;">
            <div style="background-color: ${config.bgColor}; padding: 20px; border-radius: 8px; border-left: 4px solid ${config.borderColor};">
              <p style="margin: 0; color: #374151; font-weight: 500; line-height: 1.6;">
                ${config.message}
              </p>
            </div>
          </div>

          <!-- Selected Events -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Selected Events</h3>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                ${eventsHTML}
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 16px; font-weight: bold; font-size: 16px;">Total Amount:</td>
                  <td style="padding: 16px; text-align: right; font-weight: bold; font-size: 18px; color: #1e40af;">
                    ${formatCurrency(totalAmount)}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          ${notes ? `
          <!-- Admin Notes -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Additional Information</h3>
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">${notes}</p>
            </div>
          </div>
          ` : ''}

          <!-- Next Steps -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">What's Next?</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                ${nextStepsHTML}
              </ul>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Need Help?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              If you have any questions about this payment update, please contact us:<br>
              <strong>Email:</strong> mlbeacon2023@gmail.com<br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Reference ID:</strong> ${conferenceId}
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

// Send payment status update email
export async function sendPaymentStatusEmail(data: PaymentStatusEmailData): Promise<boolean> {
  const emailHTML = generatePaymentStatusEmail(data);

  const statusTitles = {
    CONFIRMED: 'Payment Confirmed',
    FAILED: 'Payment Issue Requires Attention',
    REFUNDED: 'Payment Refunded'
  };

  const subject = `BEACON 2025 Conference: ${statusTitles[data.newStatus]}`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com',
    // Include userId for QR code generation when payment is CONFIRMED
    userId: data.newStatus === 'CONFIRMED' ? data.userId : undefined
  });
}

// Sponsor registration email data
export interface SponsorRegistrationEmailData {
  userEmail: string;
  userName: string;
  userId: string; // Add userId for QR code
  sponsorId: string;
  companyName: string;
  sponsorshipCategories: string[];
  budgetRange: string;
  proposalStatus: string;
}

// Generate sponsor registration confirmation email HTML
export function generateSponsorRegistrationEmail(data: SponsorRegistrationEmailData): string {
  const {
    userName,
    sponsorId,
    companyName,
    sponsorshipCategories,
    budgetRange,
    proposalStatus,
  } = data;

  const formatBudgetRange = (range: string) => {
    const labels: Record<string, string> = {
      RANGE_50K_100K: "₱50,000 - ₱100,000",
      RANGE_100K_250K: "₱100,000 - ₱250,000",
      RANGE_250K_500K: "₱250,000 - ₱500,000",
      RANGE_500K_1M: "₱500,000 - ₱1,000,000",
      RANGE_1M_ABOVE: "₱1,000,000 and Above",
      TO_BE_DISCUSSED: "To be discussed",
    };
    return labels[range] || range;
  };

  const formatProposalStatus = (status: string) => {
    const labels: Record<string, string> = {
      YES: "Yes",
      NO: "No",
      SCHEDULE_MEETING: "Schedule Meeting",
    };
    return labels[status] || status;
  };

  const categoriesHTML = sponsorshipCategories.map(category => `
    <li style="margin-bottom: 4px; color: #4b5563;">• ${category}</li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BEACON 2025 Sponsor Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Sponsor Registration</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background-color: #fef3c7; border-bottom: 1px solid #e5e7eb;">
           <!-- circle -->
          <div style="
            width:60px;
            height:60px;
            background-color: #f59e0b;
            border-radius:50%;
            margin:0 auto 16px;    
            text-align:center;      
            line-height:60px;       
          ">
            <span style="color:#ffffff;font-size:24px;display:inline-block;">🤝</span>
          </div>
          <h2 style="color: #92400e; margin: 0 0 8px 0; font-size: 24px;">Sponsor Registration Submitted!</h2>
          <p style="color: #78350f; margin: 0; font-size: 16px;">Your sponsorship interest has been received and is under review</p>
        </div>

        <!-- Registration Details -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Sponsorship Details</h3>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Registration ID:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${sponsorId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Contact Person:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Company:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">PENDING REVIEW</span>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Sponsorship Interest -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Sponsorship Interest</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Sponsorship Categories:</h4>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${categoriesHTML}
                </ul>
              </div>
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Budget Range:</h4>
                <p style="margin: 0; color: #1e40af; font-weight: bold;">${formatBudgetRange(budgetRange)}</p>
              </div>
              <div>
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Customized Proposal:</h4>
                <p style="margin: 0; color: #4b5563;">${formatProposalStatus(proposalStatus)}</p>
              </div>
            </div>
          </div>

          <!-- Status Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">What Happens Next?</h3>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 500;">
                <strong>⏳ Your Application is Under Review</strong>
              </p>
              <p style="margin: 0; color: #78350f; line-height: 1.5;">
                Our BEACON 2025 Sponsorship Team will review your application and reach out within 2-3 business days to discuss your ideal package, branding integration, and activation plans.
              </p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Next Steps</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">📞 Our sponsorship team will contact you within 2-3 business days</li>
                <li style="margin-bottom: 8px;">📋 We'll discuss your specific sponsorship goals and requirements</li>
                <li style="margin-bottom: 8px;">💼 A customized sponsorship proposal will be prepared for your review</li>
                <li style="margin-bottom: 8px;">🤝 We'll coordinate branding opportunities and activation details</li>
                <li style="margin-bottom: 8px;">📧 All communication will be sent to this email address</li>
                <li>🎯 Together we'll create maximum impact for your brand at BEACON 2025</li>
              </ul>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Questions About Sponsorship?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For immediate sponsorship inquiries, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Registration ID:</strong> ${sponsorId}
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

// Send sponsor registration confirmation email
export async function sendSponsorRegistrationEmail(data: SponsorRegistrationEmailData): Promise<boolean> {
  const emailHTML = generateSponsorRegistrationEmail(data);

  const subject = `BEACON 2025 Sponsor Registration - Under Review`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com',
    // No QR code for initial registration - only after admin confirmation
  });
}

// Exhibitor registration email data
export interface ExhibitorRegistrationEmailData {
  userEmail: string;
  userName: string;
  userId: string; // Add userId for QR code
  exhibitorId: string;
  companyName: string;
  participationTypes: string[];
  boothSize: string;
  confirmIntent: string;
}

// Generate exhibitor registration confirmation email HTML
export function generateExhibitorRegistrationEmail(data: ExhibitorRegistrationEmailData): string {
  const {
    userName,
    exhibitorId,
    companyName,
    participationTypes,
    boothSize,
    confirmIntent,
  } = data;

  const formatConfirmIntent = (intent: string) => {
    const labels: Record<string, string> = {
      YES_RESERVE: "Yes, I want to reserve a booth",
      TENTATIVE: "Tentative - need more information",
      NO_EXPLORING: "No, just exploring options",
    };
    return labels[intent] || intent;
  };

  const participationHTML = participationTypes
    .map(type => {
      const label = type.replace(/_/g, ' '); // convert "product_presentation" → "product presentation"
      return `<li style="margin-bottom: 4px; color: #4b5563;">• ${label}</li>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BEACON 2025 Exhibitor Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Exhibitor Registration</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background-color: #fef3c7; border-bottom: 1px solid #e5e7eb;">
          <!-- circle -->
          <div style="
            width:60px;
            height:60px;
            background-color: #f59e0b;
            border-radius:50%;
            margin:0 auto 16px;    
            text-align:center;      
            line-height:60px;       
          ">
            <span style="color:#ffffff;font-size:24px;display:inline-block;">🏢</span>
          </div>
          <h2 style="color: #92400e; margin: 0 0 8px 0; font-size: 24px;">Exhibitor Registration Submitted!</h2>
          <p style="color: #78350f; margin: 0; font-size: 16px;">Your exhibition application has been received and is under review</p>
        </div>

        <!-- Registration Details -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Exhibition Details</h3>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Registration ID:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${exhibitorId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Contact Person:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Company:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">PENDING REVIEW</span>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Exhibition Interest -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Exhibition Requirements</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Participation Types:</h4>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${participationHTML}
                </ul>
              </div>
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Preferred Booth Size:</h4>
                <p style="margin: 0; color: #1e40af; font-weight: bold;">${boothSize}</p>
              </div>
              <div>
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Confirmation Intent:</h4>
                <p style="margin: 0; color: #4b5563;">${formatConfirmIntent(confirmIntent)}</p>
              </div>
            </div>
          </div>

          <!-- Status Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">What Happens Next?</h3>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 500;">
                <strong>⏳ Your Application is Under Review</strong>
              </p>
              <p style="margin: 0; color: #78350f; line-height: 1.5;">
                Our BEACON 2025 Exhibition Team will review your application and contact you within 2-3 business days to discuss booth availability, pricing, and logistics coordination.
              </p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Next Steps</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">📞 Our exhibition team will contact you within 2-3 business days</li>
                <li style="margin-bottom: 8px;">🏢 We'll discuss booth availability and optimal positioning</li>
                <li style="margin-bottom: 8px;">💰 Pricing details and package options will be provided</li>
                <li style="margin-bottom: 8px;">📋 Exhibition guidelines and setup requirements will be shared</li>
                <li style="margin-bottom: 8px;">🚚 Logistics coordination for equipment and materials</li>
                <li>🎯 Marketing opportunities and promotional support options</li>
              </ul>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Questions About Exhibiting?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For immediate exhibition inquiries, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Registration ID:</strong> ${exhibitorId}
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

// Visitor registration email data
export interface VisitorRegistrationEmailData {
  userEmail: string;
  userName: string;
  userId: string; // Add userId for QR code
  visitorId: string;
  attendeeType: string;
  companyName?: string;
  jobTitle?: string;
  eventParts: string[];
  attendingDays: any;
}

// Generate visitor registration confirmation email HTML
function generateVisitorRegistrationEmail(data: VisitorRegistrationEmailData): string {
  const { userName, visitorId, attendeeType, companyName, jobTitle, eventParts, attendingDays } = data;

  // Format event parts
  const eventPartsHTML = eventParts.map(part => `<li style="margin-bottom: 4px;">• ${part}</li>`).join('');

  // Format attending days with detailed dates
  const attendingDaysHTML = Object.entries(attendingDays || {})
    .filter(([_, dates]) => Array.isArray(dates) && dates.length > 0)
    .map(([eventName, dates]) => {
      // → build a nested <ul> where each date is its own <li>
      const datesBullets = (dates as string[])
        .map(date => {
          const d = new Date(date)
          const pretty = d.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
          return `<li style="color:#6b7280;font-size:14px;">${pretty}</li>`
        })
        .join('')

      return `
      <li style="margin-bottom:12px;">
        <strong style="color:#1e40af;">${eventName}</strong>
        <ul style="list-style-type:disc;margin-left:20px;margin-top:4px;">
          ${datesBullets}
        </ul>
      </li>
    `
    })
    .join('')


  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BEACON 2025 Visitor Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f4e 0%, #2f538b 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Visitor Registration Confirmed</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <!-- Success Message -->
          <div style="padding: 30px; text-align: center; background-color: #f0fdf4; border-bottom: 1px solid #e5e7eb; margin-bottom: 30px;">
            <!-- circle -->
            <div style="
              width:60px;
              height:60px;
              background-color: #10b981;
              border-radius:50%;
              margin:0 auto 16px;    
              text-align:center;      
              line-height:60px;       
            ">
              <span style="color:#ffffff;font-size:24px;display:inline-block;">✓</span>
            </div>
            <h2 style="color: #059669; margin: 0 0 8px 0; font-size: 24px;">Registration Successful!</h2>
            <p style="color: #065f46; margin: 0; font-size: 16px;">Welcome to BEACON 2025, ${userName}!</p>
          </div>

          <!-- Registration Summary -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Registration Details</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500; width: 140px;">Registration ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${visitorId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Attendee Type:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${attendeeType.replace(/_/g, ' ')}</td>
                </tr>
                ${jobTitle ? `
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Job Title:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${jobTitle}</td>
                </tr>
                ` : ''}
                ${companyName ? `
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Company:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${companyName}</td>
                </tr>
                ` : ''}
              </table>
            </div>
          </div>

          <!-- Event Participation -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Event Access</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Event Parts:</h4>
                <ul style="margin: 0; padding-left: 0; list-style: none; color: #1e40af;">
                  ${eventPartsHTML}
                </ul>
              </div>
              ${attendingDaysHTML ? `
              <div>
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Attending Days:</h4>
                <ul style="margin: 0; padding-left: 0; list-style: none; color: #1e40af;">
                  ${attendingDaysHTML}
                </ul>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Status Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">What's Next?</h3>
            <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
              <p style="margin: 0 0 12px 0; color: #166534; font-weight: 500;">
                <strong>✅ You're All Set!</strong>
              </p>
              <p style="margin: 0; color: #15803d; line-height: 1.5;">
                Your visitor registration is confirmed! Get ready for an amazing experience at BEACON 2025 from September 29 - October 1, 2025 at SMX Convention Center, MOA Complex, Pasay City.
              </p>
            </div>
          </div>

          <!-- Event Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Event Information</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">📅 <strong>Dates:</strong> September 29 - October 1, 2025</li>
                <li style="margin-bottom: 8px;">📍 <strong>Venue:</strong> SMX Convention Center, MOA Complex, Pasay City</li>
                <li style="margin-bottom: 8px;">🕘 <strong>Hours:</strong> 9:00 AM - 6:00 PM daily</li>
                <li style="margin-bottom: 8px;">🎟️ <strong>Entry:</strong> FREE admission with this registration</li>
                <li style="margin-bottom: 8px;">📧 <strong>Updates:</strong> Check your email for event updates</li>
                <li>🎁 <strong>Benefits:</strong> Access to exhibitions, networking opportunities, and industry insights</li>
              </ul>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Questions About Your Visit?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For any inquiries about your visit, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Registration ID:</strong> ${visitorId}
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

// Send visitor registration confirmation email
export async function sendVisitorRegistrationEmail(data: VisitorRegistrationEmailData): Promise<boolean> {
  const emailHTML = generateVisitorRegistrationEmail(data);

  const subject = `BEACON 2025 Visitor Registration Confirmed - Welcome!`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com',
    userId: data.userId // Pass userId for QR code generation
  });
}

// Send exhibitor registration confirmation email
export async function sendExhibitorRegistrationEmail(data: ExhibitorRegistrationEmailData): Promise<boolean> {
  const emailHTML = generateExhibitorRegistrationEmail(data);

  const subject = `BEACON 2025 Exhibitor Registration - Under Review`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com',
    // No QR code for initial registration - only after admin confirmation
  });
}

// Sponsor confirmation email data
export interface SponsorConfirmationEmailData {
  userEmail: string;
  userName: string;
  userId: string;
  sponsorId: string;
  companyName: string;
  sponsorshipCategories: string[];
  budgetRange: string;
  status: 'CONFIRMED' | 'REJECTED';
  notes?: string;
}

// Generate sponsor confirmation email HTML
export function generateSponsorConfirmationEmail(data: SponsorConfirmationEmailData): string {
  const {
    userName,
    sponsorId,
    companyName,
    sponsorshipCategories,
    budgetRange,
    status,
    notes,
  } = data;

  const formatBudgetRange = (range: string) => {
    const labels: Record<string, string> = {
      RANGE_50K_100K: "₱50,000 - ₱100,000",
      RANGE_100K_250K: "₱100,000 - ₱250,000",
      RANGE_250K_500K: "₱250,000 - ₱500,000",
      RANGE_500K_1M: "₱500,000 - ₱1,000,000",
      RANGE_1M_ABOVE: "₱1,000,000 and Above",
      TO_BE_DISCUSSED: "To be discussed",
    };
    return labels[range] || range;
  };

  const categoriesHTML = sponsorshipCategories.map(category => `
    <li style="margin-bottom: 4px; color: #4b5563;">• ${category}</li>
  `).join('');

  const isConfirmed = status === 'CONFIRMED';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BEACON 2025 Sponsor Application ${isConfirmed ? 'Approved' : 'Update'}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Sponsorship Application Update</p>
        </div>

        <!-- Status Message -->
        <div style="padding: 30px; text-align: center; background-color: ${isConfirmed ? '#f0fdf4' : '#fef2f2'}; border-bottom: 1px solid #e5e7eb;">
          <!-- circle -->
          <div style="
            width:60px;
            height:60px;
            background-color: ${isConfirmed ? '#10b981' : '#ef4444'};
            border-radius:50%;
            margin:0 auto 16px;    
            text-align:center;      
            line-height:60px;       
          ">
            <span style="color:#ffffff;font-size:24px;display:inline-block;">${isConfirmed ? '✅' : '❌'}</span>
          </div>
          <h2 style="color: ${isConfirmed ? '#059669' : '#dc2626'}; margin: 0 0 8px 0; font-size: 24px;">
            Sponsorship Application ${isConfirmed ? 'Approved!' : 'Update Required'}
          </h2>
          <p style="color: ${isConfirmed ? '#065f46' : '#991b1b'}; margin: 0; font-size: 16px;">
            ${isConfirmed
      ? 'Congratulations! Your sponsorship application has been approved'
      : 'Your sponsorship application requires attention'
    }
          </p>
        </div>

        <!-- Application Details -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Sponsorship Details</h3>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Registration ID:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${sponsorId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Contact Person:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Company:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: ${isConfirmed ? '#10b981' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                      ${isConfirmed ? 'APPROVED' : 'REQUIRES ATTENTION'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Sponsorship Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Sponsorship Package</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Sponsorship Categories:</h4>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${categoriesHTML}
                </ul>
              </div>
              <div>
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Budget Range:</h4>
                <p style="margin: 0; color: #1e40af; font-weight: bold;">${formatBudgetRange(budgetRange)}</p>
              </div>
            </div>
          </div>

          ${notes ? `
          <!-- Admin Notes -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Additional Information</h3>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280;">
              <p style="margin: 0; color: #4b5563; line-height: 1.5;">${notes}</p>
            </div>
          </div>
          ` : ''}

          <!-- Next Steps -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Next Steps</h3>
            <div style="background-color: ${isConfirmed ? '#f0fdf4' : '#fef2f2'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${isConfirmed ? '#10b981' : '#ef4444'};">
              ${isConfirmed ? `
                <p style="margin: 0 0 12px 0; color: #059669; font-weight: 500;">
                  <strong>🎉 Welcome to BEACON 2025 as an Official Sponsor!</strong>
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #065f46; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">📞 Our partnership team will contact you within 24 hours</li>
                  <li style="margin-bottom: 8px;">📋 Detailed sponsorship agreement will be provided</li>
                  <li style="margin-bottom: 8px;">🎨 Branding guidelines and asset requirements will be shared</li>
                  <li style="margin-bottom: 8px;">📅 Event timeline and key activation dates will be confirmed</li>
                  <li style="margin-bottom: 8px;">💼 Dedicated account manager will be assigned</li>
                  <li>🏆 Event access credentials and VIP benefits will be arranged</li>
                </ul>
              ` : `
                <p style="margin: 0 0 12px 0; color: #dc2626; font-weight: 500;">
                  <strong>📝 Action Required</strong>
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">📞 Our team will contact you to discuss the requirements</li>
                  <li style="margin-bottom: 8px;">📋 Additional documentation may be needed</li>
                  <li style="margin-bottom: 8px;">💰 Budget or package adjustments may be required</li>
                  <li>🤝 We're committed to finding a suitable sponsorship solution</li>
                </ul>
              `}
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Questions About Your Sponsorship?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For immediate sponsorship inquiries, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Registration ID:</strong> ${sponsorId}
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

// Send sponsor confirmation email
export async function sendSponsorConfirmationEmail(data: SponsorConfirmationEmailData): Promise<boolean> {
  const emailHTML = generateSponsorConfirmationEmail(data);

  const subject = `BEACON 2025 Sponsorship Application ${data.status === 'CONFIRMED' ? 'Approved' : 'Update Required'}`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com',
    // Include QR code only when status is CONFIRMED
    userId: data.status === 'CONFIRMED' ? data.userId : undefined
  });
}

// Exhibitor confirmation email data
export interface ExhibitorConfirmationEmailData {
  userEmail: string;
  userName: string;
  userId: string;
  exhibitorId: string;
  companyName: string;
  participationTypes: string[];
  boothSize: string;
  confirmIntent: string;
  status: 'CONFIRMED' | 'REJECTED';
  notes?: string;
}

// Generate exhibitor confirmation email HTML
export function generateExhibitorConfirmationEmail(data: ExhibitorConfirmationEmailData): string {
  const {
    userName,
    exhibitorId,
    companyName,
    participationTypes,
    boothSize,
    confirmIntent,
    status,
    notes,
  } = data;

  const formatConfirmIntent = (intent: string) => {
    const labels: Record<string, string> = {
      YES_RESERVE: "Yes, I want to reserve a booth",
      TENTATIVE: "Tentative - need more information",
      NO_EXPLORING: "No, just exploring options",
    };
    return labels[intent] || intent;
  };

  const participationHTML = participationTypes
    .map(type => {
      const label = type.replace(/_/g, ' '); // convert "product_presentation" → "product presentation"
      return `<li style="margin-bottom: 4px; color: #4b5563;">• ${label}</li>`;
    })
    .join('');

  const isConfirmed = status === 'CONFIRMED';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BEACON 2025 Exhibitor Application ${isConfirmed ? 'Approved' : 'Update'}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Exhibition Application Update</p>
        </div>

        <!-- Status Message -->
        <div style="padding: 30px; text-align: center; background-color: ${isConfirmed ? '#f0fdf4' : '#fef2f2'}; border-bottom: 1px solid #e5e7eb;">
          <!-- circle -->
          <div style="
            width:60px;
            height:60px;
            background-color: ${isConfirmed ? '#10b981' : '#ef4444'};
            border-radius:50%;
            margin:0 auto 16px;    
            text-align:center;      
            line-height:60px;       
          ">
            <span style="color:#ffffff;font-size:24px;display:inline-block;">${isConfirmed ? '✅' : '❌'}</span>
          </div>
          <h2 style="color: ${isConfirmed ? '#059669' : '#dc2626'}; margin: 0 0 8px 0; font-size: 24px;">
            Exhibition Application ${isConfirmed ? 'Approved!' : 'Update Required'}
          </h2>
          <p style="color: ${isConfirmed ? '#065f46' : '#991b1b'}; margin: 0; font-size: 16px;">
            ${isConfirmed
      ? 'Congratulations! Your exhibition application has been approved'
      : 'Your exhibition application requires attention'
    }
          </p>
        </div>

        <!-- Application Details -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Exhibition Details</h3>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Registration ID:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${exhibitorId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Contact Person:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Company:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: ${isConfirmed ? '#10b981' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                      ${isConfirmed ? 'APPROVED' : 'REQUIRES ATTENTION'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Exhibition Information -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Exhibition Package</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Participation Types:</h4>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${participationHTML}
                </ul>
              </div>
              <div style="margin-bottom: 16px;">
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Preferred Booth Size:</h4>
                <p style="margin: 0; color: #1e40af; font-weight: bold;">${boothSize}</p>
              </div>
              <div>
                <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">Confirmation Intent:</h4>
                <p style="margin: 0; color: #4b5563;">${formatConfirmIntent(confirmIntent)}</p>
              </div>
            </div>
          </div>

          ${notes ? `
          <!-- Admin Notes -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Additional Information</h3>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280;">
              <p style="margin: 0; color: #4b5563; line-height: 1.5;">${notes}</p>
            </div>
          </div>
          ` : ''}

          <!-- Next Steps -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Next Steps</h3>
            <div style="background-color: ${isConfirmed ? '#f0fdf4' : '#fef2f2'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${isConfirmed ? '#10b981' : '#ef4444'};">
              ${isConfirmed ? `
                <p style="margin: 0 0 12px 0; color: #059669; font-weight: 500;">
                  <strong>🎉 Welcome to BEACON 2025 as an Official Exhibitor!</strong>
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #065f46; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">📞 Our exhibition team will contact you within 24 hours</li>
                  <li style="margin-bottom: 8px;">🏢 Booth location and setup details will be confirmed</li>
                  <li style="margin-bottom: 8px;">📋 Exhibition manual and guidelines will be provided</li>
                  <li style="margin-bottom: 8px;">🚚 Logistics coordination for equipment and setup</li>
                  <li style="margin-bottom: 8px;">🎨 Marketing and promotional support options</li>
                  <li>🏆 Event access credentials and exhibitor benefits will be arranged</li>
                </ul>
              ` : `
                <p style="margin: 0 0 12px 0; color: #dc2626; font-weight: 500;">
                  <strong>📝 Action Required</strong>
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">📞 Our team will contact you to discuss the requirements</li>
                  <li style="margin-bottom: 8px;">📋 Additional documentation may be needed</li>
                  <li style="margin-bottom: 8px;">🏢 Booth size or location adjustments may be required</li>
                  <li>🤝 We're committed to finding a suitable exhibition solution</li>
                </ul>
              `}
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Questions About Your Exhibition?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              For immediate exhibition inquiries, please contact us:<br>
              <strong>Email:</strong> <a href="mailto:mlbeacon2023@gmail.com" style="color: #2563eb;">mlbeacon2023@gmail.com</a><br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Registration ID:</strong> ${exhibitorId}
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

// Send exhibitor confirmation email
export async function sendExhibitorConfirmationEmail(data: ExhibitorConfirmationEmailData): Promise<boolean> {
  const emailHTML = generateExhibitorConfirmationEmail(data);

  const subject = `BEACON 2025 Exhibition Application ${data.status === 'CONFIRMED' ? 'Approved' : 'Update Required'}`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com',
    // Include QR code only when status is CONFIRMED
    userId: data.status === 'CONFIRMED' ? data.userId : undefined
  });
}