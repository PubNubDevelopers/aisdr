import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db";

async function getOrCreateDevUser() {
  // In development without Supabase, use a seed user
  let team = await prisma.team.findFirst({ where: { name: "Dev Team" } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: "Dev Team" },
    });
  }

  let user = await prisma.user.findFirst({ where: { email: "dev@aisdr.local" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "dev@aisdr.local",
        name: "Dev User",
        role: "SDR",
        teamId: team.id,
      },
    });
  }

  return { userId: user.id, teamId: user.teamId };
}

async function getSessionContext() {
  try {
    // Dev mode: always use dev user bypass
    if (process.env.NODE_ENV === "development") {
      const devUser = await getOrCreateDevUser();
      return createContext(devUser);
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // API routes don't set cookies
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return createContext();

    // Look up our internal user record
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) return createContext();

    return createContext({
      userId: dbUser.id,
      teamId: dbUser.teamId,
    });
  } catch {
    return createContext();
  }
}

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: getSessionContext,
  });
}

export { handler as GET, handler as POST };
