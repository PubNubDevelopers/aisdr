import { generateStructured } from "@/lib/ai/client";
import {
  RESEARCH_BRIEF_SYSTEM,
  RESEARCH_BRIEF_SCHEMA,
  buildResearchPrompt,
} from "@/lib/ai/prompts/research";
import { prisma } from "@/lib/db";
import { getPromptOverrides } from "@/server/routers/settings";

export interface ResearchBriefResult {
  companySnapshot: {
    whatTheyDo: string;
    size: string;
    funding: string;
    growth: string;
  };
  realtimeRelevance: string;
  keyPeople: Array<{ name: string; title: string; background: string }>;
  personalizationHooks: Array<{
    hook: string;
    source: string;
    relevance: string;
  }>;
  competitiveIntel: string;
  recommendedAngle: string;
}

export async function generateResearchBrief(prospectId: string, teamId?: string): Promise<ResearchBriefResult> {
  // Fetch prospect with company data
  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: {
      company: {
        include: { signals: true },
      },
    },
  });

  const company = prospect.company;

  // Build prompt with all available context including rich signal data
  const prompt = buildResearchPrompt({
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    prospectTitle: prospect.title ?? undefined,
    companyName: company.name,
    companyDomain: company.domain ?? undefined,
    companyDescription: company.description ?? undefined,
    industry: company.industry ?? undefined,
    employeeCount: company.employeeCount ?? undefined,
    fundingStage: company.fundingStage ?? undefined,
    techStack: company.techStack,
    enrichmentData: (company.enrichmentData as Record<string, unknown>) ?? undefined,
    newsAndSignals: company.signals.map(
      (s) => `[${s.type}] ${s.title}`
    ),
    signals: company.signals.map((s) => ({
      type: s.type,
      title: s.title,
      source: s.source,
      strength: s.strength,
      details: s.details as Record<string, unknown> | undefined,
    })),
  });

  // Load prompt override if available
  const overrides = teamId ? await getPromptOverrides(teamId) : {};
  const systemPrompt = overrides.researchSystemPrompt || RESEARCH_BRIEF_SYSTEM;

  // Generate structured brief via Claude
  const brief = await generateStructured<ResearchBriefResult>({
    system: systemPrompt,
    prompt,
    schema: RESEARCH_BRIEF_SCHEMA,
  });

  // Store the brief — cast JSON fields for Prisma compatibility
  type BriefData = Parameters<typeof prisma.researchBrief.create>[0]["data"];
  const briefData = {
    companySnapshot: brief.companySnapshot as BriefData["companySnapshot"],
    realtimeRelevance: brief.realtimeRelevance,
    keyPeople: brief.keyPeople as BriefData["keyPeople"],
    personalizationHooks: brief.personalizationHooks as BriefData["personalizationHooks"],
    competitiveIntel: brief.competitiveIntel,
    recommendedAngle: brief.recommendedAngle,
    sourcesUsed: ["enrichment_data", "company_profile", "signals"],
  };

  await prisma.researchBrief.upsert({
    where: { prospectId },
    create: { prospectId, ...briefData },
    update: briefData,
  });

  // Update prospect status
  await prisma.prospect.update({
    where: { id: prospectId },
    data: { status: "RESEARCHED" },
  });

  return brief;
}
