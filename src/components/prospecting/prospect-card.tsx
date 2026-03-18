"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PenTool, Building2, Mail, Briefcase } from "lucide-react";
import { SignalBadges } from "@/components/shared/signal-badges";
import type { ProspectWithCompany } from "@/types/prospect";

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  NEW: "secondary",
  RESEARCHED: "outline",
  OUTREACH_DRAFTED: "warning",
  IN_SEQUENCE: "default",
  ENGAGED: "success",
  MEETING_BOOKED: "success",
  DISQUALIFIED: "destructive" as "default",
};

const statusLabels: Record<string, string> = {
  NEW: "New",
  RESEARCHED: "Researched",
  OUTREACH_DRAFTED: "Drafted",
  IN_SEQUENCE: "In Sequence",
  ENGAGED: "Engaged",
  MEETING_BOOKED: "Meeting Booked",
  DISQUALIFIED: "Disqualified",
};

export function ProspectCard({ prospect, signals }: { prospect: ProspectWithCompany; signals?: Array<{ id: string; type: string; title: string; source: string; strength: number; detectedAt: Date }> }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {prospect.firstName} {prospect.lastName}
              </h3>
              <Badge variant={statusColors[prospect.status] || "secondary"}>
                {statusLabels[prospect.status] || prospect.status}
              </Badge>
              {prospect.score && (
                <Badge variant={prospect.score >= 70 ? "success" : prospect.score >= 40 ? "warning" : "secondary"}>
                  Score: {Math.round(prospect.score)}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              {prospect.title && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {prospect.title}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {prospect.company.name}
              </span>
              {prospect.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {prospect.email}
                </span>
              )}
            </div>
            {signals && signals.length > 0 && (
              <div className="mt-2">
                <SignalBadges signals={signals} max={4} />
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Link href={`/research/${prospect.id}`}>
              <Button variant="ghost" size="sm">
                <FileText className="mr-1 h-3 w-3" />
                Research
              </Button>
            </Link>
            <Link href={`/compose?prospectId=${prospect.id}`}>
              <Button variant="ghost" size="sm">
                <PenTool className="mr-1 h-3 w-3" />
                Compose
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
