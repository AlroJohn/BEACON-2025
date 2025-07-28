// Conference Types for BEACON 2025
// Based on Prisma schema and API structure

// Enum types from schema
export type MaritimeLeagueMembership = 'YES' | 'NO';
export type ConferenceDuration = 'ONE_DAY' | 'TWO_DAYS' | 'THREE_DAYS';
export type PaymentMode = 'BANK_DEPOSIT_TRANSFER' | 'GCASH' | 'WALK_IN_ON_SITE';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
export type ConferenceInterestArea =
  | 'SHIPBUILDING_SHIP_REPAIR'
  | 'BOATBUILDING_YACHT_BUILDING'
  | 'MARINE_TECHNOLOGY'
  | 'NAVAL_DEFENSE_SECURITY'
  | 'MARITIME_TOURISM'
  | 'INNOVATION_SUSTAINABILITY'
  | 'BLUE_ECONOMY'
  | 'LIFESTYLE_FASHION'
  | 'WOMEN_YOUTH_IN_MARITIME'
  | 'OTHERS';

export type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' | 'OTHERS';
export type AgeBracket = 'UNDER_18' | 'AGE_18_24' | 'AGE_25_34' | 'AGE_35_44' | 'AGE_45_54' | 'AGE_55_ABOVE';

// Event types
export type EventStatusEnum = 'CONFERENCE' | 'SHOW' | 'WORKSHOP' | 'SEMINAR' | 'EXHIBITION';

// Events Model Type (for Conference payments)
export interface Event {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  eventName: string;
  eventDate: Date;
  eventPrice: number;
  eventStatus: EventStatusEnum;
  isActive: boolean;
  description?: string;
  eventStartTime?: Date;
  eventEndTime?: Date;
  summaryOfPayments?: SummaryOfPayments[];
}

// VisitorEvents Model Type (for Visitor registration display)
export interface VisitorEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  eventName: string;
  eventDateStart: Date;
  eventDateEnd: Date;
  eventStatus: EventStatusEnum;
  isActive: boolean;
  description?: string;
  eventStartTime?: Date;
  eventEndTime?: Date;
}

// Summary of Payments Model Type
export interface SummaryOfPayments {
  id: string;
  conferenceId: string;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
  conference?: ConferenceRegistration;
  event?: Event;
}

// Core Conference Registration Type
export interface ConferenceRegistration {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Section 1: Maritime League Membership
  isMaritimeLeagueMember: MaritimeLeagueMembership;
  tmlMemberCode?: string;

  // Section 2: Event Registration
  registerForConference: boolean;
  registerBoatShow: boolean; // FREE but registration required
  registerBlueRunway: boolean; // ₱2,000

  // Section 3: Conference Registration (if selected)
  conferenceDuration?: ConferenceDuration;
  attendingDay1: boolean; // Sept 29
  attendingDay2: boolean; // Sept 30
  attendingDay3: boolean; // Oct 1

  // Section 4: Personal Information
  fullName: string;
  preferredName?: string;
  gender: Gender;
  ageBracket: AgeBracket;
  nationality: string;

  // Section 5: Contact Details
  email: string;
  mobileNumber: string;
  mailingAddress?: string;

  // Section 6: Professional Information
  jobTitle?: string;
  companyName?: string;
  industry?: string;
  companyAddress?: string;
  companyWebsite?: string;

  // Section 7: Areas of Interest
  interestAreas: ConferenceInterestArea[];
  otherInterests?: string;
  receiveEventInvites: boolean;

  // Section 8: Payment Details
  totalPaymentAmount?: number;
  customPaymentAmount?: string;

  // Section 9: Consent & Confirmation
  emailCertificate: boolean;
  photoVideoConsent: boolean;
  dataUsageConsent: boolean;

  // Payment Processing
  paymentToken?: string;
  paymentTokenExpiry?: Date;
  requiresPayment: boolean;

  // Relations
  user?: UserWithDetails;
  ConferencePayment?: ConferencePayment;
  summaryOfPayments?: SummaryOfPayments[];
}

// Conference Payment Type
export interface ConferencePayment {
  id: string;
  conferenceId: string;
  createdAt: Date;
  updatedAt: Date;

