import { generateStructured } from "@/lib/ai/client";
import {
  SCORING_SYSTEM,
  SCORING_SCHEMA,
  buildScoringPrompt,
} from "@/lib/ai/prompts/scoring";
import { prisma } from "@/lib/db";

export interface ProspectScore {
  score: number;
  breakdown: {
    productFit: number;
    companyStage: number;
    titleAuthority: number;
    signalStrength: number;
    competitiveLandscape: number;
  };
  explanation: string;
}

export async function scoreProspect(prospectId: string): Promise<ProspectScore> {
  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: {
      company: {
        include: { signals: true },
      },
    },
  });

  const company = prospect.company;

  const prompt = buildScoringPrompt({
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    prospectTitle: prospect.title ?? undefined,
    companyName: company.name,
    companyDescription: company.description ?? undefined,
    industry: company.industry ?? undefined,
    employeeCount: company.employeeCount ?? undefined,
    fundingStage: company.fundingStage ?? undefined,
    techStack: company.techStack,
    signals: company.signals.map((s) => ({
      type: s.type,
      title: s.title,
      details: JSON.stringify(s.details),
    })),
  });

  const result = await generateStructured<ProspectScore>({
    system: SCORING_SYSTEM,
    prompt,
    schema: SCORING_SCHEMA,
  });

  // Update prospect with score
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      score: result.score,
      scoreExplanation: result.explanation,
    },
  });

  return result;
}
