"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Trash2,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  FileDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { PaymentMode, PaymentStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import Link from "next/link";
import ConferenceRegistrationDialog from "@/components/reuseable/page-components/view-conference-details";

// Types
export interface ConferenceData {
  id: string;
  createdAt: string;
  updatedAt: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName: string;
    suffix: string;
    preferredName: string;
    gender: string;
    genderOthers: string;
    ageBracket: string;
    nationality: string;
    faceScannedUrl: string;
  };
  contactInfo: {
    email: string;
    mobileNumber: string;
    landline: string;
    mailingAddress: string;
    status: string;
  };
  conferenceInfo: {
    [x: string]: { [s: string]: unknown } | ArrayLike<unknown>;
    isMaritimeLeagueMember: string;
    tmlMemberCode: string;
    jobTitle: string;
    companyName: string;
    industry: string;
    companyAddress: string;
    companyWebsite: string;
    interestAreas: string[];
    detailedInterests: Record<string, string[]>;
    otherInterests: string;
    receiveEventInvites: string;
    emailCertificate: string;
    photoVideoConsent: string;
    dataUsageConsent: string;
  };
  paymentInfo: {
    totalAmount: number | null;
    referenceNumber: string | null;
    receiptImageUrl: string | null;
    notes: string | null;
    paymentMode: string | null;
    paymentStatus: string;
    requiresPayment: boolean;
    isPaid: boolean;
    paymentConfirmedAt: string | null;
  };
  selectedEvents: Array<{
    id: string;
    name: string;
    dates: string[];  // Changed from 'date: string' to 'dates: string[]'
    price: number;
    status: string;
  }>;
}

interface ConferenceDataTableProps {
  data: ConferenceData[];
  onDeleteConference: (conferenceId: string, attendeeName: string) => void;
  isDeleting: boolean;
  currentAdminStatus: "SUPERADMIN" | "ADMIN";
}

// Helper function to map payment status values
const mapPaymentStatus = (
  status: string
): "pending" | "completed" | "failed" | "refunded" => {
  const statusMap: Record<
    string,
    "pending" | "completed" | "failed" | "refunded"
  > = {
    PENDING: "pending",
    CONFIRMED: "completed",
    FAILED: "failed",
    REFUNDED: "refunded",
  };
  return statusMap[status] || "pending";
};

// Helper function to transform ConferenceData to match view-conference-details structure
const transformConferenceData = (
  conference: ConferenceData
): ConferenceData => {
  return {
    // Top-level properties that the component expects
    id: conference.id,
    createdAt: conference.createdAt,
    updatedAt: conference.updatedAt,

    // Transformed nested properties
    personalInfo: {
      firstName: conference.personalInfo.firstName,
      middleName: conference.personalInfo.middleName,
      lastName: conference.personalInfo.lastName,
      suffix: conference.personalInfo.suffix,
      preferredName: conference.personalInfo.preferredName,
      gender: conference.personalInfo.gender,
      genderOthers: conference.personalInfo.genderOthers,
      ageBracket: conference.personalInfo.ageBracket,
      nationality: conference.personalInfo.nationality,
      faceScannedUrl: conference.personalInfo.faceScannedUrl,
    },
    contactInfo: {
      email: conference.contactInfo.email,
      mobileNumber: conference.contactInfo.mobileNumber,
      landline: conference.contactInfo.landline,
      mailingAddress: conference.contactInfo.mailingAddress,
      status: conference.contactInfo.status,
    },
    conferenceInfo: {
      isMaritimeLeagueMember: conference.conferenceInfo.isMaritimeLeagueMember,
      tmlMemberCode: conference.conferenceInfo.tmlMemberCode,
      jobTitle: conference.conferenceInfo.jobTitle,
      companyName: conference.conferenceInfo.companyName,
      industry: conference.conferenceInfo.industry,
      companyAddress: conference.conferenceInfo.companyAddress,
      companyWebsite: conference.conferenceInfo.companyWebsite,
      interestAreas: conference.conferenceInfo.interestAreas,
      detailedInterests: conference.conferenceInfo.detailedInterests,
      otherInterests: conference.conferenceInfo.otherInterests,
      receiveEventInvites: conference.conferenceInfo.receiveEventInvites,
      emailCertificate: conference.conferenceInfo.emailCertificate,
      photoVideoConsent: conference.conferenceInfo.photoVideoConsent,
      dataUsageConsent: conference.conferenceInfo.dataUsageConsent,
    },
    selectedEvents: conference.selectedEvents,
    paymentInfo: conference.paymentInfo,
  };
};

