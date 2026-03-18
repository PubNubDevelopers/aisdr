import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/db";
import { fetchCompanyNews, fetchFundingData } from "@/lib/integrations/web/news";
import { getCompanyAppProfile, isApptopiaConfigured } from "@/lib/integrations/apptopia/client";
import { searchCalls, isGongConfigured } from "@/lib/integrations/gong/client";

async function createSignalIfNew(params: {
  companyId: string;
  type: "FUNDING" | "HIRING" | "TECH_CHANGE" | "INTENT" | "NEWS" | "APP_GROWTH" | "LEADERSHIP_CHANGE";
  source: string;
  title: string;
  details: Record<string, unknown>;
  strength: number;
}): Promise<boolean> {
  const existing = await prisma.signal.findFirst({
    where: { companyId: params.companyId, title: params.title },
  });
  if (existing) return false;

  await prisma.signal.create({
    data: {
      ...params,
      details: params.details as Parameters<typeof prisma.signal.create>[0]["data"]["details"],
    },
  });
  return true;
}

export const detectSignals = inngest.createFunction(
  { id: "detect-signals", retries: 2 },
  { event: "signals/detect" },
  async ({ event }) => {
    const { companyId } = event.data;

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    const signalsCreated: string[] = [];

    // 1. News signals
    const news = await fetchCompanyNews(company.name, company.domain ?? undefined);
    for (const item of news) {
      const created = await createSignalIfNew({
        companyId,
        type: "NEWS",
        source: item.source,
        title: item.title,
        details: { url: item.url, snippet: item.snippet, publishedAt: item.publishedAt },
        strength: 0.5,
      });
      if (created) signalsCreated.push(item.title);
    }

    // 2. Funding signals
    const funding = await fetchFundingData(company.name);
    if (funding?.lastRound) {
      const created = await createSignalIfNew({
        companyId,
        type: "FUNDING",
        source: "funding_api",
        title: `${funding.lastRound.type}: ${funding.lastRound.amount}`,
        details: funding.lastRound as unknown as Record<string, unknown>,
        strength: 0.8,
      });
      if (created) signalsCreated.push(`Funding: ${funding.lastRound.type}`);
    }

    // 3. App growth signals (Apptopia)
    if (isApptopiaConfigured()) {
      try {
        const appProfile = await getCompanyAppProfile(company.name);
        if (appProfile.apps.length > 0) {
          // Overall app growth signal
          if (appProfile.growthSignal === "strong") {
            const created = await createSignalIfNew({
              companyId,
              type: "APP_GROWTH",
              source: "apptopia",
              title: `Strong app growth: ${appProfile.totalDownloads.toLocaleString()} total downloads`,
              details: {
                totalDownloads: appProfile.totalDownloads,
                appCount: appProfile.apps.length,
                growthSignal: appProfile.growthSignal,
              },
              strength: 0.7,
            });
            if (created) signalsCreated.push("Strong app growth detected");
          }

          // Real-time SDK usage signal
          if (appProfile.hasRealtimeSdk) {
            const created = await createSignalIfNew({
              companyId,
              type: "TECH_CHANGE",
              source: "apptopia",
              title: `Using real-time SDK: ${appProfile.realtimeSdks.join(", ")}`,
              details: {
                sdks: appProfile.realtimeSdks,
                hasRealtimeSdk: true,
              },
              strength: 0.9,
            });
            if (created) signalsCreated.push(`Real-time SDK: ${appProfile.realtimeSdks.join(", ")}`);
          }

          // Individual high-growth apps
          for (const app of appProfile.apps) {
            if (app.downloads.trend === "growing" && app.downloads.last30Days > 10000) {
              const created = await createSignalIfNew({
                companyId,
                type: "APP_GROWTH",
                source: "apptopia",
                title: `${app.appName} growing: ${app.downloads.last30Days.toLocaleString()} downloads/month`,
                details: {
                  appName: app.appName,
                  platform: app.platform,
                  downloads30d: app.downloads.last30Days,
                  trend: app.downloads.trend,
                },
                strength: 0.6,
              });
              if (created) signalsCreated.push(`App growth: ${app.appName}`);
            }
          }
        }
      } catch (error) {
        console.error("Apptopia signal detection error:", error);
      }
    }

    // 4. Gong call activity signals
    if (isGongConfigured()) {
      try {
        const recentCalls = await searchCalls({
          companyName: company.name,
          limit: 5,
        });

        if (recentCalls.length > 0) {
          const created = await createSignalIfNew({
            companyId,
            type: "INTENT",
            source: "gong",
            title: `${recentCalls.length} recent call(s) with ${company.name}`,
            details: {
              callCount: recentCalls.length,
              lastCall: recentCalls[0].started,
              callTitles: recentCalls.map((c) => c.title),
            },
            strength: 0.7,
          });
          if (created) signalsCreated.push(`Gong: ${recentCalls.length} recent calls`);
        }
      } catch (error) {
        console.error("Gong signal detection error:", error);
      }
    }

    // 5. Tech stack change signals (from enrichment data)
    if (company.enrichmentData) {
      const enrichment = company.enrichmentData as Record<string, unknown>;
      const techStack = (enrichment.merged as Record<string, unknown>)?.techStack as string[] | undefined;
      if (techStack?.length) {
        const realtimeIndicators = ["websocket", "socket.io", "firebase", "pusher", "ably", "mqtt", "rabbitmq"];
        const realtimeTech = techStack.filter((t) =>
          realtimeIndicators.some((r) => t.toLowerCase().includes(r))
        );
        if (realtimeTech.length > 0) {
          const created = await createSignalIfNew({
            companyId,
            type: "TECH_CHANGE",
            source: "enrichment",
            title: `Real-time tech in stack: ${realtimeTech.join(", ")}`,
            details: { technologies: realtimeTech, fullStack: techStack },
            strength: 0.8,
          });
          if (created) signalsCreated.push(`Tech: ${realtimeTech.join(", ")}`);
        }
      }
    }

    return { companyId, signalsCreated };
  }
);

// Batch signal detection for all companies with prospects
export const batchDetectSignals = inngest.createFunction(
  { id: "batch-detect-signals", retries: 1 },
  { event: "signals/batch-detect" },
  async () => {
    const companies = await prisma.company.findMany({
      where: { prospects: { some: {} } },
      select: { id: true },
    });

    // Send individual detect events for each company
    for (const company of companies) {
      await inngest.send({
        name: "signals/detect",
        data: { companyId: company.id },
      });
    }

    return { companiesQueued: companies.length };
  }
);
