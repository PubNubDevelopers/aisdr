"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading-spinner";
import { BriefViewer } from "@/components/research/brief-viewer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PenTool, Sparkles } from "lucide-react";
import type { ResearchBriefData } from "@/types/research";

export default function ResearchBriefPage() {
  const params = useParams();
  const prospectId = params.prospectId as string;

  const utils = trpc.useUtils();
  const { data: brief, isLoading: briefLoading } = trpc.research.get.useQuery({ prospectId });
  const prospect = trpc.prospecting.get.useQuery({ id: prospectId });

  const generateBrief = trpc.research.generate.useMutation({
    onSuccess: () => {
      utils.research.get.invalidate({ prospectId });
      utils.prospecting.get.invalidate({ id: prospectId });
    },
    onError: (err) => {
      console.error("Brief generation failed:", err);
      alert(`Brief generation failed: ${err.message}`);
    },
  });

  if (briefLoading || prospect.isLoading) return <PageLoading />;

  const prospectData = prospect.data;
  if (!prospectData) return <div className="p-6">Prospect not found</div>;

  const prospectName = `${prospectData.firstName} ${prospectData.lastName}`;
  const companyName = prospectData.company.name;

  return (
    <div>
      <PageHeader
        title={`Research: ${prospectName}`}
        description={`${companyName}${prospectData.title ? ` — ${prospectData.title}` : ""}`}
        action={
          brief && (
            <Link href={`/compose?prospectId=${prospectId}`}>
              <Button>
                <PenTool className="mr-2 h-4 w-4" />
                Compose Outreach
              </Button>
            </Link>
          )
        }
      />

      <div className="p-6">
        {brief ? (
          <BriefViewer
            brief={{
              companySnapshot: brief.companySnapshot as unknown as ResearchBriefData["companySnapshot"],
              realtimeRelevance: brief.realtimeRelevance,
              keyPeople: brief.keyPeople as unknown as ResearchBriefData["keyPeople"],
              personalizationHooks: brief.personalizationHooks as unknown as ResearchBriefData["personalizationHooks"],
              competitiveIntel: brief.competitiveIntel ?? "",
              recommendedAngle: brief.recommendedAngle,
            }}
            prospectName={prospectName}
            companyName={companyName}
            signals={prospectData.company.signals?.map((s) => ({
              id: s.id,
              type: s.type,
              title: s.title,
              source: s.source,
              strength: s.strength,
              detectedAt: new Date(s.detectedAt),
            }))}
            onRegenerate={() => generateBrief.mutate({ prospectId })}
            isRegenerating={generateBrief.isPending}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Generate Research Brief</h3>
            <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
              AI will analyze {companyName} and generate a comprehensive research brief
              with PubNub-specific insights, personalization hooks, and recommended outreach angles.
            </p>
            <Button
              className="mt-6"
              size="lg"
              onClick={() => generateBrief.mutate({ prospectId })}
              disabled={generateBrief.isPending}
            >
              {generateBrief.isPending ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {generateBrief.isPending ? "Generating..." : "Generate Brief"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
