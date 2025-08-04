// (private)/admin/exhibitor-codes/page.tsx
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
import { Loader2, Badge, Plus } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { ExhibitorCodesDataTable } from "@/components/admin/exhibitor-codes-data-table";
import { useQuery } from "@tanstack/react-query";

export default function ExhibitorCodesDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();

  // Fetch exhibitor codes data
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

  const handleDeleteCode = async (codeId: string, code: string) => {
    try {
      const response = await fetch(`/api/exhibitor-codes?id=${codeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete exhibitor code");
      }

      toast.success(`Exhibitor code ${code} deleted successfully!`);
      refetch();
    } catch (error) {
      console.error("Error deleting exhibitor code:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete exhibitor code"
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
                <Badge className="h-5 w-5" />
                Exhibitor Code Distribution
              </CardTitle>
              <CardDescription>
                Manage exhibitor access codes and their distribution status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading exhibitor codes...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load exhibitor codes.{" "}
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

          {codesData && (
            <div className="space-y-4">
              <ExhibitorCodesDataTable
                data={codesData}
                onDeleteCode={handleDeleteCode}
                currentAdminStatus={currentAdmin?.status || "ADMIN"}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}