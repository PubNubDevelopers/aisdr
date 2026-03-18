import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { pushProspectToOutreach, bulkPushToOutreach } from "@/lib/integrations/outreach/sequences";
import { listSequences, isOutreachConfigured } from "@/lib/integrations/outreach/client";
import { assertNotSafeMode } from "./settings";

export const sequencesRouter = router({
  // List sequence enrollments for the current user's prospects
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.sequenceEnrollment.findMany({
      where: {
        prospect: { ownerId: ctx.userId },
      },
      include: {
        prospect: {
          include: { company: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });
  }),

  // List available Outreach sequences
  listOutreachSequences: protectedProcedure.query(async () => {
    if (!isOutreachConfigured()) return [];
    return listSequences();
  }),

  // Check if Outreach is configured
  outreachStatus: protectedProcedure.query(() => {
    return { configured: isOutreachConfigured() };
  }),

  // Enroll a prospect in a sequence locally (without Outreach)
  enroll: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        sequenceName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
      });

      const enrollment = await ctx.prisma.sequenceEnrollment.create({
        data: {
          prospectId: input.prospectId,
          sequenceName: input.sequenceName,
        },
      });

      await ctx.prisma.prospect.update({
        where: { id: input.prospectId },
        data: { status: "IN_SEQUENCE" },
      });

      return enrollment;
    }),

  // Push prospect to Outreach sequence
  pushToOutreach: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        outreachSequenceId: z.number(),
        mailboxId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNotSafeMode(ctx.teamId);
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
      });

      return pushProspectToOutreach({
        prospectId: input.prospectId,
        sequenceId: input.outreachSequenceId,
        mailboxId: input.mailboxId,
      });
    }),

  // Bulk push to Outreach
  bulkPushToOutreach: protectedProcedure
    .input(
      z.object({
        prospectIds: z.array(z.string()),
        outreachSequenceId: z.number(),
        mailboxId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNotSafeMode(ctx.teamId);
      // Verify all prospects belong to current user
      const prospects = await ctx.prisma.prospect.findMany({
        where: { id: { in: input.prospectIds }, ownerId: ctx.userId },
        select: { id: true },
      });

      return bulkPushToOutreach({
        prospectIds: prospects.map((p) => p.id),
        sequenceId: input.outreachSequenceId,
        mailboxId: input.mailboxId,
      });
    }),

  // Update enrollment status
  updateStatus: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "REPLIED", "BOUNCED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.sequenceEnrollment.update({
        where: {
          id: input.enrollmentId,
          prospect: { ownerId: ctx.userId },
        },
        data: {
          status: input.status,
          completedAt:
            input.status === "COMPLETED" || input.status === "REPLIED"
              ? new Date()
              : undefined,
        },
      });
    }),
});
