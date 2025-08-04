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
  Building2,
  DollarSign,
  HandHeart,
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
import { SponsorDetailsModal } from "../reuseable/page-components/sponsor-details-modal";

// Types
export interface SponsorData {
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
    position: string;
  };
  contactInfo: {
    email: string;
    mobileNumber: string;
    landline: string;
    mailingAddress: string;
    status: string;
  };
  companyInfo: {
    companyName: string;
    businessRegistrationName: string;
    industrySector: string;
    industrySectorOthers: string;
    companyAddress: string;
    companyWebsite: string;
    companyProfile: string;
  };
  sponsorshipInfo: {
    sponsorshipCategories: string[];
    targetAudience: string[];
    targetAudienceOthers: string;
  };
  activationInfo: {
    activationPreferences: string;
    activationOthers: string;
    launchProduct: string;
  };
  budgetInfo: {
    budgetRange: string;
    customizedProposal: string;
    uploadLogoUrl: string;
    additionalComments: string;
  };
}

interface SponsorsDataTableProps {
  data: SponsorData[];
  onDeleteSponsor: (sponsorId: string, sponsorName: string) => void;
  isDeleting: boolean;
  currentAdminStatus: "SUPERADMIN" | "ADMIN";
}

export function SponsorsDataTable({
  data,
  onDeleteSponsor,
  isDeleting,
  currentAdminStatus,
}: SponsorsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      // Personal Info - Hide most details
      middleName: false,
      suffix: false,
      gender: false,
      ageBracket: false,
      nationality: false,
      position: false,
      // Contact Info - Hide additional contact details
      landline: false,
      mailingAddress: false,
      // Company Info - Hide detailed company info
      businessRegistrationName: false,
      companyAddress: false,
      companyWebsite: false,
      companyProfile: false,
      // Hide detailed sponsorship info - show only key columns
      industry: false,
      budgetRange: false,
      sponsorshipCategories: false,
      targetAudience: false,
      targetAudienceOthers: false,
      activationPreferences: false,
      activationOthers: false,
      launchProduct: false,
      uploadLogoUrl: false,
      additionalComments: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedSponsor, setSelectedSponsor] =
    React.useState<SponsorData | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);

  const handleViewDetails = (sponsor: SponsorData) => {
    setSelectedSponsor(sponsor);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedSponsor(null);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIVE: "default",
      PENDING: "secondary",
      INACTIVE: "destructive",
      SPONSOR: "outline",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getProposalStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      YES: "default",
      NO: "destructive",
      SCHEDULE_MEETING: "secondary",
    };

    const labels: Record<string, string> = {
      YES: "Yes",
      NO: "No",
      SCHEDULE_MEETING: "Schedule Meeting",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatBudgetRange = (range: string) => {
    const labels: Record<string, string> = {
      RANGE_50K_100K: "₱50K - ₱100K",
      RANGE_100K_250K: "₱100K - ₱250K",
      RANGE_250K_500K: "₱250K - ₱500K",
      RANGE_500K_1M: "₱500K - ₱1M",
      RANGE_1M_PLUS: "₱1M+",
      CUSTOM_BUDGET: "Custom",
    };
    return labels[range] || range;
  };

  const formatArrayField = (array: string[]) => {
    if (!array || array.length === 0) return "N/A";
    return array.join(", ");
  };

  const columns: ColumnDef<SponsorData>[] = [
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
            <HandHeart className="mr-2 h-4 w-4" />
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
      accessorKey: "companyInfo.companyName",
      id: "company",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm font-medium max-w-[150px] truncate">
          {row.original.companyInfo.companyName}
        </div>
      ),
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
        <div className="text-sm max-w-[180px] truncate">
          {row.original.contactInfo.email}
        </div>
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
        <div className="text-sm">
          {row.original.contactInfo.mobileNumber || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "companyInfo.industrySector",
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
      cell: ({ row }) => {
        const sector = row.original.companyInfo.industrySector;
        const others = row.original.companyInfo.industrySectorOthers;
        return (
          <div className="text-sm">
            {sector === "OTHERS" && others ? others : sector}
          </div>
        );
      },
    },
    {
      accessorKey: "sponsorshipInfo.sponsorshipCategories",
      id: "sponsorshipCategories",
      header: "Sponsorship Categories",
      cell: ({ row }) => (
        <div className="text-sm max-w-[200px] truncate">
          {formatArrayField(row.original.sponsorshipInfo.sponsorshipCategories)}
        </div>
      ),
    },
    {
      accessorKey: "budgetInfo.budgetRange",
      id: "budgetRange",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Budget Range
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {formatBudgetRange(row.original.budgetInfo.budgetRange)}
        </div>
      ),
    },
    {
      accessorKey: "budgetInfo.customizedProposal",
      id: "proposalStatus",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Proposal Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {getProposalStatusBadge(row.original.budgetInfo.customizedProposal)}
        </div>
      ),
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
        const sponsor = row.original;

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
                  navigator.clipboard.writeText(sponsor.contactInfo.email)
                }
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* View Details */}
              <DropdownMenuItem onClick={() => handleViewDetails(sponsor)}>
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
                        Delete sponsor
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sponsor</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete{" "}
                          <strong>
                            {sponsor.personalInfo.firstName}{" "}
                            {sponsor.personalInfo.lastName}
                          </strong>{" "}
                          from{" "}
                          <strong>{sponsor.companyInfo.companyName}</strong>?
                          This action cannot be undone and will remove all
                          associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            onDeleteSponsor(
                              sponsor.id,
                              `${sponsor.personalInfo.firstName} ${sponsor.personalInfo.lastName}`
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
          placeholder="Filter sponsors..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  No sponsors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Sponsor Details Modal */}
      <SponsorDetailsModal
        sponsor={selectedSponsor}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
}
