import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { createClient } from '@supabase/supabase-js';

import { ZodError } from "zod";
import { SponsorRegistrationFormData, SponsorRegistrationResponse, sponsorRegistrationSchema } from "@/types/sponsors/registration";
import { sendSponsorRegistrationEmail, SponsorRegistrationEmailData } from "@/lib/email";

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to upload base64 image to Supabase Storage
async function uploadImageToSupabase(base64Image: string, userId: string, type: 'face'): Promise<string> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Generate file name with uid structure
    const fileName = `face-scan.jpg`;
    const filePath = `${userId}/${fileName}`;

    // Upload to user-profile bucket
    const { data, error } = await supabase.storage
      .from('user-profile')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true // This will replace if file already exists
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload ${type} image: ${error.message}`);
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('user-profile')
      .getPublicUrl(filePath);

    return publicData.publicUrl;

  } catch (error) {
    console.error(`${type} image upload error:`, error);
    throw error;
  }
}

// Helper function to upload file to Supabase Storage
async function uploadFileToSupabase(file: File, userId: string, type: 'logo'): Promise<string> {
  try {
    // Allowed extensions for logo
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

    // Extract and normalize file extension
    let fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Fallback if no extension or not allowed
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      fileExtension = 'jpg';
    }

    // Clean original file name and append extension
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = file.name.replace(/\s+/g, '_').replace(/\.[^/.]+$/, ''); // remove original extension
    const fileName = `${type}-${timestamp}-${baseName}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to company-logos bucket
    const { data, error } = await supabase.storage
      .from('company-logos')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Supabase file upload error:', error);
      throw new Error(`Failed to upload ${type}: ${error.message}`);
    }

    // Get the public URL
    const { data: publicData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath);

    return publicData.publicUrl;

  } catch (error) {
    console.error(`${type} file upload error:`, error);
    throw error;
  }
}

