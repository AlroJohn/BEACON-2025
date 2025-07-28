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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { ConferenceData } from "@/components/admin/conference-data-table";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useUpdatePaymentStatus } from "@/hooks/tanstasck-query/useAdminConference";
import { toast } from "sonner";

interface ConferenceRegistrationDialogProps {
  conference: ConferenceData;
  getStatusBadge: (status: string) => React.ReactNode;
  getMembershipBadge: (isMember: boolean) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Utility Components
const InfoField: React.FC<{
  label: string;
  value: string | number | null | undefined;
  fallback?: string;
  className?: string;
  copyable?: boolean;
}> = ({ label, value, fallback = "N/A", className = "", copyable = false }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-sm font-semibold  uppercase tracking-wide">
      {label}
    </label>
    <div className="flex items-center gap-2">
      <p className="text-base font-medium">{value || fallback}</p>
      {copyable && value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigator.clipboard.writeText(String(value))}
          className="h-6 w-6 p-0 hover:bg-border"
        >
          <Eye className="h-3 w-3" />
        </Button>
      )}
    </div>
  </div>
);

const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className = "" }) => (
  <Card className={`border-0 shadow-sm dark:bg-c1/30 bg-muted  ${className}`}>
    <CardHeader className="pb-4 border-b border-border">
      <CardTitle className="text-lg font-bold flex items-center gap-3">
        <div className="p-2 dark:bg-c1/30 rounded-lg text-blue-600">{icon}</div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">{children}</CardContent>
  </Card>
);

// Image Modal Component
const ImageModal: React.FC<{
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ src, alt, isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="w-fit max-h-[90vh] p-2">
      <DialogHeader className="pb-6">
        {/* ✅ Required for accessibility, but hidden visually */}
        <VisuallyHidden>
          <DialogTitle>{alt || "Image preview"}</DialogTitle>
        </VisuallyHidden>
      </DialogHeader>
      <div className="flex justify-center">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[70vh] md:min-w-xl min-w-[80dvw] object-contain rounded-lg shadow-lg"
        />
      </div>
    </DialogContent>
  </Dialog>
);

