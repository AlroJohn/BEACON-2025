"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { VisitorEventsDataTable } from "@/components/admin/visitor-events-data-table";
import { useVisitorEventsQuery, useDeleteVisitorEventMutation } from "@/hooks/tanstasck-query/useVisitorEventsQuery";
import { useVisitorEventsStore } from "@/stores/visitorEventsStore";
import { toast } from "sonner";

export default function VisitorEventsDashboard() {
  const { currentAdmin } = useAdminStore();
  const { data: visitorEventsData, isLoading, error, refetch } = useVisitorEventsQuery();
  const deleteVisitorEventMutation = useDeleteVisitorEventMutation();
  const { setVisitorEvents, removeVisitorEvent } = useVisitorEventsStore();

  const handleDeleteVisitorEvent = async (eventId: string, eventName: string) => {
    try {
      await deleteVisitorEventMutation.mutateAsync(eventId);
      removeVisitorEvent(eventId);
      toast.success(`Visitor event "${eventName}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting visitor event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete visitor event');
    }
  };

  // Update store when data changes
  React.useEffect(() => {
    if (visitorEventsData) {
      setVisitorEvents(visitorEventsData);
    }
  }, [visitorEventsData, setVisitorEvents]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visitor Events Management
              </CardTitle>
              <CardDescription>
                Manage all BEACON 2025 visitor events and their details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading visitor events...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load visitor events.{" "}
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

          {visitorEventsData && (
            <div className="space-y-4">
              <VisitorEventsDataTable
                data={visitorEventsData}
                onDeleteEvent={handleDeleteVisitorEvent}
                currentAdminStatus={currentAdmin?.status || "ADMIN"}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}