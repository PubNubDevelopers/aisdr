"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Send,
  Eye,
  MousePointerClick,
  MessageSquare,
  Users,
  Flame,
  Brain,
  RefreshCw,
  Percent,
} from "lucide-react";
import Link from "next/link";

export default function TrackingPage() {
  const { data, isLoading } = trpc.tracking.summary.useQuery();
  const analyzeMutation = trpc.tracking.analyzeEngagement.useMutation();
  const [analysis, setAnalysis] = useState<{
    summary: string;
    topPerformers: Array<{ prospectName: string; insight: string; suggestedAction: string }>;
    messagingInsights: Array<{ finding: string; recommendation: string }>;
  } | null>(null);

  if (isLoading) return <PageLoading />;
  if (!data) return null;

  const stats = [
    { label: "Total Prospects", value: data.totalProspects, icon: Users },
    { label: "Sent", value: data.engagement.sent, icon: Send },
    { label: "Opened", value: data.engagement.opened, icon: Eye },
    { label: "Clicked", value: data.engagement.clicked, icon: MousePointerClick },
    { label: "Replied", value: data.engagement.replied, icon: MessageSquare },
  ];

  const rates = [
    { label: "Open Rate", value: data.engagement.openRate, icon: Eye },
    { label: "Click Rate", value: data.engagement.clickRate, icon: MousePointerClick },
    { label: "Reply Rate", value: data.engagement.replyRate, icon: Percent },
  ];

  async function handleAnalyze() {
    const result = await analyzeMutation.mutateAsync();
    setAnalysis(result);
  }

  return (
    <div>
      <PageHeader
        title="Tracking"
        description="Monitor engagement and outreach performance"
        action={
          <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
            <Brain className={`mr-2 h-4 w-4 ${analyzeMutation.isPending ? "animate-pulse" : ""}`} />
            {analyzeMutation.isPending ? "Analyzing..." : "AI Analysis"}
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engagement Rates */}
        <div className="grid gap-4 md:grid-cols-3">
          {rates.map((rate) => (
            <Card key={rate.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <rate.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rate.value}%</p>
                  <p className="text-xs text-muted-foreground">{rate.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Analysis Results */}
        {analysis && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                AI Engagement Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{analysis.summary}</p>

              {analysis.topPerformers.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Top Performers</h4>
                  <div className="space-y-2">
                    {analysis.topPerformers.map((p, i) => (
                      <div key={i} className="rounded-lg border bg-background p-3">
                        <p className="text-sm font-medium">{p.prospectName}</p>
                        <p className="text-xs text-muted-foreground">{p.insight}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {p.suggestedAction}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.messagingInsights.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Messaging Insights</h4>
                  <div className="space-y-2">
                    {analysis.messagingInsights.map((insight, i) => (
                      <div key={i} className="rounded-lg border bg-background p-3">
                        <p className="text-sm">{insight.finding}</p>
                        <p className="mt-1 text-xs font-medium text-primary">{insight.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
                <RefreshCw className={`mr-1 h-3 w-3 ${analyzeMutation.isPending ? "animate-spin" : ""}`} />
                Re-analyze
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hot Prospects */}
        {data.hotProspects.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Hot Prospects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.hotProspects.map((hp) => (
                  <div key={hp.prospectId} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Link
                        href={`/research/${hp.prospectId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {hp.prospectName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {hp.companyName} — {hp.channel}
                      </p>
                      <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                        {hp.suggestion}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={hp.clickedAt ? "success" : "warning"}>
                        {hp.clickedAt ? "Clicked" : "Opened"}
                      </Badge>
                      <Link href={`/compose?prospectId=${hp.prospectId}`}>
                        <Button variant="outline" size="sm">Follow Up</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {Object.entries(data.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{status.replace(/_/g, " ")}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {msg.prospect.firstName} {msg.prospect.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {msg.prospect.company.name} — {msg.channel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{msg.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
