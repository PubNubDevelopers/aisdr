import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/db";

export interface PromptOverrides {
  /** Custom system prompt for research brief generation (replaces RESEARCH_BRIEF_SYSTEM) */
  researchSystemPrompt?: string;
  /** Custom system prompt for sequence generation (replaces COMPOSE_SEQUENCE_SYSTEM) */
  sequenceSystemPrompt?: string;
  /** Custom system prompt for single-channel generation (replaces COMPOSE_SYSTEM) */
  singleSystemPrompt?: string;
  /** Per-step instruction overrides. Key is step number (1-12), value is the custom instruction. */
  stepInstructions?: Record<string, string>;
}

interface TeamSettings {
  safeMode?: boolean;
  promptOverrides?: PromptOverrides;
}

function parseSettings(raw: unknown): TeamSettings {
  if (raw && typeof raw === "object") return raw as TeamSettings;
  return {};
}

/** Get prompt overrides for a team, or empty object if none set */
export async function getPromptOverrides(teamId: string): Promise<PromptOverrides> {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  const settings = parseSettings(team.settings);
  return settings.promptOverrides ?? {};
}

/** Throws if safe mode is enabled for the given team. Call this before any external write. */
export async function assertNotSafeMode(teamId: string) {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  const settings = parseSettings(team.settings);
  if (settings.safeMode) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Safe Mode is ON — external writes (Salesforce, Outreach) are blocked. Disable Safe Mode in Settings to proceed.",
    });
  }
}

export const settingsRouter = router({
  // Get current team settings
  get: protectedProcedure.query(async ({ ctx }) => {
    const team = await ctx.prisma.team.findUniqueOrThrow({
      where: { id: ctx.teamId },
    });
    const settings = parseSettings(team.settings);
    return {
      safeMode: settings.safeMode ?? true, // default ON
    };
  }),

  // Toggle safe mode
  toggleSafeMode: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findUniqueOrThrow({
        where: { id: ctx.teamId },
      });
      const settings = parseSettings(team.settings);
      settings.safeMode = input.enabled;

      await ctx.prisma.team.update({
        where: { id: ctx.teamId },
        data: { settings: settings as Parameters<typeof ctx.prisma.team.update>[0]["data"]["settings"] },
      });

      return { safeMode: input.enabled };
    }),

  // ── Prompt Overrides ─────────────────────────────────────────

  // Get prompt overrides
  getPromptOverrides: protectedProcedure.query(async ({ ctx }) => {
    const team = await ctx.prisma.team.findUniqueOrThrow({
      where: { id: ctx.teamId },
    });
    const settings = parseSettings(team.settings);
    return settings.promptOverrides ?? {};
  }),

  // Update prompt overrides
  updatePromptOverrides: protectedProcedure
    .input(
      z.object({
        researchSystemPrompt: z.string().optional(),
        sequenceSystemPrompt: z.string().optional(),
        singleSystemPrompt: z.string().optional(),
        stepInstructions: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findUniqueOrThrow({
        where: { id: ctx.teamId },
      });
      const settings = parseSettings(team.settings);

      // Merge — only set non-empty values, clear empty ones
      const overrides: PromptOverrides = settings.promptOverrides ?? {};

      if (input.researchSystemPrompt !== undefined) {
        overrides.researchSystemPrompt = input.researchSystemPrompt || undefined;
      }
      if (input.sequenceSystemPrompt !== undefined) {
        overrides.sequenceSystemPrompt = input.sequenceSystemPrompt || undefined;
      }
      if (input.singleSystemPrompt !== undefined) {
        overrides.singleSystemPrompt = input.singleSystemPrompt || undefined;
      }
      if (input.stepInstructions !== undefined) {
        // Clean out empty strings
        const cleaned: Record<string, string> = {};
        for (const [key, val] of Object.entries(input.stepInstructions)) {
          if (val.trim()) cleaned[key] = val;
        }
        overrides.stepInstructions = Object.keys(cleaned).length > 0 ? cleaned : undefined;
      }

      settings.promptOverrides = Object.values(overrides).some((v) => v !== undefined)
        ? overrides
        : undefined;

      await ctx.prisma.team.update({
        where: { id: ctx.teamId },
        data: { settings: settings as Parameters<typeof ctx.prisma.team.update>[0]["data"]["settings"] },
      });

      return settings.promptOverrides ?? {};
    }),

  // Reset all prompt overrides to defaults
  resetPromptOverrides: protectedProcedure.mutation(async ({ ctx }) => {
    const team = await ctx.prisma.team.findUniqueOrThrow({
      where: { id: ctx.teamId },
    });
    const settings = parseSettings(team.settings);
    delete settings.promptOverrides;

    await ctx.prisma.team.update({
      where: { id: ctx.teamId },
      data: { settings: settings as Parameters<typeof ctx.prisma.team.update>[0]["data"]["settings"] },
    });

    return {};
  }),
});
