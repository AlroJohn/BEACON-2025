import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession, createSession } from '@/lib/adminSessions';

const prisma = new PrismaClient();

interface SponsorData {
  id: string;
  createdAt: string;
  updatedAt: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName: string;
    suffix: string;
    preferredName: string;
    gender: string;
    genderOthers: string;
    ageBracket: string;
    nationality: string;
    faceScannedUrl: string;
    position: string;
  };
  contactInfo: {
    email: string;
    mobileNumber: string;
    landline: string;
    mailingAddress: string;
    status: string;
  };
  companyInfo: {
    companyName: string;
    businessRegistrationName: string;
    industrySector: string;
    industrySectorOthers: string;
    companyAddress: string;
    companyWebsite: string;
    companyProfile: string;
  };
  sponsorshipInfo: {
    sponsorshipCategories: string[];
    targetAudience: string[];
    targetAudienceOthers: string;
  };
  activationInfo: {
    activationPreferences: string;
    activationOthers: string;
    launchProduct: string;
  };
  budgetInfo: {
    budgetRange: string;
    customizedProposal: string;
    uploadLogoUrl: string;
    additionalComments: string;
  };
}

// Transform raw database response to structured format
function transformSponsorData(rawSponsor: any): SponsorData {
  const userAccount = rawSponsor.user?.user_accounts?.[0] || {};
  const userDetails = rawSponsor.user?.user_details?.[0] || {};

  return {
    id: rawSponsor.id,
    createdAt: rawSponsor.created_at,
    updatedAt: rawSponsor.updated_at,
    personalInfo: {
      firstName: userDetails.firstName || '',
      lastName: userDetails.lastName || '',
      middleName: userDetails.middleName || '',
      suffix: userDetails.suffix || '',
      preferredName: userDetails.preferredName || '',
      gender: userDetails.gender || '',
      genderOthers: userDetails.genderOthers || '',
      ageBracket: userDetails.ageBracket || '',
      nationality: userDetails.nationality || '',
      faceScannedUrl: userDetails.faceScannedUrl || '',
      position: userDetails.position || '',
    },
    contactInfo: {
      email: userAccount.email || '',
      mobileNumber: userAccount.mobileNumber || '',
      landline: userAccount.landline || '',
      mailingAddress: userAccount.mailingAddress || '',
      status: userAccount.status || 'ACTIVE',
    },
    companyInfo: {
      companyName: rawSponsor.companyName || '',
      businessRegistrationName: rawSponsor.businessRegistrationName || '',
      industrySector: rawSponsor.industrySector || '',
      industrySectorOthers: rawSponsor.industrySectorOthers || '',
      companyAddress: rawSponsor.companyAddress || '',
      companyWebsite: rawSponsor.companyWebsite || '',
      companyProfile: rawSponsor.companyProfile || '',
    },
    sponsorshipInfo: {
      sponsorshipCategories: rawSponsor.sponsorshipCategories || [],
      targetAudience: rawSponsor.targetAudience || [],
      targetAudienceOthers: rawSponsor.targetAudienceOthers || '',
    },
    activationInfo: {
      activationPreferences: rawSponsor.activationPreferences || '',
      activationOthers: rawSponsor.activationOthers || '',
      launchProduct: rawSponsor.launchProduct || '',
    },
    budgetInfo: {
      budgetRange: rawSponsor.budgetRange || '',
      customizedProposal: rawSponsor.customizedProposal || '',
      uploadLogoUrl: rawSponsor.uploadLogoUrl || '',
      additionalComments: rawSponsor.additionalComments || '',
    },
  };
}

// Middleware to verify admin token
async function verifyAdminToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }

  const token = authHeader.split(' ')[1];
  let session = getSession(token);

  // If session not found in memory, try to recreate it from database
  if (!session) {
    try {
      const admin = await prisma.managerAccount.findFirst({
        where: { isActive: true },
        select: { id: true, username: true, status: true }
      });

      if (admin) {
        const tempSession = {
          adminId: admin.id,
          username: admin.username,
          status: admin.status,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
        };

        if (token && token.length > 10) {
          createSession(token, tempSession);
          session = tempSession;
        }
      }
    } catch (dbError) {
      console.error('Database lookup failed:', dbError);
    }
  }

  if (!session) {
    throw new Error('Invalid or expired token');
  }

  return session;
}

// GET - Retrieve all sponsor registrations for admin
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    await verifyAdminToken(authHeader);

    // Fetch all sponsor registrations with related user data
    const sponsors = await prisma.sponsor_registrations.findMany({
      include: {
        user: {
          include: {
            user_accounts: true,
            user_details: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform the data to match frontend expectations
    const transformedSponsors = sponsors.map(transformSponsorData);

    return NextResponse.json({
      success: true,
      data: transformedSponsors,
      count: transformedSponsors.length,
    });

  } catch (error) {
    console.error('Error fetching sponsor registrations:', error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
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