// POST - Create new sponsor registration
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract files if present
    const logoFile = formData.get('logoFile') as File | null;

    // Extract other form data
    const jsonData: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'logoFile') {
        jsonData[key] = value;
      }
    }

    console.log('Raw FormData entries:', Object.fromEntries(formData.entries()));
    console.log('Parsed jsonData before processing:', jsonData);

    // Parse JSON fields that come as strings from FormData
    try {
      if (jsonData.sponsorshipCategories && typeof jsonData.sponsorshipCategories === 'string') {
        jsonData.sponsorshipCategories = JSON.parse(jsonData.sponsorshipCategories);
      }
      if (jsonData.targetAudience && typeof jsonData.targetAudience === 'string') {
        jsonData.targetAudience = JSON.parse(jsonData.targetAudience);
      }
    } catch (parseError) {
      console.error('Error parsing FormData fields:', parseError);
      throw new Error('Invalid form data format');
    }

    console.log('Processed jsonData before validation:', jsonData);

    // Validate the request data using Zod schema
    const validatedData: SponsorRegistrationFormData = sponsorRegistrationSchema.parse(jsonData);

    // Separate data for different models
    const {
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
      position,
      // user_accounts fields
      email,
      mobileNumber,
      mailingAddress,
      landline,
      // Everything else goes to sponsor_registrations model
      ...sponsorData
    } = validatedData;

    // Check if user already has a sponsor registration using user_type
    const existingSponsorUser = await prisma.users.findFirst({
      where: {
        user_accounts: {
          some: {
            email: email,
            user_type: 'SPONSOR' // Check if already registered as sponsor
          }
        }
      },
      include: {
        user_accounts: true,
        user_details: true,
        sponsor_registrations: true
      }
    });

    // If user already has sponsor registration, prevent duplicate
    if (existingSponsorUser && existingSponsorUser.sponsor_registrations.length > 0) {
      return NextResponse.json({
        success: false,
        error: "This email is already registered as a sponsor",
        message: "A sponsor registration already exists for this email address"
      } as SponsorRegistrationResponse, { status: 409 });
    }

    // Always create new user, accounts, and details for sponsor registration
    const user = await prisma.users.create({
      data: {
        created_at: new Date(),
        updated_at: new Date(),
        user_accounts: {
          create: {
            email,
            mobileNumber,
            mailingAddress,
            landline,
            user_type: 'SPONSOR',
            created_at: new Date(),
            updated_at: new Date(),
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
            position,
            faceScannedUrl: null, // Will be updated after image upload
          }
        }
      },
      include: {
        user_accounts: true,
        user_details: true
      }
    });

    const userAccount = user.user_accounts[0];
    const user_details = user.user_details[0];

    // Step 1: Create sponsor registration with null file URLs
    console.log("Sponsor API: Creating sponsor registration with null file URLs");
    const sponsor = await prisma.sponsor_registrations.create({
      data: {
        userId: user.id,
        companyName: sponsorData.companyName,
        businessRegistrationName: sponsorData.businessRegistrationName,
        industrySector: sponsorData.industrySector,
        industrySectorOthers: sponsorData.industrySectorOthers,
        companyAddress: sponsorData.companyAddress,
        companyWebsite: sponsorData.companyWebsite,
        companyProfile: sponsorData.companyProfile,
        sponsorshipCategories: sponsorData.sponsorshipCategories,
        targetAudience: sponsorData.targetAudience,
        targetAudienceOthers: sponsorData.targetAudienceOthers,
        activationPreferences: sponsorData.activationPreferences,
        activationOthers: sponsorData.activationOthers,
        launchProduct: sponsorData.launchProduct,
        budgetRange: sponsorData.budgetRange,
        customizedProposal: sponsorData.customizedProposal,
        uploadLogoUrl: null, // Initially null, will be updated after upload
        additionalComments: sponsorData.additionalComments,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true
          }
        }
      }
    });

    console.log("Sponsor API: Registration created successfully with ID:", sponsor.id);

    // Step 2: Handle file uploads after record creation
    let faceImageUrl: string | null = null;
    let logoImageUrl: string | null = null;

    // Handle face image upload if provided
    if (faceScannedUrl) {
      console.log("Sponsor API: Uploading face image to user-profile/" + user.id + "/");
      try {
        faceImageUrl = await uploadImageToSupabase(faceScannedUrl, user.id, 'face');

        // Update user_details with the face image URL
        const user_detailsId = user_details?.id;

        if (user_detailsId) {
          await prisma.user_details.update({
            where: { id: user_detailsId },
            data: {
              faceScannedUrl: faceImageUrl,
            },
          });
        } else {
          console.error("Sponsor API: user_details ID not found for user:", user.id);
        }

        console.log("Sponsor API: Face image uploaded and URL updated successfully");
      } catch (imageError) {
        console.error("Sponsor API: Face image upload failed:", imageError);
        // Log the error but don't fail the registration
      }
    }

    // Handle logo file upload if provided
    if (logoFile) {
      console.log("Sponsor API: Uploading logo file to company-logos/" + user.id + "/");
      try {
        logoImageUrl = await uploadFileToSupabase(logoFile, user.id, 'logo');

        // Update sponsor registration with logo URL
        await prisma.sponsor_registrations.update({
          where: { id: sponsor.id },
          data: {
            uploadLogoUrl: logoImageUrl,
            updated_at: new Date(),
          }
        });

        console.log("Sponsor API: Logo file uploaded successfully to:", logoImageUrl);
      } catch (logoError) {
        console.error("Sponsor API: Logo file upload failed:", logoError);
        // Log the error but don't fail the registration
      }
    }

    console.log("Sponsor API: File upload process completed");
    console.log("Final URLs - Face:", faceImageUrl, "Logo:", logoImageUrl);

    // Send confirmation email
    try {
      const emailData: SponsorRegistrationEmailData = {
        userEmail: email,
        userName: `${firstName} ${lastName}`,
        userId: user.id, // Add userId for QR code generation
        sponsorId: sponsor.id,
        companyName: sponsorData.companyName,
        sponsorshipCategories: sponsorData.sponsorshipCategories,
        budgetRange: sponsorData.budgetRange,
        proposalStatus: sponsorData.customizedProposal,
      };

      const emailSent = await sendSponsorRegistrationEmail(emailData);
      
      if (emailSent) {
        console.log("Sponsor registration confirmation email sent successfully");
      } else {
        console.log("Failed to send sponsor registration confirmation email");
      }
    } catch (emailError) {
      console.error("Error sending sponsor registration email:", emailError);
      // Don't fail the registration if email fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        sponsorId: sponsor.id,
        userId: user.id,
        faceImageUrl: faceImageUrl,
        logoUrl: logoImageUrl,
      },
      message: "Sponsor registration created successfully"
    } as SponsorRegistrationResponse, { status: 201 });

  } catch (error) {
    console.error("Sponsor registration error:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      console.error('Validation errors:', error.issues);
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        errors: error.issues.map(err => ({
          path: err.path.map(String),
          message: err.message
        })),
        message: "Please check your input and try again"
      } as SponsorRegistrationResponse, { status: 400 });
    }

    // Handle Prisma errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({
        success: false,
        error: "Duplicate entry",
        message: "A record with this information already exists"
      } as SponsorRegistrationResponse, { status: 409 });
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again later."
    } as SponsorRegistrationResponse, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Retrieve sponsor registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const industrySector = searchParams.get('industrySector');
    const budgetRange = searchParams.get('budgetRange');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const sponsorId = searchParams.get('sponsorId');

    // If specific identifiers are provided, return single or filtered results
    if (sponsorId || userId || email) {
      let whereClause: any = {};

      if (sponsorId) {
        whereClause.id = sponsorId;
      } else if (userId) {
        whereClause.userId = userId;
      } else if (email) {
        whereClause.user = {
          user_accounts: {
            some: {
              email: email
            }
          }
        };
      }

      const sponsors = await prisma.sponsor_registrations.findMany({
        where: whereClause,
        include: {
          user: {
            include: {
              user_accounts: true,
              user_details: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: sponsors,
        message: "Sponsors retrieved successfully"
      });
    }

    // General listing with pagination and filters
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { businessRegistrationName: { contains: search, mode: 'insensitive' } },
        {
          user: {
            user_details: {
              some: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } }
                ]
              }
            }
          }
        }
      ];
    }

    if (industrySector) {
      whereClause.industrySector = industrySector;
    }

    if (budgetRange) {
      whereClause.budgetRange = budgetRange;
    }

    // Get sponsors with relations
    const [sponsors, total] = await Promise.all([
      prisma.sponsor_registrations.findMany({
        where: whereClause,
        include: {
          user: {
            include: {
              user_accounts: true,
              user_details: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.sponsor_registrations.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sponsors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      },
      message: "Sponsors retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching sponsors:", error);

    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: "Failed to retrieve sponsors"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update sponsor registration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sponsorId, ...updateData } = body;

    if (!sponsorId) {
      return NextResponse.json({
        success: false,
        error: "Missing sponsor ID",
        message: "Sponsor ID is required for updates"
      } as SponsorRegistrationResponse, { status: 400 });
    }

    // Validate the update data (excluding file fields for JSON updates)
    const validatedData = sponsorRegistrationSchema.omit({
      faceScannedUrl: true,
      uploadLogoUrl: true
    }).parse(updateData);

    // Check if sponsor exists
    const existingSponsor = await prisma.sponsor_registrations.findUnique({
      where: { id: sponsorId },
      include: { user: true }
    });

    if (!existingSponsor) {
      return NextResponse.json({
        success: false,
        error: "Sponsor not found",
        message: "The specified sponsor registration does not exist"
      } as SponsorRegistrationResponse, { status: 404 });
    }

    // Separate data for different models
    const {
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
      position,
      // user_accounts fields
      email,
      mobileNumber,
      mailingAddress,
      landline,
      // Everything else goes to sponsor_registrations model
      ...sponsorData
    } = validatedData;

    // Update sponsor and related data in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user details
      await tx.user_details.updateMany({
        where: { userId: existingSponsor.userId },
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
          position,

        }
      });

      // Update user account
      await tx.user_accounts.updateMany({
        where: { userId: existingSponsor.userId },
        data: {
          email,
          mobileNumber,
          mailingAddress,
          landline,
          updated_at: new Date(),
        }
      });

      // Update sponsor registration
      const updatedSponsor = await tx.sponsor_registrations.update({
        where: { id: sponsorId },
        data: {
          companyName: sponsorData.companyName,
          businessRegistrationName: sponsorData.businessRegistrationName,
          industrySector: sponsorData.industrySector,
          industrySectorOthers: sponsorData.industrySectorOthers,
          companyAddress: sponsorData.companyAddress,
          companyWebsite: sponsorData.companyWebsite,
          companyProfile: sponsorData.companyProfile,
          sponsorshipCategories: sponsorData.sponsorshipCategories,
          targetAudience: sponsorData.targetAudience,
          targetAudienceOthers: sponsorData.targetAudienceOthers,
          activationPreferences: sponsorData.activationPreferences,
          activationOthers: sponsorData.activationOthers,
          launchProduct: sponsorData.launchProduct,
          budgetRange: sponsorData.budgetRange,
          customizedProposal: sponsorData.customizedProposal,
          additionalComments: sponsorData.additionalComments,
          updated_at: new Date(),
        }
      });

      return updatedSponsor;
    });

    return NextResponse.json({
      success: true,
      data: {
        sponsorId: result.id,
        userId: result.userId,
        faceImageUrl: null, // File updates would need separate endpoint
        logoUrl: result.uploadLogoUrl,
      },
      message: "Sponsor registration updated successfully"
    } as SponsorRegistrationResponse);

  } catch (error) {
    console.error("Sponsor update error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        errors: error.issues.map(err => ({
          path: err.path.map(String),
          message: err.message
        })),
        message: "Please check your input and try again"
      } as SponsorRegistrationResponse, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: "Failed to update sponsor registration"
    } as SponsorRegistrationResponse, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete sponsor registration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get('sponsorId');

    if (!sponsorId) {
      return NextResponse.json({
        success: false,
        error: "Missing sponsor ID",
        message: "Sponsor ID is required for deletion"
      }, { status: 400 });
    }

    // Check if sponsor exists
    const existingSponsor = await prisma.sponsor_registrations.findUnique({
      where: { id: sponsorId }
    });

    if (!existingSponsor) {
      return NextResponse.json({
        success: false,
        error: "Sponsor not found",
        message: "The specified sponsor registration does not exist"
      }, { status: 404 });
    }

    // Delete sponsor registration and related data
    await prisma.$transaction(async (tx) => {
      // Delete sponsor registration
      await tx.sponsor_registrations.delete({
        where: { id: sponsorId }
      });

      // Delete user details
      await tx.user_details.deleteMany({
        where: { userId: existingSponsor.userId }
      });

      // Delete user accounts
      await tx.user_accounts.deleteMany({
        where: { userId: existingSponsor.userId }
      });

      // Delete user
      await tx.users.delete({
        where: { id: existingSponsor.userId }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Sponsor registration deleted successfully"
    });

  } catch (error) {
    console.error("Sponsor deletion error:", error);

    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: "Failed to delete sponsor registration"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}