// Section Components
const PersonalInfoSection: React.FC<{
  personalInfo: ConferenceData["personalInfo"];
}> = ({ personalInfo }) => {
  const [showFaceModal, setShowFaceModal] = useState(false);

  const fullName = [
    personalInfo.firstName,
    personalInfo.middleName,
    personalInfo.lastName,
    personalInfo.suffix,
  ]
    .filter(Boolean)
    .join(" ");

  const genderDisplay = personalInfo.genderOthers
    ? `${personalInfo.gender} (${personalInfo.genderOthers})`
    : personalInfo.gender;

  return (
    <SectionCard
      title="Personal Information"
      icon={<User className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Face Photo Section */}
        {personalInfo.faceScannedUrl && (
          <div className="lg:col-span-3 mb-4">
            <label className="text-sm font-semibold uppercase tracking-wide mb-3 block">
              Face Photo
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <img
                  className="w-32 h-32 object-cover rounded-xl shadow-md border cursor-pointer hover:shadow-lg transition-shadow"
                  src={personalInfo.faceScannedUrl}
                  alt="Face Photo"
                  onClick={() => setShowFaceModal(true)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFaceModal(true)}
                  className="flex items-center gap-2 w-fit"
                >
                  <ZoomIn className="h-4 w-4" />
                  View Full Size
                </Button>
                <Link
                  href={personalInfo.faceScannedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-fit"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Link>
              </div>
            </div>

            <ImageModal
              src={personalInfo.faceScannedUrl}
              alt="Face Photo"
              isOpen={showFaceModal}
              onClose={() => setShowFaceModal(false)}
            />
          </div>
        )}

        <InfoField
          label="Full Name"
          value={fullName}
          className="lg:col-span-2"
        />
        <InfoField label="Preferred Name" value={personalInfo.preferredName} />
        <InfoField label="Gender" value={genderDisplay} />
        <InfoField label="Age Bracket" value={personalInfo.ageBracket} />
        <InfoField label="Nationality" value={personalInfo.nationality} />
      </div>
    </SectionCard>
  );
};

const ContactInfoSection: React.FC<{
  contactInfo: ConferenceData["contactInfo"];
  getStatusBadge: (status: string) => React.ReactNode;
}> = ({ contactInfo, getStatusBadge }) => (
  <SectionCard title="Contact Information" icon={<Phone className="h-5 w-5" />}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InfoField label="Email Address" value={contactInfo.email} copyable />
      <InfoField
        label="Mobile Number"
        value={contactInfo.mobileNumber}
        copyable
      />
      <InfoField label="Landline" value={contactInfo.landline} />
      <InfoField
        label="Mailing Address"
        value={contactInfo.mailingAddress}
        className="lg:col-span-2"
      />
      <div className="space-y-2">
        <label className="text-sm font-semibold  uppercase tracking-wide">
          Status
        </label>
        <div>{getStatusBadge(contactInfo.status)}</div>
      </div>
    </div>
  </SectionCard>
);

const ConferenceInfoSection: React.FC<{
  conferenceInfo: ConferenceData["conferenceInfo"];
  getMembershipBadge: (isMember: boolean) => React.ReactNode;
}> = ({ conferenceInfo, getMembershipBadge }) => (
  <SectionCard
    title="Conference Information"
    icon={<Building className="h-5 w-5" />}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold  uppercase tracking-wide">
          Maritime League Member
        </label>
        <div>
          {getMembershipBadge(conferenceInfo.isMaritimeLeagueMember === "YES")}
        </div>
      </div>
      <InfoField label="TML Member Code" value={conferenceInfo.tmlMemberCode} />
      <InfoField label="Job Title" value={conferenceInfo.jobTitle} />
      <InfoField label="Company" value={conferenceInfo.companyName} />
      <InfoField label="Industry" value={conferenceInfo.industry} />
      <InfoField
        label="Company Address"
        value={conferenceInfo.companyAddress}
      />
      <InfoField
        label="Company Website"
        value={conferenceInfo.companyWebsite}
        className="lg:col-span-2"
      />
    </div>

    {/* Additional Conference Preferences */}
    <div className="mt-6 pt-6 border-t border-border">
      <h4 className="text-sm font-semibold  uppercase tracking-wide mb-4">
        Conference Preferences
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              conferenceInfo.receiveEventInvites
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
          />
          <span className="text-sm font-medium">Receive Event Invites</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              conferenceInfo.emailCertificate ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className="text-sm font-medium">Email Certificate</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              conferenceInfo.photoVideoConsent ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className="text-sm font-medium">Photo/Video Consent</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              conferenceInfo.dataUsageConsent ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className="text-sm font-medium">Data Usage Consent</span>
        </div>
      </div>
    </div>
  </SectionCard>
);

const InterestAreasSection: React.FC<{
  conferenceInfo: ConferenceData["conferenceInfo"];
}> = ({ conferenceInfo }) => (
  <SectionCard title="Interest Areas" icon={<Heart className="h-5 w-5" />}>
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold  uppercase tracking-wide mb-3 block">
          Primary Interests
        </label>
        <div className="flex flex-wrap gap-2">
          {conferenceInfo.interestAreas &&
          conferenceInfo.interestAreas.length > 0 ? (
            conferenceInfo.interestAreas.map((interest, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover: px-3 py-1 text-sm font-medium"
              >
                {interest}
              </Badge>
            ))
          ) : (
            <span className="text-slate-500 italic">None specified</span>
          )}
        </div>
      </div>
      {conferenceInfo.otherInterests && (
        <InfoField
          label="Additional Interests"
          value={conferenceInfo.otherInterests}
        />
      )}
    </div>
  </SectionCard>
);

const SelectedEventsSection: React.FC<{
  selectedEvents: ConferenceData["selectedEvents"];
}> = ({ selectedEvents }) => {
  // Calculate total with conference discount logic (same as API)
  const calculateTotal = () => {
    const baseTotal = selectedEvents.reduce((sum, event) => sum + event.price, 0);
    
    // Apply conference discount if all 3 CONFERENCE events are selected
    const conferenceEvents = selectedEvents.filter(event => event.status === 'CONFERENCE');
    if (conferenceEvents.length === 3) {
      return baseTotal - 1500; // Apply 1500 discount for selecting all 3 conference events
    }
    
    return baseTotal;
  };

  const totalAmount = calculateTotal();

  return (
    <SectionCard
      title="Selected Events"
      icon={<Calendar className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {selectedEvents.length > 0 ? (
          <>
            {selectedEvents.map((event, index) => (
              <div
                key={event.id || index}
                className="flex items-center justify-between p-4  rounded-xl border border-border hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{event.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge
                      variant="outline"
                      className="capitalize text-xs font-medium"
                    >
                      {event.status}
                    </Badge>
                    {event.date && (
                      <span className="text-sm ">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl ">
                    ₱{event.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t ">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold ">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₱{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-slate-500 italic text-center py-8">
            No events selected
          </p>
        )}
      </div>
    </SectionCard>
  );
};

const PaymentInfoSection: React.FC<{
  paymentInfo: ConferenceData["paymentInfo"];
  getPaymentStatusBadge: (status: string) => React.ReactNode;
  conferenceId: string;
}> = ({ paymentInfo, getPaymentStatusBadge, conferenceId }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState(paymentInfo.paymentStatus);
  const [notes, setNotes] = useState(paymentInfo.notes || '');
  const updatePaymentStatus = useUpdatePaymentStatus();

  const handleUpdatePaymentStatus = () => {
    if (newPaymentStatus === paymentInfo.paymentStatus && notes === paymentInfo.notes) {
      toast.info('No changes to save');
      return;
    }

    updatePaymentStatus.mutate({
      conferenceId,
      paymentStatus: newPaymentStatus as 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED',
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        toast.success('Payment status updated successfully');
      },
      onError: (error) => {
        toast.error(`Failed to update payment status: ${error.message}`);
      },
    });
  };

  return (
    <SectionCard
      title="Payment Information"
      icon={<CreditCard className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold uppercase tracking-wide">
              Payment Status
            </label>
            <div className="flex items-center gap-3">
              <Select 
                value={newPaymentStatus} 
                onValueChange={(value) => {
                  setNewPaymentStatus(value);
                  // Auto-update when changed
                  if (value !== paymentInfo.paymentStatus) {
                    updatePaymentStatus.mutate({
                      conferenceId,
                      paymentStatus: value as 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED',
                      notes: `Status changed from ${paymentInfo.paymentStatus} to ${value} by admin`,
                    }, {
                      onSuccess: () => {
                        toast.success('Payment status updated successfully');
                      },
                      onError: (error) => {
                        toast.error(`Failed to update payment status: ${error.message}`);
                        setNewPaymentStatus(paymentInfo.paymentStatus); // Revert on error
                      },
                    });
                  }
                }}
                disabled={updatePaymentStatus.isPending}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      PENDING
                    </div>
                  </SelectItem>
                  <SelectItem value="CONFIRMED">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      CONFIRMED
                    </div>
                  </SelectItem>
                  <SelectItem value="FAILED">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      FAILED
                    </div>
                  </SelectItem>
                  <SelectItem value="REFUNDED">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      REFUNDED
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {updatePaymentStatus.isPending && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
          </div>
          <InfoField
            label="Total Amount"
            value={`₱${(paymentInfo.totalAmount || 0).toLocaleString()}`}
          />
          <InfoField label="Payment Mode" value={paymentInfo.paymentMode} />
          <InfoField
            label="Transaction Reference"
            value={paymentInfo.referenceNumber}
            copyable
          />
          <div className="space-y-2">
            <label className="text-sm font-semibold  uppercase tracking-wide">
              Payment Required
            </label>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  paymentInfo.requiresPayment ? "bg-amber-500" : "bg-green-500"
                }`}
              />
              <span className="text-sm font-medium">
                {paymentInfo.requiresPayment ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold  uppercase tracking-wide">
              Payment Confirmed
            </label>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  paymentInfo.isPaid ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-sm font-medium">
                {paymentInfo.isPaid ? "Yes" : "No"}
              </span>
              {paymentInfo.paymentConfirmedAt && (
                <span className="text-xs text-slate-500 ml-2">
                  (
                  {new Date(
                    paymentInfo.paymentConfirmedAt
                  ).toLocaleDateString()}
                  )
                </span>
              )}
            </div>
          </div>
        </div>

        {paymentInfo.receiptImageUrl && (
          <div className="space-y-4">
            <label className="text-sm font-semibold  uppercase tracking-wide block">
              Receipt
            </label>
            <div className=" rounded-xl p-4 border ">
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className="flex-shrink-0">
                  <img
                    className="object-contain max-w-48 max-h-48 rounded-lg shadow-md border  cursor-pointer hover:shadow-lg transition-shadow"
                    src={paymentInfo.receiptImageUrl}
                    alt="Payment Receipt"
                    onClick={() => setShowImageModal(true)}
                  />
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <Button
                    variant="outline"
                    onClick={() => setShowImageModal(true)}
                    className="flex items-center gap-2 w-fit"
                  >
                    <ZoomIn className="h-4 w-4" />
                    View Full Size
                  </Button>
                  <Link
                    href={paymentInfo.receiptImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm w-fit"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Link>
                </div>
              </div>
            </div>

            <ImageModal
              src={paymentInfo.receiptImageUrl}
              alt="Payment Receipt"
              isOpen={showImageModal}
              onClose={() => setShowImageModal(false)}
            />
          </div>
        )}


        {/* Current Payment Notes */}
        {paymentInfo.notes && (
          <div className="space-y-2">
            <label className="text-sm font-semibold  uppercase tracking-wide">
              Current Payment Notes
            </label>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 font-medium">{paymentInfo.notes}</p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

// Main Dialog Component
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
  const fullName = `${conference.personalInfo.firstName} ${conference.personalInfo.lastName}`;
  
  // Use external state if provided, otherwise internal state
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onOpenChange = externalOnOpenChange || setInternalIsOpen;

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

      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto ">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="font-bold flex items-center gap-3">
            <div className="p-3  rounded-xl">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            Conference Registration
          </DialogTitle>
          <DialogDescription className="text-lg  font-medium">
            Complete registration details for {fullName}
          </DialogDescription>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>ID: {conference.id}</span>
            <span>•</span>
            <span>
              Registered: {new Date(conference.createdAt).toLocaleDateString()}
            </span>
            {conference.updatedAt !== conference.createdAt && (
              <>
                <span>•</span>
                <span>
                  Updated: {new Date(conference.updatedAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </DialogHeader>

        <Separator className="bg-slate-200" />

        <div className="space-y-8 py-6">
          <PersonalInfoSection personalInfo={conference.personalInfo} />

          <ContactInfoSection
            contactInfo={conference.contactInfo}
            getStatusBadge={getStatusBadge}
          />

          <ConferenceInfoSection
            conferenceInfo={conference.conferenceInfo}
            getMembershipBadge={getMembershipBadge}
          />

          <InterestAreasSection conferenceInfo={conference.conferenceInfo} />

          <SelectedEventsSection selectedEvents={conference.selectedEvents} />

          <PaymentInfoSection
            paymentInfo={conference.paymentInfo}
            getPaymentStatusBadge={getPaymentStatusBadge}
            conferenceId={conference.id}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConferenceRegistrationDialog;
