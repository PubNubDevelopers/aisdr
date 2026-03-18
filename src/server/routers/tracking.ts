import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { generateStructured } from "@/lib/ai/client";
import { ANALYSIS_SYSTEM, ENGAGEMENT_ANALYSIS_SCHEMA } from "@/lib/ai/prompts/analysis";

export const trackingRouter = router({
  // Get engagement summary for the current user
  summary: protectedProcedure.query(async ({ ctx }) => {
    const [totalProspects, byStatus, recentMessages, hotProspects] = await Promise.all([
      ctx.prisma.prospect.count({ where: { ownerId: ctx.userId } }),
      ctx.prisma.prospect.groupBy({
        by: ["status"],
        where: { ownerId: ctx.userId },
        _count: true,
      }),
      ctx.prisma.message.findMany({
        where: { createdBy: ctx.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          prospect: {
            select: { firstName: true, lastName: true, company: { select: { name: true } } },
          },
        },
      }),
      // Hot prospects: opened/clicked but not replied
      ctx.prisma.message.findMany({
        where: {
          createdBy: ctx.userId,
          openedAt: { not: null },
          repliedAt: null,
        },
        orderBy: { openedAt: "desc" },
        take: 10,
        include: {
          prospect: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
              company: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    );

    const sent = recentMessages.filter((m) => m.status === "SENT" || m.sentAt);
    const opened = recentMessages.filter((m) => m.openedAt);
    const clicked = recentMessages.filter((m) => m.clickedAt);
    const replied = recentMessages.filter((m) => m.repliedAt);

    return {
      totalProspects,
      byStatus: statusMap,
      recentMessages: recentMessages.slice(0, 20),
      engagement: {
        sent: sent.length,
        opened: opened.length,
        clicked: clicked.length,
        replied: replied.length,
        openRate: sent.length > 0 ? Math.round((opened.length / sent.length) * 100) : 0,
        clickRate: opened.length > 0 ? Math.round((clicked.length / opened.length) * 100) : 0,
        replyRate: sent.length > 0 ? Math.round((replied.length / sent.length) * 100) : 0,
      },
      hotProspects: hotProspects.map((m) => ({
        prospectId: m.prospect.id,
        prospectName: `${m.prospect.firstName} ${m.prospect.lastName}`,
        companyName: m.prospect.company.name,
        status: m.prospect.status,
        channel: m.channel,
        openedAt: m.openedAt,
        clickedAt: m.clickedAt,
        suggestion: m.clickedAt
          ? "High interest — try a phone call or LinkedIn follow-up"
          : "Opened but didn't click — send a follow-up with a different angle",
      })),
    };
  }),

  // Get engagement data for a specific prospect
  prospectEngagement: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.message.findMany({
        where: {
          prospectId: input.prospectId,
          createdBy: ctx.userId,
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        messages,
        totalSent: messages.filter((m) => m.sentAt).length,
        totalOpened: messages.filter((m) => m.openedAt).length,
        totalClicked: messages.filter((m) => m.clickedAt).length,
        totalReplied: messages.filter((m) => m.repliedAt).length,
      };
    }),

  // AI-powered engagement analysis
  analyzeEngagement: protectedProcedure.mutation(async ({ ctx }) => {
    const messages = await ctx.prisma.message.findMany({
      where: { createdBy: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        prospect: {
          select: {
            firstName: true,
            lastName: true,
            title: true,
            company: { select: { name: true, industry: true } },
          },
        },
      },
    });

    if (messages.length === 0) {
      return {
        summary: "No messages to analyze yet. Start composing outreach to get AI-powered insights.",
        topPerformers: [],
        messagingInsights: [],
      };
    }

    // Build analysis prompt with real data
    const sent = messages.filter((m) => m.sentAt);
    const opened = messages.filter((m) => m.openedAt);
    const clicked = messages.filter((m) => m.clickedAt);
    const replied = messages.filter((m) => m.repliedAt);

    const byChannel = {
      EMAIL: messages.filter((m) => m.channel === "EMAIL"),
      LINKEDIN: messages.filter((m) => m.channel === "LINKEDIN"),
      PHONE: messages.filter((m) => m.channel === "PHONE"),
    };

    const prompt = `Analyze the following outreach engagement data and provide actionable insights.

## Overall Metrics
- Total messages: ${messages.length}
- Sent: ${sent.length}
- Opened: ${opened.length} (${sent.length > 0 ? Math.round((opened.length / sent.length) * 100) : 0}% open rate)
- Clicked: ${clicked.length} (${opened.length > 0 ? Math.round((clicked.length / opened.length) * 100) : 0}% click rate)
- Replied: ${replied.length} (${sent.length > 0 ? Math.round((replied.length / sent.length) * 100) : 0}% reply rate)

## By Channel
- Email: ${byChannel.EMAIL.length} messages, ${byChannel.EMAIL.filter((m) => m.repliedAt).length} replies
- LinkedIn: ${byChannel.LINKEDIN.length} messages, ${byChannel.LINKEDIN.filter((m) => m.repliedAt).length} replies
- Phone: ${byChannel.PHONE.length} messages

## Engaged Prospects (opened/clicked/replied)
${opened
  .slice(0, 15)
  .map(
    (m) =>
      `- ${m.prospect.firstName} ${m.prospect.lastName} (${m.prospect.title ?? "unknown title"}) at ${m.prospect.company.name} (${m.prospect.company.industry ?? "unknown industry"}) — ${m.channel}${m.repliedAt ? " REPLIED" : m.clickedAt ? " CLICKED" : " OPENED"}`
  )
  .join("\n")}

## Sample Message Subjects/Content
${sent
  .slice(0, 10)
  .map(
    (m) =>
      `- [${m.channel}] ${m.subject ?? "(no subject)"}: ${m.content.substring(0, 100)}...${m.repliedAt ? " → REPLIED" : m.openedAt ? " → OPENED" : ""}`
  )
  .join("\n")}

Provide specific, actionable insights focused on what messaging is working and what needs to change.`;

    const analysis = await generateStructured<{
      summary: string;
      topPerformers: Array<{
        prospectName: string;
        insight: string;
        suggestedAction: string;
      }>;
      messagingInsights: Array<{
        finding: string;
        recommendation: string;
      }>;
    }>({
      system: ANALYSIS_SYSTEM,
      prompt,
      schema: ENGAGEMENT_ANALYSIS_SCHEMA,
    });

    return analysis;
  }),
});
