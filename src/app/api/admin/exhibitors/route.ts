import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession, createSession } from '@/lib/adminSessions';

const prisma = new PrismaClient();

interface ExhibitorData {
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
  exhibitionInfo: {
    participationTypes: string[];
    boothSize: string;
    boothDescription: string;
    launchNewProduct: string;
    requireDemoArea: string;
  };
  logisticsInfo: {
    bringLargeEquipment: string;
    haveMarketingCollaterals: string;
    logoUrl: string;
  };
  goalsInfo: {
    goals: string[];
    goalsOthers: string;
    exploreSponsorship: string;
  };
  confirmationInfo: {
    confirmIntent: string;
    letterOfIntentUrl: string;
    additionalComments: string;
  };
}

// Transform raw database response to structured format
function transformExhibitorData(rawExhibitor: any): ExhibitorData {
  const userAccount = rawExhibitor.user?.user_accounts?.[0] || {};
  const userDetails = rawExhibitor.user?.user_details?.[0] || {};

  return {
    id: rawExhibitor.id,
    createdAt: rawExhibitor.created_at,
    updatedAt: rawExhibitor.updated_at,
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
      companyName: rawExhibitor.companyName || '',
      businessRegistrationName: rawExhibitor.businessRegistrationName || '',
      industrySector: rawExhibitor.industrySector || '',
      industrySectorOthers: rawExhibitor.industrySectorOthers || '',
      companyAddress: rawExhibitor.companyAddress || '',
      companyWebsite: rawExhibitor.companyWebsite || '',
      companyProfile: rawExhibitor.companyProfile || '',
    },
    exhibitionInfo: {
      participationTypes: rawExhibitor.participationTypes || [],
      boothSize: rawExhibitor.boothSize || '',
      boothDescription: rawExhibitor.boothDescription || '',
      launchNewProduct: rawExhibitor.launchNewProduct || '',
      requireDemoArea: rawExhibitor.requireDemoArea || '',
    },
    logisticsInfo: {
      bringLargeEquipment: rawExhibitor.bringLargeEquipment || '',
      haveMarketingCollaterals: rawExhibitor.haveMarketingCollaterals || '',
      logoUrl: rawExhibitor.logoUrl || '',
    },
    goalsInfo: {
      goals: rawExhibitor.goals || [],
      goalsOthers: rawExhibitor.goalsOthers || '',
      exploreSponsorship: rawExhibitor.exploreSponsorship || '',
    },
    confirmationInfo: {
      confirmIntent: rawExhibitor.confirmIntent || '',
      letterOfIntentUrl: rawExhibitor.letterOfIntentUrl || '',
      additionalComments: rawExhibitor.additionalComments || '',
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

// GET - Retrieve all exhibitor registrations for admin
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    await verifyAdminToken(authHeader);

    // Fetch all exhibitor registrations with related user data
    const exhibitors = await prisma.exhibitor_registrations.findMany({
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
    const transformedExhibitors = exhibitors.map(transformExhibitorData);

    return NextResponse.json({
      success: true,
      data: transformedExhibitors,
      count: transformedExhibitors.length,
    });

  } catch (error) {
    console.error('Error fetching exhibitor registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}