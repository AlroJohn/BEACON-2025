// (private)/admin/conference/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Users, LogOut } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import {
  useAdminConferences,
  useAdminConferencesRealtime,
  useDeleteConference,
} from "@/hooks/tanstasck-query/useAdminConference";
import { useAdminLogout } from "@/hooks/tanstasck-query/useAdminAuth";
import { ConferenceDataTable } from "@/components/admin/conference-data-table";

export default function ConferenceDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();
  const logout = useAdminLogout();

  // Use the realtime-enabled hook
  const {
    data: conferencesData,
    isLoading,
    error,
    refetch,
    isRealtimeEnabled,
    realtimeStatus,
    isFallbackMode,
  } = useAdminConferencesRealtime();
  const deleteConference = useDeleteConference();

  // Authentication is now handled by the layout, so we don't need these checks here

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleDeleteConference = (
    conferenceId: string,
    attendeeName: string
  ) => {
    deleteConference.mutate(conferenceId, {
      onSuccess: () => {
        toast.success(
          `Conference registration for ${attendeeName} deleted successfully`
        );
      },
      onError: (error) => {
        toast.error(
          `Failed to delete conference registration: ${error.message}`
        );
      },
    });
  };

  // No need to check authentication here since layout handles it

  return (
    <div className="max-w-[76rem] mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conference Registrations
            {(isRealtimeEnabled || isFallbackMode) && (
              <div className="flex items-center gap-2 ml-auto">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isRealtimeEnabled
                      ? "bg-green-500 animate-pulse"
                      : "bg-yellow-500 animate-ping"
                  }`}
                ></div>
                <span className="text-sm text-muted-foreground">
                  {isRealtimeEnabled ? "Live" : "Polling"}
                </span>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            All conference registrations for BEACON 2025 event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading conference registrations...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load conference registrations.{" "}
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

          {conferencesData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Conference Attendees:{" "}
                    <span className="font-semibold">
                      {conferencesData.count}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => refetch()}>
                    Refresh
                  </Button>
                </div>
              </div>

              <ConferenceDataTable
                data={conferencesData.data}
                onDeleteConference={handleDeleteConference}
                isDeleting={deleteConference.isPending}
                currentAdminStatus={currentAdmin?.status || "ADMIN"}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