export function ConferenceDataTable({
  data,
  onDeleteConference,
  isDeleting,
  currentAdminStatus,
}: ConferenceDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      middleName: false,
      suffix: false,
      gender: false,
      ageBracket: false,
      nationality: false,
      email: false,
      mobile: false,
      landline: false,
      mailingAddress: false,
      jobTitle: false,
      industry: false,
      tmlCode: false,
      totalAmount: false,
      paymentMode: true,
    });
  const [rowSelection, setRowSelection] = React.useState({});
  const [isExporting, setIsExporting] = React.useState(false);

  // Global modal state - independent of table re-renders
  const [selectedConference, setSelectedConference] =
    React.useState<ConferenceData | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const exportToExcel = async () => {
    try {
      setIsExporting(true);

      // Prepare data for Excel export
      const exportData = data.map((conference, index) => ({
        "No.": index + 1,
        "Full Name": `${conference.personalInfo.firstName} ${
          conference.personalInfo.middleName || ""
        } ${conference.personalInfo.lastName} ${
          conference.personalInfo.suffix || ""
        }`
          .replace(/\s+/g, " ")
          .trim(),
        "Preferred Name": conference.personalInfo.preferredName || "",
        Gender: conference.personalInfo.gender,
        "Gender Others": conference.personalInfo.genderOthers || "",
        "Age Bracket": conference.personalInfo.ageBracket,
        Nationality: conference.personalInfo.nationality,
        Email: conference.contactInfo.email,
        "Mobile Number": conference.contactInfo.mobileNumber,
        Landline: conference.contactInfo.landline || "",
        "Mailing Address": conference.contactInfo.mailingAddress || "",
        Status: conference.contactInfo.status,
        "Job Title": conference.conferenceInfo.jobTitle || "",
        "Company Name": conference.conferenceInfo.companyName || "",
        Industry: conference.conferenceInfo.industry || "",
        "Company Address": conference.conferenceInfo.companyAddress || "",
        "Company Website": conference.conferenceInfo.companyWebsite || "",
        "Maritime League Member":
          conference.conferenceInfo.isMaritimeLeagueMember,
        "TML Member Code": conference.conferenceInfo.tmlMemberCode || "",
        "Interest Areas": Array.isArray(conference.conferenceInfo.interestAreas)
          ? conference.conferenceInfo.interestAreas.join(", ")
          : "",
        "Detailed Interests": conference.conferenceInfo.detailedInterests && Object.keys(conference.conferenceInfo.detailedInterests).length > 0
          ? Object.entries(conference.conferenceInfo.detailedInterests)
              .map(([category, subInterests]) => `${category}: ${(subInterests as string[]).join(", ")}`)
              .join(" | ")
          : "",
        "Other Interests": conference.conferenceInfo.otherInterests || "",
        "Receive Event Invites": conference.conferenceInfo.receiveEventInvites
          ? "Yes"
          : "No",
        "Email Certificate": conference.conferenceInfo.emailCertificate
          ? "Yes"
          : "No",
        "Data Usage Consent": conference.conferenceInfo.dataUsageConsent
          ? "Yes"
          : "No",
        "Selected Events": conference.selectedEvents
          .map((event) => event.name)
          .join(", "),
        "Total Payment Amount": `₱${Number(
          conference.paymentInfo.totalAmount || 0
        ).toLocaleString()}`,
        "Payment Status": conference.paymentInfo.paymentStatus,
        "Payment Mode": conference.paymentInfo.paymentMode || "",
        "Transaction Reference": conference.paymentInfo.referenceNumber || "",
        "Receipt Image URL": conference.paymentInfo.receiptImageUrl || "",
        "Payment Notes": conference.paymentInfo.notes || "",
        "Is Paid": conference.paymentInfo.isPaid ? "Yes" : "No",
        "Requires Payment": conference.paymentInfo.requiresPayment
          ? "Yes"
          : "No",
        "Registration Date": formatDate(conference.createdAt),
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Conference Registrations");

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws["!cols"] = colWidths;

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `BEACON_2025_Conference_Registrations_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const convertEnumToLabel = (value: string): string => {
    return value
      .toUpperCase() // make everything lowercase first
      .split("_") // split by underscores
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize each word
      .join(" "); // join with spaces
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIVE: "default",
      PENDING: "secondary",
      INACTIVE: "destructive",
      VISITOR: "outline",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    if (paymentStatus === "CONFIRMED") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      );
    }

    const statusMap: Record<
      string,
      {
        variant: string;
        icon: React.ReactNode;
      }
    > = {
      PENDING: {
        variant: "bg-amber-500",
        icon: <Clock className="mr-1 h-3 w-3 " />,
      },
      CONFIRMED: {
        variant: "bg-green-500",
        icon: <CheckCircle className="mr-1 h-3 w-3 " />,
      },
      FAILED: {
        variant: "bg-red-500",
        icon: <XCircle className="mr-1 h-3 w-3" />,
      },
      REFUNDED: {
        variant: "bg-c1/20",
        icon: <XCircle className="mr-1 h-3 w-3" />,
      },
    };

    const statusConfig = statusMap[paymentStatus] || {
      variant: "outline",
      icon: <Clock className="mr-1 h-3 w-3" />,
    };

    return (
      <Badge className={`${statusConfig.variant} dark:text-accent-foreground`}>
        {statusConfig.icon}
        {paymentStatus}
      </Badge>
    );
  };

  const getMembershipBadge = (membership: string) => {
    const badgeMap: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      YES: { variant: "default", label: "TML Member" },
      NO: { variant: "outline", label: "Non-Member" },
    };

    const config = badgeMap[membership] || {
      variant: "outline",
      label: membership,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: ColumnDef<ConferenceData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "personalInfo.firstName",
      id: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <User className="mr-2 h-4 w-4" />
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const firstName = row.original.personalInfo.firstName;
        const lastName = row.original.personalInfo.lastName;
        const preferredName = row.original.personalInfo.preferredName;

        return (
          <div className="font-medium">
            {firstName} {lastName}
            {preferredName && (
              <span className="text-sm text-muted-foreground ml-1">
                ({preferredName})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "contactInfo.email",
      id: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Mail className="mr-2 h-4 w-4" />
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.contactInfo.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "personalInfo.middleName",
      id: "middleName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Middle Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.personalInfo.middleName || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "personalInfo.suffix",
      id: "suffix",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Suffix
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.personalInfo.suffix || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "personalInfo.gender",
      id: "gender",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Gender
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">{row.original.personalInfo.gender}</div>
      ),
    },
    {
      accessorKey: "personalInfo.ageBracket",
      id: "ageBracket",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Age Bracket
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">{row.original.personalInfo.ageBracket}</div>
      ),
    },
    {
      accessorKey: "personalInfo.nationality",
      id: "nationality",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Nationality
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">{row.original.personalInfo.nationality}</div>
      ),
    },
    {
      accessorKey: "contactInfo.mobileNumber",
      id: "mobile",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Phone className="mr-2 h-4 w-4" />
            Mobile
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {row.original.contactInfo.mobileNumber}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "contactInfo.landline",
      id: "landline",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Landline
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.contactInfo.landline || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "contactInfo.mailingAddress",
      id: "mailingAddress",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Mailing Address
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm max-w-xs truncate">
          {row.original.contactInfo.mailingAddress || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "conferenceInfo.jobTitle",
      id: "jobTitle",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Job Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.conferenceInfo.jobTitle || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "conferenceInfo.companyName",
      id: "company",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.conferenceInfo.companyName || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "conferenceInfo.industry",
      id: "industry",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Industry
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.conferenceInfo.industry || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "conferenceInfo.tmlMemberCode",
      id: "tmlCode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            TML Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm font-mono">
          {row.original.conferenceInfo.tmlMemberCode || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "conferenceInfo.isMaritimeLeagueMember",
      id: "membership",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Membership
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) =>
        getMembershipBadge(row.original.conferenceInfo.isMaritimeLeagueMember),
    },
    {
      accessorKey: "paymentInfo.totalAmount",
      id: "totalAmount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Total Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          ₱{Number(row.original.paymentInfo.totalAmount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "paymentInfo.paymentMode",
      id: "paymentMode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Payment Mode
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {convertEnumToLabel(row.original.paymentInfo.paymentMode || "N/A")}
        </div>
      ),
    },
    {
      accessorKey: "paymentInfo.isPaid",
      id: "payment",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payment
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) =>
        getPaymentStatusBadge(row.original.paymentInfo.paymentStatus),
    },
    {
      accessorKey: "createdAt",
      id: "registered",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Registered
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const conference = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(conference.contactInfo.email)
                }
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* View Details */}
              <DropdownMenuItem
                onClick={() => {
                  setSelectedConference(conference);
                  setIsModalOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>

              {/* Delete - Only for SUPERADMIN */}
              {currentAdminStatus === "SUPERADMIN" && (
                <>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete registration
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Conference Registration
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the conference
                          registration for{" "}
                          <strong>
                            {conference.personalInfo.firstName}{" "}
                            {conference.personalInfo.lastName}
                          </strong>
                          ? This action cannot be undone and will remove all
                          associated data including payment records.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            onDeleteConference(
                              conference.id,
                              `${conference.personalInfo.firstName} ${conference.personalInfo.lastName}`
                            )
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          {/* Export Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={data.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Export Conference Registrations
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will export all {data.length} registered conference
                  attendees to an Excel file. The file will include all personal
                  information, contact details, payment status, and selected
                  events.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={exportToExcel}
                  disabled={isExporting}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export All Registered Conference
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Columns Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-56">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const columnLabels: Record<string, string> = {
                    name: "Name",
                    email: "Email",
                    middleName: "Middle Name",
                    suffix: "Suffix",
                    gender: "Gender",
                    ageBracket: "Age Bracket",
                    nationality: "Nationality",
                    mobile: "Mobile",
                    landline: "Landline",
                    mailingAddress: "Mailing Address",
                    jobTitle: "Job Title",
                    company: "Company",
                    industry: "Industry",
                    tmlCode: "TML Code",
                    membership: "Membership",
                    totalAmount: "Total Amount",
                    paymentMode: "Payment Mode",
                    payment: "Payment",
                    registered: "Registered",
                  };

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnLabels[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-row items-center justify-end w-full  space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              {"<<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {">"}
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              {">>"}
            </Button>
          </div>
        </div>
      </div>

      {/* Global Modal - Outside table render cycle */}
      {selectedConference && (
        <ConferenceRegistrationDialog
          key={`global-conference-dialog-${selectedConference.id}`}
          conference={transformConferenceData(selectedConference)}
          getStatusBadge={getStatusBadge}
          getMembershipBadge={(isMember: boolean) =>
            getMembershipBadge(isMember ? "YES" : "NO")
          }
          getPaymentStatusBadge={getPaymentStatusBadge}
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedConference(null);
            }
          }}
        />
      )}
    </div>
  );
}
