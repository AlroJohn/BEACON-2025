"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { 
  visitorEventSchema, 
  VisitorEventFormData, 
  VisitorEvent,
  EVENT_STATUS_OPTIONS 
} from "@/types/visitor-events";
import { 
  useCreateVisitorEventMutation, 
  useUpdateVisitorEventMutation 
} from "@/hooks/tanstasck-query/useVisitorEventsQuery";
import { useVisitorEventsStore } from "@/stores/visitorEventsStore";

interface CreateVisitorEventDialogProps {
  trigger: React.ReactNode;
  onEventCreated: () => void;
  editingEvent?: VisitorEvent;
  mode?: "create" | "edit";
}

export function CreateVisitorEventDialog({
  trigger,
  onEventCreated,
  editingEvent,
  mode = "create",
}: CreateVisitorEventDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateVisitorEventMutation();
  const updateMutation = useUpdateVisitorEventMutation();
  const { addVisitorEvent, updateVisitorEvent } = useVisitorEventsStore();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Helper function to format time for input field
  const formatTimeForInput = (date: Date | undefined | null): string => {
    if (!date) return "";
    return new Date(date).toTimeString().slice(0, 5); // HH:MM format
  };

  // Get initial values based on mode
  const getInitialValues = (): VisitorEventFormData => {
    if (mode === "edit" && editingEvent) {
      return {
        eventName: editingEvent.eventName,
        eventDates: editingEvent.eventDates.map(date => new Date(date)),
        eventStartTime: editingEvent.eventStartTime ? new Date(editingEvent.eventStartTime) : null,
        eventEndTime: editingEvent.eventEndTime ? new Date(editingEvent.eventEndTime) : null,
        eventStatus: editingEvent.eventStatus,
        isActive: editingEvent.isActive,
        description: editingEvent.description,
      };
    }
    return {
      eventName: "",
      eventDates: [new Date()],
      eventStartTime: null,
      eventEndTime: null,
      eventStatus: "CONFERENCE" as const,
      isActive: true,
      description: null,
    };
  };

  const form = useForm<VisitorEventFormData>({
    resolver: zodResolver(visitorEventSchema),
    defaultValues: getInitialValues(),
  });

  // Watch for date changes to update times accordingly
  const watchedDates = form.watch("eventDates");

  React.useEffect(() => {
    const startTime = form.getValues("eventStartTime");
    if (startTime && watchedDates && watchedDates[0]) {
      const timeString = formatTimeForInput(startTime);
      if (timeString) {
        const [hours, minutes] = timeString.split(":");
        const newDateTime = new Date(watchedDates[0]);
        newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        form.setValue("eventStartTime", newDateTime);
      }
    }
  }, [watchedDates, form]);

  React.useEffect(() => {
    const endTime = form.getValues("eventEndTime");
    if (endTime && watchedDates && watchedDates[0]) {
      const timeString = formatTimeForInput(endTime);
      if (timeString) {
        const [hours, minutes] = timeString.split(":");
        const newDateTime = new Date(watchedDates[0]);
        newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        form.setValue("eventEndTime", newDateTime);
      }
    }
  }, [watchedDates, form]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && mode === "edit" && editingEvent) {
      // Load editing data when opening in edit mode
      form.reset(getInitialValues());
    } else if (!newOpen && !isLoading) {
      // Reset form when closing dialog
      form.reset(getInitialValues());
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: VisitorEventFormData) => {
    try {
      if (mode === "edit" && editingEvent) {
        const updatedEvent = await updateMutation.mutateAsync({
          id: editingEvent.id,
          ...data,
        });
        updateVisitorEvent(updatedEvent);
      } else {
        const newEvent = await createMutation.mutateAsync(data);
        addVisitorEvent(newEvent);
      }

      form.reset(getInitialValues());
      handleOpenChange(false);
      onEventCreated();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error("Error saving visitor event:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Visitor Event" : "Create New Visitor Event"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the visitor event details for the BEACON 2025 system."
              : "Add a new visitor event to the BEACON 2025 system."}
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
                        {EVENT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        Active events are visible to visitors
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
                          value={field.value ? formatTimeForInput(field.value) : ""}
                          onChange={(e) => {
                            const timeValue = e.target.value;
                            if (!timeValue) {
                              field.onChange(null);
                              return;
                            }
                            
                            const dates = form.getValues("eventDates");
                            const startDate = dates && dates[0];
                            if (startDate) {
                              const [hours, minutes] = timeValue.split(":");
                              const dateTime = new Date(startDate);
                              dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              field.onChange(dateTime);
                            }
                          }}
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
                          value={field.value ? formatTimeForInput(field.value) : ""}
                          onChange={(e) => {
                            const timeValue = e.target.value;
                            if (!timeValue) {
                              field.onChange(null);
                              return;
                            }
                            
                            const dates = form.getValues("eventDates");
                            const endDate = dates && dates[0];
                            if (endDate) {
                              const [hours, minutes] = timeValue.split(":");
                              const dateTime = new Date(endDate);
                              dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              field.onChange(dateTime);
                            }
                          }}
                        />
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>Optional - 24-hour format</FormDescription>
                    <FormMessage />
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
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description about the visitor event
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
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
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