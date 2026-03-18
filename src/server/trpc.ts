import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/lib/db";

export type Context = {
  prisma: typeof prisma;
  userId: string | null;
  teamId: string | null;
};

export function createContext(params?: {
  userId?: string;
  teamId?: string;
}): Context {
  return {
    prisma,
    userId: params?.userId ?? null,
    teamId: params?.teamId ?? null,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      teamId: ctx.teamId!,
    },
  });
});
