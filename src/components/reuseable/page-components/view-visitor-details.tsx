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
  Calendar,
  Shield,
  UserCheck,
  MapPin,
  Globe,
  ZoomIn,
  X,
} from "lucide-react";
import { VisitorData } from "@/components/admin/visitors-data-table";
import ImageModal from "@/components/reuseable/ImageModal";
import { Button } from "@/components/ui/button";

interface VisitorRegistrationDialogProps {
  visitor: VisitorData;
  getStatusBadge: (status: string) => React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const VisitorRegistrationDialog: React.FC<VisitorRegistrationDialogProps> = ({
  visitor,
  getStatusBadge,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
}) => {
  if (!visitor) return null;

  const fullName = `${visitor.personalInfo.firstName} ${visitor.personalInfo.lastName}`;

  // No need for manual zoom state - ImageModal handles this internally

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

  const genderDisplay = visitor.personalInfo.genderOthers
    ? `${visitor.personalInfo.gender} (${visitor.personalInfo.genderOthers})`
    : visitor.personalInfo.gender;

  const industryDisplay = visitor.professionalInfo.industryOthers
    ? `${visitor.professionalInfo.industry} (${visitor.professionalInfo.industryOthers})`
    : visitor.professionalInfo.industry;

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

  const formatHearAboutEvent = (hearAbout: string) => {
    const hearAboutMap: Record<string, string> = {
      FACEBOOK_SOCIAL_MEDIA: "Facebook/Social Media",
      WEBSITE: "Website",
      EMAIL_INVITATION: "Email Invitation",
      REFERRED_BY_FRIEND: "Referred by Friend",
      PARTICIPATED_LAST_YEAR: "Participated Last Year",
      OTHER: "Other",
    };
    return hearAboutMap[hearAbout] || hearAbout;
  };

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

  const hearAboutDisplay = visitor.consentInfo.hearAboutOthers
    ? `${formatHearAboutEvent(visitor.consentInfo.hearAboutEvent)} (${
        visitor.consentInfo.hearAboutOthers
      })`
    : formatHearAboutEvent(visitor.consentInfo.hearAboutEvent);

  // Profile Image Zoom Modal using the advanced ImageModal component

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

        <DialogContent className="max-w-4xl max-h-[90vh] bg-muted">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2  rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Visitor Details
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete registration information for {fullName}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-8 pb-4">
              {/* Header with Profile */}
              <div className="bg-gradient-to-r from-background to-muted rounded-xl p-6">
                <div className="flex items-start gap-6">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {visitor.personalInfo.faceScannedUrl ? (
                      <div className="relative group">
                        <img
                          src={visitor.personalInfo.faceScannedUrl}
                          alt={`${fullName} profile`}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageModal
                            imageUrl={visitor.personalInfo.faceScannedUrl}
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
                    <h2 className="text-2xl font-bold  mb-2">{fullName}</h2>
                    {visitor.personalInfo.preferredName && (
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                        Preferred: {visitor.personalInfo.preferredName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {visitor.eventInfo.attendeeType}
                      </Badge>
                      {getStatusBadge(visitor.contactInfo.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className=" rounded-xl p-6 border ">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 ">
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
                    <p className="">{genderDisplay}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Age Bracket
                    </span>
                    <p className="">
                      {formatAgeBracket(visitor.personalInfo.ageBracket)}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nationality
                    </span>
                    <p className="">{visitor.personalInfo.nationality}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className=" rounded-xl p-6 border ">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 ">
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
                    <p className=" break-all">{visitor.contactInfo.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mobile Number
                    </span>
                    <p className="">
                      {visitor.contactInfo.mobileNumber || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Landline
                    </span>
                    <p className="">
                      {visitor.contactInfo.landline || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mailing Address
                    </span>
                    <p className="">
                      {visitor.contactInfo.mailingAddress || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className=" rounded-xl p-6 border ">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 ">
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
                      <p className="">{visitor.professionalInfo.jobTitle}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Name
                      </span>
                      <p className="">{visitor.professionalInfo.companyName}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Industry
                    </span>
                    <p className="">{industryDisplay}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Business Email
                    </span>
                    <p className=" break-all">
                      {visitor.professionalInfo.businessEmail || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Company Address
                    </span>
                    <p className=" flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      {visitor.professionalInfo.companyAddress ||
                        "Not provided"}
                    </p>
                  </div>
                  {visitor.professionalInfo.companyWebsite && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Website
                      </span>
                      <p>
                        <a
                          href={visitor.professionalInfo.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          {visitor.professionalInfo.companyWebsite}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Information */}
              <div className=" rounded-xl p-6 border ">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 ">
                  <div className="p-1.5  rounded-lg">
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Event Information
                </h3>
                <div className="space-y-6">
                  {/* ─── Attending Days ─── */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Attending Days
                    </span>

                    <div className="space-y-4">
                      {(() => {
                        /* 1️⃣ get the raw strings from your helper */
                        const formattedDays = formatAttendingDays(
                          visitor.eventInfo.attendingDays
                        );

                        /* 2️⃣ early-out when nothing to show */
                        if (!formattedDays.length) {
                          return (
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              None specified
                            </span>
                          );
                        }

                        /* 3️⃣ render “event name → bullet dates” */
                        return formattedDays.map((item, idx) => {
                          // Expecting "Event Name: Sep 30, 2025, Sep 29, 2025"
                          const [rawEvent, rawDates = ""] = item.split(":");
                          const eventName = rawEvent.trim();

                          // Grab full “Mon DD, YYYY” pieces
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

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Event Parts
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {visitor.eventInfo.eventParts.length > 0 ? (
                        visitor.eventInfo.eventParts.map((part, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
                          >
                            {part}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          None specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Interest Areas
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {visitor.eventInfo.interestAreas.length > 0 ? (
                        visitor.eventInfo.interestAreas.map(
                          (interest, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
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
                </div>
              </div>

              {/* Emergency & Safety Information */}
              <div className=" rounded-xl p-6 border ">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 ">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  Emergency & Safety Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Emergency Contact Person
                    </span>
                    <p className="">
                      {visitor.emergencyInfo.emergencyContactPerson ||
                        "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Emergency Contact Number
                    </span>
                    <p className="">
                      {visitor.emergencyInfo.emergencyContactNumber ||
                        "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Special Assistance
                    </span>
                    <p className="">
                      {visitor.emergencyInfo.specialAssistance ||
                        "None required"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consent & Privacy Information */}
              <div className=" rounded-xl p-6 border ">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 ">
                  <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  Consent & Privacy Information
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Data Privacy Consent:
                    </span>
                    <Badge
                      variant={
                        visitor.consentInfo.dataPrivacyConsent
                          ? "default"
                          : "destructive"
                      }
                      className={
                        visitor.consentInfo.dataPrivacyConsent
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : ""
                      }
                    >
                      {visitor.consentInfo.dataPrivacyConsent
                        ? "Given"
                        : "Not Given"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      How did you hear about this event?
                    </span>
                    <p className="">{hearAboutDisplay}</p>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="bg-gradient-to-r from-background to-muted rounded-xl p-6 ">
                <h3 className="text-lg font-semibold flex items-center gap-3 mb-4 ">
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
                    <p className="">{formatDate(visitor.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </span>
                    <p className="">{formatDate(visitor.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisitorRegistrationDialog;
