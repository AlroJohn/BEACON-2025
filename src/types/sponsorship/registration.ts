import {
  IndustrySector,
  SponsorshipCategory,
  SponsorshipAudience,
  SponsorshipActivation,
  SponsorshipBudgetRange,
  ProposalOption,
  YesNoMaybe,
} from "@prisma/client";
import { z } from "zod";

// Base schema for sponsorship interest registration (for forms - includes File)
export const baseSponsorshipSchema = z.object({
  // Company & Contact Details
  companyName: z.string().min(1, "Company name is required"),
  businessRegistrationName: z.string().optional().nullable(),
  industrySector: z.nativeEnum(IndustrySector),
  industrySectorOthers: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyWebsite: z.string().url("Invalid website URL").optional().nullable().or(z.literal("")),
  companyProfile: z.string().optional().nullable(),

  // Contact Person
  contactFullName: z.string().min(1, "Contact full name is required"),
  contactPosition: z.string().min(1, "Contact position is required"),
  contactEmail: z.string().email("Invalid email format"),
  contactMobile: z.string().min(1, "Mobile number is required"),
  contactLandline: z.string().optional().nullable(),

  // Sponsorship Interest
  sponsorshipCategories: z.array(z.nativeEnum(SponsorshipCategory)).min(1, "Select at least one sponsorship category"),
  targetAudience: z.array(z.nativeEnum(SponsorshipAudience)).min(1, "Select at least one target audience"),
  targetAudienceOthers: z.string().optional().nullable(),

  // Activation Preferences
  activationPreferences: z.array(z.nativeEnum(SponsorshipActivation)).min(1, "Select at least one activation preference"),
  activationOthers: z.string().optional().nullable(),
  launchProduct: z.nativeEnum(YesNoMaybe).optional().nullable(),

  // Budget & Next Steps
  budgetRange: z.nativeEnum(SponsorshipBudgetRange),
  customizedProposal: z.nativeEnum(ProposalOption),
  uploadLogoUrl: z.union([z.instanceof(File), z.string()]).optional().nullable(),
  additionalComments: z.string().optional().nullable(),
});

// API schema for sponsorship interest registration (for API - only strings)
export const sponsorshipApiSchema = z.object({
  // Company & Contact Details
  companyName: z.string().min(1, "Company name is required"),
  businessRegistrationName: z.string().optional().nullable(),
  industrySector: z.nativeEnum(IndustrySector),
  industrySectorOthers: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyWebsite: z.string().optional().nullable(),
  companyProfile: z.string().optional().nullable(),

  // Contact Person
  contactFullName: z.string().min(1, "Contact full name is required"),
  contactPosition: z.string().min(1, "Contact position is required"),
  contactEmail: z.string().email("Invalid email format"),
  contactMobile: z.string().min(1, "Mobile number is required"),
  contactLandline: z.string().optional().nullable(),

  // Sponsorship Interest
  sponsorshipCategories: z.array(z.nativeEnum(SponsorshipCategory)).min(1, "Select at least one sponsorship category"),
  targetAudience: z.array(z.nativeEnum(SponsorshipAudience)).min(1, "Select at least one target audience"),
  targetAudienceOthers: z.string().optional().nullable(),

  // Activation Preferences
  activationPreferences: z.array(z.nativeEnum(SponsorshipActivation)).min(1, "Select at least one activation preference"),
  activationOthers: z.string().optional().nullable(),
  launchProduct: z.nativeEnum(YesNoMaybe).optional().nullable(),

  // Budget & Next Steps
  budgetRange: z.nativeEnum(SponsorshipBudgetRange),
  customizedProposal: z.nativeEnum(ProposalOption),
  additionalComments: z.string().optional().nullable(),
});

