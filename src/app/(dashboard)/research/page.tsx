"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowRight, Building2, CheckCircle2 } from "lucide-react";

export default function ResearchQueuePage() {
  const { data: prospects, isLoading } = trpc.research.queue.useQuery({ status: "all" });

  if (isLoading) return <PageLoading />;

  const pending = prospects?.filter((p) => !p.researchBrief) || [];
  const completed = prospects?.filter((p) => p.researchBrief) || [];

  return (
    <div>
      <PageHeader
        title="Research"
        description="AI research briefs for your prospects"
      />

      <div className="p-6 space-y-6">
        {prospects?.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No prospects to research"
            description="Add prospects in the Prospecting tab, then generate AI research briefs here."
            action={
              <Link href="/prospecting">
                <Button>Go to Prospects</Button>
              </Link>
            }
          />
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Pending Research ({pending.length})
                </h2>
                <div className="space-y-2">
                  {pending.map((prospect) => (
                    <Card key={prospect.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">
                            {prospect.firstName} {prospect.lastName}
                          </p>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {prospect.company.name}
                            {prospect.title && ` — ${prospect.title}`}
                          </p>
                        </div>
                        <Link href={`/research/${prospect.id}`}>
                          <Button size="sm">
                            Generate Brief
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Completed ({completed.length})
                </h2>
                <div className="space-y-2">
                  {completed.map((prospect) => (
                    <Card key={prospect.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">
                              {prospect.firstName} {prospect.lastName}
                            </p>
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {prospect.company.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">Brief Ready</Badge>
                          <Link href={`/research/${prospect.id}`}>
                            <Button variant="outline" size="sm">
                              View Brief
                              <ArrowRight className="ml-1.5 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
