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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Eye,
  ExternalLink,
  User,
  Phone,
  Building,
  Heart,
  Calendar,
  CreditCard,
  ZoomIn,
  Save,
  Loader2,
  MapPin,
  Globe,
} from "lucide-react";
import Link from "next/link";
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

  // Calculate total with conference discount logic
  const calculateTotal = () => {
    const baseTotal = conference.selectedEvents.reduce(
      (sum, event) => sum + event.price,
      0
    );
    const conferenceEvents = conference.selectedEvents.filter(
      (event) => event.status === "CONFERENCE"
    );
    if (conferenceEvents.length === 3) {
      return baseTotal - 1500;
    }
    return baseTotal;
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Only render trigger if using internal state */}
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
            Conference Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {fullName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-2">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-3 pl-1">
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
                    {conference.personalInfo.preferredName || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Gender:</span>
                  <p className="mt-1">{genderDisplay}</p>
                </div>
                <div>
                  <span className="font-medium">Age Bracket:</span>
                  <p className="mt-1">{conference.personalInfo.ageBracket}</p>
                </div>
                <div>
                  <span className="font-medium">Nationality:</span>
                  <p className="mt-1">{conference.personalInfo.nationality}</p>
                </div>
                {conference.personalInfo.faceScannedUrl && (
                  <div className="col-span-2">
                    <span className="font-medium">Face Capture:</span>
                    <div className="mt-1">
                      <ImageModal
                        imageUrl={conference.personalInfo.faceScannedUrl}
                        title={`Face Capture - ${fullName}`}
                        description="User face capture for identity verification"
                        altText={`Face capture for ${fullName}`}
                        triggerText="View face capture"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-300 hover:underline"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-3 pl-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="mt-1">{conference.contactInfo.email}</p>
                </div>
                <div>
                  <span className="font-medium">Mobile Number:</span>
                  <p className="mt-1">
                    {conference.contactInfo.mobileNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Landline:</span>
                  <p className="mt-1">
                    {conference.contactInfo.landline || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline" className="mt-1">
                    {conference.contactInfo.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Mailing Address:</span>
                  <p className="mt-1">
                    {conference.contactInfo.mailingAddress || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Conference Information */}
            <div className="space-y-3 pl-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Conference Information
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="font-medium">Maritime League Member:</span>
                  <Badge variant="outline" className="mt-1 ml-2">
                    {conference.conferenceInfo.isMaritimeLeagueMember}
                  </Badge>
                </div>
                {conference.conferenceInfo.tmlMemberCode && (
                  <div>
                    <span className="font-medium">TML Member Code:</span>
                    <p className="mt-1">
                      {conference.conferenceInfo.tmlMemberCode}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Job Title:</span>
                    <p className="mt-1">{conference.conferenceInfo.jobTitle}</p>
                  </div>
                  <div>
                    <span className="font-medium">Company:</span>
                    <p className="mt-1">
                      {conference.conferenceInfo.companyName}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Industry:</span>
                  <p className="mt-1">{conference.conferenceInfo.industry}</p>
                </div>
                <div>
                  <span className="font-medium">Company Address:</span>
                  <p className="mt-1 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                    {conference.conferenceInfo.companyAddress}
                  </p>
                </div>
                {conference.conferenceInfo.companyWebsite && (
                  <div>
                    <span className="font-medium">Company Website:</span>
                    <p className="mt-1">
                      <a
                        href={conference.conferenceInfo.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {conference.conferenceInfo.companyWebsite}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Interest Areas */}
            <div className="space-y-3 pl-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Interest Areas
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Primary Interests:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {conference.conferenceInfo.interestAreas &&
                    conference.conferenceInfo.interestAreas.length > 0 ? (
                      conference.conferenceInfo.interestAreas.map(
                        (interest, index) => (
                          <Badge key={index} variant="secondary">
                            {interest}
                          </Badge>
                        )
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        None specified
                      </span>
                    )}
                  </div>
                </div>
                {conference.conferenceInfo.otherInterests && (
                  <div>
                    <span className="font-medium">Additional Interests:</span>
                    <p className="mt-1 text-muted-foreground">
                      {conference.conferenceInfo.otherInterests}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Selected Events */}
            <div className="space-y-3 pl-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Selected Events
              </h3>
              <div className="space-y-4 text-sm">
                {conference.selectedEvents.length > 0 ? (
                  <>
                    {conference.selectedEvents.map((event, index) => (
                      <div
                        key={event.id || index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{event.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {event.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ₱{event.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-lg">
                          ₱{calculateTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No events selected</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Information */}
            <div className="space-y-3 pl-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </h3>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Payment Status:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        className={getStatusBadgeColor(
                          conference.paymentInfo.paymentStatus
                        )}
                      >
                        {conference.paymentInfo.paymentStatus}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsStatusModalOpen(true)}
                        disabled={updatePaymentStatus.isPending}
                        className="h-6 text-xs"
                      >
                        Update Status
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span>
                    <p className="mt-1 font-bold">
                      ₱
                      {(
                        conference.paymentInfo.totalAmount || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Payment Mode:</span>
                    <p className="mt-1">
                      {conference.paymentInfo.paymentMode || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Reference Number:</span>
                    <p className="mt-1">
                      {conference.paymentInfo.referenceNumber || "Not provided"}
                    </p>
                  </div>
                </div>
                {conference.paymentInfo.receiptImageUrl && (
                  <div>
                    <span className="font-medium">Payment Receipt:</span>
                    <div className="mt-1">
                      <ImageModal
                        imageUrl={conference.paymentInfo.receiptImageUrl}
                        title={`Payment Receipt - ${fullName}`}
                        description="Payment receipt for conference registration"
                        altText={`Payment receipt for ${fullName}`}
                        triggerText="View payment receipt"
                        triggerVariant="link"
                        className="p-0 h-auto text-blue-300 hover:underline"
                      />
                    </div>
                  </div>
                )}
                {conference.paymentInfo.notes && (
                  <div>
                    <span className="font-medium">Payment Notes:</span>
                    <p className="mt-1 text-muted-foreground">
                      {conference.paymentInfo.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Registration Information */}
            <div className="space-y-3 pl-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Registered:</span>
                  <p className="mt-1">{formatDate(conference.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="mt-1">{formatDate(conference.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>

      <PaymentStatusEditModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusUpdate}
        currentStatus={conference.paymentInfo.paymentStatus}
        userName={fullName}
        isLoading={updatePaymentStatus.isPending}
      />
    </Dialog>
  );
};

export default ConferenceRegistrationDialog;
