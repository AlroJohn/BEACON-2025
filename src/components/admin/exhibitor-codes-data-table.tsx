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
  Badge,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Zap,
  Mail,
  MailCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
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
import { CreateExhibitorCodeDialog } from "./create-exhibitor-code-dialog";
import { BulkGenerateExhibitorCodesDialog } from "./bulk-generate-exhibitor-codes-dialog";

// Types
interface ExhibitorCodeDistributionData {
  id: string;
  code: string;
  isActive: boolean;
  userId: string | null;
  isSent: boolean;
  sentAt: string | null;
  sentTo: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    user_accounts?: Array<{
      email: string;
    }>;
    user_details?: Array<{
      firstName: string;
      lastName: string;
    }>;
  } | null;
}

interface ExhibitorCodesDataTableProps {
  data: ExhibitorCodeDistributionData[];
  onDeleteCode: (codeId: string, code: string) => void;
  currentAdminStatus: "SUPERADMIN" | "ADMIN";
}

export function ExhibitorCodesDataTable({
  data,
  onDeleteCode,
  currentAdminStatus,
}: ExhibitorCodesDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const { data: codesData, isLoading, error, refetch } = useQuery({
    queryKey: ['exhibitor-codes'],
    queryFn: async () => {
      const response = await fetch('/api/exhibitor-codes');
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitor codes');
      }
      const result = await response.json();
      return result.data;
    },
  });

  const handleCodeCreated = () => {
    refetch();
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

  const getStatusBadge = (isActive: boolean, hasUser: boolean) => {
    if (hasUser) {
      return (
        <UIBadge variant="secondary" className="bg-blue-100 text-blue-800">
          <User className="mr-1 h-3 w-3" />
          Used
        </UIBadge>
      );
    }

    if (isActive) {
      return (
        <UIBadge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Available
        </UIBadge>
      );
    }

    return (
      <UIBadge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Inactive
      </UIBadge>
    );
  };

  const getActiveBadge = (isActive: boolean) => {
    return (
      <UIBadge variant={isActive ? "default" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </UIBadge>
    );
  };

  const getSentBadge = (isSent: boolean, sentTo?: string | null) => {
    if (isSent && sentTo) {
      return (
        <UIBadge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <MailCheck className="mr-1 h-3 w-3" />
          Sent
        </UIBadge>
      );
    }
    return (
      <UIBadge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <Mail className="mr-1 h-3 w-3" />
        Not Sent
      </UIBadge>
    );
  };

  const columns: ColumnDef<ExhibitorCodeDistributionData>[] = [
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
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Badge className="mr-2 h-4 w-4" />
            Exhibitor Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-mono font-medium">{row.getValue("code")}</div>
      ),
    },
    {
      id: "usedBy",
      header: "Used By",
      cell: ({ row }) => {
        const code = row.original;
        if (!code.user) {
          return <span className="text-muted-foreground">Not used</span>;
        }

        const user_details = code.user.user_details?.[0];
        const userAccount = code.user.user_accounts?.[0];

        if (user_details) {
          return (
            <div className="text-sm">
              <div className="font-medium">
                {user_details.firstName} {user_details.lastName}
              </div>
              {userAccount && (
                <div className="text-muted-foreground">{userAccount.email}</div>
              )}
            </div>
          );
        }

        return (
          <span className="text-muted-foreground">User ID: {code.userId}</span>
        );
      },
    },
    {
      id: "sentStatus",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Mail className="mr-2 h-4 w-4" />
            Sent Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const code = row.original;
        return (
          <div className="flex flex-col gap-1">
            {getSentBadge(code.isSent, code.sentTo)}
            {code.isSent && code.sentTo && (
              <div className="text-xs text-muted-foreground">
                To: {code.sentTo}
              </div>
            )}
            {code.isSent && code.sentAt && (
              <div className="text-xs text-muted-foreground">
                {formatDate(code.sentAt)}
              </div>
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
        const code = row.original;

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
                onClick={() => navigator.clipboard.writeText(code.code)}
              >
                Copy exhibitor code
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
                    <DialogTitle>Exhibitor Code Details: {code.code}</DialogTitle>
                    <DialogDescription>
                      Complete information about this exhibitor access code
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6">
                    {/* Code Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Code Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Exhibitor Code:</label>
                          <p className="font-mono">{code.code}</p>
                        </div>
                        <div>
                          <label className="font-medium">Status:</label>
                          <p>{getStatusBadge(code.isActive, !!code.userId)}</p>
                        </div>
                        <div>
                          <label className="font-medium">Active:</label>
                          <p>{getActiveBadge(code.isActive)}</p>
                        </div>
                        <div>
                          <label className="font-medium">Usage Status:</label>
                          <p>{code.userId ? "Used" : "Available"}</p>
                        </div>
                      </div>
                    </div>

                    {/* User Information */}
                    {code.user && (
                      <div>
                        <h3 className="font-semibold mb-3">Used By</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium">User ID:</label>
                            <p className="font-mono">{code.userId}</p>
                          </div>
                          <div>
                            <label className="font-medium">Name:</label>
                            <p>
                              {code.user.user_details?.[0]
                                ? `${code.user.user_details[0].firstName} ${code.user.user_details[0].lastName}`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="font-medium">Email:</label>
                            <p>
                              {code.user.user_accounts?.[0]?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* System Information */}
                    <div>
                      <h3 className="font-semibold mb-3">System Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Code ID:</label>
                          <p className="font-mono">{code.id}</p>
                        </div>
                        <div>
                          <label className="font-medium">Created:</label>
                          <p>{formatDate(code.createdAt)}</p>
                        </div>
                        <div>
                          <label className="font-medium">Last Updated:</label>
                          <p>{formatDate(code.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit - Available for both ADMIN and SUPERADMIN */}
              <CreateExhibitorCodeDialog
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit code
                  </DropdownMenuItem>
                }
                onCodeCreated={handleCodeCreated}
                editingCode={{
                  id: code.id,
                  code: code.code,
                  isActive: code.isActive,
                }}
                mode="edit"
              />

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
                        Delete code
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Exhibitor Code</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the exhibitor code{" "}
                          <strong>{code.code}</strong>? This action cannot be
                          undone.
                          {code.userId && (
                            <span className="text-destructive">
                              {" "}
                              This code is currently in use and deleting it may
                              affect the associated user's registration.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteCode(code.id, code.code)}
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
      <div className="flex items-center py-4 gap-4">
        <div className="w-full flex items-center justify-between">
          <div className="w-full items-center flex gap-4">
            <Input
              placeholder="Filter exhibitor codes..."
              value={
                (table.getColumn("code")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("code")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />

          </div>

          <div className="flex gap-4 items-center">
            <CreateExhibitorCodeDialog
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Code
                </Button>
              }
              onCodeCreated={handleCodeCreated}
            />
            <BulkGenerateExhibitorCodesDialog
              trigger={
                <Button variant="secondary" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Bulk Generate
                </Button>
              }
              onCodesGenerated={handleCodeCreated}
            />
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
                  code: "Exhibitor Code",
                  usedBy: "Used By",
                  sentStatus: "Sent Status",
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
                  No results.
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
    </div>
  );
}