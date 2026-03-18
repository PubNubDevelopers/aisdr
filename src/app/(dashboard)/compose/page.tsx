"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageEditor } from "@/components/compose/message-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PenTool, ArrowRight, Building2 } from "lucide-react";

export default function ComposePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ComposeContent />
    </Suspense>
  );
}

function ComposeContent() {
  const searchParams = useSearchParams();
  const prospectId = searchParams.get("prospectId");

  // If a specific prospect is selected, show the editor
  if (prospectId) {
    return <ComposeForProspect prospectId={prospectId} />;
  }

  // Otherwise, show list of prospects ready for outreach
  return <ComposeQueue />;
}

function ComposeForProspect({ prospectId }: { prospectId: string }) {
  const { data: prospect, isLoading } = trpc.prospecting.get.useQuery({ id: prospectId });

  if (isLoading) return <PageLoading />;
  if (!prospect) return <div className="p-6">Prospect not found</div>;

  return (
    <div>
      <PageHeader
        title="Compose Outreach"
        description={`${prospect.firstName} ${prospect.lastName} at ${prospect.company.name}`}
      />
      <div className="p-6">
        <MessageEditor
          prospectId={prospectId}
          prospectName={`${prospect.firstName} ${prospect.lastName}`}
          hasResearchBrief={!!prospect.researchBrief}
        />
      </div>
    </div>
  );
}

function ComposeQueue() {
  const { data: prospects, isLoading } = trpc.research.queue.useQuery({ status: "completed" });

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader
        title="Compose"
        description="Draft AI-powered outreach for your researched prospects"
      />
      <div className="p-6">
        {!prospects?.length ? (
          <EmptyState
            icon={PenTool}
            title="No prospects ready for outreach"
            description="Generate research briefs first, then come here to compose personalized outreach."
            action={
              <Link href="/research">
                <Button>Go to Research</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {prospects.map((prospect) => (
              <Card key={prospect.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">
                      {prospect.firstName} {prospect.lastName}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {prospect.company.name}
                    </p>
                  </div>
                  <Link href={`/compose?prospectId=${prospect.id}`}>
                    <Button size="sm">
                      Compose
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
