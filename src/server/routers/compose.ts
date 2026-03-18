import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { composeOutreach } from "@/lib/ai/workflows/compose-outreach";
import { composeFullSequence } from "@/lib/ai/workflows/compose-sequence";

export const composeRouter = router({
  // Generate outreach messages for a prospect
  generate: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        channel: z.enum(["EMAIL", "LINKEDIN", "PHONE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
      });
      return composeOutreach({
        prospectId: input.prospectId,
        channel: input.channel,
        userId: ctx.userId,
        teamId: ctx.teamId,
      });
    }),

  // List messages for a prospect
  listMessages: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        channel: z.enum(["EMAIL", "LINKEDIN", "PHONE"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        prospectId: input.prospectId,
        createdBy: ctx.userId,
      };
      if (input.channel) where.channel = input.channel;

      return ctx.prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }),

  // Update a message (SDR edits)
  updateMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        content: z.string().optional(),
        subject: z.string().optional(),
        status: z.enum(["DRAFT", "APPROVED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { messageId, ...data } = input;
      return ctx.prisma.message.update({
        where: { id: messageId, createdBy: ctx.userId },
        data,
      });
    }),

  // Approve a message
  approve: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.message.update({
        where: { id: input.messageId, createdBy: ctx.userId },
        data: { status: "APPROVED" },
      });
    }),

  // Generate all channels at once
  generateAll: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
      });

      const channels = ["EMAIL", "LINKEDIN", "PHONE"] as const;
      const results = await Promise.all(
        channels.map((channel) =>
          composeOutreach({
            prospectId: input.prospectId,
            channel,
            userId: ctx.userId,
            teamId: ctx.teamId,
          })
        )
      );

      return {
        email: results[0],
        linkedin: results[1],
        phone: results[2],
      };
    }),

  // ── Sequence-Aware Procedures ─────────────────────────────

  // Generate full 12-step outreach sequence
  generateSequence: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
      });
      return composeFullSequence({
        prospectId: input.prospectId,
        userId: ctx.userId,
        teamId: ctx.teamId,
      });
    }),

  // Get all messages for a generated sequence
  getSequence: protectedProcedure
    .input(z.object({ sequenceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.message.findMany({
        where: { sequenceId: input.sequenceId, createdBy: ctx.userId },
        orderBy: { sequenceStep: "asc" },
      });
    }),

  // List sequences for a prospect (returns distinct sequenceIds)
  listSequences: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.message.findMany({
        where: {
          prospectId: input.prospectId,
          sequenceId: { not: null },
          createdBy: ctx.userId,
        },
        select: { sequenceId: true, createdAt: true },
        distinct: ["sequenceId"],
        orderBy: { createdAt: "desc" },
      });
      return messages;
    }),

  // Approve all messages in a sequence at once
  approveAll: protectedProcedure
    .input(z.object({ sequenceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.message.updateMany({
        where: {
          sequenceId: input.sequenceId,
          createdBy: ctx.userId,
          status: "DRAFT",
        },
        data: { status: "APPROVED" },
      });
    }),
});
