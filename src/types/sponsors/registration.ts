import {
    AgeBracket,
    Gender,
    IndustrySector,
    SponsorshipCategory,
    SponsorshipAudience,
    SponsorshipBudgetRange,
    ProposalOption,
    YesNoMaybe,
} from "@prisma/client";
import { z } from "zod";

/* ---------------------------------------------
   UI preset values for activation preferences
   (activationPreferences is a string in DB)
----------------------------------------------*/
export const activationPreferencePresetValues = [
    "Speaking Slot / Product Presentation",
    "Logo Visibility on Stage / Program / Banners",
    "Digital Media Promotions (FB, IG, Website, Email)",
    "Booth / Product Display",
    "Inclusion in Press Materials",
    "VIP Networking Access",
    "Co-branded Activities / Competitions",
    "OTHER",
] as const;

export type ActivationPreferencePreset =
    (typeof activationPreferencePresetValues)[number];

export const isActivationPreferencePreset = (
    v: string
): v is ActivationPreferencePreset =>
    activationPreferencePresetValues.includes(v as ActivationPreferencePreset);

/* ---------------------------------------------
   Base schema for Sponsor registration
   (Form-only + user_details + user_accounts + sponsor_registrations)
----------------------------------------------*/
export const baseSponsorSchema = z.object({
    // Form-only fields (not stored directly in sponsor_registrations)
    faceScannedUrl: z.string().min(1, "Face capture is required"),

    // user_details fields (contact person)
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional().nullable(),
    suffix: z.string().optional().nullable(),
    preferredName: z.string().optional().nullable(),
    position: z.string().min(1, "Position/Designation is required"),
    gender: z.nativeEnum(Gender),
    genderOthers: z.string().optional().nullable(),
    ageBracket: z.nativeEnum(AgeBracket),
    nationality: z.string().min(1, "Nationality is required"),

    // user_accounts fields (contact details)
    email: z.string().email("Invalid email format"),
    mobileNumber: z.string().min(1, "Mobile number is required"),
    mailingAddress: z.string().optional().nullable(),
    landline: z.string().optional().nullable(),

    // sponsor_registrations fields — Section 1: Company & Details
    companyName: z.string().min(1, "Company/Organization name is required"),
    businessRegistrationName: z.string().optional().nullable(),
    industrySector: z.nativeEnum(IndustrySector),
    industrySectorOthers: z.string().optional().nullable(),
    companyAddress: z.string().min(1, "Company address is required"),
    companyWebsite: z.string().url("Invalid website URL").or(z.literal("")),
    companyProfile: z.string().min(1, "Company profile is required"),

    // Section 3: Sponsorship Interest
    sponsorshipCategories: z
        .array(z.nativeEnum(SponsorshipCategory))
        .min(1, "Select at least one sponsorship category"),
    targetAudience: z
        .array(z.nativeEnum(SponsorshipAudience))
        .min(1, "Select at least one target audience"),
    targetAudienceOthers: z.string().optional().nullable(),

    // Section 4: Activation Preferences
    // String with presets support and custom text allowance
    activationPreferences: z
        .string()
        .min(1, "Select or enter an activation preference"),
    activationOthers: z.string().optional().nullable(),
    launchProduct: z.nativeEnum(YesNoMaybe).optional().nullable(),

    // Section 5: Budget & Next Steps
    budgetRange: z.nativeEnum(SponsorshipBudgetRange),
    customizedProposal: z.nativeEnum(ProposalOption),
    uploadLogoUrl: z.union([z.instanceof(File), z.string()]).optional().nullable(),
    additionalComments: z.string().optional().nullable(),
});

