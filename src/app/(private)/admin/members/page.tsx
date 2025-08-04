// (private)/admin/members/page.tsx
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
import { Users, Building, Send, Upload, BarChart3 } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";

export default function MembersDashboard() {
  const router = useRouter();
  const { currentAdmin } = useAdminStore();

  const navigationCards = [
    {
      title: "TML Members",
      description: "Manage TML member database, codes, and communications",
      icon: Users,
      href: "/admin/members/tml",
      color: "bg-blue-500",
    },
    {
      title: "Exhibitor Members", 
      description: "Manage exhibitor member database, codes, and communications",
      icon: Building,
      href: "/admin/members/exhibitor",
      color: "bg-green-500",
    },
    {
      title: "Bulk Messaging",
      description: "Send mass emails to TML and exhibitor members",
      icon: Send,
      href: "/admin/members/bulk-message",
      color: "bg-purple-500",
    },
    {
      title: "Bulk Upload",
      description: "Import members from Excel/CSV files",
      icon: Upload,
      href: "/admin/members/bulk-upload",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="max-w-[76rem] mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Members Management</h1>
        <p className="text-muted-foreground">
          Manage TML and Exhibitor members, send bulk communications, and handle member data imports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {navigationCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.href}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => router.push(card.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`${card.color} p-2 rounded-md`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Overview
            </CardTitle>
            <CardDescription>
              Member statistics and system overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">--</div>
                <div className="text-sm text-muted-foreground">TML Members</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">--</div>
                <div className="text-sm text-muted-foreground">Exhibitor Members</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">--</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">--</div>
                <div className="text-sm text-muted-foreground">Total Messages Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common member management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => router.push("/admin/members/tml")}>
                <Users className="mr-2 h-4 w-4" />
                Manage TML Members
              </Button>
              <Button onClick={() => router.push("/admin/members/exhibitor")}>
                <Building className="mr-2 h-4 w-4" />
                Manage Exhibitors
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/members/bulk-message")}>
                <Send className="mr-2 h-4 w-4" />
                Send Bulk Message
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/members/bulk-upload")}>
                <Upload className="mr-2 h-4 w-4" />
                Import Members
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}