import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { checkDuplicateInSalesforce, syncProspectToSalesforce, logSalesforceActivity } from "@/lib/integrations/salesforce/sync";
import { scoreProspect } from "@/lib/ai/workflows/score-prospect";
import { discoverProspects, importDiscoveredProspects } from "@/lib/ai/workflows/discover-prospects";
import { assertNotSafeMode } from "./settings";

export const prospectingRouter = router({
  // List all prospects for the current user
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum([
          "NEW", "RESEARCHED", "OUTREACH_DRAFTED", "IN_SEQUENCE",
          "ENGAGED", "MEETING_BOOKED", "DISQUALIFIED",
        ]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { ownerId: ctx.userId };
      if (input.status) where.status = input.status;
      if (input.search) {
        where.OR = [
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
          { company: { name: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      const prospects = await ctx.prisma.prospect.findMany({
        where,
        include: { company: { include: { signals: true } } },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (prospects.length > input.limit) {
        const next = prospects.pop();
        nextCursor = next?.id;
      }

      return { prospects, nextCursor };
    }),

  // Get a single prospect with full details
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.id, ownerId: ctx.userId },
        include: {
          company: { include: { signals: true } },
          researchBrief: true,
          messages: { orderBy: { createdAt: "desc" } },
          sequenceEnrollments: true,
        },
      });
    }),

  // Create a new prospect (manual add)
  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        title: z.string().optional(),
        linkedinUrl: z.string().url().optional(),
        companyName: z.string().min(1),
        companyDomain: z.string().optional(),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check Salesforce dedup
      const dedup = await checkDuplicateInSalesforce({
        email: input.email,
        domain: input.companyDomain,
      });

      // Find or create company
      let company;
      if (input.companyDomain) {
        company = await ctx.prisma.company.upsert({
          where: { domain: input.companyDomain },
          create: {
            name: input.companyName,
            domain: input.companyDomain,
          },
          update: {},
        });
      } else {
        company = await ctx.prisma.company.create({
          data: { name: input.companyName },
        });
      }

      const prospect = await ctx.prisma.prospect.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          title: input.title,
          linkedinUrl: input.linkedinUrl,
          companyId: company.id,
          ownerId: ctx.userId,
          tags: input.tags,
        },
        include: { company: true },
      });

      return {
        prospect,
        salesforceDedup: dedup,
      };
    }),

  // Bulk create from CSV data
  bulkCreate: protectedProcedure
    .input(
      z.object({
        prospects: z.array(
          z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().optional(),
            phone: z.string().optional(),
            title: z.string().optional(),
            companyName: z.string(),
            companyDomain: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: Array<{ success: boolean; name: string; error?: string }> = [];

      for (const p of input.prospects) {
        try {
          let company;
          if (p.companyDomain) {
            company = await ctx.prisma.company.upsert({
              where: { domain: p.companyDomain },
              create: { name: p.companyName, domain: p.companyDomain },
              update: {},
            });
          } else {
            company = await ctx.prisma.company.create({
              data: { name: p.companyName },
            });
          }

          await ctx.prisma.prospect.create({
            data: {
              firstName: p.firstName,
              lastName: p.lastName,
              email: p.email,
              phone: p.phone,
              title: p.title,
              companyId: company.id,
              ownerId: ctx.userId,
            },
          });

          results.push({ success: true, name: `${p.firstName} ${p.lastName}` });
        } catch (error) {
          results.push({
            success: false,
            name: `${p.firstName} ${p.lastName}`,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),

  // Score a prospect
  score: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return scoreProspect(input.id);
    }),

  // Update prospect status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "NEW", "RESEARCHED", "OUTREACH_DRAFTED", "IN_SEQUENCE",
          "ENGAGED", "MEETING_BOOKED", "DISQUALIFIED",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.prospect.update({
        where: { id: input.id, ownerId: ctx.userId },
        data: { status: input.status },
      });
    }),

  // Delete prospect
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.prospect.delete({
        where: { id: input.id, ownerId: ctx.userId },
      });
    }),

  // AI Discovery — search enrichment APIs using a targeting profile, AI ranks results
  discover: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return discoverProspects({
        profileId: input.profileId,
        userId: ctx.userId,
        limit: input.limit,
      });
    }),

  // Import discovered prospects into the pipeline
  importDiscovered: protectedProcedure
    .input(
      z.object({
        prospects: z.array(
          z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().optional(),
            phone: z.string().optional(),
            title: z.string().optional(),
            linkedinUrl: z.string().optional(),
            companyName: z.string(),
            companyDomain: z.string().optional(),
            companyDescription: z.string().optional(),
            industry: z.string().optional(),
            employeeCount: z.number().optional(),
            fundingStage: z.string().optional(),
            techStack: z.array(z.string()).optional(),
            score: z.number().optional(),
            scoreExplanation: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return importDiscoveredProspects({
        prospects: input.prospects.map((p) => ({
          ...p,
          salesforceDedup: { isDuplicate: false },
          source: "discovery",
        })),
        userId: ctx.userId,
      });
    }),

  // Sync prospect to Salesforce (create Account + Contact)
  syncToSalesforce: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertNotSafeMode(ctx.teamId);
      await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.id, ownerId: ctx.userId },
      });
      return syncProspectToSalesforce(input.id);
    }),

  // Log activity in Salesforce
  logActivity: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        subject: z.string(),
        description: z.string(),
        type: z.enum(["Email", "Call", "Other"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNotSafeMode(ctx.teamId);
      const prospect = await ctx.prisma.prospect.findUniqueOrThrow({
        where: { id: input.prospectId, ownerId: ctx.userId },
        include: { company: true },
      });

      return logSalesforceActivity({
        whoId: prospect.salesforceId ?? undefined,
        whatId: prospect.company.salesforceId ?? undefined,
        subject: input.subject,
        description: input.description,
        type: input.type,
      });
    }),
});