/* ---------------------------------------------
   Sponsor registration schema with conditionals
----------------------------------------------*/
export const sponsorRegistrationSchema = baseSponsorSchema
    // If industry sector is OTHERS, require industrySectorOthers
    .refine(
        (data) =>
            data.industrySector !== IndustrySector.OTHERS ||
            !!(data.industrySectorOthers && data.industrySectorOthers.trim().length),
        {
            message: "Please specify your industry sector",
            path: ["industrySectorOthers"],
        }
    )
    // If gender is OTHERS, require genderOthers
    .refine((data) => data.gender !== Gender.OTHERS || !!(data.genderOthers && data.genderOthers.trim().length), {
        message: "Please specify your gender",
        path: ["genderOthers"],
    })
    // If targetAudience includes OTHERS, require targetAudienceOthers
    .refine(
        (data) =>
            !data.targetAudience.includes(SponsorshipAudience.OTHERS) ||
            !!(data.targetAudienceOthers && data.targetAudienceOthers.trim().length),
        {
            message: "Please specify your other target audience",
            path: ["targetAudienceOthers"],
        }
    )
    // activationPreferences logic:
    // - If "OTHER" selected, activationOthers is required
    // - If not a preset, treat as custom text; ensure at least 3 chars
    .refine(
        (data) =>
            data.activationPreferences !== "OTHER" ||
            !!(data.activationOthers && data.activationOthers.trim().length),
        {
            message: "Please enter your custom activation preference",
            path: ["activationOthers"],
        }
    )
    .refine(
        (data) =>
            isActivationPreferencePreset(data.activationPreferences) ||
            data.activationPreferences.trim().length >= 3,
        {
            message:
                "Custom activation preference must be at least 3 characters",
            path: ["activationPreferences"],
        }
    )
    // Optional website validation already via zod.url() above; allow empty string
    // Face capture required
    .refine(
        (data) => !!(data.faceScannedUrl && data.faceScannedUrl.trim().length),
        {
            message: "Face capture is required for registration",
            path: ["faceScannedUrl"],
        }
    );

export type SponsorRegistrationFormData = z.infer<
    typeof sponsorRegistrationSchema
>;

/* ---------------------------------------------
   Default values for sponsor registration form
----------------------------------------------*/
export const defaultSponsorRegistrationValues: Partial<SponsorRegistrationFormData> =
{
    // Form-only
    faceScannedUrl: "",

    // user_details
    firstName: "",
    lastName: "",
    middleName: null,
    suffix: null,
    preferredName: null,
    position: "",
    gender: Gender.MALE,
    genderOthers: null,
    ageBracket: AgeBracket.AGE_25_34,
    nationality: "",

    // user_accounts
    email: "",
    mobileNumber: "",
    mailingAddress: null,
    landline: null,

    // Company & Details
    companyName: "",
    businessRegistrationName: null,
    industrySector: IndustrySector.MARITIME_EQUIPMENT_TECHNOLOGY,
    industrySectorOthers: null,
    companyAddress: "",
    companyWebsite: "",
    companyProfile: "",

    // Sponsorship Interest
    sponsorshipCategories: [],
    targetAudience: [],
    targetAudienceOthers: null,

    // Activation Preferences
    activationPreferences: "",
    activationOthers: null,
    launchProduct: null,

    // Budget & Next Steps
    budgetRange: SponsorshipBudgetRange.TO_BE_DISCUSSED,
    customizedProposal: ProposalOption.SCHEDULE_MEETING,
    uploadLogoUrl: null,
    additionalComments: null,
};

/* ---------------------------------------------
   UI options (value-label)
----------------------------------------------*/
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
    { value: SponsorshipCategory.BLUE_RUNWAY_SPONSOR, label: "Blue Runway Fashion Show Sponsor" },
    { value: SponsorshipCategory.NETWORKING_AWARDS_SPONSOR, label: "Networking & Awards Night Sponsor" },
    { value: SponsorshipCategory.PANEL_KEYNOTE_SUPPORTER, label: "Panel/Keynote Supporter" },
    { value: SponsorshipCategory.EXHIBIT_BAG_LANYARD_TOKEN, label: "Exhibit Bag / Lanyard / Token Sponsor" },
    { value: SponsorshipCategory.CUSTOM_PACKAGE, label: "Custom Sponsorship Package" },
] as const;

