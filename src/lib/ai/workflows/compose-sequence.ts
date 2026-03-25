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

/** Prepare shared context for all batches — called once before batch 1 */
export async function prepareSequenceContext(params: {
  prospectId: string;
  teamId: string;
}): Promise<{
  sequenceId: string;
  prospectName: string;
  prospectTitle: string | undefined;
  companyName: string;
  briefData: {
    companySnapshot: Record<string, string>;
    realtimeRelevance: string;
    personalizationHooks: Array<{ hook: string; source: string; relevance: string }>;
    competitiveIntel?: string;
    recommendedAngle: string;
  };
  contentSection: string;
  systemPrompt: string;
  stepInstructions: Record<string, string> | undefined;
  gongInsights?: {
    topTopics: string[];
    effectiveQuestions: string[];
    commonObjections: string[];
    winningTalkTracks: string[];
  };
}> {
  const { prospectId, teamId } = params;

  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: { company: true, researchBrief: true },
  });

  if (!prospect.researchBrief) {
    throw new Error("Research brief required before generating a sequence.");
  }

  const brief = prospect.researchBrief;
  const briefData = {
    companySnapshot: brief.companySnapshot as Record<string, string>,
    realtimeRelevance: brief.realtimeRelevance,
    personalizationHooks: brief.personalizationHooks as Array<{
      hook: string; source: string; relevance: string;
    }>,
    competitiveIntel: brief.competitiveIntel ?? undefined,
    recommendedAngle: brief.recommendedAngle,
  };

  const matched = matchContent({
    industry: prospect.company.industry ?? undefined,
    realtimeRelevance: brief.realtimeRelevance,
    recommendedAngle: brief.recommendedAngle,
    competitiveIntel: brief.competitiveIntel ?? undefined,
  });

  const overrides = await getPromptOverrides(teamId);

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
      // supplementary
    }
  }

  return {
    sequenceId: crypto.randomUUID(),
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    prospectTitle: prospect.title ?? undefined,
    companyName: prospect.company.name,
    briefData,
    contentSection: formatContentForPrompt(matched),
    systemPrompt: overrides.sequenceSystemPrompt || COMPOSE_SEQUENCE_SYSTEM,
    stepInstructions: overrides.stepInstructions ?? undefined,
    gongInsights,
  };
}

/** Generate a single batch (1, 2, or 3) and save messages to DB */
export async function generateSequenceBatch(params: {
  batchNumber: 1 | 2 | 3;
  sequenceId: string;
  prospectId: string;
  userId: string;
  prospectName: string;
  prospectTitle: string | undefined;
  companyName: string;
  briefData: {
    companySnapshot: Record<string, string>;
    realtimeRelevance: string;
    personalizationHooks: Array<{ hook: string; source: string; relevance: string }>;
    competitiveIntel?: string;
    recommendedAngle: string;
  };
  contentSection: string;
  systemPrompt: string;
  stepInstructions: Record<string, string> | undefined;
  previousBatchSummaries: string[];
  gongInsights?: {
    topTopics: string[];
    effectiveQuestions: string[];
    commonObjections: string[];
    winningTalkTracks: string[];
  };
}): Promise<{ batchSummary: string; stepsGenerated: number }> {
  const {
    batchNumber, sequenceId, prospectId, userId,
    prospectName, prospectTitle, companyName,
    briefData, contentSection, systemPrompt, stepInstructions,
    previousBatchSummaries, gongInsights,
  } = params;

  const steps = getStepsForBatch(batchNumber).map((step) => {
    const override = stepInstructions?.[String(step.step)];
    return override ? { ...step, aiInstructions: override } : step;
  });

  const prompt = buildSequenceBatchPrompt({
    batchNumber,
    steps,
    prospectName,
    prospectTitle,
    companyName,
    researchBrief: briefData,
    matchedContent: contentSection,
    previousBatchSummaries: previousBatchSummaries.length > 0 ? previousBatchSummaries : undefined,
    gongInsights,
  });

  const result = await generateStructured<BatchResult>({
    system: systemPrompt,
    prompt,
    schema: SEQUENCE_BATCH_SCHEMA,
    maxTokens: 8192,
  });

  // Save messages
  type MessageData = Parameters<typeof prisma.message.create>[0]["data"];

  for (const stepResult of result.steps) {
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

  // After batch 3, update prospect status
  if (batchNumber === 3) {
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: "OUTREACH_DRAFTED" },
    });
  }

  return {
    batchSummary: result.batchSummary,
    stepsGenerated: result.steps.length,
  };
}
