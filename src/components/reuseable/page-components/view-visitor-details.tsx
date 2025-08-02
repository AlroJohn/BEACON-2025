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
  ExternalLink,
  User,
  Phone,
  Building,
  Heart,
  Calendar,
  Shield,
  ZoomIn,
  UserCheck,
  MapPin,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { VisitorData } from "@/components/admin/visitors-data-table";
import ImageModal from "@/components/reuseable/ImageModal";

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

  const hearAboutDisplay = visitor.consentInfo.hearAboutOthers
    ? `${visitor.consentInfo.hearAboutEvent} (${visitor.consentInfo.hearAboutOthers})`
    : visitor.consentInfo.hearAboutEvent;

  return (
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Visitor Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {fullName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Full Name:</span>
                  <p className="mt-1">{fullName}</p>
                </div>
                <div>
                  <span className="font-medium">Preferred Name:</span>
                  <p className="mt-1">
                    {visitor.personalInfo.preferredName || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Gender:</span>
                  <p className="mt-1">{genderDisplay}</p>
                </div>
                <div>
                  <span className="font-medium">Age Bracket:</span>
                  <p className="mt-1">{visitor.personalInfo.ageBracket}</p>
                </div>
                <div>
                  <span className="font-medium">Nationality:</span>
                  <p className="mt-1">{visitor.personalInfo.nationality}</p>
                </div>
                {visitor.personalInfo.faceScannedUrl && (
                  <div className="col-span-2">
                    <span className="font-medium">Face Capture:</span>
                    <div className="mt-1">
                      <ImageModal
                        imageUrl={visitor.personalInfo.faceScannedUrl}
                        title={`Face Capture - ${fullName}`}
                        description="User face capture for identity verification"
                        altText={`Face capture for ${fullName}`}
                        triggerText="View face capture"
                        triggerVariant="link"
                        className="p-0 h-auto dark:text-blue-300 text-blue-600 hover:underline"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="mt-1">{visitor.contactInfo.email}</p>
                </div>
                <div>
                  <span className="font-medium">Mobile Number:</span>
                  <p className="mt-1">
                    {visitor.contactInfo.mobileNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Landline:</span>
                  <p className="mt-1">
                    {visitor.contactInfo.landline || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline" className="mt-1">
                    {visitor.contactInfo.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Mailing Address:</span>
                  <p className="mt-1">
                    {visitor.contactInfo.mailingAddress || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Job Title:</span>
                    <p className="mt-1">{visitor.professionalInfo.jobTitle}</p>
                  </div>
                  <div>
                    <span className="font-medium">Company Name:</span>
                    <p className="mt-1">
                      {visitor.professionalInfo.companyName}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Industry:</span>
                  <p className="mt-1">{industryDisplay}</p>
                </div>
                <div>
                  <span className="font-medium">Business Email:</span>
                  <p className="mt-1">
                    {visitor.professionalInfo.businessEmail || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Company Address:</span>
                  <p className="mt-1 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                    {visitor.professionalInfo.companyAddress || "Not provided"}
                  </p>
                </div>
                {visitor.professionalInfo.companyWebsite && (
                  <div>
                    <span className="font-medium">Company Website:</span>
                    <p className="mt-1">
                      <a
                        href={visitor.professionalInfo.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dark:text-blue-300 text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {visitor.professionalInfo.companyWebsite}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Event Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Information
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Attending Days:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {visitor.eventInfo.attendingDays.length > 0 ? (
                      visitor.eventInfo.attendingDays.map((day, index) => (
                        <Badge key={index} variant="secondary">
                          {day}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        None specified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Event Parts:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {visitor.eventInfo.eventParts.length > 0 ? (
                      visitor.eventInfo.eventParts.map((part, index) => (
                        <Badge key={index} variant="outline">
                          {part}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        None specified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Attendee Type:</span>
                  <p className="mt-1">{visitor.eventInfo.attendeeType}</p>
                </div>
                <div>
                  <span className="font-medium">Interest Areas:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {visitor.eventInfo.interestAreas.length > 0 ? (
                      visitor.eventInfo.interestAreas.map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        None specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Emergency & Safety Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Emergency & Safety Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Emergency Contact Person:</span>
                  <p className="mt-1">
                    {visitor.emergencyInfo.emergencyContactPerson ||
                      "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Emergency Contact Number:</span>
                  <p className="mt-1">
                    {visitor.emergencyInfo.emergencyContactNumber ||
                      "Not provided"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Special Assistance:</span>
                  <p className="mt-1">
                    {visitor.emergencyInfo.specialAssistance || "None required"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Consent & Privacy Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Consent & Privacy Information
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Data Privacy Consent:</span>
                  <Badge
                    variant={
                      visitor.consentInfo.dataPrivacyConsent
                        ? "default"
                        : "destructive"
                    }
                    className="mt-1 ml-2"
                  >
                    {visitor.consentInfo.dataPrivacyConsent
                      ? "Given"
                      : "Not Given"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">
                    How did you hear about this event?
                  </span>
                  <p className="mt-1 text-muted-foreground">
                    {hearAboutDisplay}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Registration Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Registered:</span>
                  <p className="mt-1">{formatDate(visitor.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="mt-1">{formatDate(visitor.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default VisitorRegistrationDialog;
