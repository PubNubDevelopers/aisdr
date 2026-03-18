import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const DEV_EMAIL = "dev@aisdr.local";
const DEV_TEAM = "Dev Team";

async function getOrCreateAppUser() {
  // Get or create the default team and user for this app instance
  let team = await prisma.team.findFirst({ where: { name: DEV_TEAM } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: DEV_TEAM },
    });
  }

  let user = await prisma.user.findFirst({ where: { email: DEV_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEV_EMAIL,
        name: "SDR User",
        role: "SDR",
        teamId: team.id,
      },
    });
  }

  return { userId: user.id, teamId: user.teamId };
}

async function getSessionContext() {
  try {
    // Dev mode: always bypass auth
    if (process.env.NODE_ENV === "development" || process.env.BYPASS_AUTH === "true") {
      const appUser = await getOrCreateAppUser();
      return createContext(appUser);
    }

    // Production: check the aisdr-auth cookie (set by /api/auth/login)
    const cookieStore = cookies();
    const authCookie = cookieStore.get("aisdr-auth");

    if (authCookie?.value === "authenticated") {
      const appUser = await getOrCreateAppUser();
      return createContext(appUser);
    }

    // Not authenticated
    return createContext();
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
