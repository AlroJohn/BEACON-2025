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
  HandHeart,
  LogOut,
  AlertCircle,
  Wifi,
  WifiOff,
  DollarSign,
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import {
  useAdminSponsors,
  useAdminSponsorsRealtime,
  useDeleteSponsor,
} from "@/hooks/tanstasck-query/useAdminSponsors";
import { useAdminLogout } from "@/hooks/tanstasck-query/useAdminAuth";
import { SponsorsDataTable } from "@/components/admin/sponsors-data-table";

export default function SponsorsDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();
  const logout = useAdminLogout();

  // Use the realtime-enabled hook
  const {
    data: sponsorsData,
    isLoading,
    error,
    refetch,
    isRealtimeEnabled,
    realtimeStatus,
    isFallbackMode,
  } = useAdminSponsorsRealtime();
  const deleteSponsor = useDeleteSponsor();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleDeleteSponsor = (sponsorId: string, sponsorName: string) => {
    deleteSponsor.mutate(sponsorId, {
      onSuccess: () => {
        toast.success(`Sponsor ${sponsorName} deleted successfully`);
      },
      onError: (error) => {
        toast.error(`Failed to delete sponsor: ${error.message}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading sponsors...</p>
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
              Error Loading Sponsors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Failed to load sponsors data"}
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

  const sponsors = sponsorsData?.data || [];
  const totalCount = sponsorsData?.count || 0;

  // Calculate budget distribution
  const budgetRanges = [
    { key: "RANGE_50K_100K", label: "₱50K-₱100K", color: "bg-blue-500" },
    { key: "RANGE_100K_250K", label: "₱100K-₱250K", color: "bg-green-500" },
    { key: "RANGE_250K_500K", label: "₱250K-₱500K", color: "bg-yellow-500" },
    { key: "RANGE_500K_1M", label: "₱500K-₱1M", color: "bg-orange-500" },
    { key: "RANGE_1M_PLUS", label: "₱1M+", color: "bg-red-500" },
  ];

  return (
    <div className="max-w-[76rem] mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Registrations</CardTitle>
          <CardDescription>
            View and manage all sponsor registrations for BEACON 2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SponsorsDataTable
            data={sponsors}
            onDeleteSponsor={handleDeleteSponsor}
            isDeleting={deleteSponsor.isPending}
            currentAdminStatus={currentAdmin?.status as "SUPERADMIN" | "ADMIN"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
