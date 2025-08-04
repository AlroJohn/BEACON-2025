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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5" />
            Sponsor Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {sponsor.personalInfo.firstName}{" "}
            {sponsor.personalInfo.lastName} from{" "}
            {sponsor.companyInfo.companyName}
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
                    {sponsor.personalInfo.firstName}{" "}
                    {sponsor.personalInfo.middleName || ""}{" "}
                    {sponsor.personalInfo.lastName}{" "}
                    {sponsor.personalInfo.suffix || ""}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Preferred Name:</span>
                  <p className="mt-1">
                    {sponsor.personalInfo.preferredName || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Position:</span>
                  <p className="mt-1">{sponsor.personalInfo.position}</p>
                </div>
                <div>
                  <span className="font-medium">Gender:</span>
                  <p className="mt-1">
                    {sponsor.personalInfo.gender === "OTHERS"
                      ? sponsor.personalInfo.genderOthers
                      : sponsor.personalInfo.gender}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Age Bracket:</span>
                  <p className="mt-1">{sponsor.personalInfo.ageBracket}</p>
                </div>
                <div>
                  <span className="font-medium">Nationality:</span>
                  <p className="mt-1">{sponsor.personalInfo.nationality}</p>
                </div>
                <div>
                  {" "}
                  {sponsor.personalInfo.faceScannedUrl && (
                    <div className="col-span-2">
                      <span className="font-medium">Face Capture:</span>
                      <div className="mt-1">
                        <ImageModal
                          imageUrl={sponsor.personalInfo.faceScannedUrl}
                          title={`Face Capture - ${sponsor.personalInfo.firstName} ${sponsor.personalInfo.lastName}`}
                          description="User face capture for identity verification"
                          altText={`Face capture for ${sponsor.personalInfo.firstName} ${sponsor.personalInfo.lastName}`}
                          triggerText="View face capture"
                          triggerVariant="link"
                          className="p-0 h-auto dark:text-blue-300 text-blue-600 hover:underline"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                  <p className="mt-1">{sponsor.contactInfo.email}</p>
                </div>
                <div>
                  <span className="font-medium">Mobile Number:</span>
                  <p className="mt-1">
                    {sponsor.contactInfo.mobileNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Landline:</span>
                  <p className="mt-1">
                    {sponsor.contactInfo.landline || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Contact Status:</span>
                  <Badge
                    variant="outline"
                    className="mt-1 dark:text-accent-foreground"
                  >
                    {sponsor.contactInfo.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Application Status:</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      className={getStatusBadgeColor(
                        sponsor.contactInfo.status
                      )}
                    >
                      {sponsor.contactInfo.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStatusModalOpen(true)}
                      disabled={updateSponsorStatus.isPending}
                      className="h-6 text-xs"
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Mailing Address:</span>
                  <p className="mt-1">
                    {sponsor.contactInfo.mailingAddress || "Not provided"}
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
                    {sponsor.companyInfo.companyName}
                  </p>
                </div>
                {sponsor.companyInfo.businessRegistrationName && (
                  <div>
                    <span className="font-medium">
                      Business Registration Name:
                    </span>
                    <p className="mt-1">
                      {sponsor.companyInfo.businessRegistrationName}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Industry Sector:</span>
                    <p className="mt-1">
                      {sponsor.companyInfo.industrySector === "OTHERS"
                        ? sponsor.companyInfo.industrySectorOthers
                        : sponsor.companyInfo.industrySector}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Company Website:</span>
                    <p className="mt-1">
                      {sponsor.companyInfo.companyWebsite ? (
                        <a
                          href={sponsor.companyInfo.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {sponsor.companyInfo.companyWebsite}
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
                    {sponsor.companyInfo.companyAddress}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Company Profile:</span>
                  <p className="mt-1 text-muted-foreground">
                    {sponsor.companyInfo.companyProfile}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sponsorship Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Sponsorship Interest
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Sponsorship Categories:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sponsor.sponsorshipInfo.sponsorshipCategories.map(
                      (category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Target Audience:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sponsor.sponsorshipInfo.targetAudience.map(
                      (audience, index) => (
                        <Badge key={index} variant="outline">
                          {audience}
                        </Badge>
                      )
                    )}
                  </div>
                  {sponsor.sponsorshipInfo.targetAudienceOthers && (
                    <p className="mt-2 text-muted-foreground">
                      Other: {sponsor.sponsorshipInfo.targetAudienceOthers}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Activation Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Activation Preferences
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="font-medium">Activation Preferences:</span>
                  <p className="mt-1">
                    {sponsor.activationInfo.activationPreferences}
                  </p>
                  {sponsor.activationInfo.activationOthers && (
                    <p className="mt-1 text-muted-foreground">
                      Other: {sponsor.activationInfo.activationOthers}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">Launch Product:</span>
                  <p className="mt-1">
                    {sponsor.activationInfo.launchProduct
                      ? formatYesNoMaybe(sponsor.activationInfo.launchProduct)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Budget Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget & Proposal
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Budget Range:</span>
                  <p className="mt-1 font-medium text-green-600">
                    {formatBudgetRange(sponsor.budgetInfo.budgetRange)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Customized Proposal:</span>
                  <Badge
                    variant={
                      sponsor.budgetInfo.customizedProposal === "YES"
                        ? "default"
                        : sponsor.budgetInfo.customizedProposal === "NO"
                        ? "destructive"
                        : "secondary"
                    }
                    className="mt-1"
                  >
                    {formatProposalStatus(
                      sponsor.budgetInfo.customizedProposal
                    )}
                  </Badge>
                </div>
                {sponsor.budgetInfo.uploadLogoUrl && (
                  <div className="col-span-2">
                    <span className="font-medium">Logo:</span>
                    <div className="mt-1">
                      <ImageModal
                        imageUrl={sponsor.budgetInfo.uploadLogoUrl}
                        title={`Company Logo - ${sponsor.companyInfo.companyName}`}
                        description="Company logo for sponsorship purposes"
                        altText={`Logo for ${sponsor.companyInfo.companyName}`}
                        triggerText="View uploaded logo"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-600 hover:underline"
                      />
                    </div>
                  </div>
                )}
                {sponsor.budgetInfo.additionalComments && (
                  <div className="col-span-2">
                    <span className="font-medium">Additional Comments:</span>
                    <p className="mt-1 text-muted-foreground">
                      {sponsor.budgetInfo.additionalComments}
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
                  <p className="mt-1">{formatDate(sponsor.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="mt-1">{formatDate(sponsor.updatedAt)}</p>
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
