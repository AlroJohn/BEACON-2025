// (private)/admin/events/page.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Calendar, Plus } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { EventsDataTable } from "@/components/admin/events-data-table";
import { useEventsQuery } from "@/hooks/tanstasck-query/useEventsQuery";

export default function EventsDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();
  const { data: eventsData, isLoading, error, refetch } = useEventsQuery();

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    try {
      const response = await fetch(`/api/events?eventId=${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete event");
      }

      toast.success(`Event "${eventName}" deleted successfully!`);
      refetch();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete event"
      );
    }
  };

  return (
    <div className="max-w-[76rem] mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events Management
              </CardTitle>
              <CardDescription>
                Manage all BEACON 2025 events and their details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading events...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load events.{" "}
                {error instanceof Error ? error.message : "Please try again."}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {eventsData && (
            <div className="space-y-4">
              <EventsDataTable
                data={eventsData}
                onDeleteEvent={handleDeleteEvent}
                currentAdminStatus={currentAdmin?.status || "ADMIN"}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
