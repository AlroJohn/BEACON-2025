import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { AgeBracket, AttendeeType, Gender, HearAboutEvent, Industry, InterestArea, Prisma, PrismaClient } from '@prisma/client';
import { baseVisitorSchema } from '@/types/visitor/registration';
import { sendVisitorRegistrationEmail, VisitorRegistrationEmailData } from '@/lib/email';


const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);



// Schema with conditional validation - matching client-side validation
const visitorRegistrationSchema = baseVisitorSchema
  .refine((data) => {
    // If attendee type is STUDENT_ACADEMIC, job title is optional
    if (data.attendeeType === AttendeeType.STUDENT_ACADEMIC) {
      return true;
    }
    // For non-students, require job title
    return data.jobTitle && data.jobTitle.trim().length > 0;
  }, {
    message: "Job title is required for non-student attendees",
    path: ["jobTitle"],
  })
  .refine((data) => {
    // If attendee type is STUDENT_ACADEMIC, company name is optional
    if (data.attendeeType === AttendeeType.STUDENT_ACADEMIC) {
      return true;
    }
    // For non-students, require company name
    return data.companyName && data.companyName.trim().length > 0;
  }, {
    message: "Company/School name is required for non-student attendees",
    path: ["companyName"],
  })
  .refine((data) => {
    // If attendee type is STUDENT_ACADEMIC, industry is optional
    if (data.attendeeType === AttendeeType.STUDENT_ACADEMIC) {
      return true;
    }
    // For non-students, require industry
    return data.industry;
  }, {
    message: "Industry is required for non-student attendees",
    path: ["industry"],
  });

// Helper function to upload base64 image to Supabase Storage
async function uploadImageToSupabase(base64Image: string, userId: string): Promise<string> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Generate file name with user ID directory structure
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

