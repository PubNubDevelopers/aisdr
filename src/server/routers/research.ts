import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { generateResearchBrief } from "@/lib/ai/workflows/generate-brief";

export const researchRouter = router({
  // Generate a research brief for a prospect
  generate: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
      });
      return generateResearchBrief(input.prospectId, ctx.teamId);
    }),

  // Get existing brief for a prospect
  get: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.researchBrief.findUnique({
        where: { prospectId: input.prospectId },
        include: {
          prospect: {
            include: { company: true },
          },
        },
      });
    }),

  // Regenerate a specific section of the brief
  regenerateSection: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        section: z.enum([
          "companySnapshot",
          "realtimeRelevance",
          "keyPeople",
          "personalizationHooks",
          "competitiveIntel",
          "recommendedAngle",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
      });
      // For MVP, regenerate the full brief (section-level regen is a future enhancement)
      return generateResearchBrief(input.prospectId, ctx.teamId);
    }),

  // List prospects with their brief status (research queue)
  queue: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "completed", "all"]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { ownerId: ctx.userId };

      if (input.status === "pending") {
        where.researchBrief = null;
        where.status = "NEW";
      } else if (input.status === "completed") {
        where.researchBrief = { isNot: null };
      }

      return ctx.prisma.prospect.findMany({
        where,
        include: {
          company: true,
          researchBrief: { select: { id: true, updatedAt: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
