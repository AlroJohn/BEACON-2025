import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is not set in environment variables');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Email service interface
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  templateData?: Record<string, any>;
}

// Conference registration email data
export interface ConferenceRegistrationEmailData {
  userEmail: string;
  userName: string;
  conferenceId: string;
  isMaritimeLeagueMember: boolean;
  selectedEvents: Array<{
    eventName: string;
    eventDate: Date;
    eventPrice: number;
    eventStatus: string;
  }>;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'FREE';
  requiresPayment: boolean;
  tmlMemberCode?: string;
}

// Send email function
export async function sendEmail({ to, subject, html, from }: EmailData): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('Cannot send email: SENDGRID_API_KEY not configured');
      return false;
    }

    const msg = {
      to,
      from: 'noreply@thebeaconexpo.com',
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
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
          ${formatDate(event.eventDate)} • ${event.eventStatus}
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
      <title>BEACON 2025 Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BEACON 2025</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Maritime Conference & Exhibition</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background-color: #f0fdf4; border-bottom: 1px solid #e5e7eb;">
          <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">✓</span>
          </div>
          <h2 style="color: #059669; margin: 0 0 8px 0; font-size: 24px;">Registration Successful!</h2>
          <p style="color: #065f46; margin: 0; font-size: 16px;">Thank you for registering for BEACON 2025</p>
        </div>

        <!-- Registration Details -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Registration Details</h3>
            
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

          <!-- Next Steps -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">What's Next?</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
                <li style="margin-bottom: 8px;">📧 You will receive updates about the event via email</li>
                <li style="margin-bottom: 8px;">📋 Event schedules and venue details will be sent closer to the date</li>
                ${requiresPayment ? '<li style="margin-bottom: 8px;">💳 Your payment will be verified within 24-48 hours</li>' : ''}
                <li style="margin-bottom: 8px;">📞 Our team may contact you for additional information if needed</li>
                <li>🎫 Digital certificates will be available after attending the events</li>
              </ul>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0;">Need Help?</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">
              If you have any questions about your registration, please contact us:<br>
              <strong>Email:</strong> info@beacon2025.com<br>
              <strong>Phone:</strong> +63 (02) 123-4567
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 BEACON Maritime Conference & Exhibition. All rights reserved.
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

  const subject = `BEACON 2025 Registration Confirmation - ${data.paymentStatus === 'FREE' ? 'FREE Registration' : data.requiresPayment ? 'Payment Under Review' : 'Registration Complete'}`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com'
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
    eventDate: Date;
    eventPrice: number;
  }>;
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
          ${formatDate(event.eventDate)}
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
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Maritime Conference & Exhibition</p>
        </div>

        <!-- Status Message -->
        <div style="padding: 30px; text-align: center; background-color: ${config.bgColor}; border-bottom: 1px solid #e5e7eb;">
          <div style="width: 60px; height: 60px; background-color: ${config.color}; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">${config.icon}</span>
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
              <strong>Email:</strong> payments@beacon2025.com<br>
              <strong>Phone:</strong> +63 (02) 123-4567<br>
              <strong>Reference ID:</strong> ${conferenceId}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 BEACON Maritime Conference & Exhibition. All rights reserved.
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
    CONFIRMED: 'Payment Confirmed ✅',
    FAILED: 'Payment Issue ❌',
    REFUNDED: 'Payment Refunded 💰'
  };

  const subject = `BEACON 2025 - ${statusTitles[data.newStatus]} - Registration ${data.conferenceId}`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com'
  });
}

// Sponsor registration email data
export interface SponsorRegistrationEmailData {
  userEmail: string;
  userName: string;
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
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Maritime Conference & Exhibition</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background-color: #fef3c7; border-bottom: 1px solid #e5e7eb;">
          <div style="width: 60px; height: 60px; background-color: #f59e0b; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">🤝</span>
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
            © 2025 BEACON Maritime Conference & Exhibition. All rights reserved.
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

  const subject = `BEACON 2025 Sponsor Registration - Under Review | ${data.companyName}`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com'
  });
}

// Exhibitor registration email data
export interface ExhibitorRegistrationEmailData {
  userEmail: string;
  userName: string;
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

  const participationHTML = participationTypes.map(type => `
    <li style="margin-bottom: 4px; color: #4b5563;">• ${type}</li>
  `).join('');

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
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Maritime Conference & Exhibition</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background-color: #fef3c7; border-bottom: 1px solid #e5e7eb;">
          <div style="width: 60px; height: 60px; background-color: #f59e0b; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">🏢</span>
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
            © 2025 BEACON Maritime Conference & Exhibition. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send exhibitor registration confirmation email
export async function sendExhibitorRegistrationEmail(data: ExhibitorRegistrationEmailData): Promise<boolean> {
  const emailHTML = generateExhibitorRegistrationEmail(data);

  const subject = `BEACON 2025 Exhibitor Registration - Under Review | ${data.companyName}`;

  return await sendEmail({
    to: data.userEmail,
    subject,
    html: emailHTML,
    from: 'noreply@thebeaconexpo.com'
  });
}