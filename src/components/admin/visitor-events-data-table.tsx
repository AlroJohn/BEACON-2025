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
  Calendar,
  Plus,
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
import { VisitorEvent, EVENT_STATUS_COLORS } from "@/types/visitor-events";
import { EventStatusEnum } from "@prisma/client";
import { useVisitorEventsQuery } from "@/hooks/tanstasck-query/useVisitorEventsQuery";
import { CreateVisitorEventDialog } from "./create-visitor-event-dialog";
import { useVisitorEventsStore } from "@/stores/visitorEventsStore";

interface VisitorEventsDataTableProps {
  data: VisitorEvent[];
  onDeleteEvent: (eventId: string, eventName: string) => void;
  currentAdminStatus: "SUPERADMIN" | "ADMIN";
}

export function VisitorEventsDataTable({
  data,
  onDeleteEvent,
  currentAdminStatus,
}: VisitorEventsDataTableProps) {
  const { refetch } = useVisitorEventsQuery();
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    activeFilter,
    setActiveFilter,
    clearFilters,
  } = useVisitorEventsStore();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const handleEventCreated = () => {
    refetch();
  };

  const formatDate = (dateString: Date | undefined) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEventDates = (eventDates: Date[]) => {
    if (!eventDates || eventDates.length === 0) return "No dates set";

    if (eventDates.length === 1) {
      return new Date(eventDates[0]).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    return `${eventDates.length} dates`;
  };

  const formatTimeRange = (startTime: Date | null, endTime: Date | null) => {
    if (!startTime && !endTime) return "TBD";

    const start = startTime
      ? new Date(startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const end = endTime
      ? new Date(endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    if (start && end) {
      return `${start} - ${end}`;
    } else if (start) {
      return `${start}`;
    } else if (end) {
      return `Until ${end}`;
    }

    return "TBD";
  };

  const getStatusBadge = (status: EventStatusEnum) => {
    const colorClass = EVENT_STATUS_COLORS[status];
    return (
      <Badge className={colorClass} variant="secondary">
        {status.replace("_", " ")}
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

  const columns: ColumnDef<VisitorEvent>[] = [
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
      accessorKey: "eventName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Event Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("eventName")}</div>
      ),
    },
    {
      accessorKey: "eventDates",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Event Dates
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const eventDates = row.getValue("eventDates") as Date[];
        return <div className="text-sm">{formatEventDates(eventDates)}</div>;
      },
    },
    {
      id: "eventTime",
      header: "Time",
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div className="text-sm">
            {formatTimeRange(
              event.eventStartTime || null,
              event.eventEndTime || null
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "eventStatus",
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
      cell: ({ row }) => getStatusBadge(row.getValue("eventStatus")),
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => getActiveBadge(row.getValue("isActive")),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const event = row.original;

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
                onClick={() => navigator.clipboard.writeText(event.id)}
              >
                Copy event ID
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
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Visitor Event Details: {event.eventName}
                    </DialogTitle>
                    <DialogDescription>
                      Complete information about this visitor event
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Event Name:</label>
                          <p>{event.eventName}</p>
                        </div>
                        <div>
                          <label className="font-medium">Status:</label>
                          <p>{getStatusBadge(event.eventStatus)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-medium">Event Dates:</label>
                          <div className="space-y-1">
                            {event.eventDates?.map((date, index) => (
                              <p key={index}>{formatDate(date)}</p>
                            )) || <p>No dates set</p>}
                          </div>
                        </div>
                        <div>
                          <label className="font-medium">Start Time:</label>
                          <p>
                            {event.eventStartTime
                              ? new Date(
                                  event.eventStartTime
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Not set"}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium">End Time:</label>
                          <p>
                            {event.eventEndTime
                              ? new Date(event.eventEndTime).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <div>
                        <h3 className="font-semibold mb-3">Description</h3>
                        <p className="text-sm">{event.description}</p>
                      </div>
                    )}

                    {/* System Information */}
                    <div>
                      <h3 className="font-semibold mb-3">System Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Event ID:</label>
                          <p className="font-mono">{event.id}</p>
                        </div>
                        <div>
                          <label className="font-medium">Active Status:</label>
                          <p>{getActiveBadge(event.isActive)}</p>
                        </div>
                        <div>
                          <label className="font-medium">Created:</label>
                          <p>{formatDate(event.createdAt)}</p>
                        </div>
                        <div>
                          <label className="font-medium">Last Updated:</label>
                          <p>{formatDate(event.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit - Available for both ADMIN and SUPERADMIN */}
              <CreateVisitorEventDialog
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit event
                  </DropdownMenuItem>
                }
                onEventCreated={handleEventCreated}
                editingEvent={event}
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
                        Delete event
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Visitor Event
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the visitor event{" "}
                          <strong>{event.eventName}</strong>? This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            onDeleteEvent(event.id, event.eventName)
                          }
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
      <div className="flex items-center py-4">
        <div className="w-full flex items-center justify-between pr-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Filter visitor events..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-sm"
            />

            <Select
              value={statusFilter || "all_status"}
              onValueChange={(value) =>
                setStatusFilter(value === "all_status" ? null : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">All Status</SelectItem>
                <SelectItem value={EventStatusEnum.CONFERENCE}>
                  Conference
                </SelectItem>
                <SelectItem value={EventStatusEnum.SHOW}>Show</SelectItem>
                <SelectItem value={EventStatusEnum.WORKSHOP}>
                  Workshop
                </SelectItem>
                <SelectItem value={EventStatusEnum.SEMINAR}>Seminar</SelectItem>
                <SelectItem value={EventStatusEnum.EXHIBITION}>
                  Exhibition
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={activeFilter || "all_active"}
              onValueChange={(value) =>
                setActiveFilter(value === "all_active" ? null : value)
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Active" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_active">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <CreateVisitorEventDialog
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Visitor Event
                </Button>
              }
              onEventCreated={handleEventCreated}
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
                  eventName: "Event Name",
                  eventDates: "Dates",
                  eventTime: "Time",
                  eventStatus: "Status",
                  isActive: "Active",
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
