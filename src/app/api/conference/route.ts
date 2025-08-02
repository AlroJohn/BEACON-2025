import { NextRequest, NextResponse } from 'next/server';
import { MaritimeLeagueMembership, ConferenceInterestArea, PrismaClient, PaymentMode, Prisma } from '@prisma/client';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { sendConferenceRegistrationEmail, ConferenceRegistrationEmailData } from '@/lib/email';
import { conferenceRegistrationSchema } from '@/types/conference/registration';

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map frontend payment mode to Prisma PaymentMode enum
function mapPaymentMode(paymentMode: string | null | undefined): PaymentMode {
  switch (paymentMode) {
    case 'BANK_DEPOSIT_TRANSFER':
      return PaymentMode.BANK_DEPOSIT_TRANSFER;
    case 'GCASH':
      return PaymentMode.GCASH;
    case 'FREE':
      return PaymentMode.FREE;
    default:
      return PaymentMode.BANK_DEPOSIT_TRANSFER;
  }
}

// Helper function to upload base64 image to Supabase Storage
async function uploadImageToSupabase(base64Image: string, userId: string): Promise<string> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Generate file name with user ID
    const fileName = `${userId}/face-scan.jpg`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-profile')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true // This will replace if file already exists
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('user-profile')
      .getPublicUrl(filePath);

    return publicData.publicUrl;

  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}


