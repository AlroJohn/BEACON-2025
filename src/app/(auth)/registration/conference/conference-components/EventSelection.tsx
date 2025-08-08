"use client";

import { useEffect, useRef, useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react";
import { EventSelectionProps } from "@/types/conference/components";
import { useEventSelection } from "@/hooks/tanstasck-query/useEventsQuery";
import { useConferenceRegistrationStore } from "@/hooks/standard-hooks/conference/useConferenceRegistrationStore";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

export default function EventSelection({ form }: EventSelectionProps) {
  const { updateSelectedEvents } = useConferenceRegistrationStore();
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const {
    events = [],
    isLoading,
    error,
    calculateTotalPrice,
    getEventsByIds,
  } = useEventSelection();

  // Watch selected event IDs and attending days
  const selectedEventIds = form.watch("selectedEventIds") || [];
  const attendingDays = form.watch("attendingDays") || {};
  const previousSelectionRef = useRef<string>("");

  // Helper functions for managing attendingDays
  const handleDateSelection = (
    eventId: string,
    eventName: string,
    dateStr: string,
    checked: boolean
  ) => {
    const currentAttendingDays = form.getValues("attendingDays") || {};
    const currentDates = currentAttendingDays[eventName] || [];

    if (checked) {
      // Add date
      const updatedDates = [...currentDates, dateStr];
      form.setValue("attendingDays", {
        ...currentAttendingDays,
        [eventName]: updatedDates,
      });
    } else {
      // Remove date
      const updatedDates = currentDates.filter((date) => date !== dateStr);
      if (updatedDates.length === 0) {
        // Remove the event entirely if no dates selected
        const { [eventName]: _, ...remainingDays } = currentAttendingDays;
        form.setValue("attendingDays", remainingDays);
      } else {
        form.setValue("attendingDays", {
          ...currentAttendingDays,
          [eventName]: updatedDates,
        });
      }
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Update store when form selection changes
  useEffect(() => {
    // Create a string representation to compare
    const currentSelection = selectedEventIds.sort().join(",");

    // Only update if the selection actually changed
    if (currentSelection !== previousSelectionRef.current) {
      previousSelectionRef.current = currentSelection;

      if (selectedEventIds.length > 0 && events.length > 0) {
        const selected = getEventsByIds(selectedEventIds);
        const eventsWithDetails = selected.map((event) => ({
          id: event.id,
          name: event.eventName,
          price: Number(event.eventPrice),
        }));

        updateSelectedEvents(eventsWithDetails);

        // Calculate total with conference discount logic based on selected dates
        const total = calculateTotalWithDateBasedDiscount(
          selectedEventIds,
          events,
          attendingDays
        );
        form.setValue("totalPaymentAmount", total);

        // Check if conference discount is applied (3+ CONFERENCE days)
        const conferenceDaysCount = selected
          .filter(
            (event) =>
              events.find((e) => e.id === event.id)?.eventStatus ===
              "CONFERENCE"
          )
          .reduce((sum, event) => {
            const eventName =
              events.find((e) => e.id === event.id)?.eventName || "";
            const selectedDates = attendingDays[eventName] || [];
            return sum + selectedDates.length;
          }, 0);
        const hasDiscount = conferenceDaysCount >= 3;

        // Set hasConferenceDiscount field for backend
        form.setValue("hasConferenceDiscount", hasDiscount);

        // Update the store's totalAmount directly with the discounted amount
        useConferenceRegistrationStore.setState({ totalAmount: total });

        // Validate that each selected event has at least one date selected
        const eventsMissingDates = selected.filter((event) => {
          const selectedDates = attendingDays[event.eventName] || [];
          return selectedDates.length === 0;
        });

        if (eventsMissingDates.length > 0) {
          const missingEventNames = eventsMissingDates
            .map((e) => e.eventName)
            .join(", ");
          form.setError("attendingDays", {
            type: "manual",
            message: `Please select at least one date for: ${missingEventNames}`,
          });
        } else {
          form.clearErrors("attendingDays");
        }
      } else {
        updateSelectedEvents([]);
        form.setValue("totalPaymentAmount", 0);
        useConferenceRegistrationStore.setState({ totalAmount: 0 });
        form.clearErrors("attendingDays");
      }
    }
  }, [selectedEventIds, events, attendingDays]); // Add attendingDays to dependencies

  // Calculate total with conference discount logic
  const calculateTotalWithConferenceDiscount = (
    selectedIds: string[],
    allEvents: any[]
  ) => {
    if (!selectedIds.length || !allEvents.length) return 0;

    const selectedEvents = getEventsByIds(selectedIds);

    // Get all CONFERENCE events
    const conferenceEvents = allEvents.filter(
      (event) => event.eventStatus === "CONFERENCE"
    );
    const selectedConferenceEvents = selectedEvents.filter(
      (event) => event.eventStatus === "CONFERENCE"
    );

    // Calculate base total
    let total = selectedEvents.reduce(
      (sum, event) => sum + Number(event.eventPrice),
      0
    );

    // Apply discount if ALL conference events are selected
    if (
      conferenceEvents.length === 3 &&
      selectedConferenceEvents.length === 3
    ) {
      total -= 1500; // Apply 1500 discount for selecting all 3 conference events
    }

    return total;
  };

  // Calculate total with date-based conference discount logic
  const calculateTotalWithDateBasedDiscount = (
    selectedIds: string[],
    allEvents: any[],
    attendingDays: Record<string, string[]>
  ) => {
    if (!selectedIds.length || !allEvents.length) return 0;

    const selectedEvents = getEventsByIds(selectedIds);

    // Separate conference events from other events
    let conferenceTotal = 0;
    let otherEventsTotal = 0;
    let conferenceDaysCount = 0;

    selectedEvents.forEach((event) => {
      const eventName = event.eventName;
      const selectedDates = attendingDays[eventName] || [];
      const pricePerDay = Number(event.eventPrice);
      const daysSelected = selectedDates.length;

      if (event.eventStatus === "CONFERENCE") {
        // Conference events - eligible for discount
        conferenceTotal += daysSelected * pricePerDay;
        conferenceDaysCount += daysSelected;
      } else {
        // Other events (SHOW, WORKSHOP, etc.) - no discount
        otherEventsTotal += daysSelected * pricePerDay;
      }
    });

    // Apply conference discount if 3 or more CONFERENCE days are selected
    if (conferenceDaysCount >= 3) {
      conferenceTotal -= 1500; // ₱1,500 discount for 3+ conference days
    }

    const total = conferenceTotal + otherEventsTotal;
    return Math.max(0, total); // Ensure never negative
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "FREE" : `₱${price.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case "CONFERENCE":
        return "bg-blue-100 text-blue-800";
      case "SHOW":
        return "bg-purple-100 text-purple-800";
      case "WORKSHOP":
        return "bg-green-100 text-green-800";
      case "SEMINAR":
        return "bg-yellow-100 text-yellow-800";
      case "EXHIBITION":
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
        name="selectedEventIds"
        render={() => (
          <FormItem>
            <div className="flex items-center justify-between py-4">
              <FormLabel className="text-base font-medium">
                1. Select Events to Attend *
              </FormLabel>
              <FormMessage />
            </div>
            <FormDescription className="font-normal text-accent-foreground pb-4">
              Select events and specific dates you'd like to attend. Pricing is
              per day. Get a discount of ₱1,500 if you select 3 or more
              CONFERENCE days.
            </FormDescription>
            <FormControl>
              <div className="grid grid-cols-1 gap-6 overflow-hidden">
                {events
                  .sort((a, b) => a.eventName.localeCompare(b.eventName))
                  .map((event) => (
                    <FormField
                      key={`event-${event.id}`}
                      control={form.control}
                      name="selectedEventIds"
                      render={({ field }) => {
                        const isEventSelected = field.value?.includes(event.id);
                        const isExpanded = expandedEvents.has(event.id);
                        const eventDates = attendingDays[event.eventName] || [];

                        const needsDates =
                          isEventSelected && eventDates.length === 0;

                        return (
                          <div
                            key={`item-${event.id}`}
                            className={`border rounded-lg p-4 ${
                              needsDates
                                ? "border-red-300 bg-red-50 dark:bg-transparent "
                                : ""
                            }`}
                          >
                            <FormItem className="flex flex-row items-start lg:items-center lg:space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={isEventSelected}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    if (checked) {
                                      field.onChange([
                                        ...currentValues,
                                        event.id,
                                      ]);
                                      // Automatically expand date selection when event is selected
                                      const newExpanded = new Set(
                                        expandedEvents
                                      );
                                      newExpanded.add(event.id);
                                      setExpandedEvents(newExpanded);
                                    } else {
                                      field.onChange(
                                        currentValues.filter(
                                          (value) => value !== event.id
                                        )
                                      );
                                      // Clear attending days for this event when unchecked
                                      const currentAttendingDays =
                                        form.getValues("attendingDays") || {};
                                      const {
                                        [event.eventName]: _,
                                        ...remainingDays
                                      } = currentAttendingDays;
                                      form.setValue(
                                        "attendingDays",
                                        remainingDays
                                      );
                                      // Remove from expanded events
                                      const newExpanded = new Set(
                                        expandedEvents
                                      );
                                      newExpanded.delete(event.id);
                                      setExpandedEvents(newExpanded);
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="flex-1">
                                <FormLabel className="text-accent-foreground flex flex-col lg:flex-row items-start lg:items-center gap-2">
                                  <span className="font-medium">
                                    {event.eventName}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={getEventStatusColor(
                                        event.eventStatus
                                      )}
                                      variant="secondary"
                                    >
                                      {event.eventStatus}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="font-semibold"
                                    >
                                      {formatPrice(Number(event.eventPrice))}
                                    </Badge>
                                  </div>
                                </FormLabel>
                                <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {event.eventDates &&
                                    event.eventDates.length > 0
                                      ? `${event.eventDates.length} date${
                                          event.eventDates.length > 1 ? "s" : ""
                                        } available`
                                      : "No dates scheduled"}
                                  </div>
                                  {isEventSelected &&
                                    event.eventDates &&
                                    event.eventDates.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleEventExpansion(event.id)
                                        }
                                        className="flex items-center text-blue-600 hover:text-blue-800"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="h-4 w-4 mr-1" />
                                            Hide dates
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-4 w-4 mr-1" />
                                            Select dates
                                          </>
                                        )}
                                      </button>
                                    )}
                                </div>
                              </div>
                            </FormItem>

                            {/* Warning when event is selected but no dates chosen */}
                            {needsDates && (
                              <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                                ⚠️ Please select at least one date for this
                                event
                              </div>
                            )}

                            {/* Date Selection */}
                            {isEventSelected &&
                              isExpanded &&
                              event.eventDates &&
                              event.eventDates.length > 0 && (
                                <Collapsible open={isExpanded}>
                                  <CollapsibleContent className="mt-4 pt-4 border-t">
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">
                                        Select which dates you'll attend:
                                      </p>
                                      <div className="grid gap-2">
                                        {event.eventDates.map(
                                          (dateString, index) => {
                                            const date = new Date(dateString);
                                            const dateStr = date
                                              .toISOString()
                                              .split("T")[0];
                                            const isDateSelected =
                                              eventDates.includes(dateStr);

                                            return (
                                              <label
                                                key={index}
                                                className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/10"
                                              >
                                                <Checkbox
                                                  checked={isDateSelected}
                                                  onCheckedChange={(checked) =>
                                                    handleDateSelection(
                                                      event.id,
                                                      event.eventName,
                                                      dateStr,
                                                      checked as boolean
                                                    )
                                                  }
                                                />
                                                <span className="text-sm">
                                                  {formatDate(date)}
                                                </span>
                                              </label>
                                            );
                                          }
                                        )}
                                      </div>
                                      {eventDates.length > 0 && (
                                        <p className="text-xs text-green-600 mt-2">
                                          ✓ {eventDates.length} date
                                          {eventDates.length > 1
                                            ? "s"
                                            : ""}{" "}
                                          selected
                                        </p>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                          </div>
                        );
                      }}
                    />
                  ))}
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Date Selection Validation Error */}
      <FormField
        control={form.control}
        name="attendingDays"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pricing Summary */}
      {selectedEventIds.length > 0 && (
        <div className="mt-6 p-4 bg-muted dark:bg-c1/30 rounded-lg border">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pricing Summary
          </h3>

          <div className="space-y-2 text-sm">
            {(() => {
              const selectedEvents = getEventsByIds(selectedEventIds);
              let conferenceTotal = 0;
              let otherEventsTotal = 0;
              let conferenceDaysCount = 0;
              const breakdown: Array<{
                name: string;
                days: number;
                pricePerDay: number;
                total: number;
                isConference: boolean;
              }> = [];

              selectedEvents.forEach((event) => {
                const eventName = event.eventName;
                const selectedDates = attendingDays[eventName] || [];
                const pricePerDay = Number(event.eventPrice);
                const daysSelected = selectedDates.length;

                if (daysSelected > 0) {
                  const eventTotal = daysSelected * pricePerDay;
                  const isConference = event.eventStatus === "CONFERENCE";

                  breakdown.push({
                    name: eventName,
                    days: daysSelected,
                    pricePerDay,
                    total: eventTotal,
                    isConference,
                  });

                  if (isConference) {
                    conferenceTotal += eventTotal;
                    conferenceDaysCount += daysSelected;
                  } else {
                    otherEventsTotal += eventTotal;
                  }
                }
              });

              const hasDiscount = conferenceDaysCount >= 3;
              const discount = hasDiscount ? 1500 : 0;
              const finalTotal = conferenceTotal + otherEventsTotal - discount;

              return (
                <>
                  {breakdown.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-1"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.isConference && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            CONFERENCE
                          </Badge>
                        )}
                        <div className=" text-xs">
                          {item.days} day{item.days > 1 ? "s" : ""} ×{" "}
                          {formatPrice(item.pricePerDay)}
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatPrice(item.total)}
                      </div>
                    </div>
                  ))}

                  {breakdown.length > 0 && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>
                            {formatPrice(conferenceTotal + otherEventsTotal)}
                          </span>
                        </div>

                        {hasDiscount && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>
                              Conference Discount ({conferenceDaysCount} days):
                            </span>
                            <span>-{formatPrice(discount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                          <span>Total:</span>
                          <span className="text-blue-600">
                            {formatPrice(finalTotal)}
                          </span>
                        </div>
                      </div>

                      {hasDiscount && (
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          You saved ₱1,500 for selecting 3+ conference days!
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