export const targetAudienceOptions = [
    { value: SponsorshipAudience.GOVERNMENT, label: "Government / Regulatory Bodies" },
    { value: SponsorshipAudience.SHIPPING_MARITIME, label: "Shipping & Maritime Companies" },
    { value: SponsorshipAudience.TOURISM_TRAVEL, label: "Tourism & Travel" },
    { value: SponsorshipAudience.MARINE_INNOVATION_TECH, label: "Marine Innovation & Tech" },
    { value: SponsorshipAudience.EDUCATION_YOUNG_PROFESSIONALS, label: "Education / Students / Young Professionals" },
    { value: SponsorshipAudience.LIFESTYLE_FASHION_COMMUNITY, label: "Lifestyle / Fashion / Coastal Community" },
    { value: SponsorshipAudience.OTHERS, label: "Others" },
] as const;

export const budgetRangeOptions = [
    { value: SponsorshipBudgetRange.RANGE_50K_100K, label: "₱50,000 – ₱100,000" },
    { value: SponsorshipBudgetRange.RANGE_100K_250K, label: "₱100,000 – ₱250,000" },
    { value: SponsorshipBudgetRange.RANGE_250K_500K, label: "₱250,000 – ₱500,000" },
    { value: SponsorshipBudgetRange.RANGE_500K_1M, label: "₱500,000 – ₱1,000,000" },
    { value: SponsorshipBudgetRange.RANGE_1M_ABOVE, label: "₱1,000,000 and Above" },
    { value: SponsorshipBudgetRange.TO_BE_DISCUSSED, label: "To be discussed" },
] as const;

export const proposalOptionOptions = [
    { value: ProposalOption.YES, label: "Yes" },
    { value: ProposalOption.NO, label: "No" },
    { value: ProposalOption.SCHEDULE_MEETING, label: "Let's schedule a meeting" },
] as const;

export const yesNoMaybeOptions = [
    { value: YesNoMaybe.YES, label: "Yes" },
    { value: YesNoMaybe.NO, label: "No" },
    { value: YesNoMaybe.MAYBE, label: "Maybe" },
] as const;

export const activationPreferenceOptions = activationPreferencePresetValues.map(
    (v) => ({ value: v, label: v })
);

/* ---------------------------------------------
   Form steps for multi-step sponsor form
----------------------------------------------*/
export type SponsorFormStep =
    | "company"
    | "personal"
    | "contact"
    | "interest"
    | "activation"
    | "budget"
    | "review";

export const sponsorFormSteps: {
    step: SponsorFormStep;
    title: string;
    description: string;
}[] = [
        { step: "company", title: "Company Information", description: "Business details and industry" },
        { step: "personal", title: "Personal Information", description: "Sponsorship representative details" },
        { step: "contact", title: "Contact Details", description: "Email and contact information" },
        { step: "interest", title: "Sponsorship Interest", description: "Categories and target audience" },
        { step: "activation", title: "Activation Preferences", description: "Preferred activation and product launch" },
        { step: "budget", title: "Budget & Proposal", description: "Budget range and proposal options" },
        { step: "review", title: "Review & Submit", description: "Final review before submission" },
    ];

/* ---------------------------------------------
   Helpers
----------------------------------------------*/
export const isValidWebsiteUrl = (url: string): boolean => {
    if (!url || url.trim() === "") return true; // Optional
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const formatCompanyName = (
    companyName: string,
    businessRegistrationName?: string | null
): string => {
    if (!businessRegistrationName) return companyName;
    return `${companyName} (${businessRegistrationName})`;
};

/* ---------------------------------------------
   API response type
----------------------------------------------*/
export interface SponsorRegistrationResponse {
    success: boolean;
    data?: {
        sponsorId: string;
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

/* ---------------------------------------------
   Sponsor with relations (for display)
----------------------------------------------*/
export interface SponsorWithRelations {
    id: string;
    userId: string;
    created_at: Date;
    updated_at: Date;

    // Company & Details
    companyName: string;
    businessRegistrationName?: string | null;
    industrySector: IndustrySector;
    industrySectorOthers?: string | null;
    companyAddress: string;
    companyWebsite: string;
    companyProfile: string;

    // Sponsorship Interest
    sponsorshipCategories: SponsorshipCategory[];
    targetAudience: SponsorshipAudience[];
    targetAudienceOthers?: string | null;

    // Activation Preferences
    activationPreferences: string; // preset or custom
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