// GET - Fetch all visitors with full user details
export async function GET(request: NextRequest) {
  try {
    console.log("API: Fetching all visitors");

    const visitors = await prisma.visitors.findMany({
      include: {
        user: {
          include: {
            user_details: true,
            user_accounts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to flatten the structure for easier consumption
    const transformedVisitors = visitors.map(visitor => ({
      // Visitor specific data
      id: visitor.id,
      jobTitle: visitor.jobTitle,
      companyName: visitor.companyName,
      industry: visitor.industry,
      industryOthers: visitor.industryOthers,
      companyAddress: visitor.companyAddress,
      companyWebsite: visitor.companyWebsite,
      businessEmail: visitor.businessEmail,
      attendingDays: visitor.attendingDays,
      eventParts: visitor.eventParts,
      attendeeType: visitor.attendeeType,
      interestAreas: visitor.interestAreas,
      receiveUpdates: visitor.receiveUpdates,
      inviteToFutureEvents: visitor.inviteToFutureEvents,
      specialAssistance: visitor.specialAssistance,
      emergencyContactPerson: visitor.emergencyContactPerson,
      emergencyContactNumber: visitor.emergencyContactNumber,
      dataPrivacyConsent: visitor.dataPrivacyConsent,
      hearAboutEvent: visitor.hearAboutEvent,
      hearAboutOthers: visitor.hearAboutOthers,
      createdAt: visitor.createdAt,
      updatedAt: visitor.updatedAt,

      // User details
      userId: visitor.user?.id,
      firstName: visitor.user?.user_details?.[0]?.firstName,
      lastName: visitor.user?.user_details?.[0]?.lastName,
      middleName: visitor.user?.user_details?.[0]?.middleName,
      suffix: visitor.user?.user_details?.[0]?.suffix,
      preferredName: visitor.user?.user_details?.[0]?.preferredName,
      faceScannedUrl: visitor.user?.user_details?.[0]?.faceScannedUrl,
      gender: visitor.user?.user_details?.[0]?.gender,
      genderOthers: visitor.user?.user_details?.[0]?.genderOthers,
      ageBracket: visitor.user?.user_details?.[0]?.ageBracket,
      nationality: visitor.user?.user_details?.[0]?.nationality,

      // User account details
      email: visitor.user?.user_accounts?.[0]?.email,
      mobileNumber: visitor.user?.user_accounts?.[0]?.mobileNumber,
      landline: visitor.user?.user_accounts?.[0]?.landline,
      mailingAddress: visitor.user?.user_accounts?.[0]?.mailingAddress,
      status: visitor.user?.user_accounts?.[0]?.status,
    }));

    return NextResponse.json({
      success: true,
      data: transformedVisitors,
      count: transformedVisitors.length
    });

  } catch (error) {
    console.error('API: Error fetching visitors:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch visitors",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("API: Received registration request");
    const body = await request.json();
    console.log("API: Request body:", body);

    // Validate the request body
    console.log("API: Validating request data");
    const validatedData = visitorRegistrationSchema.parse(body);
    console.log("API: Validation successful");

    // Check if user already has a visitor registration specifically
    const existingVisitorUser = await prisma.users.findFirst({
      where: {
        user_accounts: {
          some: {
            email: validatedData.email,
            user_type: 'VISITOR'
          }
        }
      },
      include: {
        user_accounts: true,
        Visitors: true
      }
    });

    if (existingVisitorUser && existingVisitorUser.Visitors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "User already has a visitor registration",
      }, { status: 409 });
    }

    // Create user and related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.users.create({
        data: {},
      });

      // Create user_accounts
      const userAccount = await tx.user_accounts.create({
        data: {
          userId: user.id,
          email: validatedData.email,
          mobileNumber: validatedData.mobileNumber,
          landline: validatedData.landline || null,
          status: 'ACTIVE',
          mailingAddress: validatedData.mailingAddress,
          user_type: 'VISITOR'
        },
      });

      // Create user_details (initially without faceScannedUrl)
      const user_details = await tx.user_details.create({
        data: {
          userId: user.id,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          middleName: validatedData.middleName || null,
          suffix: validatedData.suffix || null,
          preferredName: validatedData.preferredName || null,
          gender: validatedData.gender,
          genderOthers: validatedData.genderOthers || null,
          ageBracket: validatedData.ageBracket,
          nationality: validatedData.nationality,
          faceScannedUrl: null, // Initially null
        },
      });

      // Create Visitors record
      const visitor = await tx.visitors.create({
        data: {
          userId: user.id,
          jobTitle: validatedData.jobTitle || '',
          companyName: validatedData.companyName || '',
          industry: validatedData.industry || Industry.OTHERS,
          industryOthers: validatedData.industryOthers || null,
          companyAddress: validatedData.companyAddress || null,
          companyWebsite: validatedData.companyWebsite || null,
          businessEmail: validatedData.businessEmail || null,
          eventParts: validatedData.eventParts,
          attendeeType: validatedData.attendeeType,
          attendingDays: (validatedData.attendingDays ?? {}) as Prisma.InputJsonValue,
          interestAreas: validatedData.interestAreas,
          receiveUpdates: validatedData.receiveUpdates,
          inviteToFutureEvents: validatedData.inviteToFutureEvents,
          specialAssistance: validatedData.specialAssistance || null,
          emergencyContactPerson: validatedData.emergencyContactPerson,
          emergencyContactNumber: validatedData.emergencyContactNumber,
          dataPrivacyConsent: validatedData.dataPrivacyConsent,
          hearAboutEvent: validatedData.hearAboutEvent,
          hearAboutOthers: validatedData.hearAboutOthers || null,
        },
      });

      return {
        user,
        userAccount,
        user_details,
        visitor,
      };
    });

    // After successful transaction, handle face image upload if provided
    let faceImageUrl: string | null = null;
    if (validatedData.faceScannedUrl) {
      console.log("API: Uploading face image to Supabase");
      try {
        faceImageUrl = await uploadImageToSupabase(validatedData.faceScannedUrl, result.user.id);

        // Update user_details with the face image URL
        await prisma.user_details.update({
          where: { id: result.user_details.id }, // use the id from the create result
          data: {
            faceScannedUrl: faceImageUrl,
          },
        });


        console.log("API: Face image uploaded and URL updated successfully");
      } catch (imageError) {
        console.error("API: Face image upload failed:", imageError);
        // Log the error but don't fail the registration
        // The user registration is already completed
      }
    }

    // Send confirmation email after successful registration
    try {
      console.log("API: Sending visitor confirmation email...");

      const emailData: VisitorRegistrationEmailData = {
        userEmail: validatedData.email,
        userName: `${validatedData.firstName} ${validatedData.lastName}`,
        userId: result.user.id, // Add userId for QR code generation
        visitorId: result.visitor.id,
        attendeeType: validatedData.attendeeType,
        companyName: validatedData.companyName || undefined,
        jobTitle: validatedData.jobTitle || undefined,
        eventParts: validatedData.eventParts,
        attendingDays: validatedData.attendingDays || {},
      };

      const emailSent = await sendVisitorRegistrationEmail(emailData);

      if (emailSent) {
        console.log("API: Visitor confirmation email sent successfully to:", validatedData.email);
      } else {
        console.error("API: Failed to send visitor confirmation email to:", validatedData.email);
      }
    } catch (emailError) {
      console.error("API: Error sending visitor confirmation email:", emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Visitor registration completed successfully",
      data: {
        userId: result.user.id,
        visitorId: result.visitor.id,
        faceImageUrl: faceImageUrl,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('API: Visitor registration error:', error);

    if (error instanceof z.ZodError) {
      console.error('API: Validation error details:', error);
      return NextResponse.json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map(err => ({
          path: err.path,
          message: err.message
        })),
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.error('API: Unique constraint error');
      return NextResponse.json({
        success: false,
        message: "Email already exists for visitor registration",
      }, { status: 409 });
    }

    if (error instanceof Error) {
      console.error('API: General error:', error.message);
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 500 });
    }

    console.error('API: Unknown error type');
    return NextResponse.json({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
}