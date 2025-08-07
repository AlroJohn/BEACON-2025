"use client";

import * as React from "react";
import {
  Book,
  BookOpen,
  Frame,
  GalleryVerticalEnd,
  Badge,
  Users,
  Building,
  BarChart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "BEACON EXPO 2025",
      logo: GalleryVerticalEnd,
      plan: "Registration management",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: BarChart,
    },
    {
      title: "Visitors",
      url: "#",
      icon: Users,
      isActive: true,
      items: [
        {
          title: "Events",
          url: "/admin/visitor-events",
        },
        {
          title: "Registered Visitors",
          url: "/admin/visitors",
        },
      ],
    },
    {
      title: "Conference Management",
      url: "",
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: "Events",
          url: "/admin/events",
        },
        {
          title: "Codes",
          url: "/admin/conference-codes",
        },
        {
          title: "TML Members",
          url: "/admin/members/tml",
        },
        {
          title: "Registered Users",
          url: "/admin/conference",
        },
      ],
    },
    {
      title: "Exhibitor Management",
      url: "",
      icon: Building,
      isActive: true,
      items: [
        {
          title: "Codes",
          url: "/admin/exhibitor-codes",
        },
        {
          title: "Exhibit Members",
          url: "/admin/members/exhibitor",
        },
        {
          title: "Registrered User ",
          url: "/admin/exhibitors",
        },
      ],
    },
    {
      title: "Sponsor Management",
      url: "",
      icon: Building,
      isActive: true,
      items: [
        {
          title: "Registrered Sponsors ",
          url: "/admin/sponsors",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
