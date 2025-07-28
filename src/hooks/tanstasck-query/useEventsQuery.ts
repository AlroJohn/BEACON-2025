import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Event, EventStatusEnum } from "@/types/conference";

// Fetch all events
const getEvents = async (): Promise<Event[]> => {
  const response = await fetch("/api/events");

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching all events
export const useEventsQuery = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch active events only
const getActiveEvents = async (): Promise<Event[]> => {
  const response = await fetch("/api/events?active=true");

  if (!response.ok) {
    throw new Error(`Failed to fetch active events: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching active events only
export const useActiveEventsQuery = () => {
  return useQuery({
    queryKey: ['events', 'active'],
    queryFn: getActiveEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch events by status
const getEventsByStatus = async (status: EventStatusEnum): Promise<Event[]> => {
  const response = await fetch(`/api/events?status=${status}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch events by status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching events by status
export const useEventsByStatusQuery = (status: EventStatusEnum) => {
  return useQuery({
    queryKey: ['events', 'status', status],
    queryFn: () => getEventsByStatus(status),
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch single event by ID
const getEventById = async (eventId: string): Promise<Event> => {
  const response = await fetch(`/api/events/${eventId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching single event
export const useEventQuery = (eventId: string) => {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEventById(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,

  });
};

// Create new event
interface CreateEventData {
  eventName: string;
  eventDate: Date;
  eventPrice: number;
  eventStatus: EventStatusEnum;
  isActive?: boolean;
  description?: string;
}

const createEvent = async (data: CreateEventData): Promise<Event> => {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create event: ${errorData.error}`);
  }

  const responseData = await response.json();
  return responseData.data;
};

// Hook for creating events
export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      toast.success("Event created successfully!");

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      console.error("Create event error:", error);
      toast.error("Failed to create event", {
        description: error.message,
      });
    },
  });
};

// Update event
interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

const updateEvent = async (data: UpdateEventData): Promise<Event> => {
  const { id, ...updateData } = data;
  const response = await fetch(`/api/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update event: ${errorData.error}`);
  }

  const responseData = await response.json();
  return responseData.data;
};

// Hook for updating events
export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (data) => {
      toast.success("Event updated successfully!");

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', data.id] });
    },
    onError: (error) => {
      console.error("Update event error:", error);
      toast.error("Failed to update event", {
        description: error.message,
      });
    },
  });
};

// Delete event
const deleteEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/events/${eventId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to delete event: ${errorData.error}`);
  }

  return response.json();
};

// Hook for deleting events
export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success("Event deleted successfully!");

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      console.error("Delete event error:", error);
      toast.error("Failed to delete event", {
        description: error.message,
      });
    },
  });
};

// Helper hook for event selection in forms
export const useEventSelection = () => {
  const { data: events = [], isLoading, error } = useActiveEventsQuery() as {
    data: Event[],
    isLoading: boolean,
    error: any
  };

  const getEventsByIds = (eventIds: string[]) => {
    return events.filter(event => eventIds.includes(event.id));
  };

  const calculateTotalPrice = (eventIds: string[]) => {
    const selectedEvents = getEventsByIds(eventIds);
    return selectedEvents.reduce((total, event) => total + Number(event.eventPrice), 0);
  };

  const getEventOptions = () => {
    return events.map(event => ({
      value: event.id,
      label: event.eventName,
      price: Number(event.eventPrice),
      date: event.eventDate,
      status: event.eventStatus,
      description: event.description,
    }));
  };

  return {
    events,
    isLoading,
    error,
    getEventsByIds,
    calculateTotalPrice,
    getEventOptions,
  };
};

// Export query keys
export const EVENTS_QUERY_KEY = ['events'] as const;
export const ACTIVE_EVENTS_QUERY_KEY = ['events', 'active'] as const;