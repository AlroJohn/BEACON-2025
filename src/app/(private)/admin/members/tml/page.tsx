// (private)/admin/members/tml/page.tsx
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
import { Loader2, Users, Plus } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { MembersDataTable } from "@/components/admin/members-data-table";

export default function TmlMembersDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    try {
      const response = await fetch(`/api/members/tml?id=${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete TML member");
      }

      toast.success(`TML member ${memberName} deleted successfully!`);
      // The data table will automatically refresh via React Query
    } catch (error) {
      console.error("Error deleting TML member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete TML member"
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
                <Users className="h-5 w-5" />
                TML Members Management
              </CardTitle>
              <CardDescription>
                Manage TML members, send bulk messages, and handle member data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MembersDataTable
              memberType="tml"
              onDeleteMember={handleDeleteMember}
              currentAdminStatus={currentAdmin?.status || "ADMIN"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}