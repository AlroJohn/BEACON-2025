import { EventStatusEnum } from "@prisma/client";
import { z } from "zod";

// Base VisitorEvent type (matches Prisma model exactly)
export interface VisitorEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  eventName: string;
  eventDates: Date[];
  eventStartTime: Date | null;
  eventEndTime: Date | null;
  eventStatus: EventStatusEnum;
  isActive: boolean;
  description: string | null;
}

// Zod schema for form validation
export const visitorEventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventDates: z.array(z.date()).min(1, "At least one event date is required"),
  eventStartTime: z.date().optional().nullable(),
  eventEndTime: z.date().optional().nullable(),
  eventStatus: z.nativeEnum(EventStatusEnum),
  isActive: z.boolean(),
  description: z.string().optional().nullable(),
}).refine((data) => {
  // If both start and end times are provided, ensure end time is after start time
  if (data.eventStartTime && data.eventEndTime) {
    return data.eventEndTime > data.eventStartTime;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["eventEndTime"],
});

// Form data type for create/update operations
export type VisitorEventFormData = z.infer<typeof visitorEventSchema>;

// Create request type (excludes auto-generated fields)
export interface CreateVisitorEventRequest {
  eventName: string;
  eventDates: Date[];
  eventStartTime?: Date | null;
  eventEndTime?: Date | null;
  eventStatus: EventStatusEnum;
  isActive: boolean;
  description?: string | null;
}

// Update request type (all fields optional except id)
export interface UpdateVisitorEventRequest {
  id: string;
  eventName?: string;
  eventDates?: Date[];
  eventStartTime?: Date | null;
  eventEndTime?: Date | null;
  eventStatus?: EventStatusEnum;
  isActive?: boolean;
  description?: string | null;
}

// API response types
export interface VisitorEventResponse {
  success: boolean;
  data?: VisitorEvent;
  message?: string;
  error?: string;
}

export interface VisitorEventsListResponse {
  success: boolean;
  data?: VisitorEvent[];
  message?: string;
  error?: string;
}

// EventStatus options for UI dropdowns
export const EVENT_STATUS_OPTIONS = [
  { value: EventStatusEnum.CONFERENCE, label: 'Conference' },
  { value: EventStatusEnum.SHOW, label: 'Show' },
  { value: EventStatusEnum.WORKSHOP, label: 'Workshop' },
  { value: EventStatusEnum.SEMINAR, label: 'Seminar' },
  { value: EventStatusEnum.EXHIBITION, label: 'Exhibition' },
] as const;

// Status color mapping for UI badges
export const EVENT_STATUS_COLORS = {
  [EventStatusEnum.CONFERENCE]: 'bg-blue-100 text-blue-800',
  [EventStatusEnum.SHOW]: 'bg-green-100 text-green-800',
  [EventStatusEnum.WORKSHOP]: 'bg-yellow-100 text-yellow-800',
  [EventStatusEnum.SEMINAR]: 'bg-purple-100 text-purple-800',
  [EventStatusEnum.EXHIBITION]: 'bg-pink-100 text-pink-800',
} as const;

// Helper types for table/form usage
export interface VisitorEventTableRow extends VisitorEvent {
  // Additional computed fields for table display can be added here if needed
}

// Modal state type for admin interface
export interface VisitorEventModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete' | null;
  selectedEvent: VisitorEvent | null;
}