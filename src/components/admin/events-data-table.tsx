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
  DollarSign,
  MapPin,
  Users,
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
import { EventStatusEnum } from "@prisma/client";
import { SummaryOfPayments } from "@/types/conference";
import { toast } from "sonner";
import { useEventsQuery } from "@/hooks/tanstasck-query/useEventsQuery";
import { CreateEventDialog } from "./create-event-dialog";

// Types
interface EventData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  eventName: string;
  eventDates: Date[];
  eventPrice: number;
  eventStatus: EventStatusEnum;
  isActive: boolean;
  description?: string;
  eventStartTime?: Date | undefined;
  eventEndTime?: Date | undefined;
  summaryOfPayments?: SummaryOfPayments[];
}

interface EventsDataTableProps {
  data: EventData[];
  onDeleteEvent: (eventId: string, eventName: string) => void;
  currentAdminStatus: "SUPERADMIN" | "ADMIN";
}

export function EventsDataTable({
  data,
  onDeleteEvent,
  currentAdminStatus,
}: EventsDataTableProps) {
  const { data: eventsData, isLoading, error, refetch } = useEventsQuery();
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

  const formatDates = (dates: Date[]) => {
    if (!dates || dates.length === 0) return "TBD";
    if (dates.length === 1) {
      return formatDate(dates[0]);
    }
    return `${formatDate(dates[0])} (+${dates.length - 1} more)`;
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

  const formatPrice = (price: number) => {
    return price === 0 ? "FREE" : `₱${price.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      CONFERENCE: "default",
      SHOW: "secondary",
      WORKSHOP: "outline",
      SEMINAR: "outline",
      EXHIBITION: "outline",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getActiveBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const columns: ColumnDef<EventData>[] = [
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
            Dates
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dates = row.getValue("eventDates") as Date[];
        return (
          <div className="text-sm">
            {dates && dates.length > 0 
              ? dates.length === 1 
                ? formatDate(dates[0])
                : `${formatDate(dates[0])} (+${dates.length - 1} more)`
              : 'No dates set'
            }
          </div>
        );
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
      accessorKey: "eventPrice",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">
          {formatPrice(row.getValue("eventPrice"))}
        </div>
      ),
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
      accessorKey: "eventCapacity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Users className="mr-2 h-4 w-4" />
            Capacity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue("eventCapacity") || "Unlimited"}
        </div>
      ),
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
                    <DialogTitle>Event Details: {event.eventName}</DialogTitle>
                    <DialogDescription>
                      Complete information about this event
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
                          <label className="font-medium">Dates:</label>
                          <div className="space-y-1">
                            {event.eventDates && event.eventDates.length > 0 ? (
                              event.eventDates.map((date, index) => (
                                <p key={index}>{formatDate(date)}</p>
                              ))
                            ) : (
                              <p>No dates set</p>
                            )}
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
                        <div>
                          <label className="font-medium">Price:</label>
                          <p>{formatPrice(event.eventPrice)}</p>
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

                    {/* Venue */}
                    {/* {event.eventVenue && (
                      <div>
                        <h3 className="font-semibold mb-3">Venue</h3>
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          {event.eventVenue}
                        </div>
                      </div>
                    )} */}

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
              <CreateEventDialog
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit event
                  </DropdownMenuItem>
                }
                onEventCreated={handleEventCreated}
                editingEvent={{
                  id: event.id,
                  eventName: event.eventName,
                  eventDates: event.eventDates && event.eventDates.length > 0 ? event.eventDates.map(date => new Date(date)) : [new Date()],
                  eventStartTime: event.eventStartTime ? new Date(event.eventStartTime) : undefined,
                  eventEndTime: event.eventEndTime ? new Date(event.eventEndTime) : undefined,
                  eventPrice: Number(event.eventPrice),
                  eventStatus: event.eventStatus,
                  description: event.description,
                  isActive: event.isActive,
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
                        Delete event
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the event{" "}
                          <strong>{event.eventName}</strong>? This action cannot
                          be undone and will affect all registrations associated
                          with this event.
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
      <div className="flex items-center py-4 ">
        <div className="w-full flex items-center justify-between pr-4">
          <Input
            placeholder="Filter events..."
            value={
              (table.getColumn("eventName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("eventName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <div className="flex items-center gap-4">
            <CreateEventDialog
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Event
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
                  eventPrice: "Price",
                  eventStatus: "Status",
                  eventCapacity: "Capacity",
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
