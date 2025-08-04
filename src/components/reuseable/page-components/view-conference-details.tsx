import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  User,
  Phone,
  Building,
  Heart,
  Calendar,
  CreditCard,
  MapPin,
  Globe,
  UserCheck,
  Shield,
} from "lucide-react";
import { ConferenceData } from "@/components/admin/conference-data-table";
import { useUpdatePaymentStatus } from "@/hooks/tanstasck-query/useAdminConference";
import { toast } from "sonner";
import ImageModal from "@/components/reuseable/ImageModal";
import PaymentStatusEditModal from "@/components/reuseable/PaymentStatusEditModal";
import { Button } from "@/components/ui/button";

interface ConferenceRegistrationDialogProps {
  conference: ConferenceData;
  getStatusBadge: (status: string) => React.ReactNode;
  getMembershipBadge: (isMember: boolean) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ConferenceRegistrationDialog: React.FC<
  ConferenceRegistrationDialogProps
> = ({
  conference,
  getStatusBadge,
  getMembershipBadge,
  getPaymentStatusBadge,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
}) => {
  if (!conference) return null;

  const fullName = `${conference.personalInfo.firstName} ${conference.personalInfo.lastName}`;

  // Use external state if provided, otherwise internal state
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onOpenChange = externalOnOpenChange || setInternalIsOpen;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const genderDisplay = conference.personalInfo.genderOthers
    ? `${conference.personalInfo.gender} (${conference.personalInfo.genderOthers})`
    : conference.personalInfo.gender;

  // Convert enum values to human-readable text
  const formatAgeBracket = (ageBracket: string) => {
    const ageBracketMap: Record<string, string> = {
      UNDER_18: "Under 18",
      AGE_18_24: "18-24",
      AGE_25_34: "25-34",
      AGE_35_44: "35-44",
      AGE_45_54: "45-54",
      AGE_55_ABOVE: "55 and above",
    };
    return ageBracketMap[ageBracket] || ageBracket;
  };

  const formatMaritimeLeagueMember = (member: string) => {
    const memberMap: Record<string, string> = {
      YES: "Yes - TML Member",
      NO: "No - Non-Member",
      APPLY: "Apply for Membership",
    };
    return memberMap[member] || member;
  };

  const formatPaymentMode = (mode: string | null) => {
    if (!mode) return "Not specified";
    const modeMap: Record<string, string> = {
      GCASH: "GCash",
      BANK_TRANSFER: "Bank Transfer",
    };
    return modeMap[mode] || mode;
  };

  // Transform selectedEvents array to attending days JSON format (same as visitor)
  const transformSelectedEventsToAttendingDays = (selectedEvents: any[]) => {
    if (
      !selectedEvents ||
      !Array.isArray(selectedEvents) ||
      selectedEvents.length === 0
    ) {
      return {};
    }

    // Group events by name and collect their dates - same format as visitor
    const attendingDaysJson: Record<string, string[]> = {};
    selectedEvents.forEach((event) => {
      if (event.name && event.dates && Array.isArray(event.dates)) {
        if (!attendingDaysJson[event.name]) {
          attendingDaysJson[event.name] = [];
        }
        // Add all dates from the dates array
        event.dates.forEach((date: string) => {
          attendingDaysJson[event.name].push(date);
        });
      }
    });

    return attendingDaysJson;
  };

  // Use the exact same formatAttendingDays function as visitor component
  const formatAttendingDays = (attendingDays: any) => {
    if (!attendingDays || typeof attendingDays !== "object") {
      return [];
    }

    const formattedDays: string[] = [];
    Object.entries(attendingDays).forEach(([eventName, dates]) => {
      if (Array.isArray(dates) && dates.length > 0) {
        const formattedDates = dates.map((date) => {
          try {
            return new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          } catch {
            return date;
          }
        });
        formattedDays.push(`${eventName}: ${formattedDates.join(", ")}`);
      }
    });
    return formattedDays;
  };

  // New: returns a detailed breakdown instead of one number
  const calculateTotals = () => {
    return conference.selectedEvents.reduce(
      (acc, ev) => {
        const qty = ev.dates?.length || 1; // how many dates for this event
        const lineTotal = ev.price * qty; // unit × qty

        acc.subtotal += lineTotal; // running sub-total
        if (ev.status === "CONFERENCE") {
          acc.conferenceDates += qty; // only CONFERENCE dates count for the discount
        }
        return acc;
      },
      { subtotal: 0, conferenceDates: 0 } as {
        subtotal: number;
        conferenceDates: number;
      }
    );
  };

  const updatePaymentStatus = useUpdatePaymentStatus();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const handleStatusUpdate = (newStatus: string, notes?: string) => {
    updatePaymentStatus.mutate(
      {
        conferenceId: conference.id,
        paymentStatus: newStatus as
          | "PENDING"
          | "CONFIRMED"
          | "FAILED"
          | "REFUNDED",
        notes:
          notes ||
          `Status changed from ${conference.paymentInfo.paymentStatus} to ${newStatus} by admin`,
      },
      {
        onSuccess: () => {
          setIsStatusModalOpen(false);
          toast.success("Payment status updated successfully");
        },
        onError: () => {
          toast.error("Failed to update payment status");
        },
      }
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {/* Only render trigger if using internal state (for backward compatibility) */}
        {externalIsOpen === undefined && (
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onOpenChange(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
          </DialogTrigger>
        )}

        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Conference Details
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete registration information for {fullName}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-8">
              {/* Header with Profile */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {conference.personalInfo.faceScannedUrl ? (
                      <div className="relative group">
                        <img
                          src={conference.personalInfo.faceScannedUrl}
                          alt={`${fullName} profile`}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageModal
                            imageUrl={conference.personalInfo.faceScannedUrl}
                            title={`${fullName} Profile Photo`}
                            description="Face verification photo captured during registration"
                            altText={`${fullName} profile photo`}
                            triggerText="View"
                            triggerVariant="ghost"
                            showDownload={true}
                            className="text-white hover:text-white hover:bg-white/20 border-white/50"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                        <User className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {fullName}
                    </h2>
                    {conference.personalInfo.preferredName && (
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                        Preferred: {conference.personalInfo.preferredName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        Conference Attendee
                      </Badge>
                      {getStatusBadge(conference.contactInfo.status)}
                      <Badge
                        variant={
                          conference.conferenceInfo.isMaritimeLeagueMember ===
                          "YES"
                            ? "default"
                            : "outline"
                        }
                        className={
                          conference.conferenceInfo.isMaritimeLeagueMember ===
                          "YES"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : ""
                        }
                      >
                        {formatMaritimeLeagueMember(
                          conference.conferenceInfo.isMaritimeLeagueMember
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Gender
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {genderDisplay}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Age Bracket
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatAgeBracket(conference.personalInfo.ageBracket)}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nationality
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {conference.personalInfo.nationality}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 break-all">
                      {conference.contactInfo.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mobile Number
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {conference.contactInfo.mobileNumber || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Landline
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {conference.contactInfo.landline || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mailing Address
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {conference.contactInfo.mailingAddress || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Building className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  Professional Information
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Job Title
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {conference.conferenceInfo.jobTitle || "Not provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Name
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {conference.conferenceInfo.companyName ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Industry
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {conference.conferenceInfo.industry || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Company Address
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      {conference.conferenceInfo.companyAddress ||
                        "Not provided"}
                    </p>
                  </div>
                  {conference.conferenceInfo.companyWebsite && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Website
                      </span>
                      <p>
                        <a
                          href={conference.conferenceInfo.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          {conference.conferenceInfo.companyWebsite}
                        </a>
                      </p>
                    </div>
                  )}
                  {conference.conferenceInfo.tmlMemberCode && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        TML Member Code
                      </span>
                      <p className="text-gray-900 dark:text-gray-100 font-mono">
                        {conference.conferenceInfo.tmlMemberCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interest Areas */}
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  Interest Areas
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Primary Interest Categories
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {conference.conferenceInfo.interestAreas &&
                      conference.conferenceInfo.interestAreas.length > 0 ? (
                        conference.conferenceInfo.interestAreas.map(
                          (interest, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                            >
                              {interest
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          )
                        )
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          None specified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detailed Sub-Interests */}
                  {conference?.conferenceInfo?.detailedInterests &&
                    Object.keys(conference.conferenceInfo?.detailedInterests)
                      .length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Specific Areas of Interest
                        </span>
                        <div className="space-y-4">
                          {Object.entries(
                            conference.conferenceInfo.detailedInterests
                          ).map(([category, subInterests]) => (
                            <div
                              key={category}
                              className="border-l-4 border-pink-200 dark:border-pink-700 pl-4"
                            >
                              <div className="font-medium text-pink-800 dark:text-pink-300 text-sm uppercase tracking-wide mb-2">
                                {category}
                              </div>
                              <div className="space-y-1">
                                {(subInterests as string[]).map(
                                  (subInterest, index) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-2"
                                    >
                                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {subInterest}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {conference.conferenceInfo.otherInterests && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Additional Comments
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {conference.conferenceInfo.otherInterests}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Information */}
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Event Information
                </h3>
                <div className="space-y-6">
                  {/* Attending Days */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Attending Days
                    </span>

                    <div className="space-y-4">
                      {(() => {
                        /* 1️⃣ Transform selectedEvents to attending days JSON format */
                        const attendingDaysJson =
                          transformSelectedEventsToAttendingDays(
                            conference.selectedEvents
                          );

                        /* 2️⃣ Get the formatted strings from the helper (same as visitor) */
                        const formattedDays =
                          formatAttendingDays(attendingDaysJson);

                        /* 3️⃣ Early-out when nothing to show */
                        if (!formattedDays.length) {
                          return (
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              None specified
                            </span>
                          );
                        }

                        /* 4️⃣ Render "event name → bullet dates" (exact same as visitor) */
                        return formattedDays.map((item, idx) => {
                          // Expecting "Event Name: Sep 30, 2025, Sep 29, 2025"
                          const [rawEvent, rawDates = ""] = item.split(":");
                          const eventName = rawEvent.trim();

                          // Grab full "Mon DD, YYYY" pieces
                          const dates =
                            rawDates.match(/\b[A-Za-z]{3} \d{1,2}, \d{4}\b/g) ||
                            [];

                          return (
                            <div key={idx}>
                              <p className="font-semibold text-indigo-800 dark:text-indigo-300">
                                {eventName}
                              </p>

                              <ul className="list-disc pl-6 mt-1 space-y-0.5 text-sm text-gray-700 dark:text-gray-300">
                                {dates.map((d, i) => (
                                  <li key={i}>{d}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Selected Events with Pricing */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Selected Events
                    </span>
                    <div className="space-y-3">
                      {conference.selectedEvents.length > 0 ? (
                        <>
                          {conference.selectedEvents.map((event, index) => {
                            const qty = event.dates?.length || 1;
                            const lineTotal = event.price * qty;

                            return (
                              <div
                                key={event.id || index}
                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                              >
                                <div className="flex-1">
                                  {/* name + badge block unchanged */}…
                                </div>

                                {/* right-hand price, now shows the extended total */}
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                    ₱{lineTotal.toLocaleString()}
                                  </p>

                                  {/* optional small “qty × unit-price” hint */}
                                  {qty > 1 && (
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                      {qty}&nbsp;×&nbsp;₱
                                      {event.price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* ─── totals & discount ─── */}
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            {(() => {
                              const { subtotal, conferenceDates } =
                                calculateTotals();
                              const discount = conferenceDates >= 3 ? 1500 : 0;
                              const grandTotal = subtotal - discount;

                              return (
                                <div className="space-y-1">
                                  {/* row 1 – sub-total */}
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      Sub-total:
                                    </span>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      ₱{subtotal.toLocaleString()}
                                    </span>
                                  </div>

                                  {/* row 2 – discount (only when triggered) */}
                                  {discount > 0 && (
                                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                                      <span className="font-medium">
                                        Discount&nbsp;(3+&nbsp;conference&nbsp;dates):
                                      </span>
                                      <span>-₱{discount.toLocaleString()}</span>
                                    </div>
                                  )}

                                  {/* row 3 – grand total */}
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      Total Amount:
                                    </span>
                                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                      ₱{grandTotal.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          No events selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  Payment Information
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Payment Status
                      </span>
                      <div className="flex items-center gap-3">
                        {getPaymentStatusBadge(
                          conference.paymentInfo.paymentStatus
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsStatusModalOpen(true)}
                          disabled={updatePaymentStatus.isPending}
                          className="h-7 text-xs"
                        >
                          Update Status
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Amount
                      </span>
                      <p className="text-gray-900 dark:text-gray-100 font-bold text-lg">
                        ₱
                        {(
                          conference.paymentInfo.totalAmount || 0
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Payment Mode
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatPaymentMode(conference.paymentInfo.paymentMode)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Reference Number
                      </span>
                      <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                        {conference.paymentInfo.referenceNumber ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                  {conference.paymentInfo.receiptImageUrl && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Payment Receipt
                      </span>
                      <div>
                        <ImageModal
                          imageUrl={conference.paymentInfo.receiptImageUrl}
                          title={`Payment Receipt - ${fullName}`}
                          description="Payment receipt for conference registration"
                          altText={`Payment receipt for ${fullName}`}
                          triggerText="View payment receipt"
                          triggerVariant="link"
                          className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:underline"
                        />
                      </div>
                    </div>
                  )}
                  {conference.paymentInfo.notes && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Payment Notes
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {conference.paymentInfo.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Consent & Privacy Information */}
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  Consent & Privacy Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Data Usage Consent:
                    </span>
                    <Badge
                      variant={
                        conference.conferenceInfo.dataUsageConsent === "YES"
                          ? "default"
                          : "destructive"
                      }
                      className={
                        conference.conferenceInfo.dataUsageConsent === "YES"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : ""
                      }
                    >
                      {conference.conferenceInfo.dataUsageConsent === "YES"
                        ? "Given"
                        : "Not Given"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Photo/Video Consent:
                    </span>
                    <Badge
                      variant={
                        conference.conferenceInfo.photoVideoConsent === "YES"
                          ? "default"
                          : "destructive"
                      }
                      className={
                        conference.conferenceInfo.photoVideoConsent === "YES"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : ""
                      }
                    >
                      {conference.conferenceInfo.photoVideoConsent === "YES"
                        ? "Given"
                        : "Not Given"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Receive Event Invites:
                    </span>
                    <Badge
                      variant={
                        conference.conferenceInfo.receiveEventInvites === "YES"
                          ? "default"
                          : "outline"
                      }
                      className={
                        conference.conferenceInfo.receiveEventInvites === "YES"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : ""
                      }
                    >
                      {conference.conferenceInfo.receiveEventInvites === "YES"
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email Certificate:
                    </span>
                    <Badge
                      variant={
                        conference.conferenceInfo.emailCertificate === "YES"
                          ? "default"
                          : "outline"
                      }
                      className={
                        conference.conferenceInfo.emailCertificate === "YES"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : ""
                      }
                    >
                      {conference.conferenceInfo.emailCertificate === "YES"
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-950/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  Registration Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Registered
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatDate(conference.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatDate(conference.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Payment Status Update Modal */}
      <PaymentStatusEditModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusUpdate}
        currentStatus={conference.paymentInfo.paymentStatus}
        userName={fullName}
        isLoading={updatePaymentStatus.isPending}
      />
    </>
  );
};

export default ConferenceRegistrationDialog;
