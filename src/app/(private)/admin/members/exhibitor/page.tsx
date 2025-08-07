// (private)/admin/members/exhibitor/page.tsx
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
import { Loader2, Building, Plus, Zap, RefreshCw } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { MembersDataTable } from "@/components/admin/members-data-table";
import { BulkGenerateExhibitorCodesDialog } from "@/components/admin/bulk-generate-exhibitor-codes-dialog";

export default function ExhibitorMembersDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    try {
      const response = await fetch(`/api/members/exhibitor?id=${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete exhibitor member");
      }

      toast.success(`Exhibitor member ${memberName} deleted successfully!`);
      // The data table will automatically refresh via React Query
    } catch (error) {
      console.error("Error deleting exhibitor member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete exhibitor member"
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
                <Building className="h-5 w-5" />
                Exhibitor Members Management
              </CardTitle>
              <CardDescription>
                Manage exhibitor members, send bulk messages, and handle member data
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <BulkGenerateExhibitorCodesDialog
                trigger={
                  <Button className="flex items-center gap-1" variant="secondary">
                    <Zap className="h-4 w-4" />
                    Generate Codes
                  </Button>
                }
                onCodesGenerated={() => {
                toast.success("Exhibitor codes generated successfully!");
                // Force refresh of data
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }}
              />
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Codes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MembersDataTable
              memberType="exhibitor"
              onDeleteMember={handleDeleteMember}
              currentAdminStatus={currentAdmin?.status || "ADMIN"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}