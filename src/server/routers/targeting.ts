import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const criteriaSchema = z.object({
  industries: z.array(z.string()).default([]),
  companySize: z.string().default(""),
  titles: z.array(z.string()).default([]),
  techSignals: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
});

export const targetingRouter = router({
  // List all targeting profiles for the team
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.targetingProfile.findMany({
      where: { teamId: ctx.teamId },
      orderBy: { updatedAt: "desc" },
    });
  }),

  // Get a single profile
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.targetingProfile.findUniqueOrThrow({
        where: { id: input.id, teamId: ctx.teamId },
      });
    }),

  // Create a targeting profile
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        criteria: criteriaSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.targetingProfile.create({
        data: {
          name: input.name,
          description: input.description,
          criteria: input.criteria,
          teamId: ctx.teamId,
          createdBy: ctx.userId,
        },
      });
    }),

  // Update a targeting profile
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        criteria: criteriaSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.targetingProfile.update({
        where: { id, teamId: ctx.teamId },
        data,
      });
    }),

  // Delete a targeting profile
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.targetingProfile.delete({
        where: { id: input.id, teamId: ctx.teamId },
      });
    }),
});
