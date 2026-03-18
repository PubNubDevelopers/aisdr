"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Building2, Zap, Users, Lightbulb, Shield, Target, Radio } from "lucide-react";
import { SignalList } from "@/components/shared/signal-badges";
import type { ResearchBriefData, CompanySnapshot, PersonalizationHook, KeyPerson } from "@/types/research";

interface Signal {
  id: string;
  type: string;
  title: string;
  source: string;
  strength: number;
  detectedAt: Date;
  details?: unknown;
}

interface BriefViewerProps {
  brief: ResearchBriefData;
  prospectName: string;
  companyName: string;
  signals?: Signal[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function BriefViewer({
  brief,
  prospectName,
  companyName,
  signals,
  onRegenerate,
  isRegenerating,
}: BriefViewerProps) {
  const snapshot = brief.companySnapshot as CompanySnapshot;
  const hooks = brief.personalizationHooks as PersonalizationHook[];
  const people = brief.keyPeople as KeyPerson[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Research Brief</h2>
          <p className="text-sm text-muted-foreground">
            {prospectName} at {companyName}
          </p>
        </div>
        {onRegenerate && (
          <Button variant="outline" onClick={onRegenerate} disabled={isRegenerating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        )}
      </div>

      {/* Company Snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Company Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">What They Do</p>
            <p className="text-sm">{snapshot.whatTheyDo}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Size</p>
            <p className="text-sm">{snapshot.size}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Funding</p>
            <p className="text-sm">{snapshot.funding}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Growth</p>
            <p className="text-sm">{snapshot.growth}</p>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Relevance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-yellow-500" />
            Why PubNub Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{brief.realtimeRelevance}</p>
        </CardContent>
      </Card>

      {/* Key People */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Key People
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {people.map((person, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{person.title}</p>
                  <p className="text-xs text-muted-foreground">{person.background}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalization Hooks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-orange-500" />
            Personalization Hooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hooks.map((hook, i) => (
              <div key={i} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{hook.hook}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">{hook.source}</Badge>
                  <span className="text-xs text-muted-foreground">{hook.relevance}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buying Signals */}
      {signals && signals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4 text-green-500" />
              Buying Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignalList signals={signals} />
          </CardContent>
        </Card>
      )}

      {/* Competitive Intel */}
      {brief.competitiveIntel && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Competitive Intel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{brief.competitiveIntel}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommended Angle */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Recommended Angle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{brief.recommendedAngle}</p>
        </CardContent>
      </Card>
    </div>
  );
}
