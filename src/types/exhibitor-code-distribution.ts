import { z } from "zod";

// Base ExhibitorCodeDistribution type (matches Prisma model exactly)
export interface ExhibitorCodeDistribution {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  isActive: boolean;
  userId: string | null;
}

// Extended type with user relations for admin views
export interface ExhibitorCodeDistributionWithUser extends ExhibitorCodeDistribution {
  user: {
    id: string;
    user_details: {
      firstName: string;
      lastName: string;
    }[];
    user_accounts: {
      email: string;
    }[];
  } | null;
}

// Zod schema for form validation
export const exhibitorCodeSchema = z.object({
  code: z.string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, underscores, and hyphens"),
  isActive: z.boolean().default(false),
});

// Form data type for create/update operations
export type ExhibitorCodeFormData = z.infer<typeof exhibitorCodeSchema>;

// Create request type (excludes auto-generated fields)
export interface CreateExhibitorCodeRequest {
  code: string;
  isActive?: boolean;
}

// Update request type (all fields optional except id)
export interface UpdateExhibitorCodeRequest {
  id: string;
  code?: string;
  isActive?: boolean;
}

// API response types
export interface ExhibitorCodeResponse {
  success: boolean;
  data?: ExhibitorCodeDistribution;
  message?: string;
  error?: string;
}

export interface ExhibitorCodesListResponse {
  success: boolean;
  data?: ExhibitorCodeDistributionWithUser[];
  message?: string;
  error?: string;
}

// Code validation request/response for registration forms
export interface ValidateExhibitorCodeRequest {
  code: string;
}

export interface ValidateExhibitorCodeResponse {
  success: boolean;
  isValid: boolean;
  isActive: boolean;
  message?: string;
  error?: string;
}

// Helper types for table/form usage
export interface ExhibitorCodeTableRow extends ExhibitorCodeDistributionWithUser {
  userFullName?: string;
  userEmail?: string;
  isUsed: boolean;
}

// Modal state type for admin interface
export interface ExhibitorCodeModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete' | null;
  selectedCode: ExhibitorCodeDistribution | null;
}

// Status options for UI dropdowns
export const EXHIBITOR_CODE_STATUS_OPTIONS = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' },
] as const;

// Status color mapping for UI badges
export const EXHIBITOR_CODE_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  used: 'bg-blue-100 text-blue-800',
} as const;

// Utility function types
export type ExhibitorCodeStatus = 'active' | 'inactive' | 'used';

export interface ExhibitorCodeStats {
  total: number;
  active: number;
  inactive: number;
  used: number;
}