// Sponsorship registration schema with conditional validation (for forms)
export const sponsorshipRegistrationSchema = baseSponsorshipSchema
  .refine((data) => {
    // If industry sector is OTHERS, industrySectorOthers is required
    if (data.industrySector === IndustrySector.OTHERS) {
      return data.industrySectorOthers && data.industrySectorOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your industry sector",
    path: ["industrySectorOthers"],
  })
  .refine((data) => {
    // If target audience includes OTHERS, targetAudienceOthers is required
    if (data.targetAudience.includes(SponsorshipAudience.OTHERS)) {
      return data.targetAudienceOthers && data.targetAudienceOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your other target audience",
    path: ["targetAudienceOthers"],
  })
  .refine((data) => {
    // If activation preferences include OTHERS, activationOthers is required
    if (data.activationPreferences.includes(SponsorshipActivation.OTHERS)) {
      return data.activationOthers && data.activationOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your other activation preferences",
    path: ["activationOthers"],
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
  });

// Sponsorship API schema with conditional validation (for API)
export const sponsorshipApiRegistrationSchema = sponsorshipApiSchema
  .refine((data) => {
    // If industry sector is OTHERS, industrySectorOthers is required
    if (data.industrySector === IndustrySector.OTHERS) {
      return data.industrySectorOthers && data.industrySectorOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your industry sector",
    path: ["industrySectorOthers"],
  })
  .refine((data) => {
    // If target audience includes OTHERS, targetAudienceOthers is required
    if (data.targetAudience.includes(SponsorshipAudience.OTHERS)) {
      return data.targetAudienceOthers && data.targetAudienceOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your other target audience",
    path: ["targetAudienceOthers"],
  })
  .refine((data) => {
    // If activation preferences include OTHERS, activationOthers is required
    if (data.activationPreferences.includes(SponsorshipActivation.OTHERS)) {
      return data.activationOthers && data.activationOthers.trim().length > 0;
    }
    return true;
  }, {
    message: "Please specify your other activation preferences",
    path: ["activationOthers"],
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
  });

export type SponsorshipRegistrationFormData = z.infer<typeof sponsorshipRegistrationSchema>;
export type SponsorshipApiFormData = z.infer<typeof sponsorshipApiRegistrationSchema>;

// Default values for sponsorship registration form
export const defaultSponsorshipRegistrationValues: Partial<SponsorshipRegistrationFormData> = {
  // Company & Contact Details
  companyName: "",
  businessRegistrationName: null,
  industrySector: IndustrySector.MARITIME_EQUIPMENT_TECHNOLOGY,
  industrySectorOthers: null,
  companyAddress: null,
  companyWebsite: null,
  companyProfile: null,

  // Contact Person
  contactFullName: "",
  contactPosition: "",
  contactEmail: "",
  contactMobile: "",
  contactLandline: null,

  // Sponsorship Interest
  sponsorshipCategories: [],
  targetAudience: [],
  targetAudienceOthers: null,

  // Activation Preferences
  activationPreferences: [],
  activationOthers: null,
  launchProduct: null,

  // Budget & Next Steps
  budgetRange: SponsorshipBudgetRange.TO_BE_DISCUSSED,
  customizedProposal: ProposalOption.YES,
  uploadLogoUrl: null, // File or string for forms, string for API
  additionalComments: null,
};

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

export const sponsorshipCategoryOptions = [
  { value: SponsorshipCategory.TITLE_SPONSOR, label: "Title Sponsor" },
  { value: SponsorshipCategory.MAJOR_PARTNER, label: "Major Partner" },
  { value: SponsorshipCategory.CONFERENCE_SPONSOR, label: "Conference Sponsor" },
  { value: SponsorshipCategory.IN_WATER_SHOW_SPONSOR, label: "In-Water Show Sponsor" },
  { value: SponsorshipCategory.BLUE_RUNWAY_SPONSOR, label: "Blue Runway Sponsor" },
  { value: SponsorshipCategory.NETWORKING_AWARDS_SPONSOR, label: "Networking & Awards Sponsor" },
  { value: SponsorshipCategory.PANEL_KEYNOTE_SUPPORTER, label: "Panel & Keynote Supporter" },
  { value: SponsorshipCategory.EXHIBIT_BAG_LANYARD_TOKEN, label: "Exhibit Bag, Lanyard & Token" },
  { value: SponsorshipCategory.CUSTOM_PACKAGE, label: "Custom Package" },
] as const;

export const sponsorshipAudienceOptions = [
  { value: SponsorshipAudience.GOVERNMENT, label: "Government Officials" },
  { value: SponsorshipAudience.SHIPPING_MARITIME, label: "Shipping & Maritime Industry" },
  { value: SponsorshipAudience.TOURISM_TRAVEL, label: "Tourism & Travel Industry" },
  { value: SponsorshipAudience.MARINE_INNOVATION_TECH, label: "Marine Innovation & Technology" },
  { value: SponsorshipAudience.EDUCATION_YOUNG_PROFESSIONALS, label: "Education & Young Professionals" },
  { value: SponsorshipAudience.LIFESTYLE_FASHION_COMMUNITY, label: "Lifestyle & Fashion Community" },
  { value: SponsorshipAudience.OTHERS, label: "Others" },
] as const;

export const sponsorshipActivationOptions = [
  { value: SponsorshipActivation.SPEAKING_SLOT_PRESENTATION, label: "Speaking Slot & Presentation" },
  { value: SponsorshipActivation.LOGO_VISIBILITY, label: "Logo Visibility" },
  { value: SponsorshipActivation.DIGITAL_MEDIA_PROMOTIONS, label: "Digital Media Promotions" },
  { value: SponsorshipActivation.BOOTH_PRODUCT_DISPLAY, label: "Booth & Product Display" },
  { value: SponsorshipActivation.PRESS_MATERIALS, label: "Press Materials" },
  { value: SponsorshipActivation.VIP_NETWORKING_ACCESS, label: "VIP Networking Access" },
  { value: SponsorshipActivation.CO_BRANDED_ACTIVITIES, label: "Co-branded Activities" },
  { value: SponsorshipActivation.OTHERS, label: "Others" },
] as const;

export const sponsorshipBudgetRangeOptions = [
  { value: SponsorshipBudgetRange.RANGE_50K_100K, label: "₱50,000 - ₱100,000" },
  { value: SponsorshipBudgetRange.RANGE_100K_250K, label: "₱100,000 - ₱250,000" },
  { value: SponsorshipBudgetRange.RANGE_250K_500K, label: "₱250,000 - ₱500,000" },
  { value: SponsorshipBudgetRange.RANGE_500K_1M, label: "₱500,000 - ₱1,000,000" },
  { value: SponsorshipBudgetRange.RANGE_1M_ABOVE, label: "₱1,000,000+" },
  { value: SponsorshipBudgetRange.TO_BE_DISCUSSED, label: "To be discussed" },
] as const;

export const proposalOptionOptions = [
  { value: ProposalOption.YES, label: "Yes, send me a customized proposal" },
  { value: ProposalOption.NO, label: "No, standard packages are fine" },
  { value: ProposalOption.SCHEDULE_MEETING, label: "Schedule a meeting to discuss" },
] as const;

export const yesNoMaybeOptions = [
  { value: YesNoMaybe.YES, label: "Yes" },
  { value: YesNoMaybe.NO, label: "No" },
  { value: YesNoMaybe.MAYBE, label: "Maybe / Considering" },
] as const;

// Form step types for multi-step form
export type SponsorshipFormStep =
  | 'company'
  | 'contact'
  | 'sponsorship'
  | 'activation'
  | 'budget'
  | 'review';

export const sponsorshipFormSteps: { step: SponsorshipFormStep; title: string; description: string }[] = [
  { step: 'company', title: 'Company Details', description: 'Business information and industry' },
  { step: 'contact', title: 'Contact Person', description: 'Primary contact details' },
  { step: 'sponsorship', title: 'Sponsorship Interest', description: 'Categories and target audience' },
  { step: 'activation', title: 'Activation Preferences', description: 'How you want to activate sponsorship' },
  { step: 'budget', title: 'Budget & Next Steps', description: 'Budget range and proposal preferences' },
  { step: 'review', title: 'Review & Submit', description: 'Review your sponsorship interest' },
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

// Helper function to format budget range for display
export const formatBudgetRange = (budgetRange: SponsorshipBudgetRange): string => {
  const option = sponsorshipBudgetRangeOptions.find(opt => opt.value === budgetRange);
  return option?.label || budgetRange;
};

// Helper function to get sponsorship category labels
export const getSponsorshipCategoryLabels = (categories: SponsorshipCategory[]): string[] => {
  return categories.map(category => {
    const option = sponsorshipCategoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  });
};

// Helper function to get target audience labels
export const getTargetAudienceLabels = (audiences: SponsorshipAudience[]): string[] => {
  return audiences.map(audience => {
    const option = sponsorshipAudienceOptions.find(opt => opt.value === audience);
    return option?.label || audience;
  });
};

// Helper function to get activation preference labels
export const getActivationPreferenceLabels = (preferences: SponsorshipActivation[]): string[] => {
  return preferences.map(preference => {
    const option = sponsorshipActivationOptions.find(opt => opt.value === preference);
    return option?.label || preference;
  });
};

// Type for API responses
export interface SponsorshipRegistrationResponse {
  success: boolean;
  data?: {
    sponsorshipId: string;
    userId: string;
    uploadLogoUrl?: string | null;
  };
  error?: string;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
  message?: string;
}

// Type for sponsorship with all relations (for display purposes)
export interface SponsorshipWithRelations {
  id: string;
  userId: string;
  created_at: Date;
  updated_at: Date;

  // Company & Contact Details
  companyName: string;
  businessRegistrationName?: string | null;
  industrySector: IndustrySector;
  industrySectorOthers?: string | null;
  companyAddress?: string | null;
  companyWebsite?: string | null;
  companyProfile?: string | null;

  // Contact Person
  contactFullName: string;
  contactPosition: string;
  contactEmail: string;
  contactMobile: string;
  contactLandline?: string | null;

  // Sponsorship Interest
  sponsorshipCategories: SponsorshipCategory[];
  targetAudience: SponsorshipAudience[];
  targetAudienceOthers?: string | null;

  // Activation Preferences
  activationPreferences: SponsorshipActivation[];
  activationOthers?: string | null;
  launchProduct?: YesNoMaybe | null;

  // Budget & Next Steps
  budgetRange: SponsorshipBudgetRange;
  customizedProposal: ProposalOption;
  uploadLogoUrl?: string | null;
  additionalComments?: string | null;

  // Relations
  user: {
    id: string;
    created_at: Date;
    updated_at: Date;
  };
}

// Type for sponsorship list query parameters
export interface SponsorshipListQuery {
  page?: number;
  limit?: number;
  search?: string;
  industrySector?: IndustrySector;
  budgetRange?: SponsorshipBudgetRange;
  customizedProposal?: ProposalOption;
  sortBy?: 'created_at' | 'updated_at' | 'companyName';
  sortOrder?: 'asc' | 'desc';
}

// Type for sponsorship list response
export interface SponsorshipListResponse {
  data: SponsorshipWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Type for sponsorship analytics
export interface SponsorshipAnalytics {
  total: number;
  byIndustry: Array<{
    industry: IndustrySector;
    count: number;
    percentage: number;
  }>;
  byBudgetRange: Array<{
    budgetRange: SponsorshipBudgetRange;
    count: number;
    percentage: number;
  }>;
  bySponsorshipCategory: Array<{
    category: SponsorshipCategory;
    count: number;
    percentage: number;
  }>;
  byProposalPreference: Array<{
    proposal: ProposalOption;
    count: number;
    percentage: number;
  }>;
}