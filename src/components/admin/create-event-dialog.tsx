"use client";

import React, { useState } from "react";
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
  eventDates: z.array(z.date()).min(1, "At least one event date is required"),
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
    eventDates: Date[];
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
        eventDates: editingEvent.eventDates.map(date => new Date(date)),
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
      eventDates: [new Date()],
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

  // Watch for date changes to update times accordingly
  const watchedDates = form.watch("eventDates");

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

      // Use the first date for time calculations (times apply to all dates)
      const firstDate = data.eventDates[0];

      if (data.eventStartTime && data.eventStartTime.trim() && firstDate) {
        const [hours, minutes] = data.eventStartTime.split(":");
        eventStartTime = new Date(firstDate);
        eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      if (data.eventEndTime && data.eventEndTime.trim() && firstDate) {
        const [hours, minutes] = data.eventEndTime.split(":");
        eventEndTime = new Date(firstDate);
        eventEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const eventData = {
        ...(mode === "edit" && editingEvent ? { id: editingEvent.id } : {}),
        eventName: data.eventName,
        eventDates: data.eventDates.map(date => date.toISOString()),
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

              {/* Event Dates */}
              <FormField
                control={form.control}
                name="eventDates"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Event Dates *</FormLabel>
                    <div className="space-y-2">
                      {field.value?.map((date, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`flex-1 pl-3 text-left font-normal ${
                                  !date && "text-muted-foreground"
                                }`}
                              >
                                {date ? (
                                  format(date, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(selectedDate) => {
                                  if (selectedDate) {
                                    const newDates = [...field.value];
                                    newDates[index] = selectedDate;
                                    field.onChange(newDates);
                                  }
                                }}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {field.value.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newDates = field.value.filter((_, i) => i !== index);
                                field.onChange(newDates);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const newDates = [...field.value, new Date()];
                          field.onChange(newDates);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Date
                      </Button>
                    </div>
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