  // Payment Details
  totalAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  customPaymentAmount?: string;
  transactionId?: string;
  proofOfPaymentUrl?: string;
  paymentDate?: Date;

  // PayMongo Integration Fields
  paymongoPaymentId?: string;
  paymongoCheckoutId?: string;
  paymongoIntentId?: string;
  paymongoWebhookId?: string;
  paymongoPaymentMethod?: string;
  paymongoReferenceId?: string;

  // Payment Confirmation
  isPaid: boolean;
  paymentConfirmedAt?: Date;
  paymentConfirmedBy?: string;

  // Payment Breakdown
  conferenceAmount?: number;
  blueRunwayAmount?: number;

  // Notes
  notes?: string;

  // Relations
  conference?: ConferenceRegistration;
}

// User-related types (from existing schema)
export interface UserWithDetails {
  id: string;
  created_at: Date;
  updated_at: Date;
  user_accounts: UserAccount[];
  user_details: UserDetail[];
}

export interface UserAccount {
  id: string;
  created_at: Date;
  updated_at: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'VISITOR';
  userId: string;
  email: string;
  mobileNumber: string;
  landline?: string;
  faceScanningFile?: string;
  identification?: string;
}

export interface UserDetail {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  preferredName?: string;
  faceScannedUrl?: string;
  gender: Gender;
  genderOthers?: string;
  ageBracket: AgeBracket;
  nationality: string;
}

// Form Data Types for API requests
export interface ConferenceRegistrationFormData {
  // Maritime League Membership
  isMaritimeLeagueMember: MaritimeLeagueMembership;
  tmlMemberCode?: string;

  // Selected Events (new approach)
  selectedEventIds?: string[];

  // Event Registration (legacy - for backward compatibility)
  registerForConference?: boolean;
  registerBoatShow?: boolean;
  registerBlueRunway?: boolean;

  // Conference Registration
  conferenceDuration?: ConferenceDuration;
  attendingDay1?: boolean;
  attendingDay2?: boolean;
  attendingDay3?: boolean;

  // Personal Information
  fullName: string;
  preferredName?: string;
  gender: Gender;
  ageBracket: AgeBracket;
  nationality: string;

  // Contact Details
  email: string;
  mobileNumber: string;
  mailingAddress?: string;

  // Professional Information
  jobTitle?: string;
  companyName?: string;
  industry?: string;
  companyAddress?: string;
  companyWebsite?: string;

  // Areas of Interest
  interestAreas: ConferenceInterestArea[];
  otherInterests?: string;
  receiveEventInvites?: boolean;

  // Payment Details
  totalPaymentAmount?: number;
  customPaymentAmount?: string;

  // Consent & Confirmation
  emailCertificate?: boolean;
  photoVideoConsent?: boolean;
  dataUsageConsent: boolean;
}

// API Response Types
export interface ConferenceRegistrationResponse {
  success: boolean;
  data: {
    conferenceId: string;
    userId: string;
    requiresPayment: boolean;
    totalAmount: number;
    paymentToken?: string;
    paymentTokenExpiry?: Date;
  };
}

export interface ConferenceListResponse {
  success: boolean;
  data: ConferenceRegistration[];
}

export interface ConferenceUpdateResponse {
  success: boolean;
  data: ConferenceRegistration;
}

export interface ConferenceDeleteResponse {
  success: boolean;
  message: string;
}

// API Error Response
export interface ConferenceAPIError {
  error: string;
  details?: any[];
}

// Payment calculation types
export interface PaymentBreakdown {
  conferenceAmount: number;
  blueRunwayAmount: number;
  totalAmount: number;
  requiresPayment: boolean;
}

// PayMongo webhook event types
export interface PayMongoWebhookEvent {
  id: string;
  type: string;
  data: {
    attributes: {
      amount: number;
      currency: string;
      status: string;
      checkout_session_id?: string;
      payment_intent_id?: string;
      payment_method?: string;
      reference_number?: string;
    };
  };
}

// Conference query parameters for GET requests
export interface ConferenceQueryParams {
  userId?: string;
  email?: string;
  conferenceId?: string;
}

// Conference update parameters for PUT requests
export interface ConferenceUpdateParams {
  conferenceId: string;
  [key: string]: any;
}