// POST - Create new conference registration
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract file if present
    const receiptFile = formData.get('receiptFile') as File | null;

    // Extract other form data
    const jsonData: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'receiptFile') {
        jsonData[key] = value;
      }
    }

    console.log('Raw FormData entries:', Object.fromEntries(formData.entries()));
    console.log('Parsed jsonData before processing:', jsonData);

    // Parse JSON fields that come as strings from FormData
    try {
      if (jsonData.selectedEventIds && typeof jsonData.selectedEventIds === 'string') {
        jsonData.selectedEventIds = JSON.parse(jsonData.selectedEventIds);
      }
      if (jsonData.interestAreas && typeof jsonData.interestAreas === 'string') {
        jsonData.interestAreas = JSON.parse(jsonData.interestAreas);
      }
      if (jsonData.attendingDays && typeof jsonData.attendingDays === 'string') {
        jsonData.attendingDays = JSON.parse(jsonData.attendingDays);
      }
      if (jsonData.detailedInterests && typeof jsonData.detailedInterests === 'string') {
        jsonData.detailedInterests = JSON.parse(jsonData.detailedInterests);
      }

      // Convert string booleans to actual booleans
      ['dataUsageConsent', 'emailCertificate', 'photoVideoConsent', 'receiveEventInvites', 'hasConferenceDiscount'].forEach(field => {
        if (jsonData[field] !== undefined) {
          jsonData[field] = jsonData[field] === 'true';
        }
      });

      // Convert string numbers to numbers
      if (jsonData.totalPaymentAmount !== undefined && jsonData.totalPaymentAmount !== '') {
        jsonData.totalPaymentAmount = parseFloat(jsonData.totalPaymentAmount);
      }

      // Receipt file is handled separately like face scan - don't include in validation

    } catch (parseError) {
      console.error('Error parsing FormData fields:', parseError);
      throw new Error('Invalid form data format');
    }

    console.log('Processed jsonData before validation:', jsonData);
    console.log('Receipt file present:', !!receiptFile);

    const validatedData = conferenceRegistrationSchema.parse(jsonData);

    // Separate data for different models
    const {
      selectedEventIds,
      faceScannedUrl,
      // user_details fields
      firstName,
      lastName,
      middleName,
      suffix,
      preferredName,
      gender,
      genderOthers,
      ageBracket,
      nationality,
      // user_accounts fields
      email,
      mobileNumber,
      mailingAddress,
      // Everything else goes to Conference model
      ...conferenceData
    } = validatedData;

    // Validate TML member code if membership is YES
    if (conferenceData.isMaritimeLeagueMember === 'YES') {
      if (!conferenceData.tmlMemberCode || conferenceData.tmlMemberCode.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'TML member code is required when selecting "YES" for Maritime League membership',
        }, { status: 400 });
      }

      // Validate the TML code exists and is active
      const tmlCode = await prisma.codeDistribution.findFirst({
        where: {
          code: conferenceData.tmlMemberCode.trim(),
          isActive: true,
        },
        include: {
          user: {
            include: {
              user_accounts: true,
              user_details: true,
            },
          },
        },
      });

      if (!tmlCode) {
        return NextResponse.json({
          success: false,
          error: 'Invalid TML member code. Please enter a valid code or change your membership selection.',
        }, { status: 400 });
      }

      // Check if code is already used by someone else
      if (tmlCode.userId && tmlCode.user?.user_accounts?.[0]?.email !== email) {
        return NextResponse.json({
          success: false,
          error: `This TML member code is already in use by ${tmlCode.user?.user_details?.[0]?.firstName} ${tmlCode.user?.user_details?.[0]?.lastName} (${tmlCode.user?.user_accounts?.[0]?.email}). Please use your own TML member code.`,
        }, { status: 400 });
      }
    }

    // Check if user already has a registration
    const existingUser = await prisma.users.findFirst({
      where: {
        user_accounts: {
          some: {
            email: email
          }
        }
      },
      include: {
        user_accounts: true,
        user_details: true,
        Conferences: true
      }
    });

    let user;
    let userAccount;
    let user_details;

    if (existingUser) {
      user = existingUser;
      userAccount = existingUser.user_accounts[0];
      user_details = existingUser.user_details[0];

      // Check if user already has a conference registration
      if (existingUser.Conferences.length > 0) {
        return NextResponse.json(
          { error: 'User already has a conference registration' },
          { status: 400 }
        );
      }

      // Update existing user data if needed
      if (userAccount) {
        await prisma.user_accounts.update({
          where: { id: userAccount.id },
          data: {
            email,
            mobileNumber,
            mailingAddress,
            user_type: 'CONFERENCE'
          }
        });
      }

      if (user_details) {
        await prisma.user_details.update({
          where: { id: user_details.id },
          data: {
            firstName,
            lastName,
            middleName,
            suffix,
            preferredName,
            gender,
            genderOthers,
            ageBracket,
            nationality,
            faceScannedUrl: null // Will be updated after image upload
          }
        });
      }
    } else {
      // Create new user with accounts and details
      user = await prisma.users.create({
        data: {
          user_accounts: {
            create: {
              email,
              mobileNumber,
              mailingAddress,
              status: 'ACTIVE',
              user_type: 'CONFERENCE'
            }
          },
          user_details: {
            create: {
              firstName,
              lastName,
              middleName,
              suffix,
              preferredName,
              gender,
              genderOthers,
              ageBracket,
              nationality,
              faceScannedUrl: null // Will be updated after image upload
            }
          }
        },
        include: {
          user_accounts: true,
          user_details: true
        }
      });

      userAccount = user.user_accounts[0];
      user_details = user.user_details[0];
    }

    // Calculate total payment amount based on selected events
    let calculatedAmount = 0;
    let selectedEvents: any[] = [];

    if (selectedEventIds && selectedEventIds.length > 0) {
      // Fetch selected events from database
      selectedEvents = await prisma.events.findMany({
        where: {
          id: {
            in: selectedEventIds
          },
          isActive: true
        }
      });

      // Calculate total amount based on selected dates per event (price per day)
      const attendingDays = conferenceData.attendingDays || {};
      
      // Separate conference events from other events
      let conferenceTotal = 0;
      let otherEventsTotal = 0;
      let conferenceDaysCount = 0;

      selectedEvents.forEach(event => {
        const eventName = event.eventName;
        const selectedDates = attendingDays[eventName] || [];
        const pricePerDay = Number(event.eventPrice);
        const daysSelected = Array.isArray(selectedDates) ? selectedDates.length : 0;
        
        if (event.eventStatus === 'CONFERENCE') {
          // Conference events - eligible for discount
          conferenceTotal += daysSelected * pricePerDay;
          conferenceDaysCount += daysSelected;
        } else {
          // Other events (SHOW, WORKSHOP, etc.) - no discount
          otherEventsTotal += daysSelected * pricePerDay;
        }
      });

      // Apply conference discount if 3 or more CONFERENCE days are selected
      if (conferenceDaysCount >= 3) {
        conferenceTotal -= 1500; // ₱1,500 discount for 3+ conference days
      }

      calculatedAmount = conferenceTotal + otherEventsTotal;
    }

    // Determine if payment is required (non-maritime league members)
    const requiresPayment = conferenceData.isMaritimeLeagueMember === 'NO' && calculatedAmount > 0;

    console.log("DEBUG - /api/conference route:");
    console.log("isMaritimeLeagueMember:", conferenceData.isMaritimeLeagueMember);
    console.log("calculatedAmount:", calculatedAmount);
    console.log("requiresPayment:", requiresPayment);
    console.log("paymentMode:", conferenceData.paymentMode);


    // Create conference registration (only conference-specific fields)
    const conference = await prisma.conference.create({
      data: {
        userId: user.id,
        isMaritimeLeagueMember: conferenceData.isMaritimeLeagueMember || MaritimeLeagueMembership.NO,
        tmlMemberCode: conferenceData.tmlMemberCode,
        jobTitle: conferenceData.jobTitle,
        companyName: conferenceData.companyName,
        industry: conferenceData.industry,
        companyAddress: conferenceData.companyAddress,
        companyWebsite: conferenceData.companyWebsite,
        interestAreas: conferenceData.interestAreas,
        detailedInterests: (conferenceData.detailedInterests ?? {}) as Prisma.InputJsonValue,
        otherInterests: conferenceData.otherInterests,
        receiveEventInvites: conferenceData.receiveEventInvites || false,
        emailCertificate: conferenceData.emailCertificate || false,
        dataUsageConsent: conferenceData.dataUsageConsent,
        attendingDays: (conferenceData.attendingDays ?? {}) as Prisma.InputJsonValue,
      },
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true
          }
        },
        summaryOfPayments: {
          include: {
            event: true
          }
        }
      }
    });

    // Create summary of payments entries for selected events
    if (selectedEvents.length > 0) {
      const summaryEntries = selectedEvents.map(event => ({
        conferenceId: conference.id,
        eventId: event.id,
        eventName: event.eventName,
        eventDates: event.eventDates,
        eventPrice: event.eventPrice,
        eventStatus: event.eventStatus,
        attendingDays: (conferenceData.attendingDays || {}) as Prisma.InputJsonValue,
      }));

      await prisma.summaryOfPayments.createMany({
        data: summaryEntries
      });
    }

    // Create payment record if payment is required OR for TML members (free)
    let paymentRecord = null;
    if (requiresPayment && calculatedAmount > 0) {
      // Non-TML members who need to pay
      const paymentMode = mapPaymentMode(conferenceData.paymentMode);

      paymentRecord = await prisma.conferencePayment.create({
        data: {
          conferenceId: conference.id,
          totalAmount: calculatedAmount,
          paymentMode: paymentMode,
          paymentStatus: 'PENDING', // Will be updated to CONFIRMED after receipt upload
          receiptImageUrl: null, // Will be updated after file upload
          referenceNumber: conferenceData.referenceNumber || null,
          notes: 'Payment pending - Receipt upload in progress',
          attendingDays: (conferenceData.attendingDays || {}) as Prisma.InputJsonValue,
        }
      });
    } else if (conferenceData.isMaritimeLeagueMember === 'YES') {
      // TML members get free registration with CONFIRMED status
      paymentRecord = await prisma.conferencePayment.create({
        data: {
          conferenceId: conference.id,
          totalAmount: 0, // Free for TML members
          paymentMode: PaymentMode.FREE, // Default payment mode for free registration
          paymentStatus: 'CONFIRMED', // Automatically confirmed for TML members
          receiptImageUrl: null, // No receipt needed for free registration
          referenceNumber: null,
          notes: 'Free registration for TML member - Automatically confirmed',
          attendingDays: (conferenceData.attendingDays ?? {}) as Prisma.InputJsonValue,
        }
      });
    }

    // Mark TML code as used if it was provided and valid
    if (conferenceData.isMaritimeLeagueMember === 'YES' && conferenceData.tmlMemberCode) {
      try {
        await prisma.codeDistribution.update({
          where: {
            code: conferenceData.tmlMemberCode.trim(),
          },
          data: {
            userId: user.id,
          },
        });

        console.log('TML member code marked as used:', conferenceData.tmlMemberCode.trim(), 'by user:', user.id);
      } catch (error) {
        console.error('Failed to mark TML code as used:', error);
        // Don't fail the registration, just log the error
      }
    }

    // Handle face image upload if provided
    let faceImageUrl: string | null = null;
    if (faceScannedUrl) {
      console.log("Conference API: Uploading face image to Supabase");
      try {
        faceImageUrl = await uploadImageToSupabase(faceScannedUrl, user.id);

        // Update user_details with the face image URL
        // Use the user_details variable we already have from user creation/retrieval
        const user_detailsId = user_details?.id;

        if (user_detailsId) {
          await prisma.user_details.update({
            where: { id: user_detailsId },
            data: {
              faceScannedUrl: faceImageUrl,
            },
          });
        } else {
          console.error("Conference API: user_details ID not found for user:", user.id);
        }

        console.log("Conference API: Face image uploaded and URL updated successfully");
      } catch (imageError) {
        console.error("Conference API: Face image upload failed:", imageError);
        // Log the error but don't fail the registration
        // The user registration is already completed
      }
    }

    // Handle receipt file upload if provided and payment is required
    let receiptImageUrl: string | null = null;
    if (receiptFile && paymentRecord && requiresPayment) {
      console.log("Conference API: Uploading receipt image to Supabase");
      try {
        // Generate file name with user ID and timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExtension = receiptFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/receipt-${timestamp}.${fileExtension}`;
        const filePath = fileName;

        // Upload to Supabase Storage - 'receipt' bucket  
        const { data, error } = await supabase.storage
          .from('receipt')
          .upload(filePath, receiptFile, {
            contentType: receiptFile.type,
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error('Supabase receipt upload error:', error);
          throw new Error(`Failed to upload receipt: ${error.message}`);
        }

        // Get public URL
        const { data: publicData } = supabase.storage
          .from('receipt')
          .getPublicUrl(filePath);

        receiptImageUrl = publicData.publicUrl;

        // Update payment record with receipt URL but keep as PENDING for admin review
        await prisma.conferencePayment.update({
          where: { id: paymentRecord.id },
          data: {
            receiptImageUrl: receiptImageUrl,
            paymentStatus: 'PENDING', // Keep as PENDING until admin manually confirms
            notes: 'Receipt uploaded - Awaiting admin verification',
            updatedAt: new Date()
          }
        });

        console.log("Conference API: Receipt image uploaded successfully - awaiting admin verification");
      } catch (receiptError) {
        console.error("Conference API: Receipt image upload failed:", receiptError);
        // Update payment with error note but don't fail the registration
        if (paymentRecord) {
          await prisma.conferencePayment.update({
            where: { id: paymentRecord.id },
            data: {
              notes: 'Registration completed but receipt upload failed - Please contact support',
            }
          });
        }
      }
    }

    // Send confirmation email after successful registration
    try {
      console.log("Conference API: Sending confirmation email...");

      // Prepare email data - use the email from the database user_accounts
      const emailData: ConferenceRegistrationEmailData = {
        userId: user.id,
        userEmail: user.user_accounts?.[0]?.email || email,
        userName: `${firstName} ${lastName}`,
        conferenceId: conference.id,
        isMaritimeLeagueMember: conferenceData.isMaritimeLeagueMember === 'YES',
        selectedEvents: selectedEvents.map(event => ({
          eventName: event.eventName,
          eventDates: event.eventDates.map((date: string) => new Date(date)),
          eventPrice: Number(event.eventPrice),
          eventStatus: event.eventStatus,
        })),
        totalAmount: calculatedAmount,
        paymentStatus: conferenceData.isMaritimeLeagueMember === 'YES' ? 'FREE' :
          (requiresPayment ? 'PENDING' : 'CONFIRMED'),
        requiresPayment,
        tmlMemberCode: conferenceData.tmlMemberCode || undefined,
        attendingDays: conferenceData.attendingDays || {},
      };

      const emailSent = await sendConferenceRegistrationEmail(emailData);

      if (emailSent) {
        console.log("Conference API: Confirmation email sent successfully to:", email);
      } else {
        console.error("Conference API: Failed to send confirmation email to:", email);
      }
    } catch (emailError) {
      console.error("Conference API: Error sending confirmation email:", emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        conferenceId: conference.id,
        userId: user.id,
        requiresPayment,
        totalAmount: calculatedAmount,
        faceImageUrl: faceImageUrl,
        receiptImageUrl: receiptImageUrl,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Conference registration error:', error);

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
          message: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Retrieve conference registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const conferenceId = searchParams.get('conferenceId');

    if (!userId && !email && !conferenceId) {
      return NextResponse.json(
        { error: 'userId, email, or conferenceId parameter is required' },
        { status: 400 }
      );
    }

    let whereClause: any = {};

    if (conferenceId) {
      whereClause.id = conferenceId;
    } else if (userId) {
      whereClause.userId = userId;
    } else if (email) {
      whereClause.email = email;
    }

    const conferences = await prisma.conference.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true
          }
        },
        ConferencePayment: true,
        summaryOfPayments: {
          include: {
            event: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: conferences
    });

  } catch (error) {
    console.error('Error fetching conference registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update conference registration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { conferenceId, ...updateData } = body;

    if (!conferenceId) {
      return NextResponse.json(
        { error: 'conferenceId is required' },
        { status: 400 }
      );
    }

    // Validate update data with partial schema
    const partialSchema = conferenceRegistrationSchema.partial();
    const validatedData = partialSchema.parse(updateData);

    const updatedConference = await prisma.conference.update({
      where: { id: conferenceId },
      data: validatedData,
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true
          }
        },
        ConferencePayment: true,
        summaryOfPayments: {
          include: {
            event: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedConference
    });

  } catch (error) {
    console.error('Error updating conference registration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Remove conference registration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conferenceId = searchParams.get('conferenceId');

    if (!conferenceId) {
      return NextResponse.json(
        { error: 'conferenceId parameter is required' },
        { status: 400 }
      );
    }

    await prisma.conference.delete({
      where: { id: conferenceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Conference registration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conference registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}