import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { VisitorEvent, VisitorEventFormData, } from "@/types/visitor-events";
import { EventStatusEnum } from "@prisma/client";

// Fetch all visitor events
const getVisitorEvents = async (): Promise<VisitorEvent[]> => {
  const response = await fetch("/api/visitor-events");

  if (!response.ok) {
    throw new Error(`Failed to fetch visitor events: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching all visitor events
export const useVisitorEventsQuery = () => {
  return useQuery({
    queryKey: ['visitor-events'],
    queryFn: getVisitorEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch active visitor events only
const getActiveVisitorEvents = async (): Promise<VisitorEvent[]> => {
  const response = await fetch("/api/visitor-events?active=true");

  if (!response.ok) {
    throw new Error(`Failed to fetch active visitor events: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching active visitor events only
export const useActiveVisitorEventsQuery = () => {
  return useQuery({
    queryKey: ['visitor-events', 'active'],
    queryFn: getActiveVisitorEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch visitor events by status
const getVisitorEventsByStatus = async (status: EventStatusEnum): Promise<VisitorEvent[]> => {
  const response = await fetch(`/api/visitor-events?status=${status}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch visitor events by status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching visitor events by status
export const useVisitorEventsByStatusQuery = (status: EventStatusEnum) => {
  return useQuery({
    queryKey: ['visitor-events', 'status', status],
    queryFn: () => getVisitorEventsByStatus(status),
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch single visitor event by ID
const getVisitorEventById = async (eventId: string): Promise<VisitorEvent> => {
  const response = await fetch(`/api/visitor-events/${eventId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch visitor event: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching single visitor event
export const useVisitorEventQuery = (eventId: string) => {
  return useQuery({
    queryKey: ['visitor-events', eventId],
    queryFn: () => getVisitorEventById(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
};

// Create new visitor event
const createVisitorEvent = async (data: VisitorEventFormData): Promise<VisitorEvent> => {
  // Serialize dates properly for HTTP transport
  const serializedData = {
    ...data,
    eventDates: data.eventDates.map(date => date.toISOString()),
    eventStartTime: data.eventStartTime ? data.eventStartTime.toISOString() : null,
    eventEndTime: data.eventEndTime ? data.eventEndTime.toISOString() : null,
  };

  const response = await fetch("/api/visitor-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serializedData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create visitor event: ${errorData.error}`);
  }

  const responseData = await response.json();
  return responseData.data;
};

// Hook for creating visitor events
export const useCreateVisitorEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVisitorEvent,
    onSuccess: (data) => {
      toast.success("Visitor event created successfully!");

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['visitor-events'] });
    },
    onError: (error) => {
      console.error("Create visitor event error:", error);
      toast.error("Failed to create visitor event", {
        description: error.message,
      });
    },
  });
};

// Update visitor event
interface UpdateVisitorEventData extends Partial<VisitorEventFormData> {
  id: string;
}

const updateVisitorEvent = async (data: UpdateVisitorEventData): Promise<VisitorEvent> => {
  const { id, ...updateData } = data;
  
  // Serialize dates properly for HTTP transport
  const serializedData = {
    ...updateData,
    ...(updateData.eventDates && { eventDates: updateData.eventDates.map(date => date.toISOString()) }),
    eventStartTime: updateData.eventStartTime ? updateData.eventStartTime.toISOString() : null,
    eventEndTime: updateData.eventEndTime ? updateData.eventEndTime.toISOString() : null,
  };

  const response = await fetch(`/api/visitor-events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serializedData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update visitor event: ${errorData.error}`);
  }

  const responseData = await response.json();
  return responseData.data;
};

// Hook for updating visitor events
export const useUpdateVisitorEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVisitorEvent,
    onSuccess: (data) => {
      toast.success("Visitor event updated successfully!");

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['visitor-events'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-events', data.id] });
    },
    onError: (error) => {
      console.error("Update visitor event error:", error);
      toast.error("Failed to update visitor event", {
        description: error.message,
      });
    },
  });
};

// Delete visitor event
const deleteVisitorEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/visitor-events/${eventId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to delete visitor event: ${errorData.error}`);
  }

  return response.json();
};

// Hook for deleting visitor events
export const useDeleteVisitorEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVisitorEvent,
    onSuccess: () => {
      toast.success("Visitor event deleted successfully!");

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['visitor-events'] });
    },
    onError: (error) => {
      console.error("Delete visitor event error:", error);
      toast.error("Failed to delete visitor event", {
        description: error.message,
      });
    },
  });
};

// Export query keys
export const VISITOR_EVENTS_QUERY_KEY = ['visitor-events'] as const;
export const ACTIVE_VISITOR_EVENTS_QUERY_KEY = ['visitor-events', 'active'] as const;