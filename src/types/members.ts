import { z } from "zod";

// Base member status enum
export const MEMBER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE', 
  SUSPENDED: 'SUSPENDED'
} as const;

export type MemberStatus = typeof MEMBER_STATUS[keyof typeof MEMBER_STATUS];

// TML Member Types (aligned with Prisma schema)
export interface TmlMember {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  mobileNumber?: string | null;
  landline?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  isActive: boolean;
}

// Exhibitor Member Types
export interface ExhibitorMember {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  email: string;
  jobTitle?: string | null;
  companyName?: string | null;
  mobileNumber?: string | null;
  landline?: string | null;
  sentCode?: string | null;
  isActive: boolean;
}

// Form validation schemas
export const tmlMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  mobileNumber: z.string().optional(),
  landline: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const exhibitorMemberSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  mobileNumber: z.string().optional(),
  landline: z.string().optional(),
  sentCode: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Form data types
export type TmlMemberFormData = z.infer<typeof tmlMemberSchema>;
export type ExhibitorMemberFormData = z.infer<typeof exhibitorMemberSchema>;

// Create/Update request types
export interface CreateTmlMemberRequest extends Omit<TmlMemberFormData, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateTmlMemberRequest extends Partial<CreateTmlMemberRequest> {
  id: string;
}

export interface CreateExhibitorMemberRequest extends Omit<ExhibitorMemberFormData, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateExhibitorMemberRequest extends Partial<CreateExhibitorMemberRequest> {
  id: string;
}

// API response types
export interface MemberResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface MembersListResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  message?: string;
  error?: string;
}

// Bulk upload types
export interface BulkUploadRequest {
  memberType: 'tml' | 'exhibitor';
  overwriteExisting?: boolean;
}

export interface BulkUploadResult {
  success: boolean;
  data: {
    totalRows: number;
    successfulImports: number;
    skippedRows: number;
    errors: Array<{
      row: number;
      email?: string;
      error: string;
    }>;
    duplicateEmails: string[];
  };
  message?: string;
}

// Excel/CSV column mappings for TML members
export const TML_MEMBER_COLUMNS = {
  firstName: ['firstName', 'first_name', 'First Name', 'fname'],
  lastName: ['lastName', 'last_name', 'Last Name', 'lname'],  
  middleName: ['middleName', 'middle_name', 'Middle Name', 'mname'],
  email: ['email', 'Email', 'EMAIL', 'Email Address'],
  mobileNumber: ['mobileNumber', 'mobile_number', 'Mobile Number', 'mobile', 'phone'],
  landline: ['landline', 'Landline', 'landline_number'],
  jobTitle: ['jobTitle', 'job_title', 'Job Title', 'position', 'Position'],
  companyName: ['companyName', 'company_name', 'Company Name', 'company'],
  industry: ['industry', 'Industry', 'INDUSTRY'],
  companyAddress: ['companyAddress', 'company_address', 'Company Address', 'address'],
  tmlMemberCode: ['tmlMemberCode', 'tml_member_code', 'TML Member Code', 'member_code'],
  membershipStatus: ['membershipStatus', 'membership_status', 'Status', 'status'],
  notes: ['notes', 'Notes', 'NOTES', 'remarks', 'Remarks'],
  tags: ['tags', 'Tags', 'TAGS', 'categories'],
} as const;

// Excel/CSV column mappings for Exhibitor members
export const EXHIBITOR_MEMBER_COLUMNS = {
  firstName: ['firstName', 'first_name', 'First Name', 'fname'],
  lastName: ['lastName', 'last_name', 'Last Name', 'lname'],
  middleName: ['middleName', 'middle_name', 'Middle Name', 'mname'],
  email: ['email', 'Email', 'EMAIL', 'Email Address'],
  mobileNumber: ['mobileNumber', 'mobile_number', 'Mobile Number', 'mobile', 'phone'],
  landline: ['landline', 'Landline', 'landline_number'],
  companyName: ['companyName', 'company_name', 'Company Name', 'company'],
  businessRegistrationName: ['businessRegistrationName', 'business_registration_name', 'Business Registration Name', 'registered_name'],
  companyAddress: ['companyAddress', 'company_address', 'Company Address', 'address'],
  companyWebsite: ['companyWebsite', 'company_website', 'Company Website', 'website'],
  industrySector: ['industrySector', 'industry_sector', 'Industry Sector', 'industry'],
  boothSize: ['boothSize', 'booth_size', 'Booth Size', 'booth'],
  participationTypes: ['participationTypes', 'participation_types', 'Participation Types', 'participation'],
  exhibitorCode: ['exhibitorCode', 'exhibitor_code', 'Exhibitor Code', 'code'],
  membershipStatus: ['membershipStatus', 'membership_status', 'Status', 'status'],
  notes: ['notes', 'Notes', 'NOTES', 'remarks', 'Remarks'],
  tags: ['tags', 'Tags', 'TAGS', 'categories'],
} as const;

// Bulk messaging types
export interface BulkMessageRequest {
  memberTypes: ('tml' | 'exhibitor')[];
  subject: string;
  htmlContent: string;
  filters?: {
    status?: MemberStatus;
    tags?: string[];
    isActive?: boolean;
  };
  testMode?: boolean; // Send to admin email only for testing
}

export interface BulkMessageResult {
  success: boolean;
  data: {
    totalRecipients: number;
    successfulSends: number;
    failedSends: number;
    errors: Array<{
      email: string;
      error: string;
    }>;
  };
  message?: string;
}

// Table/display types
export interface MemberTableRow {
  id: string;
  fullName: string;
  email: string;
  companyName?: string;
  memberCode?: string;
  status: string;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Modal state types
export interface MemberModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete' | 'view' | null;
  selectedMember: TmlMember | ExhibitorMember | null;
}

// Status color mapping for UI
export const MEMBER_STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
} as const;

// Member statistics
export interface MemberStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

// Filter options for UI
export const MEMBER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
] as const;

// Common participation types for exhibitors
export const PARTICIPATION_TYPES = [
  'INDOOR_BOOTH',
  'RAW_SPACE',
  'IN_WATER_DISPLAY',
  'BLUE_RUNWAY',
  'PRODUCT_LAUNCH',
  'CO_BRANDING',
] as const;

// Common booth sizes
export const BOOTH_SIZES = [
  '2m x 2m',
  '2m x 3m', 
  '3m x 3m',
  '6m x 3m',
  'Raw Space (Minimum 18sqm)',
  'Custom Setup',
] as const;

// Common industry sectors
export const INDUSTRY_SECTORS = [
  'SHIPBUILDING_BOATBUILDING',
  'MARITIME_EQUIPMENT_TECHNOLOGY',
  'NAVAL_DEFENSE',
  'PORT_LOGISTICS', 
  'MARINE_TOURISM',
  'RENEWABLE_GREEN',
  'FASHION_LIFESTYLE',
  'EDUCATION_TRAINING',
  'OTHERS',
] as const;