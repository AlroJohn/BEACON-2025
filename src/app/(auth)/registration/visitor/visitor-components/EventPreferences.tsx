"use client";

import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Info, ChevronDown, ChevronUp } from "lucide-react";
import { InterestArea, EventStatusEnum } from "@prisma/client";
import { useRegistrationStore } from "@/hooks/standard-hooks/visitor/useRegistrationStore";
import { format, parseISO } from "date-fns";
import { RegistrationFormData } from "@/types/visitor/registration";
import { useActiveVisitorEventsQuery } from "@/hooks/tanstasck-query/useVisitorEventsQuery";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventPreferencesProps {
  form: UseFormReturn<RegistrationFormData>;
}

const toIsoDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toISOString().slice(0, 10);
};

const formatDate = (d: string | Date) => {
  const date =
    typeof d === "string" ? parseISO(d.length > 10 ? toIsoDate(d) : d) : d;
  return format(date, "MMM dd, yyyy");
};

export function EventPreferences({ form }: EventPreferencesProps) {
  const { updateSelectedEvents } = useRegistrationStore();
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(
    {}
  );

  const { data: events = [], isLoading, error } = useActiveVisitorEventsQuery();

  const selectedEventParts = form.watch("eventParts") || [];
  const attendingDaysObj = (form.watch("attendingDays") || {}) as Record<
    string,
    string[]
  >;
  const previousSelectionRef = useRef<string>("");

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const handleEventToggle = (
    eventId: string,
    eventName: string,
    isChecked: boolean
  ) => {
    const nextEventParts = [...selectedEventParts];
    const nextAttending = { ...attendingDaysObj };

    if (isChecked) {
      if (!nextEventParts.includes(eventName)) nextEventParts.push(eventName);
      if (!nextAttending[eventName]) nextAttending[eventName] = [];
    } else {
      const idx = nextEventParts.indexOf(eventName);
      if (idx > -1) nextEventParts.splice(idx, 1);
      delete nextAttending[eventName];
    }

    form.setValue("eventParts", nextEventParts, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("attendingDays", nextAttending, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleDateToggle = (
    eventName: string,
    rawDate: string | Date,
    isChecked: boolean
  ) => {
    const iso = toIsoDate(rawDate);
    const nextAttending = { ...attendingDaysObj };
    const current = nextAttending[eventName]
      ? [...nextAttending[eventName]]
      : [];

    if (isChecked) {
      if (!current.includes(iso)) current.push(iso);
    } else {
      const i = current.indexOf(iso);
      if (i > -1) current.splice(i, 1);
    }

    nextAttending[eventName] = current;
    form.setValue("attendingDays", nextAttending, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    const snapshot = JSON.stringify({
      parts: [...selectedEventParts].sort(),
      days: Object.fromEntries(
        Object.entries(attendingDaysObj).map(([k, v]) => [k, [...v].sort()])
      ),
    });
    if (snapshot !== previousSelectionRef.current) {
      previousSelectionRef.current = snapshot;

      if (selectedEventParts.length > 0 && events.length > 0) {
        const selected = events.filter((e) =>
          selectedEventParts.includes(e.eventName)
        );
        const eventsWithDetails = selected.map((e) => ({
          id: e.id,
          name: e.eventName,
          price: 0,
        }));
        updateSelectedEvents(eventsWithDetails);
      } else {
        updateSelectedEvents([]);
      }
    }
  }, [attendingDaysObj, selectedEventParts, events, updateSelectedEvents]);

  const getEventStatusColor = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.CONFERENCE:
        return "bg-blue-100 text-blue-800";
      case EventStatusEnum.SHOW:
        return "bg-purple-100 text-purple-800";
      case EventStatusEnum.WORKSHOP:
        return "bg-green-100 text-green-800";
      case EventStatusEnum.SEMINAR:
        return "bg-yellow-100 text-yellow-800";
      case EventStatusEnum.EXHIBITION:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading available events...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Info className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Unable to load events. Please refresh the page or try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selection */}
      <FormField
        control={form.control}
        name="eventParts"
        render={() => (
          <FormItem>
            <div className="flex items-center justify-between py-4">
              <FormLabel className="text-base font-medium">
                1. Select Events to Attend *
              </FormLabel>
              <FormMessage />
            </div>
            <FormDescription className="font-normal text-accent-foreground pb-4">
              Select one or more events and specific dates you&apos;d like to
              attend.
            </FormDescription>
            <FormControl>
              <div className="space-y-4">
                {events.map((event) => {
                  const isEventSelected = selectedEventParts.includes(
                    event.eventName
                  );
                  const isExpanded = expandedEvents[event.id] || false;
                  const selectedDates = attendingDaysObj[event.eventName] || [];

                  return (
                    <Collapsible key={event.id} className="space-y-2">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id={`event-${event.id}`}
                          checked={isEventSelected}
                          onCheckedChange={(checked) =>
                            handleEventToggle(
                              event.id,
                              event.eventName,
                              Boolean(checked)
                            )
                          }
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`event-${event.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            {event.eventName}
                            <Badge
                              className={getEventStatusColor(event.eventStatus)}
                            >
                              {event.eventStatus}
                            </Badge>
                          </label>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {event.eventDates.length} available date(s)
                          </div>
                          {isEventSelected && selectedDates.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Selected:{" "}
                              {selectedDates
                                .map((d) => formatDate(d))
                                .join(", ")}
                            </div>
                          )}
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-9 p-0"
                            disabled={!isEventSelected}
                            onClick={() => toggleEventExpansion(event.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle</span>
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent>
                        <div className="ml-10 space-y-2 mt-2">
                          {event.eventDates.map((dateObj) => {
                            const iso = toIsoDate(dateObj);
                            const inputId = `date-${event.id}-${iso}`;
                            const checked = selectedDates.includes(iso);
                            return (
                              <div
                                key={iso}
                                className="flex items-center space-x-3"
                              >
                                <Checkbox
                                  id={inputId}
                                  checked={checked}
                                  disabled={!isEventSelected}
                                  onCheckedChange={(checked) =>
                                    handleDateToggle(
                                      event.eventName,
                                      iso,
                                      Boolean(checked)
                                    )
                                  }
                                />
                                <label
                                  htmlFor={inputId}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {formatDate(iso)}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Rest of your form fields */}
      <div className="space-y-6">
        {/* Attendee Type */}
        <FormField
          control={form.control}
          name="attendeeType"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>2. Attendee Type *</FormLabel>
                <FormMessage />
              </div>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select attendee type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="TRADE_VISITOR">Trade Visitor</SelectItem>
                  <SelectItem value="GOVERNMENT_OFFICIAL">
                    Government Official
                  </SelectItem>
                  <SelectItem value="STUDENT_ACADEMIC">
                    Student/Academic
                  </SelectItem>
                  <SelectItem value="MEDIA_PRESS">Media/Press</SelectItem>
                  <SelectItem value="EXHIBITOR">Exhibitor</SelectItem>
                  <SelectItem value="SPEAKER_PANELIST">
                    Speaker/Panelist
                  </SelectItem>
                  <SelectItem value="VIP_GUEST">VIP Guest</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Interest Areas */}
        <FormField
          control={form.control}
          name="interestAreas"
          render={() => (
            <FormItem className="flex flex-col gap-3">
              <FormLabel>3. Interest Areas *</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(InterestArea).map((area) => (
                  <FormField
                    key={area}
                    control={form.control}
                    name="interestAreas"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={area}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(area)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...(field.value || []),
                                      area,
                                    ])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (v) => v !== area
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {area
                              .replace(/_/g, " ")
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preferences */}
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="receiveUpdates"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">
                    4. Do you want to receive event updates?
                  </FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === "true")}
                    value={field.value ? "true" : "false"}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="receiveUpdates-yes" />
                      <label
                        htmlFor="receiveUpdates-yes"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        Yes
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="receiveUpdates-no" />
                      <label
                        htmlFor="receiveUpdates-no"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        No
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="inviteToFutureEvents"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">
                    5. Do you want to be invited to future events?
                  </FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === "true")}
                    value={field.value ? "true" : "false"}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="true"
                        id="inviteToFutureEvents-yes"
                      />
                      <label
                        htmlFor="inviteToFutureEvents-yes"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        Yes
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="false"
                        id="inviteToFutureEvents-no"
                      />
                      <label
                        htmlFor="inviteToFutureEvents-no"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        No
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
