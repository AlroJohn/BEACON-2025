
"use client";

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, Building, Calendar, Trophy } from "lucide-react"
import { useRegistrantCounts } from "@/hooks/tanstasck-query/useRegistrantCounts"
import { Skeleton } from "@/components/ui/skeleton"

export function SectionCards() {
  const { data: counts, isLoading, error } = useRegistrantCounts();

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-destructive">Failed to load registrant data</p>
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Visitors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {counts?.VISITOR || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users className="w-4 h-4" />
              Registered
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            General event visitors <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total visitor registrations
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Conference</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {counts?.CONFERENCE || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Calendar className="w-4 h-4" />
              Registered
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Conference attendees <Calendar className="size-4" />
          </div>
          <div className="text-muted-foreground">
            BEACON 2025 Conference registrations
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Exhibitors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {counts?.EXHIBITOR || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Building className="w-4 h-4" />
              Registered
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Exhibition participants <Building className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Companies showcasing products
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Sponsors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {counts?.SPONSOR || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Trophy className="w-4 h-4" />
              Registered
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Event sponsors <Trophy className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Sponsorship interest registrations
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
