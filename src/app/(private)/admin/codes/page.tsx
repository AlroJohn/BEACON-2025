// (private)/admin/codes/page.tsx
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
import { Loader2, Key, Plus } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { CodeDistributionDataTable } from "@/components/admin/code-distribution-data-table";
import { useAllCodesQuery } from "@/hooks/tanstasck-query/useTMLCodeValidation";

export default function CodesDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();
  const { data: codesData, isLoading, error, refetch } = useAllCodesQuery();

  const handleDeleteCode = async (codeId: string, code: string) => {
    try {
      const response = await fetch(`/api/codes?id=${codeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete code");
      }

      toast.success(`Code ${code} deleted successfully!`);
      refetch();
    } catch (error) {
      console.error("Error deleting code:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete code"
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
                <Key className="h-5 w-5" />
                TML Code Distribution
              </CardTitle>
              <CardDescription>
                Manage TML member codes and their distribution status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading TML codes...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load TML codes.{" "}
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
              <CodeDistributionDataTable
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
