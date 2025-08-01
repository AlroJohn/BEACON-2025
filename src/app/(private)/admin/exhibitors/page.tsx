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
import {
  Loader2,
  Building2,
  LogOut,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import {
  useAdminExhibitors,
  useAdminExhibitorsRealtime,
  useDeleteExhibitor,
} from "@/hooks/tanstasck-query/useAdminExhibitors";
import { useAdminLogout } from "@/hooks/tanstasck-query/useAdminAuth";
import { ExhibitorsDataTable } from "@/components/admin/exhibitors-data-table";

export default function ExhibitorsDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();
  const logout = useAdminLogout();

  // Use the realtime-enabled hook
  const {
    data: exhibitorsData,
    isLoading,
    error,
    refetch,
    isRealtimeEnabled,
    realtimeStatus,
    isFallbackMode,
  } = useAdminExhibitorsRealtime();
  const deleteExhibitor = useDeleteExhibitor();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleDeleteExhibitor = (
    exhibitorId: string,
    exhibitorName: string
  ) => {
    deleteExhibitor.mutate(exhibitorId, {
      onSuccess: () => {
        toast.success(`Exhibitor ${exhibitorName} deleted successfully`);
      },
      onError: (error) => {
        toast.error(`Failed to delete exhibitor: ${error.message}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading exhibitors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Exhibitors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Failed to load exhibitors data"}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exhibitors = exhibitorsData?.data || [];
  const totalCount = exhibitorsData?.count || 0;

  return (
    <div className="max-w-[76rem]  mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Exhibitor Registrations</CardTitle>
          <CardDescription>
            View and manage all exhibitor registrations for BEACON 2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExhibitorsDataTable
            data={exhibitors}
            onDeleteExhibitor={handleDeleteExhibitor}
            isDeleting={deleteExhibitor.isPending}
            currentAdminStatus={currentAdmin?.status as "SUPERADMIN" | "ADMIN"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
