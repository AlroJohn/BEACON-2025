"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Package,
  Target,
  Truck,
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { ExhibitorData } from "./exhibitors-data-table";
import ImageModal from "@/components/reuseable/ImageModal";

interface ExhibitorDetailsModalProps {
  exhibitor: ExhibitorData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExhibitorDetailsModal({
  exhibitor,
  isOpen,
  onClose,
}: ExhibitorDetailsModalProps) {
  if (!exhibitor) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatArrayField = (array: string[]) => {
    if (!array || array.length === 0) return "None specified";
    return array.join(", ");
  };

  const formatYesNoMaybe = (value: string) => {
    const labels: Record<string, string> = {
      YES: "Yes",
      NO: "No",
      MAYBE: "Maybe",
    };
    return labels[value] || value;
  };

  const formatConfirmIntent = (intent: string) => {
    const labels: Record<string, string> = {
      YES_RESERVE: "Yes, I want to reserve a booth",
      TENTATIVE: "Tentative - need more information",
      NO_EXPLORING: "No, just exploring options",
    };
    return labels[intent] || intent;
  };

  const formatMarketingCollaterals = (value: string) => {
    const labels: Record<string, string> = {
      yes_have_collaterals: "Yes, I have marketing collaterals",
      no_need_assistance: "No, I need assistance",
      working_on_it: "I'm working on it",
    };
    return labels[value] || value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Exhibitor Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {exhibitor.personalInfo.firstName}{" "}
            {exhibitor.personalInfo.lastName} from{" "}
            {exhibitor.companyInfo.companyName}
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
                  <p className="mt-1">
                    {exhibitor.personalInfo.firstName}{" "}
                    {exhibitor.personalInfo.middleName || ""}{" "}
                    {exhibitor.personalInfo.lastName}{" "}
                    {exhibitor.personalInfo.suffix || ""}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Preferred Name:</span>
                  <p className="mt-1">
                    {exhibitor.personalInfo.preferredName || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Position:</span>
                  <p className="mt-1">{exhibitor.personalInfo.position}</p>
                </div>
                <div>
                  <span className="font-medium">Gender:</span>
                  <p className="mt-1">
                    {exhibitor.personalInfo.gender === "OTHERS"
                      ? exhibitor.personalInfo.genderOthers
                      : exhibitor.personalInfo.gender}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Age Bracket:</span>
                  <p className="mt-1">{exhibitor.personalInfo.ageBracket}</p>
                </div>
                <div>
                  <span className="font-medium">Nationality:</span>
                  <p className="mt-1">{exhibitor.personalInfo.nationality}</p>
                </div>
                {exhibitor.personalInfo.faceScannedUrl && (
                  <div className="col-span-2">
                    <span className="font-medium">Face Capture:</span>
                    <div className="mt-1">
                      <ImageModal
                        imageUrl={exhibitor.personalInfo.faceScannedUrl}
                        title={`Face Capture - ${exhibitor.personalInfo.firstName} ${exhibitor.personalInfo.lastName}`}
                        description="User face capture for identity verification"
                        altText={`Face capture for ${exhibitor.personalInfo.firstName} ${exhibitor.personalInfo.lastName}`}
                        triggerText="View face capture"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-600 hover:underline"
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
                <Mail className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="mt-1">{exhibitor.contactInfo.email}</p>
                </div>
                <div>
                  <span className="font-medium">Mobile Number:</span>
                  <p className="mt-1">
                    {exhibitor.contactInfo.mobileNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Landline:</span>
                  <p className="mt-1">
                    {exhibitor.contactInfo.landline || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant="outline"
                    className="mt-1 dark:text-accent-foreground"
                  >
                    {exhibitor.contactInfo.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Mailing Address:</span>
                  <p className="mt-1">
                    {exhibitor.contactInfo.mailingAddress || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="font-medium">Company Name:</span>
                  <p className="mt-1 font-medium">
                    {exhibitor.companyInfo.companyName}
                  </p>
                </div>
                {exhibitor.companyInfo.businessRegistrationName && (
                  <div>
                    <span className="font-medium">
                      Business Registration Name:
                    </span>
                    <p className="mt-1">
                      {exhibitor.companyInfo.businessRegistrationName}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Industry Sector:</span>
                    <p className="mt-1">
                      {exhibitor.companyInfo.industrySector === "OTHERS"
                        ? exhibitor.companyInfo.industrySectorOthers
                        : exhibitor.companyInfo.industrySector}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Company Website:</span>
                    <p className="mt-1">
                      {exhibitor.companyInfo.companyWebsite ? (
                        <a
                          href={exhibitor.companyInfo.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {exhibitor.companyInfo.companyWebsite}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Company Address:</span>
                  <p className="mt-1 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                    {exhibitor.companyInfo.companyAddress}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Company Profile:</span>
                  <p className="mt-1 text-muted-foreground">
                    {exhibitor.companyInfo.companyProfile}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Exhibition Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Exhibition Package & Preferences
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Participation Types:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {exhibitor.exhibitionInfo.participationTypes.map(
                      (type, index) => (
                        <Badge key={index} variant="secondary">
                          {type}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Booth Size:</span>
                    <p className="mt-1 font-medium">
                      {exhibitor.exhibitionInfo.boothSize || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Launch New Product:</span>
                    <p className="mt-1">
                      {exhibitor.exhibitionInfo.launchNewProduct
                        ? formatYesNoMaybe(
                            exhibitor.exhibitionInfo.launchNewProduct
                          )
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Require Demo Area:</span>
                  <p className="mt-1">
                    {exhibitor.exhibitionInfo.requireDemoArea
                      ? formatYesNoMaybe(
                          exhibitor.exhibitionInfo.requireDemoArea
                        )
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Booth Description:</span>
                  <p className="mt-1 text-muted-foreground">
                    {exhibitor.exhibitionInfo.boothDescription}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Logistics Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Logistics & Marketing Coordination
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Bring Large Equipment:</span>
                  <p className="mt-1">
                    {exhibitor.logisticsInfo.bringLargeEquipment
                      ? formatYesNoMaybe(
                          exhibitor.logisticsInfo.bringLargeEquipment
                        )
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Marketing Collaterals:</span>
                  <p className="mt-1">
                    {exhibitor.logisticsInfo.haveMarketingCollaterals
                      ? formatMarketingCollaterals(
                          exhibitor.logisticsInfo.haveMarketingCollaterals
                        )
                      : "Not specified"}
                  </p>
                </div>
                {exhibitor.logisticsInfo.logoUrl && (
                  <div className="col-span-2">
                    <span className="font-medium">Company Logo:</span>
                    <div className="mt-1">
                      <ImageModal
                        imageUrl={exhibitor.logisticsInfo.logoUrl}
                        title={`Company Logo - ${exhibitor.companyInfo.companyName}`}
                        description="Company logo for exhibition purposes"
                        altText={`Logo for ${exhibitor.companyInfo.companyName}`}
                        triggerText="View uploaded logo"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-600 hover:underline"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Goals Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Company Objectives & Goals
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Goals:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {exhibitor.goalsInfo.goals.map((goal, index) => (
                      <Badge key={index} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                  {exhibitor.goalsInfo.goalsOthers && (
                    <p className="mt-2 text-muted-foreground">
                      Other goals: {exhibitor.goalsInfo.goalsOthers}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">Explore Sponsorship:</span>
                  <p className="mt-1">
                    {exhibitor.goalsInfo.exploreSponsorship
                      ? formatYesNoMaybe(exhibitor.goalsInfo.exploreSponsorship)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Confirmation Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirmation & Next Steps
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Confirmation Intent:</span>
                  <Badge
                    variant={
                      exhibitor.confirmationInfo.confirmIntent === "YES_RESERVE"
                        ? "default"
                        : exhibitor.confirmationInfo.confirmIntent ===
                          "TENTATIVE"
                        ? "secondary"
                        : "outline"
                    }
                    className="mt-1"
                  >
                    {formatConfirmIntent(
                      exhibitor.confirmationInfo.confirmIntent
                    )}
                  </Badge>
                </div>
                {exhibitor.confirmationInfo.letterOfIntentUrl && (
                  <div>
                    <span className="font-medium">Letter of Intent:</span>
                    <div className="mt-1">
                      <ImageModal
                        imageUrl={exhibitor.confirmationInfo.letterOfIntentUrl}
                        title={`Letter of Intent - ${exhibitor.companyInfo.companyName}`}
                        description="Letter of intent for exhibition participation"
                        altText={`Letter of Intent from ${exhibitor.companyInfo.companyName}`}
                        triggerText="View letter of intent"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-600 hover:underline"
                      />
                    </div>
                  </div>
                )}
                {exhibitor.confirmationInfo.additionalComments && (
                  <div>
                    <span className="font-medium">Additional Comments:</span>
                    <p className="mt-1 text-muted-foreground">
                      {exhibitor.confirmationInfo.additionalComments}
                    </p>
                  </div>
                )}
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
                  <p className="mt-1">{formatDate(exhibitor.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="mt-1">{formatDate(exhibitor.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
