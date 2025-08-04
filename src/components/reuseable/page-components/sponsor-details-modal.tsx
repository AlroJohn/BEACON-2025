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
  DollarSign,
  Target,
  Zap,
  FileText,
  Calendar,
  HandHeart,
} from "lucide-react";
import { SponsorData } from "../../admin/sponsors-data-table";
import ImageModal from "@/components/reuseable/ImageModal";
import StatusUpdateModal from "@/components/reuseable/StatusUpdateModal";
import { useUpdateSponsorStatus } from "@/hooks/tanstasck-query/useAdminSponsors";
import { toast } from "sonner";

interface SponsorDetailsModalProps {
  sponsor: SponsorData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SponsorDetailsModal({
  sponsor,
  isOpen,
  onClose,
}: SponsorDetailsModalProps) {
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const updateSponsorStatus = useUpdateSponsorStatus();

  if (!sponsor) return null;

  const handleStatusUpdate = (
    newStatus: "ACTIVE" | "INACTIVE",
    notes?: string
  ) => {
    updateSponsorStatus.mutate(
      {
        sponsorId: sponsor.id,
        status: newStatus,
        notes,
      },
      {
        onSuccess: () => {
          setIsStatusModalOpen(false);
          toast.success(`Sponsor status updated to ${newStatus}`);
        },
        onError: (error) => {
          toast.error("Failed to update sponsor status");
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

  const formatBudgetRange = (range: string) => {
    const labels: Record<string, string> = {
      RANGE_50K_100K: "₱50,000 - ₱100,000",
      RANGE_100K_250K: "₱100,000 - ₱250,000",
      RANGE_250K_500K: "₱250,000 - ₱500,000",
      RANGE_500K_1M: "₱500,000 - ₱1,000,000",
      RANGE_1M_ABOVE: "₱1,000,000 and Above",
      TO_BE_DISCUSSED: "To be discussed",
    };
    return labels[range] || range;
  };

  const formatProposalStatus = (status: string) => {
    const labels: Record<string, string> = {
      YES: "Yes",
      NO: "No",
      SCHEDULE_MEETING: "Schedule Meeting",
    };
    return labels[status] || status;
  };

  const formatYesNoMaybe = (value: string) => {
    const labels: Record<string, string> = {
      YES: "Yes",
      NO: "No",
      MAYBE: "Maybe",
    };
    return labels[value] || value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-muted">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg">
              <HandHeart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Sponsor Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete registration information for {sponsor.personalInfo.firstName}{" "}
            {sponsor.personalInfo.lastName} from {sponsor.companyInfo.companyName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-8 pb-4">
            {/* Header with Profile */}
            <div className="bg-gradient-to-r from-background to-muted rounded-xl p-6">
              <div className="flex items-start gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {sponsor.personalInfo.faceScannedUrl ? (
                    <div className="relative group">
                      <img
                        src={sponsor.personalInfo.faceScannedUrl}
                        alt={`${sponsor.personalInfo.firstName} ${sponsor.personalInfo.lastName} profile`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageModal
                          imageUrl={sponsor.personalInfo.faceScannedUrl}
                          title={`${sponsor.personalInfo.firstName} ${sponsor.personalInfo.lastName} Profile Photo`}
                          description="Face verification photo captured during registration"
                          altText={`${sponsor.personalInfo.firstName} ${sponsor.personalInfo.lastName} profile photo`}
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
                    {sponsor.personalInfo.firstName} {sponsor.personalInfo.lastName}
                  </h2>
                  {sponsor.personalInfo.preferredName && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                      Preferred: {sponsor.personalInfo.preferredName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      Sponsor
                    </Badge>
                    <Badge
                      className={getStatusBadgeColor(sponsor.contactInfo.status)}
                    >
                      {sponsor.contactInfo.status}
                    </Badge>
                    <Badge variant="outline">
                      {sponsor.companyInfo.companyName}
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
                  <p className="">{sponsor.personalInfo.position}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Gender
                  </span>
                  <p className="">
                    {sponsor.personalInfo.gender === "OTHERS"
                      ? sponsor.personalInfo.genderOthers
                      : sponsor.personalInfo.gender}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Age Bracket
                  </span>
                  <p className="">{sponsor.personalInfo.ageBracket}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nationality
                  </span>
                  <p className="">{sponsor.personalInfo.nationality}</p>
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
                  <p className="break-all">{sponsor.contactInfo.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Mobile Number
                  </span>
                  <p className="">
                    {sponsor.contactInfo.mobileNumber || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Landline
                  </span>
                  <p className="">
                    {sponsor.contactInfo.landline || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Application Status
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={getStatusBadgeColor(sponsor.contactInfo.status)}
                    >
                      {sponsor.contactInfo.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStatusModalOpen(true)}
                      disabled={updateSponsorStatus.isPending}
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
                    {sponsor.contactInfo.mailingAddress || "Not provided"}
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
                  <p className="font-semibold">{sponsor.companyInfo.companyName}</p>
                </div>
                {sponsor.companyInfo.businessRegistrationName && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Business Registration Name
                    </span>
                    <p className="">{sponsor.companyInfo.businessRegistrationName}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Industry Sector
                    </span>
                    <p className="">
                      {sponsor.companyInfo.industrySector === "OTHERS"
                        ? sponsor.companyInfo.industrySectorOthers
                        : sponsor.companyInfo.industrySector}
                    </p>
                  </div>
                  {sponsor.companyInfo.companyWebsite && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Website
                      </span>
                      <p>
                        <a
                          href={sponsor.companyInfo.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          {sponsor.companyInfo.companyWebsite}
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
                    {sponsor.companyInfo.companyAddress}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Company Profile
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {sponsor.companyInfo.companyProfile}
                  </p>
                </div>
              </div>
            </div>

            {/* Sponsorship Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                Sponsorship Interest
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sponsorship Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sponsor.sponsorshipInfo.sponsorshipCategories.map((category, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Target Audience
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sponsor.sponsorshipInfo.targetAudience.map((audience, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
                      >
                        {audience}
                      </Badge>
                    ))}
                  </div>
                  {sponsor.sponsorshipInfo.targetAudienceOthers && (
                    <p className="mt-2 text-muted-foreground">
                      Other: {sponsor.sponsorshipInfo.targetAudienceOthers}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Activation Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Zap className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                Activation Preferences
              </h3>
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Activation Preferences
                  </span>
                  <p className="">{sponsor.activationInfo.activationPreferences}</p>
                  {sponsor.activationInfo.activationOthers && (
                    <p className="mt-1 text-muted-foreground">
                      Other: {sponsor.activationInfo.activationOthers}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Launch Product
                  </span>
                  <p className="">
                    {sponsor.activationInfo.launchProduct
                      ? formatYesNoMaybe(sponsor.activationInfo.launchProduct)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Information */}
            <div className="rounded-xl p-6 border">
              <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                Budget & Proposal
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Budget Range
                    </span>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {formatBudgetRange(sponsor.budgetInfo.budgetRange)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Customized Proposal
                    </span>
                    <div>
                      <Badge
                        variant={
                          sponsor.budgetInfo.customizedProposal === "YES"
                            ? "default"
                            : sponsor.budgetInfo.customizedProposal === "NO"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          sponsor.budgetInfo.customizedProposal === "YES"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : ""
                        }
                      >
                        {formatProposalStatus(sponsor.budgetInfo.customizedProposal)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {sponsor.budgetInfo.uploadLogoUrl && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Company Logo
                    </span>
                    <div>
                      <ImageModal
                        imageUrl={sponsor.budgetInfo.uploadLogoUrl}
                        title={`Company Logo - ${sponsor.companyInfo.companyName}`}
                        description="Company logo for sponsorship purposes"
                        altText={`Logo for ${sponsor.companyInfo.companyName}`}
                        triggerText="View uploaded logo"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:underline"
                      />
                    </div>
                  </div>
                )}
                {sponsor.budgetInfo.additionalComments && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Additional Comments
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {sponsor.budgetInfo.additionalComments}
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
                  <p className="">{formatDate(sponsor.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </span>
                  <p className="">{formatDate(sponsor.updatedAt)}</p>
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
        currentStatus={sponsor.contactInfo.status}
        userName={`${sponsor.personalInfo.firstName} ${sponsor.personalInfo.lastName}`}
        entityType="sponsor"
        isLoading={updateSponsorStatus.isPending}
      />
    </Dialog>
  );
}
