"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { EventStatusEnum } from "@prisma/client";

const createEventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventDate: z.date(),
  eventStartTime: z.string().optional(),
  eventEndTime: z.string().optional(),
  eventPrice: z.number().min(0, "Price must be 0 or positive"),
  eventStatus: z.nativeEnum(EventStatusEnum),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventDialogProps {
  trigger: React.ReactNode;
  onEventCreated: () => void;
  editingEvent?: {
    id: string;
    eventName: string;
    eventDate: Date;
    eventStartTime?: Date;
    eventEndTime?: Date;
    eventPrice: number;
    eventStatus: EventStatusEnum;
    description?: string;
    isActive: boolean;
  };
  mode?: "create" | "edit";
}

export function CreateEventDialog({
  trigger,
  onEventCreated,
  editingEvent,
  mode = "create",
}: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to format time for input field
  const formatTimeForInput = (date: Date | undefined | null): string => {
    if (!date) return "";
    return new Date(date).toTimeString().slice(0, 5); // HH:MM format
  };

  // Get initial values based on mode
  const getInitialValues = () => {
    if (mode === "edit" && editingEvent) {
      return {
        eventName: editingEvent.eventName,
        eventDate: new Date(editingEvent.eventDate),
        eventStartTime: formatTimeForInput(editingEvent.eventStartTime),
        eventEndTime: formatTimeForInput(editingEvent.eventEndTime),
        eventPrice: editingEvent.eventPrice,
        eventStatus: editingEvent.eventStatus,
        description: editingEvent.description || "",
        isActive: editingEvent.isActive,
      };
    }
    return {
      eventName: "",
      eventDate: new Date(),
      eventStartTime: "",
      eventEndTime: "",
      eventPrice: 0,
      eventStatus: EventStatusEnum.CONFERENCE,
      description: "",
      isActive: true,
    };
  };

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: getInitialValues(),
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && mode === "edit" && editingEvent) {
      // Load editing data when opening in edit mode
      form.reset(getInitialValues());
    } else if (!newOpen && !isSubmitting) {
      // Reset form when closing dialog
      form.reset(getInitialValues());
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: CreateEventFormData) => {
    setIsSubmitting(true);
    try {
      // Convert time strings to Date objects if provided
      let eventStartTime: Date | undefined;
      let eventEndTime: Date | undefined;

      if (data.eventStartTime && data.eventStartTime.trim() && data.eventDate) {
        const [hours, minutes] = data.eventStartTime.split(":");
        eventStartTime = new Date(data.eventDate);
        eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      if (data.eventEndTime && data.eventEndTime.trim() && data.eventDate) {
        const [hours, minutes] = data.eventEndTime.split(":");
        eventEndTime = new Date(data.eventDate);
        eventEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const eventData = {
        ...(mode === "edit" && editingEvent ? { id: editingEvent.id } : {}),
        eventName: data.eventName,
        eventDate: data.eventDate.toISOString(),
        eventStartTime: eventStartTime?.toISOString(),
        eventEndTime: eventEndTime?.toISOString(),
        eventPrice: data.eventPrice,
        eventStatus: data.eventStatus,
        description: data.description || null,
        isActive: data.isActive,
      };

      const response = await fetch("/api/events", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${mode} event`);
      }

      const result = await response.json();

      toast.success(
        `Event ${mode === "edit" ? "updated" : "created"} successfully!`
      );
      form.reset(getInitialValues());
      handleOpenChange(false);
      onEventCreated();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the event details for the BEACON 2025 conference system."
              : "Add a new event to the BEACON 2025 conference system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Name */}
              <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Event Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Date */}
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Event Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Status */}
              <FormField
                control={form.control}
                name="eventStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EventStatusEnum.CONFERENCE}>
                          Conference
                        </SelectItem>
                        <SelectItem value={EventStatusEnum.SHOW}>
                          Show
                        </SelectItem>
                        <SelectItem value={EventStatusEnum.WORKSHOP}>
                          Workshop
                        </SelectItem>
                        <SelectItem value={EventStatusEnum.SEMINAR}>
                          Seminar
                        </SelectItem>
                        <SelectItem value={EventStatusEnum.EXHIBITION}>
                          Exhibition
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time */}
              <FormField
                control={form.control}
                name="eventStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="time"
                          placeholder="09:00"
                          {...field}
                          value={field.value || ""}
                        />
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>Optional - 24-hour format</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="eventEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="time"
                          placeholder="17:00"
                          {...field}
                          value={field.value || ""}
                        />
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>Optional - 24-hour format</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Price */}
              <FormField
                control={form.control}
                name="eventPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Price (₱) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>Enter 0 for free events</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Event</FormLabel>
                      <FormDescription>
                        Active events are visible to users for registration
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter event description (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description about the event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit" ? "Updating..." : "Creating..."}
                  </>
                ) : mode === "edit" ? (
                  "Update Event"
                ) : (
                  "Create Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
