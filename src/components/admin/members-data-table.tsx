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
  Edit,
  MoreHorizontal,
  Trash2,
  User,
  Plus,
  Upload,
  Send,
  Download,
  Loader2,
  Mail,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useQuery } from "@tanstack/react-query";
import { TmlMember, ExhibitorMember } from "@/types/members";
import { toast } from "sonner";
import { AddExhibitorMemberDialog } from "./add-exhibitor-member-dialog";
import { AddTmlMemberDialog } from "./add-tml-member-dialog";
import { BulkMessageDialog } from "./bulk-message-dialog";
import { CSVUploadDialog } from "./csv-upload-dialog";
import { EditExhibitorMemberDialog } from "./edit-exhibitor-member-dialog";
import { EditTmlMemberDialog } from "./edit-tml-member-dialog";

// Types
interface MembersDataTableProps {
  memberType: "tml" | "exhibitor";
  onDeleteMember: (memberId: string, memberName: string) => void;
  currentAdminStatus: "SUPERADMIN" | "ADMIN";
}

type MemberData = TmlMember | ExhibitorMember;

export function MembersDataTable({
  memberType,
  onDeleteMember,
  currentAdminStatus,
}: MembersDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sendingCodes, setSendingCodes] = React.useState<Set<string>>(
    new Set()
  );

  // Fetch members data
  const {
    data: membersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["members", memberType, globalFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (globalFilter) params.append("search", globalFilter);

      const response = await fetch(`/api/members/${memberType}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${memberType} members`);
      }
      const result = await response.json();
      return result.data;
    },
  });

  const handleMemberCreated = () => {
    refetch();
  };

  const handleSendCode = async (
    memberId: string,
    memberName: string,
    memberEmail: string
  ) => {
    // Add to sending state
    setSendingCodes((prev) => new Set(prev).add(memberId));

    try {
      const response = await fetch(`/api/members/${memberType}/send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send code");
      }

      const codeType = memberType === "tml" ? "TML code" : "Exhibitor code";
      toast.success(`${codeType} sent successfully to ${memberEmail}!`, {
        description: `Code ${result.codeSent} has been emailed to ${memberName}`,
      });
    } catch (error) {
      console.error("Error sending code:", error);
      const codeType = memberType === "tml" ? "TML code" : "exhibitor code";
      toast.error(
        error instanceof Error ? error.message : `Failed to send ${codeType}`
      );
    } finally {
      // Remove from sending state
      setSendingCodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
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

  const getActiveBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const formatMemberName = (member: MemberData) => {
    const firstName = member.firstName || "";
    const lastName = member.lastName || "";
    const middleName = member.middleName || "";

    return middleName
      ? `${firstName} ${middleName} ${lastName}`
      : `${firstName} ${lastName}`;
  };

  const getMemberCode = (member: MemberData) => {
    if (memberType === "exhibitor") {
      return (member as ExhibitorMember).sentCode || "N/A";
    } else {
      return (member as TmlMember).sentCode || "N/A";
    }
  };

  const getCompanyName = (member: MemberData) => {
    if (memberType === "exhibitor") {
      return (member as ExhibitorMember).companyName;
    } else {
      return (member as TmlMember).companyName || "N/A";
    }
  };

  const columns: ColumnDef<MemberData>[] = [
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
      accessorKey: "fullName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <User className="mr-2 h-4 w-4" />
            Full Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const member = row.original;
        return <div className="font-medium">{formatMemberName(member)}</div>;
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("email")}</div>
      ),
    },
    {
      id: "company",
      header: "Company",
      cell: ({ row }) => {
        const member = row.original;
        return <div className="text-sm">{getCompanyName(member)}</div>;
      },
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("mobileNumber") || "N/A"}</div>
      ),
    },
    // Show sent code column for both TML and exhibitor members
    {
      id: "memberCode",
      header: "Sent Code",
      cell: ({ row }: { row: any }) => {
        const member = row.original;
        const code = getMemberCode(member);
        const codeTypeColor =
          memberType === "tml"
            ? "bg-blue-50 text-blue-700"
            : "bg-green-50 text-green-700";

        return (
          <div className="font-mono text-sm">
            {code && code !== "N/A" ? (
              <Badge variant="outline" className={codeTypeColor}>
                {code}
              </Badge>
            ) : (
              <span className="text-muted-foreground">Not sent</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => getActiveBadge(row.getValue("isActive")),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const member = row.original;
        const memberName = formatMemberName(member);

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
                onClick={() => navigator.clipboard.writeText(member.email)}
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* View Details */}
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {memberType.toUpperCase()} Member Details: {memberName}
                    </DialogTitle>
                    <DialogDescription>
                      Complete information about this {memberType} member
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Full Name:</label>
                          <p>{memberName}</p>
                        </div>
                        <div>
                          <label className="font-medium">Email:</label>
                          <p className="font-mono">{member.email}</p>
                        </div>
                        <div>
                          <label className="font-medium">Mobile:</label>
                          <p>{member.mobileNumber || "N/A"}</p>
                        </div>
                        <div>
                          <label className="font-medium">Landline:</label>
                          <p>{member.landline || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div>
                      <h3 className="font-semibold mb-3">
                        Company Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Company:</label>
                          <p>{getCompanyName(member)}</p>
                        </div>
                        {memberType === "tml" && (
                          <>
                            <div>
                              <label className="font-medium">Job Title:</label>
                              <p>{(member as TmlMember).jobTitle || "N/A"}</p>
                            </div>
                          </>
                        )}
                        {/* {memberType === 'exhibitor' && (
                          <>
                            <div>
                              <label className="font-medium">Business Registration:</label>
                              <p>{(member as ExhibitorMember).businessRegistrationName || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="font-medium">Website:</label>
                              <p>{(member as ExhibitorMember).companyWebsite || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="font-medium">Industry Sector:</label>
                              <p>{(member as ExhibitorMember).industrySector || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="font-medium">Booth Size:</label>
                              <p>{(member as ExhibitorMember).boothSize || 'N/A'}</p>
                            </div>
                          </>
                        )} */}
                      </div>
                    </div>

                    {/* Member Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Member Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">
                            {memberType.toUpperCase()} Code:
                          </label>
                          <p className="font-mono">{getMemberCode(member)}</p>
                        </div>
                        <div>
                          <label className="font-medium">Active:</label>
                          <p>{getActiveBadge(member.isActive)}</p>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div>
                      <h3 className="font-semibold mb-3">System Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Member ID:</label>
                          <p className="font-mono">{member.id}</p>
                        </div>
                        <div>
                          <label className="font-medium">Created:</label>
                          <p>{formatDate(member.createdAt.toString())}</p>
                        </div>
                        <div>
                          <label className="font-medium">Last Updated:</label>
                          <p>{formatDate(member.updatedAt.toString())}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Send Code - Available for both TML and exhibitor members */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  handleSendCode(member.id, memberName, member.email)
                }
                disabled={sendingCodes.has(member.id)}
              >
                {sendingCodes.has(member.id) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {sendingCodes.has(member.id)
                  ? "Sending..."
                  : memberType === "tml"
                  ? "Send TML Code"
                  : "Send Exhibitor Code"}
              </DropdownMenuItem>

              {/* Edit - Available for both ADMIN and SUPERADMIN */}
              {memberType === "exhibitor" ? (
                <EditExhibitorMemberDialog
                  member={member as ExhibitorMember}
                  onMemberUpdated={() => refetch()}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit member
                  </DropdownMenuItem>
                </EditExhibitorMemberDialog>
              ) : (
                <EditTmlMemberDialog
                  member={member as TmlMember}
                  onMemberUpdated={() => refetch()}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit member
                  </DropdownMenuItem>
                </EditTmlMemberDialog>
              )}

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
                        Delete member
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {memberType.toUpperCase()} Member
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete{" "}
                          <strong>{memberName}</strong>? This action cannot be
                          undone and will permanently remove all member data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteMember(member.id, memberName)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
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
    data: membersData || [],
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
      <div className="flex items-center py-4 gap-4">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="w-full items-center flex gap-4">
            <Input
              placeholder={`Search ${memberType} members...`}
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />

            {/* Active Filter */}
            <Select
              value={
                (table.getColumn("isActive")?.getFilterValue() as string) ??
                "all"
              }
              onValueChange={(value) => {
                if (value === "all") {
                  table.getColumn("isActive")?.setFilterValue("");
                } else {
                  table.getColumn("isActive")?.setFilterValue(value === "true");
                }
              }}
            >
              <SelectTrigger className="w-[150px] text-accent-foreground">
                <SelectValue
                  placeholder="Filter by status"
                  className="text-black"
                />
              </SelectTrigger>
              <SelectContent className="text-accent-foreground">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 items-center">
            <CSVUploadDialog
              memberType={memberType}
              onUploadComplete={() => refetch()}
            />
            <BulkMessageDialog memberType={memberType} />
            {memberType === "exhibitor" ? (
              <AddExhibitorMemberDialog onMemberCreated={() => refetch()} />
            ) : (
              <AddTmlMemberDialog onMemberCreated={() => refetch()} />
            )}
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>

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
                const columnLabels: Record<string, string> = {
                  fullName: "Full Name",
                  email: "Email",
                  company: "Company",
                  mobileNumber: "Mobile",
                  memberCode: "Sent Code",
                  isActive: "Active",
                  createdAt: "Created",
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
                  {isLoading ? "Loading..." : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-row items-center justify-end w-full space-x-2 py-4">
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
              {[10, 20, 50, 100].map((pageSize) => (
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
    </div>
  );
}
