"use client";

import { SectionCards } from "@/components/reuseable/SectionCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  // Authentication is handled by the (private) layout, no need for checks here

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">{/* <ChartAreaInteractive /> */}</div>
          {/* <DataTable data={data} /> */}
        </div>
      </div>
    </div>
  );
}
