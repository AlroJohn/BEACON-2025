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
  Key,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Zap,
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
import { useAllCodesQuery } from "@/hooks/tanstasck-query/useTMLCodeValidation";
import { CreateCodeDialog } from "./create-code-dialog";
import { BulkGenerateCodesDialog } from "./bulk-generate-codes-dialog";
import { toast } from "sonner";

// Types
interface CodeDistributionData {
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

interface CodeDistributionDataTableProps {
  data: CodeDistributionData[];
  onDeleteCode: (codeId: string, code: string) => void;
  currentAdminStatus: "SUPERADMIN" | "ADMIN";
}

export function CodeDistributionDataTable({
  data,
  onDeleteCode,
  currentAdminStatus,
}: CodeDistributionDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const { data: codesData, isLoading, error, refetch } = useAllCodesQuery();
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

  const getStatusBadge = (isActive: boolean, hasUser: boolean, isSent: boolean) => {
    if (hasUser) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <User className="mr-1 h-3 w-3" />
          Used
        </Badge>
      );
    }

    if (isSent) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="mr-1 h-3 w-3" />
          Sent
        </Badge>
      );
    }

    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Available
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const getActiveBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const columns: ColumnDef<CodeDistributionData>[] = [
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
            <Key className="mr-2 h-4 w-4" />
            TML Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-mono font-medium">{row.getValue("code")}</div>
      ),
    },
    {
      id: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const code = row.original;
        return getStatusBadge(code.isActive, !!code.userId, code.isSent);
      },
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        
        const code = row.original;
        const hasUser = !!code.userId;
        const isSent = code.isSent;
        const isActive = code.isActive;
        
        switch (filterValue) {
          case "used":
            return hasUser;
          case "sent":
            return isSent && !hasUser;
          case "available":
            return isActive && !hasUser && !isSent;
          case "inactive":
            return !isActive;
          default:
            return true;
        }
      },
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
      id: "sentTo",
      header: "Sent To",
      cell: ({ row }) => {
        const code = row.original;
        if (!code.isSent || !code.sentTo) {
          return <span className="text-muted-foreground">Not sent</span>;
        }

        return (
          <div className="text-sm">
            <div className="font-medium">{code.sentTo}</div>
            {code.sentAt && (
              <div className="text-muted-foreground text-xs">
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
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.getValue("updatedAt"))}
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
                Copy TML code
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
                    <DialogTitle>TML Code Details: {code.code}</DialogTitle>
                    <DialogDescription>
                      Complete information about this TML member code
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6">
                    {/* Code Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Code Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">TML Code:</label>
                          <p className="font-mono">{code.code}</p>
                        </div>
                        <div>
                          <label className="font-medium">Status:</label>
                          <p>{getStatusBadge(code.isActive, !!code.userId, code.isSent)}</p>
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

                    {/* Email Sent Information */}
                    {code.isSent && (
                      <div>
                        <h3 className="font-semibold mb-3">Email Sent Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium">Sent To:</label>
                            <p className="font-mono">{code.sentTo || "N/A"}</p>
                          </div>
                          <div>
                            <label className="font-medium">Sent At:</label>
                            <p>{code.sentAt ? formatDate(code.sentAt) : "N/A"}</p>
                          </div>
                          <div>
                            <label className="font-medium">Email Status:</label>
                            <p>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Clock className="mr-1 h-3 w-3" />
                                Code Sent via Email
                              </Badge>
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
              <CreateCodeDialog
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
                        <AlertDialogTitle>Delete TML Code</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the TML code{" "}
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
  
  // Bulk delete selected codes
  const handleBulkDelete = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    
    if (selectedRows.length === 0) return;
    
    try {
      // Process each selected code
      for (const row of selectedRows) {
        const code = row.original;
        await onDeleteCode(code.id, code.code);
      }
      
      // Clear selection after successful deletion
      setRowSelection({});
      
      toast.success(`Successfully deleted ${selectedRows.length} TML codes`);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      toast.error("Failed to delete some TML codes. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <div className="w-full flex items-center justify-between">
          <div className="w-full items-center flex gap-4">
            <Input
              placeholder="Filter TML codes..."
              value={
                (table.getColumn("code")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("code")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />

            {/* Status Filter */}
            <Select
              value={
                (table.getColumn("status")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 items-center">
            {currentAdminStatus === "SUPERADMIN" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={table.getSelectedRowModel().rows.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected TML Codes</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the {table.getSelectedRowModel().rows.length} selected TML code(s)? 
                      This action cannot be undone.
                      {table.getSelectedRowModel().rows.some(row => row.original.userId) && (
                        <span className="text-destructive block mt-2">
                          Warning: Some selected codes are currently in use and deleting them may
                          affect the associated users' registrations.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <CreateCodeDialog
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Code
                </Button>
              }
              onCodeCreated={handleCodeCreated}
            />
            <BulkGenerateCodesDialog
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
                  code: "TML Code",
                  status: "Status",
                  usedBy: "Used By",
                  sentTo: "Sent To",
                  isActive: "Active",
                  createdAt: "Created",
                  updatedAt: "Updated",
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
