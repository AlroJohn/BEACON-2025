import {
  AgeBracket,
  Gender,
  IndustrySector,
  ParticipationType,
  YesNoMaybe,
  GoalType,
  ConfirmIntent
} from "@prisma/client";
import { z } from "zod";

// Base schema for exhibitor registration
export const baseExhibitorSchema = z.object({
  // Form-only fields (not stored in any model directly)
  faceScannedUrl: z.string().min(1, "Face capture is required"),

  // user_details fields
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  preferredName: z.string().optional().nullable(),
  gender: z.nativeEnum(Gender),
  genderOthers: z.string().optional().nullable(),
  ageBracket: z.nativeEnum(AgeBracket),
  nationality: z.string().min(1, "Nationality is required"),
  position: z.string().min(1, "Job title or position is required"),

  // user_accounts fields
  email: z.string().email("Invalid email format"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  mailingAddress: z.string().optional().nullable(),
  landline: z.string().optional().nullable(),

  // exhibitor_registrations fields - Section 1: Company Information
  companyName: z.string().min(1, "Company name is required"),
  businessRegistrationName: z.string().min(1, 'Businedd Name is required'),
  industrySector: z.nativeEnum(IndustrySector),
  industrySectorOthers: z.string().optional().nullable(),
  companyAddress: z.string().min(1, "Company address is required"),
  companyWebsite: z.string().url("Invalid website URL").or(z.literal("")),
  companyProfile: z.string().min(1, "Company profile is required"),

  // Section 4: Exhibition Package & Preferences
  participationTypes: z.array(z.nativeEnum(ParticipationType)).min(1, "Select at least one participation type"),
  boothSize: z.string().min(1, 'Booth size is required'),
  boothDescription: z.string().min(1, "Booth description is required"),
  launchNewProduct: z.nativeEnum(YesNoMaybe).optional().nullable(),
  requireDemoArea: z.nativeEnum(YesNoMaybe).optional().nullable(),

  // Section 5: Logistics & Marketing Coordination
  bringLargeEquipment: z.nativeEnum(YesNoMaybe).optional().nullable(),
  haveMarketingCollaterals: z.string().optional().nullable(),
  logoUrl: z.union([z.instanceof(File), z.string()]).optional().nullable(),

  // Section 6: Company Objectives & Collaboration
  goals: z.array(z.nativeEnum(GoalType)).min(1, "Select at least one goal"),
  goalsOthers: z.string().optional().nullable(),
  exploreSponsorship: z.nativeEnum(YesNoMaybe).optional().nullable(),

  // Section 7: Confirmation & Next Steps
  confirmIntent: z.nativeEnum(ConfirmIntent),
  letterOfIntentUrl: z.union([z.instanceof(File), z.string()]).optional().nullable(),
  additionalComments: z.string().optional().nullable(),
});

// Exhibitor registration schema with conditional validation
export const exhibitorRegistrationSchema = baseExhibitorSchema
  .refine((data) => {
    // If industry sector is OTHERS, industryOthers is required
    if (data.industrySector === IndustrySector.OTHERS) {
      return data.industrySectorOthers && data.industrySectorOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your industry sector",
    path: ["industrySectorOthers"],
  })
  .refine((data) => {
    // If gender is OTHERS, genderOthers is required
    if (data.gender === Gender.OTHERS) {
      return data.genderOthers && data.genderOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your gender",
    path: ["genderOthers"],
  })
  .refine((data) => {
    // If goals include OTHERS, goalsOthers is required
    if (data.goals.includes(GoalType.OTHERS)) {
      return data.goalsOthers && data.goalsOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your other goals",
    path: ["goalsOthers"],
  })
  .refine((data) => {
    // If website is provided, validate URL format
    if (data.companyWebsite && data.companyWebsite.trim() !== "") {
      try {
        new URL(data.companyWebsite);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, {
    message: "Please provide a valid website URL",
    path: ["companyWebsite"],
  })
  .refine((data) => {
    // Face capture is required
    if (!data.faceScannedUrl || data.faceScannedUrl.trim().length === 0) {
      return false;
    }
    return true;
  }, {
    message: "Face capture is required for registration",
    path: ["faceScannedUrl"],
  });

export type ExhibitorRegistrationFormData = z.infer<typeof exhibitorRegistrationSchema>;

// Default values for exhibitor registration form
export const defaultExhibitorRegistrationValues: Partial<ExhibitorRegistrationFormData> = {
  // Form-only fields
  faceScannedUrl: "",

  // user_details fields
  firstName: "",
  lastName: "",
  middleName: null,
  suffix: null,
  preferredName: null,
  gender: Gender.MALE,
  genderOthers: null,
  ageBracket: AgeBracket.AGE_25_34,
  nationality: "",
  position: '',

  // user_accounts fields
  email: "",
  mobileNumber: "",
  mailingAddress: null,
  landline: null,

  // Company Information
  companyName: "",
  businessRegistrationName: '',
  industrySector: IndustrySector.MARITIME_EQUIPMENT_TECHNOLOGY,
  industrySectorOthers: null,
  companyAddress: '',
  companyWebsite: '',
  companyProfile: '',

  // Exhibition Package & Preferences
  participationTypes: [],
  boothSize: '',
  boothDescription: "",
  launchNewProduct: null,
  requireDemoArea: null,

  // Logistics & Marketing Coordination
  bringLargeEquipment: null,
  haveMarketingCollaterals: null,
  logoUrl: null,

  // Company Objectives & Collaboration
  goals: [],
  goalsOthers: null,
  exploreSponsorship: null,

  // Confirmation & Next Steps
  confirmIntent: ConfirmIntent.TENTATIVE,
  letterOfIntentUrl: null,
  additionalComments: null,
};

// export const defaultExhibitorRegistrationValues: Partial<ExhibitorRegistrationFormData> = {
//   // Form-only fields
//   faceScannedUrl: "",

//   // user_details fields
//   firstName: "John",
//   lastName: "Doe",
//   middleName: "A.",
//   suffix: "Jr.",
//   preferredName: "John",
//   gender: Gender.MALE,
//   genderOthers: null, // only use if gender === 'OTHERS'
//   ageBracket: AgeBracket.AGE_25_34,
//   nationality: "Filipino",
//   position: "Marketing Manager",

//   // user_accounts fields
//   email: "alromercado08@gmail.com",
//   mobileNumber: "09171234567",
//   mailingAddress: "Unit 1203, Ayala Ave., Makati City, Metro Manila",
//   landline: "+63 2 8123 4567",

//   // Company Information
//   companyName: "Acme Maritime Solutions, Inc.",
//   businessRegistrationName: "Acme Maritime Solutions, Inc.",
//   industrySector: IndustrySector.MARITIME_EQUIPMENT_TECHNOLOGY,
//   industrySectorOthers: null, // only use if industrySector === 'OTHERS'
//   companyAddress: "123 Harbor Drive, Pasay City, Metro Manila",
//   companyWebsite: "https://www.acmemaritime.com",
//   companyProfile: "Provider of marine equipment, navigation systems, and coastal monitoring solutions.",

//   // Exhibition Package & Preferences
//   participationTypes: [], // keep empty unless you want to pre-select in UI
//   boothSize: "3m x 3m (9 sqm)",
//   boothDescription: "Corner booth with storage and product display shelves.",
//   launchNewProduct: 'YES',
//   requireDemoArea: 'YES',

//   // Logistics & Marketing Coordination
//   bringLargeEquipment: 'MAYBE',
//   haveMarketingCollaterals: '',
//   logoUrl: null, // file upload will populate this

//   // Company Objectives & Collaboration
//   goals: [], // keep empty unless you want to pre-select
//   goalsOthers: null, // fill only if goals contains 'OTHERS'
//   exploreSponsorship: 'MAYBE',

//   // Confirmation & Next Steps
//   confirmIntent: ConfirmIntent.TENTATIVE,
//   letterOfIntentUrl: null, // file upload will populate this
//   additionalComments: "We prefer a booth near the conference hall entrance.",
// };


// UI options for dropdowns and multi-selects
export const industrySectorOptions = [
  { value: IndustrySector.SHIPBUILDING_BOATBUILDING, label: "Shipbuilding & Boatbuilding" },
  { value: IndustrySector.MARITIME_EQUIPMENT_TECHNOLOGY, label: "Maritime Equipment & Technology" },
  { value: IndustrySector.NAVAL_DEFENSE, label: "Naval Defense" },
  { value: IndustrySector.PORT_LOGISTICS, label: "Port & Logistics" },
  { value: IndustrySector.MARINE_TOURISM, label: "Marine Tourism" },
  { value: IndustrySector.RENEWABLE_GREEN, label: "Renewable & Green Energy" },
  { value: IndustrySector.FASHION_LIFESTYLE, label: "Fashion & Lifestyle" },
  { value: IndustrySector.EDUCATION_TRAINING, label: "Education & Training" },
  { value: IndustrySector.OTHERS, label: "Others" },
] as const;

export const participationTypeOptions = [
  { value: ParticipationType.INDOOR_BOOTH, label: "Indoor Booth" },
  { value: ParticipationType.RAW_SPACE, label: "Raw Space" },
  { value: ParticipationType.IN_WATER_DISPLAY, label: "In-Water Display" },
  { value: ParticipationType.BLUE_RUNWAY, label: "Blue Runway" },
  { value: ParticipationType.PRODUCT_LAUNCH, label: "Product Launch" },
  { value: ParticipationType.CO_BRANDING, label: "Co-Branding" },
] as const;

export const yesNoMaybeOptions = [
  { value: YesNoMaybe.YES, label: "Yes" },
  { value: YesNoMaybe.NO, label: "No" },
  { value: YesNoMaybe.MAYBE, label: "Maybe" },
] as const;

export const boothSizeOptions = [
  { value: '2m x 2m', label: "2x2 meters" },
  { value: '2m x 3m', label: "2x3 meters" },
  { value: '3m x 3m', label: "3x3 meters" },
  { value: '6m x 3m', label: "6x3 meters" },
  { value: 'Raw Space (Minimum 18sqm)', label: "Raw Space (minimum 18 sqm)" },
  { value: 'custom setup', label: "Custom Setup" },
] as const;

export const goalTypeOptions = [
  { value: GoalType.SHOWCASE_PRODUCTS, label: "Showcase Products/Services" },
  { value: GoalType.MEET_BUYERS, label: "Meet Potential Buyers" },
  { value: GoalType.PROMOTE_BRAND, label: "Promote Brand Awareness" },
  { value: GoalType.LAUNCH_NEW_PRODUCT, label: "Launch New Product/Service" },
  { value: GoalType.ENGAGE_GOV_AGENCIES, label: "Engage with Government Agencies" },
  { value: GoalType.JOIN_BLUE_ECONOMY, label: "Join Blue Economy Initiative" },
  { value: GoalType.RECRUIT_TALENT, label: "Recruit Talent" },
  { value: GoalType.OTHERS, label: "Others" },
] as const;

export const confirmIntentOptions = [
  { value: ConfirmIntent.YES_RESERVE, label: "Yes, I want to reserve a booth" },
  { value: ConfirmIntent.TENTATIVE, label: "Tentative - need more information" },
  { value: ConfirmIntent.NO_EXPLORING, label: "No, just exploring options" },
] as const;

export const marketingCollateralsOptions = [
  { value: "yes_have_collaterals", label: "Yes, I have marketing collaterals" },
  { value: "no_need_assistance", label: "No, I need assistance" },
  { value: "working_on_it", label: "I'm working on it" },
] as const;

// Gender options for UI
export const genderOptions = [
  { value: Gender.MALE, label: "Male" },
  { value: Gender.FEMALE, label: "Female" },
  { value: Gender.PREFER_NOT_TO_SAY, label: "Prefer not to say" },
  { value: Gender.OTHERS, label: "Others" },
] as const;

// Age Bracket options for UI
export const ageBracketOptions = [
  { value: AgeBracket.UNDER_18, label: "Under 18" },
  { value: AgeBracket.AGE_18_24, label: "18-24" },
  { value: AgeBracket.AGE_25_34, label: "25-34" },
  { value: AgeBracket.AGE_35_44, label: "35-44" },
  { value: AgeBracket.AGE_45_54, label: "45-54" },
  { value: AgeBracket.AGE_55_ABOVE, label: "55 and above" },
] as const;

// Form step types for multi-step form
export type ExhibitorFormStep =
  | 'company'
  | 'personal'
  | 'contact'
  | 'exhibition'
  | 'logistics'
  | 'objectives'
  | 'confirmation'
  | 'review';

export const exhibitorFormSteps: { step: ExhibitorFormStep; title: string; description: string }[] = [
  { step: 'company', title: 'Company Information', description: 'Business details and industry' },
  { step: 'personal', title: 'Personal Information', description: 'Representative details' },
  { step: 'contact', title: 'Contact Details', description: 'Email and contact information' },
  { step: 'exhibition', title: 'Exhibition Package', description: 'Booth and participation preferences' },
  { step: 'logistics', title: 'Logistics & Marketing', description: 'Equipment and marketing coordination' },
  { step: 'objectives', title: 'Objectives & Goals', description: 'Business goals and collaboration' },
  { step: 'confirmation', title: 'Confirmation', description: 'Intent and additional information' },
  { step: 'review', title: 'Review & Submit', description: 'Review your registration' },
];

// Helper function to validate company website
export const isValidWebsiteUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return true; // Optional field
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to format company name for display
export const formatCompanyName = (companyName: string, businessRegistrationName?: string | null): string => {
  if (!businessRegistrationName) return companyName;
  return `${companyName} (${businessRegistrationName})`;
};

// Type for API responses
export interface ExhibitorRegistrationResponse {
  success: boolean;
  data?: {
    exhibitorId: string;
    userId: string;
    faceImageUrl?: string | null;
    logoUrl?: string | null;
  };
  error?: string;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
  message?: string;
}

// Type for exhibitor with all relations (for display purposes)
export interface ExhibitorWithRelations {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Company Information
  companyName: string;
  businessRegistrationName?: string | null;
  industrySector: IndustrySector;
  industrySectorOthers?: string | null;
  companyAddress: string;
  companyWebsite: string;
  companyProfile: string;

  // Exhibition Package & Preferences
  participationTypes: ParticipationType[];
  boothSize?: string;
  boothDescription: string;
  launchNewProduct?: YesNoMaybe | null;
  requireDemoArea?: YesNoMaybe | null;

  // Logistics & Marketing Coordination
  bringLargeEquipment?: YesNoMaybe | null;
  haveMarketingCollaterals?: string | null;
  logoUrl?: string | null;

  // Company Objectives & Collaboration
  goals: GoalType[];
  goalsOthers?: string | null;
  exploreSponsorship?: YesNoMaybe | null;

  // Confirmation & Next Steps
  confirmIntent: ConfirmIntent;
  letterOfIntentUrl?: string | null;
  additionalComments?: string | null;

  // Relations
  user: {
    id: string;
    created_at: Date;
    updated_at: Date;
    user_accounts: Array<{
      id: string;
      email: string;
      mobileNumber: string;
      mailingAddress?: string | null;
      landline?: string | null;
    }>;
    user_details: Array<{
      id: string;
      firstName: string;
      lastName: string;
      middleName?: string | null;
      suffix?: string | null;
      preferredName?: string | null;
      faceScannedUrl?: string | null;
      gender: Gender;
      genderOthers?: string | null;
      ageBracket: AgeBracket;
      nationality: string;
      position: string;
    }>;
  };
}