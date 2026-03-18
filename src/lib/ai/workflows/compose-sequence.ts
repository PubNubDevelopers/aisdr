import { generateStructured } from "@/lib/ai/client";
import {
  COMPOSE_SEQUENCE_SYSTEM,
  SEQUENCE_BATCH_SCHEMA,
  buildSequenceBatchPrompt,
} from "@/lib/ai/prompts/compose";
import { getStepsForBatch, SEQUENCE_PLAYBOOK } from "@/lib/ai/data/sequence-playbook";
import { matchContent, formatContentForPrompt } from "@/lib/ai/data/content-matcher";
import { prisma } from "@/lib/db";
import { getTalkTrackInsights, isGongConfigured } from "@/lib/integrations/gong/client";
import { getPromptOverrides } from "@/server/routers/settings";
import crypto from "crypto";

interface BatchResult {
  steps: Array<{
    step: number;
    content: string;
    subject: string | null;
    subjectVariants: string[];
    voicemail: string | null;
  }>;
  batchSummary: string;
}

export async function composeFullSequence(params: {
  prospectId: string;
  userId: string;
  teamId: string;
}): Promise<{ sequenceId: string; messageCount: number }> {
  const { prospectId, userId, teamId } = params;

  // 1. Fetch prospect with research brief
  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: {
      company: true,
      researchBrief: true,
    },
  });

  if (!prospect.researchBrief) {
    throw new Error("Research brief required before generating a sequence. Generate a brief first.");
  }

  const brief = prospect.researchBrief;
  const briefData = {
    companySnapshot: brief.companySnapshot as Record<string, string>,
    realtimeRelevance: brief.realtimeRelevance,
    personalizationHooks: brief.personalizationHooks as Array<{
      hook: string;
      source: string;
      relevance: string;
    }>,
    competitiveIntel: brief.competitiveIntel ?? undefined,
    recommendedAngle: brief.recommendedAngle,
  };

  // 2. Match content library to prospect's industry
  const matched = matchContent({
    industry: prospect.company.industry ?? undefined,
    realtimeRelevance: brief.realtimeRelevance,
    recommendedAngle: brief.recommendedAngle,
    competitiveIntel: brief.competitiveIntel ?? undefined,
  });
  const contentSection = formatContentForPrompt(matched);

  // 3. Fetch Gong insights (optional)
  let gongInsights: Awaited<ReturnType<typeof getTalkTrackInsights>> | undefined;
  if (isGongConfigured()) {
    try {
      gongInsights = await getTalkTrackInsights({
        companyName: prospect.company.name,
        industry: prospect.company.industry ?? undefined,
      });
      if (gongInsights.topTopics.length === 0 && gongInsights.effectiveQuestions.length === 0) {
        gongInsights = undefined;
      }
    } catch {
      // Gong insights are supplementary
    }
  }

  // 4. Load prompt overrides from team settings
  const overrides = await getPromptOverrides(teamId);
  const systemPrompt = overrides.sequenceSystemPrompt || COMPOSE_SEQUENCE_SYSTEM;

  // 5. Generate sequence ID
  const sequenceId = crypto.randomUUID();

  // 6. Generate 3 batches sequentially (each batch needs summary of previous)
  const batchSummaries: string[] = [];
  const allStepResults: BatchResult["steps"] = [];

  for (const batchNum of [1, 2, 3] as const) {
    const steps = getStepsForBatch(batchNum).map((step) => {
      // Apply per-step instruction overrides if set
      const override = overrides.stepInstructions?.[String(step.step)];
      return override ? { ...step, aiInstructions: override } : step;
    });
    const prompt = buildSequenceBatchPrompt({
      batchNumber: batchNum,
      steps,
      prospectName: `${prospect.firstName} ${prospect.lastName}`,
      prospectTitle: prospect.title ?? undefined,
      companyName: prospect.company.name,
      researchBrief: briefData,
      matchedContent: contentSection,
      previousBatchSummaries: batchSummaries.length > 0 ? batchSummaries : undefined,
      gongInsights,
    });

    const result = await generateStructured<BatchResult>({
      system: systemPrompt,
      prompt,
      schema: SEQUENCE_BATCH_SCHEMA,
      maxTokens: 8192,
    });

    allStepResults.push(...result.steps);
    batchSummaries.push(result.batchSummary);
  }

  // 6. Save all messages to database
  type MessageData = Parameters<typeof prisma.message.create>[0]["data"];

  for (const stepResult of allStepResults) {
    const playbookStep = SEQUENCE_PLAYBOOK.find((s) => s.step === stepResult.step);
    if (!playbookStep) continue;

    const variants: unknown[] = [];
    if (stepResult.subjectVariants && stepResult.subjectVariants.length > 0) {
      for (const sv of stepResult.subjectVariants) {
        variants.push({ subject: sv, content: stepResult.content });
      }
    }

    await prisma.message.create({
      data: {
        prospectId,
        channel: playbookStep.channel,
        subject: stepResult.subject,
        content: stepResult.content,
        variants: variants.length > 0
          ? (variants as MessageData["variants"])
          : undefined,
        sequenceId,
        sequenceStep: playbookStep.step,
        stepDay: playbookStep.day,
        stepType: playbookStep.type,
        isBreakup: playbookStep.phase === "breakup",
        createdBy: userId,
      },
    });
  }

  // 7. Update prospect status
  await prisma.prospect.update({
    where: { id: prospectId },
    data: { status: "OUTREACH_DRAFTED" },
  });

  return { sequenceId, messageCount: allStepResults.length };
}
