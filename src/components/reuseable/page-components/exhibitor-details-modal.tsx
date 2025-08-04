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
import { Button } from "@/components/ui/button";
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
import { ExhibitorData } from "../../admin/exhibitors-data-table";
import ImageModal from "@/components/reuseable/ImageModal";
import StatusUpdateModal from "@/components/reuseable/StatusUpdateModal";
import { useUpdateExhibitorStatus } from "@/hooks/tanstasck-query/useAdminExhibitors";
import { toast } from "sonner";

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
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const updateExhibitorStatus = useUpdateExhibitorStatus();

  if (!exhibitor) return null;

  const handleStatusUpdate = (
    newStatus: "ACTIVE" | "INACTIVE",
    notes?: string
  ) => {
    updateExhibitorStatus.mutate(
      {
        exhibitorId: exhibitor.id,
        status: newStatus,
        notes,
      },
      {
        onSuccess: () => {
          setIsStatusModalOpen(false);
          toast.success(`Exhibitor status updated to ${newStatus}`);
        },
        onError: (error) => {
          toast.error("Failed to update exhibitor status");
          console.error("Status update error:", error);
        },
      }
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "INACTIVE":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

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
      <DialogContent className="max-w-4xl max-h-[90vh] bg-muted">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Exhibitor Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete registration information for {exhibitor.personalInfo.firstName}{" "}
            {exhibitor.personalInfo.lastName} from {exhibitor.companyInfo.companyName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-8 pb-4">
            {/* Header with Profile */}
            <div className="bg-gradient-to-r from-background to-muted rounded-xl p-6">
              <div className="flex items-start gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {exhibitor.personalInfo.faceScannedUrl ? (
                    <div className="relative group">
                      <img
                        src={exhibitor.personalInfo.faceScannedUrl}
                        alt={`${exhibitor.personalInfo.firstName} ${exhibitor.personalInfo.lastName} profile`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageModal
                          imageUrl={exhibitor.personalInfo.faceScannedUrl}
                          title={`${exhibitor.personalInfo.firstName} ${exhibitor.personalInfo.lastName} Profile Photo`}
                          description="Face verification photo captured during registration"
                          altText={`${exhibitor.personalInfo.firstName} ${exhibitor.personalInfo.lastName} profile photo`}
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
                  <h2 className="text-2xl font-bold mb-2">
                    {exhibitor.personalInfo.firstName} {exhibitor.personalInfo.lastName}
                  </h2>
                  {exhibitor.personalInfo.preferredName && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                      Preferred: {exhibitor.personalInfo.preferredName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      Exhibitor
                    </Badge>
                    <Badge
                      className={getStatusBadgeColor(exhibitor.contactInfo.status)}
                    >
                      {exhibitor.contactInfo.status}
                    </Badge>
                    <Badge variant="outline">
                      {exhibitor.companyInfo.companyName}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            {/* Personal Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Position
                  </span>
                  <p className="">{exhibitor.personalInfo.position}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Gender
                  </span>
                  <p className="">
                    {exhibitor.personalInfo.gender === "OTHERS"
                      ? exhibitor.personalInfo.genderOthers
                      : exhibitor.personalInfo.gender}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Age Bracket
                  </span>
                  <p className="">{exhibitor.personalInfo.ageBracket}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nationality
                  </span>
                  <p className="">{exhibitor.personalInfo.nationality}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
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
                  <p className="break-all">{exhibitor.contactInfo.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Mobile Number
                  </span>
                  <p className="">
                    {exhibitor.contactInfo.mobileNumber || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Landline
                  </span>
                  <p className="">
                    {exhibitor.contactInfo.landline || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Application Status
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={getStatusBadgeColor(exhibitor.contactInfo.status)}
                    >
                      {exhibitor.contactInfo.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStatusModalOpen(true)}
                      disabled={updateExhibitorStatus.isPending}
                      className="h-7 text-xs"
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Mailing Address
                  </span>
                  <p className="">
                    {exhibitor.contactInfo.mailingAddress || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                Company Information
              </h3>
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Company Name
                  </span>
                  <p className="font-semibold">{exhibitor.companyInfo.companyName}</p>
                </div>
                {exhibitor.companyInfo.businessRegistrationName && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Business Registration Name
                    </span>
                    <p className="">{exhibitor.companyInfo.businessRegistrationName}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Industry Sector
                    </span>
                    <p className="">
                      {exhibitor.companyInfo.industrySector === "OTHERS"
                        ? exhibitor.companyInfo.industrySectorOthers
                        : exhibitor.companyInfo.industrySector}
                    </p>
                  </div>
                  {exhibitor.companyInfo.companyWebsite && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Website
                      </span>
                      <p>
                        <a
                          href={exhibitor.companyInfo.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          {exhibitor.companyInfo.companyWebsite}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Company Address
                  </span>
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    {exhibitor.companyInfo.companyAddress}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Company Profile
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {exhibitor.companyInfo.companyProfile}
                  </p>
                </div>
              </div>
            </div>

            {/* Exhibition Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                Exhibition Package & Preferences
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Participation Types
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {exhibitor.exhibitionInfo.participationTypes.map((type, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Booth Size
                    </span>
                    <p className="font-medium">
                      {exhibitor.exhibitionInfo.boothSize || "Not specified"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Launch New Product
                    </span>
                    <p className="">
                      {exhibitor.exhibitionInfo.launchNewProduct
                        ? formatYesNoMaybe(exhibitor.exhibitionInfo.launchNewProduct)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Require Demo Area
                  </span>
                  <p className="">
                    {exhibitor.exhibitionInfo.requireDemoArea
                      ? formatYesNoMaybe(exhibitor.exhibitionInfo.requireDemoArea)
                      : "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Booth Description
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {exhibitor.exhibitionInfo.boothDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Logistics Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Truck className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                Logistics & Marketing Coordination
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Bring Large Equipment
                    </span>
                    <p className="">
                      {exhibitor.logisticsInfo.bringLargeEquipment
                        ? formatYesNoMaybe(exhibitor.logisticsInfo.bringLargeEquipment)
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Marketing Collaterals
                    </span>
                    <p className="">
                      {exhibitor.logisticsInfo.haveMarketingCollaterals
                        ? formatMarketingCollaterals(exhibitor.logisticsInfo.haveMarketingCollaterals)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                {exhibitor.logisticsInfo.logoUrl && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Company Logo
                    </span>
                    <div>
                      <ImageModal
                        imageUrl={exhibitor.logisticsInfo.logoUrl}
                        title={`Company Logo - ${exhibitor.companyInfo.companyName}`}
                        description="Company logo for exhibition purposes"
                        altText={`Logo for ${exhibitor.companyInfo.companyName}`}
                        triggerText="View uploaded logo"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:underline"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Goals Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Target className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                Company Objectives & Goals
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Exhibition Goals
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {exhibitor.goalsInfo.goals.map((goal, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-teal-200 text-teal-700 dark:border-teal-700 dark:text-teal-300"
                      >
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
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Explore Sponsorship
                  </span>
                  <p className="">
                    {exhibitor.goalsInfo.exploreSponsorship
                      ? formatYesNoMaybe(exhibitor.goalsInfo.exploreSponsorship)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Confirmation & Next Steps
              </h3>
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Confirmation Intent
                  </span>
                  <div>
                    <Badge
                      variant={
                        exhibitor.confirmationInfo.confirmIntent === "YES_RESERVE"
                          ? "default"
                          : exhibitor.confirmationInfo.confirmIntent === "TENTATIVE"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        exhibitor.confirmationInfo.confirmIntent === "YES_RESERVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : ""
                      }
                    >
                      {formatConfirmIntent(exhibitor.confirmationInfo.confirmIntent)}
                    </Badge>
                  </div>
                </div>
                {exhibitor.confirmationInfo.letterOfIntentUrl && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Letter of Intent
                    </span>
                    <div>
                      <ImageModal
                        imageUrl={exhibitor.confirmationInfo.letterOfIntentUrl}
                        title={`Letter of Intent - ${exhibitor.companyInfo.companyName}`}
                        description="Letter of intent for exhibition participation"
                        altText={`Letter of Intent from ${exhibitor.companyInfo.companyName}`}
                        triggerText="View letter of intent"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:underline"
                      />
                    </div>
                  </div>
                )}
                {exhibitor.confirmationInfo.additionalComments && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Additional Comments
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {exhibitor.confirmationInfo.additionalComments}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Information */}
            <div className="bg-gradient-to-r from-background to-muted rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
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
                  <p className="">{formatDate(exhibitor.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </span>
                  <p className="">{formatDate(exhibitor.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>

      <StatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusUpdate}
        currentStatus={exhibitor.contactInfo.status}
        userName={`${exhibitor.personalInfo.firstName} ${exhibitor.personalInfo.lastName}`}
        entityType="exhibitor"
        isLoading={updateExhibitorStatus.isPending}
      />
    </Dialog>
  );
}
