import { generateStructured } from "@/lib/ai/client";
import {
  COMPOSE_SYSTEM,
  COMPOSE_EMAIL_SCHEMA,
  COMPOSE_LINKEDIN_SCHEMA,
  COMPOSE_PHONE_SCHEMA,
  buildComposePrompt,
} from "@/lib/ai/prompts/compose";
import { prisma } from "@/lib/db";
import { getTalkTrackInsights, isGongConfigured } from "@/lib/integrations/gong/client";
import { getPromptOverrides } from "@/server/routers/settings";
import type { Channel } from "@prisma/client";

export interface EmailVariant {
  subject: string;
  content: string;
  approach: string;
}

export interface LinkedInMessages {
  connectionRequest: string;
  followUpMessage: string;
}

export interface CallScript {
  opener: string;
  valueStatement: string;
  discoveryQuestions: string[];
  objectionHandling: Array<{ objection: string; response: string }>;
  closeForNext: string;
}

const CHANNEL_SCHEMAS = {
  EMAIL: COMPOSE_EMAIL_SCHEMA,
  LINKEDIN: COMPOSE_LINKEDIN_SCHEMA,
  PHONE: COMPOSE_PHONE_SCHEMA,
} as const;

export async function composeOutreach(params: {
  prospectId: string;
  channel: Channel;
  userId: string;
  teamId?: string;
}): Promise<{ messages: Array<{ channel: Channel; subject?: string; content: string; variants?: unknown }> }> {
  const { prospectId, channel, userId, teamId } = params;

  // Fetch prospect with research brief
  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: {
      company: true,
      researchBrief: true,
    },
  });

  if (!prospect.researchBrief) {
    throw new Error("Research brief required before composing outreach. Generate a brief first.");
  }

  const brief = prospect.researchBrief;

  // Fetch Gong talk track insights if configured
  let gongInsights: Awaited<ReturnType<typeof getTalkTrackInsights>> | undefined;
  if (isGongConfigured()) {
    try {
      gongInsights = await getTalkTrackInsights({
        companyName: prospect.company.name,
        industry: prospect.company.industry ?? undefined,
      });
      // Only include if there's useful data
      if (
        gongInsights.topTopics.length === 0 &&
        gongInsights.effectiveQuestions.length === 0
      ) {
        gongInsights = undefined;
      }
    } catch {
      // Gong insights are supplementary — don't fail outreach composition
    }
  }

  const prompt = buildComposePrompt({
    channel,
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    prospectTitle: prospect.title ?? undefined,
    companyName: prospect.company.name,
    researchBrief: {
      companySnapshot: brief.companySnapshot as Record<string, string>,
      realtimeRelevance: brief.realtimeRelevance,
      personalizationHooks: brief.personalizationHooks as Array<{
        hook: string;
        source: string;
        relevance: string;
      }>,
      competitiveIntel: brief.competitiveIntel ?? undefined,
      recommendedAngle: brief.recommendedAngle,
    },
    gongInsights,
  });

  // Apply prompt override if available
  const overrides = teamId ? await getPromptOverrides(teamId) : {};
  const systemPrompt = overrides.singleSystemPrompt || COMPOSE_SYSTEM;

  const schema = CHANNEL_SCHEMAS[channel];
  const result = await generateStructured<Record<string, unknown>>({
    system: systemPrompt,
    prompt,
    schema,
  });

  // Save messages to database based on channel
  const savedMessages: Array<{ channel: Channel; subject?: string; content: string; variants?: unknown }> = [];

  if (channel === "EMAIL") {
    const emailResult = result as unknown as { variants: EmailVariant[] };
    const primary = emailResult.variants[0];
    const msg = await prisma.message.create({
      data: {
        prospectId,
        channel: "EMAIL",
        subject: primary.subject,
        content: primary.content,
        variants: emailResult.variants.slice(1) as unknown as Parameters<typeof prisma.message.create>[0]["data"]["variants"],
        createdBy: userId,
      },
    });
    savedMessages.push({
      channel: "EMAIL",
      subject: msg.subject ?? undefined,
      content: msg.content,
      variants: emailResult.variants,
    });
  } else if (channel === "LINKEDIN") {
    const linkedinResult = result as unknown as LinkedInMessages;
    const msg = await prisma.message.create({
      data: {
        prospectId,
        channel: "LINKEDIN",
        content: linkedinResult.connectionRequest,
        variants: [{ followUp: linkedinResult.followUpMessage }],
        createdBy: userId,
      },
    });
    savedMessages.push({
      channel: "LINKEDIN",
      content: msg.content,
      variants: linkedinResult,
    });
  } else if (channel === "PHONE") {
    const phoneResult = result as unknown as CallScript;
    const fullScript = [
      `**Opener:** ${phoneResult.opener}`,
      `**Value:** ${phoneResult.valueStatement}`,
      `**Discovery Questions:**\n${phoneResult.discoveryQuestions.map((q) => `- ${q}`).join("\n")}`,
      `**Objection Handling:**\n${phoneResult.objectionHandling.map((o) => `- "${o.objection}" → ${o.response}`).join("\n")}`,
      `**Close:** ${phoneResult.closeForNext}`,
    ].join("\n\n");

    const msg = await prisma.message.create({
      data: {
        prospectId,
        channel: "PHONE",
        content: fullScript,
        variants: phoneResult as unknown as Parameters<typeof prisma.message.create>[0]["data"]["variants"],
        createdBy: userId,
      },
    });
    savedMessages.push({
      channel: "PHONE",
      content: msg.content,
      variants: phoneResult,
    });
  }

  // Update prospect status
  await prisma.prospect.update({
    where: { id: prospectId },
    data: { status: "OUTREACH_DRAFTED" },
  });

  return { messages: savedMessages };
}
