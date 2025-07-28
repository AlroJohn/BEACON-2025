import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, IndustrySector, SponsorshipAudience, SponsorshipActivation } from '@prisma/client';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { 
  sponsorshipApiRegistrationSchema,
  SponsorshipApiFormData,
  SponsorshipRegistrationResponse
} from '@/types/sponsorship/registration';

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to upload file to Supabase Storage for sponsorship materials
async function uploadSponsorshipFileToSupabase(file: File, userId: string, type: 'sponsor-logo'): Promise<string> {
  try {
    // Allowed extensions for sponsor materials
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'gif', 'webp'];

    // Extract and normalize file extension
    let fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Fallback if no extension or not allowed
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      fileExtension = 'jpg'; // Default to jpg for sponsor logos
    }

    // Clean original file name and append extension
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = file.name.replace(/\s+/g, '_').replace(/\.[^/.]+$/, ''); // remove original extension
    const fileName = `${type}-${timestamp}-${baseName}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Choose correct bucket - sponsor-logo goes to company-logos bucket
    const bucketName = 'company-logos';

    // Upload file to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
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
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicData.publicUrl;

  } catch (error) {
    console.error(`${type} file upload error:`, error);
    throw error;
  }
}

// Using the imported sponsorship registration schema from types

// POST - Create new sponsorship registration
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract files if present
    const sponsorLogoFile = formData.get('sponsorLogoFile') as File | null;

    // Extract other form data
    const jsonData: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'sponsorLogoFile') {
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
      if (jsonData.activationPreferences && typeof jsonData.activationPreferences === 'string') {
        jsonData.activationPreferences = JSON.parse(jsonData.activationPreferences);
      }

    } catch (parseError) {
      console.error('Error parsing FormData fields:', parseError);
      throw new Error('Invalid form data format');
    }

    console.log('Processed jsonData before validation:', jsonData);

    const validatedData: SponsorshipApiFormData = sponsorshipApiRegistrationSchema.parse(jsonData);

    // Additional validations for "Others" fields
    if (validatedData.industrySector === IndustrySector.OTHERS) {
      if (!validatedData.industrySectorOthers || validatedData.industrySectorOthers.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Please specify your industry sector when selecting "Others"',
        }, { status: 400 });
      }
    }

    if (validatedData.targetAudience.includes(SponsorshipAudience.OTHERS)) {
      if (!validatedData.targetAudienceOthers || validatedData.targetAudienceOthers.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Please specify your other target audience when selecting "Others"',
        }, { status: 400 });
      }
    }

    if (validatedData.activationPreferences.includes(SponsorshipActivation.OTHERS)) {
      if (!validatedData.activationOthers || validatedData.activationOthers.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Please specify your other activation preferences when selecting "Others"',
        }, { status: 400 });
      }
    }

    // Check if user already has a sponsorship registration
    const existingUser = await prisma.users.findFirst({
      where: {
        sponsorship_interests: {
          some: {
            contactEmail: validatedData.contactEmail
          }
        }
      },
      include: {
        sponsorship_interests: true
      }
    });

    let user;

    if (existingUser) {
      // Check if user already has a sponsorship registration
      if (existingUser.sponsorship_interests.length > 0) {
        return NextResponse.json(
          { error: 'User already has a sponsorship registration' },
          { status: 400 }
        );
      }
      user = existingUser;
    } else {
      // Create new user for sponsorship
      user = await prisma.users.create({
        data: {},
        include: {
          sponsorship_interests: true
        }
      });
    }

    // Step 1: Create sponsorship registration with null uploadLogoUrl
    console.log("Sponsorship API: Creating sponsorship registration with null uploadLogoUrl");
    const sponsorship = await prisma.sponsorship_interests.create({
      data: {
        userId: user.id,
        companyName: validatedData.companyName,
        businessRegistrationName: validatedData.businessRegistrationName,
        industrySector: validatedData.industrySector,
        industrySectorOthers: validatedData.industrySectorOthers,
        companyAddress: validatedData.companyAddress,
        companyWebsite: validatedData.companyWebsite,
        companyProfile: validatedData.companyProfile,
        contactFullName: validatedData.contactFullName,
        contactPosition: validatedData.contactPosition,
        contactEmail: validatedData.contactEmail,
        contactMobile: validatedData.contactMobile,
        contactLandline: validatedData.contactLandline,
        sponsorshipCategories: validatedData.sponsorshipCategories,
        targetAudience: validatedData.targetAudience,
        targetAudienceOthers: validatedData.targetAudienceOthers,
        activationPreferences: validatedData.activationPreferences,
        activationOthers: validatedData.activationOthers,
        launchProduct: validatedData.launchProduct,
        budgetRange: validatedData.budgetRange,
        customizedProposal: validatedData.customizedProposal,
        uploadLogoUrl: null, // Initially null, will be updated after upload
        additionalComments: validatedData.additionalComments,
      },
      include: {
        user: true
      }
    });

    console.log("Sponsorship API: Registration created successfully with ID:", sponsorship.id);

    // Step 2: Handle file upload after record creation
    let sponsorLogoUrl: string | null = null;

    // Handle sponsor logo file upload if provided
    if (sponsorLogoFile) {
      console.log("Sponsorship API: Uploading sponsor logo file to sponsor-logo/" + user.id + "/");
      try {
        sponsorLogoUrl = await uploadSponsorshipFileToSupabase(sponsorLogoFile, user.id, 'sponsor-logo');

        // Update sponsorship registration with logo URL
        await prisma.sponsorship_interests.update({
          where: { id: sponsorship.id },
          data: {
            uploadLogoUrl: sponsorLogoUrl,
          }
        });

        console.log("Sponsorship API: Sponsor logo file uploaded successfully to:", sponsorLogoUrl);
      } catch (logoError) {
        console.error("Sponsorship API: Sponsor logo file upload failed:", logoError);
        // Log the error but don't fail the registration
      }
    }

    console.log("Sponsorship API: File upload process completed");
    console.log("Final URLs - Sponsor Logo:", sponsorLogoUrl);

    const response: SponsorshipRegistrationResponse = {
      success: true,
      data: {
        sponsorshipId: sponsorship.id,
        userId: user.id,
        uploadLogoUrl: sponsorLogoUrl,
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Sponsorship registration error:', error);

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

// GET - Retrieve sponsorship registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const sponsorshipId = searchParams.get('sponsorshipId');

    if (!userId && !email && !sponsorshipId) {
      return NextResponse.json(
        { error: 'userId, email, or sponsorshipId parameter is required' },
        { status: 400 }
      );
    }

    let whereClause: any = {};

    if (sponsorshipId) {
      whereClause.id = sponsorshipId;
    } else if (userId) {
      whereClause.userId = userId;
    } else if (email) {
      whereClause.contactEmail = email;
    }

    const sponsorships = await prisma.sponsorship_interests.findMany({
      where: whereClause,
      include: {
        user: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: sponsorships
    });

  } catch (error) {
    console.error('Error fetching sponsorship registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update sponsorship registration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sponsorshipId, ...updateData } = body;

    if (!sponsorshipId) {
      return NextResponse.json(
        { error: 'sponsorshipId is required' },
        { status: 400 }
      );
    }

    // Validate update data with partial schema
    const partialSchema = sponsorshipApiRegistrationSchema.partial();
    const validatedData = partialSchema.parse(updateData);

    const updatedSponsorship = await prisma.sponsorship_interests.update({
      where: { id: sponsorshipId },
      data: validatedData,
      include: {
        user: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSponsorship
    });

  } catch (error) {
    console.error('Error updating sponsorship registration:', error);

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

// DELETE - Remove sponsorship registration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorshipId = searchParams.get('sponsorshipId');

    if (!sponsorshipId) {
      return NextResponse.json(
        { error: 'sponsorshipId parameter is required' },
        { status: 400 }
      );
    }

    await prisma.sponsorship_interests.delete({
      where: { id: sponsorshipId }
    });

    return NextResponse.json({
      success: true,
      message: 'Sponsorship registration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting sponsorship registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}