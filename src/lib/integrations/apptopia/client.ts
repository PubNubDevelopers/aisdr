const BASE_URL = "https://api.apptopia.com/v2";

function getHeaders(): HeadersInit {
  const key = process.env.APPTOPIA_API_KEY;
  if (!key) throw new Error("Apptopia API key not configured");

  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export function isApptopiaConfigured(): boolean {
  return !!process.env.APPTOPIA_API_KEY;
}

export interface AppIntelligence {
  appId: string;
  appName: string;
  publisher: string;
  category: string;
  platform: "ios" | "android";
  downloads: {
    total: number;
    last30Days: number;
    last90Days: number;
    trend: "growing" | "stable" | "declining";
  };
  ratings: {
    average: number;
    count: number;
  };
  revenue?: {
    estimated30Days: number;
  };
  sdks: string[];
  lastUpdated: string;
}

export interface CompanyAppProfile {
  companyName: string;
  apps: AppIntelligence[];
  totalDownloads: number;
  hasRealtimeSdk: boolean;
  realtimeSdks: string[];
  growthSignal: "strong" | "moderate" | "low";
}

// Search apps by publisher/company name
export async function searchApps(companyName: string): Promise<AppIntelligence[]> {
  if (!isApptopiaConfigured()) return [];

  try {
    const response = await fetch(
      `${BASE_URL}/search/apps?q=${encodeURIComponent(companyName)}&limit=10`,
      { headers: getHeaders() }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map(
      (app: Record<string, unknown>): AppIntelligence => ({
        appId: app.id as string,
        appName: app.name as string,
        publisher: app.publisher as string,
        category: app.category as string,
        platform: app.platform as "ios" | "android",
        downloads: {
          total: (app.downloads as number) || 0,
          last30Days: (app.downloads_30d as number) || 0,
          last90Days: (app.downloads_90d as number) || 0,
          trend: getDownloadTrend(
            (app.downloads_30d as number) || 0,
            (app.downloads_90d as number) || 0
          ),
        },
        ratings: {
          average: (app.rating as number) || 0,
          count: (app.rating_count as number) || 0,
        },
        revenue: app.revenue_30d
          ? { estimated30Days: app.revenue_30d as number }
          : undefined,
        sdks: (app.sdks as string[]) || [],
        lastUpdated: (app.last_updated as string) || "",
      })
    );
  } catch (error) {
    console.error("Apptopia search error:", error);
    return [];
  }
}

// Get app detail with SDK info
export async function getAppDetail(appId: string): Promise<AppIntelligence | null> {
  if (!isApptopiaConfigured()) return null;

  try {
    const response = await fetch(`${BASE_URL}/apps/${appId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) return null;

    const app = await response.json();
    return {
      appId: app.id,
      appName: app.name,
      publisher: app.publisher,
      category: app.category,
      platform: app.platform,
      downloads: {
        total: app.downloads || 0,
        last30Days: app.downloads_30d || 0,
        last90Days: app.downloads_90d || 0,
        trend: getDownloadTrend(app.downloads_30d || 0, app.downloads_90d || 0),
      },
      ratings: {
        average: app.rating || 0,
        count: app.rating_count || 0,
      },
      revenue: app.revenue_30d
        ? { estimated30Days: app.revenue_30d }
        : undefined,
      sdks: app.sdks || [],
      lastUpdated: app.last_updated || "",
    };
  } catch (error) {
    console.error("Apptopia get app error:", error);
    return null;
  }
}

// Build company app profile with real-time relevance
export async function getCompanyAppProfile(
  companyName: string
): Promise<CompanyAppProfile> {
  const apps = await searchApps(companyName);

  const REALTIME_SDKS = [
    "firebase", "pusher", "ably", "sendbird", "twilio",
    "socket.io", "pubnub", "stream", "cometchat",
    "agora", "vonage",
  ];

  const realtimeSdks = new Set<string>();
  let totalDownloads = 0;
  let growingApps = 0;

  for (const app of apps) {
    totalDownloads += app.downloads.total;
    if (app.downloads.trend === "growing") growingApps++;

    for (const sdk of app.sdks) {
      const lower = sdk.toLowerCase();
      for (const rtSdk of REALTIME_SDKS) {
        if (lower.includes(rtSdk)) {
          realtimeSdks.add(sdk);
        }
      }
    }
  }

  const growthRatio = apps.length > 0 ? growingApps / apps.length : 0;

  return {
    companyName,
    apps,
    totalDownloads,
    hasRealtimeSdk: realtimeSdks.size > 0,
    realtimeSdks: Array.from(realtimeSdks),
    growthSignal: growthRatio > 0.5 ? "strong" : growthRatio > 0.2 ? "moderate" : "low",
  };
}

function getDownloadTrend(
  last30Days: number,
  last90Days: number
): "growing" | "stable" | "declining" {
  if (last90Days === 0) return "stable";
  const monthlyAvg = last90Days / 3;
  const ratio = last30Days / monthlyAvg;
  if (ratio > 1.15) return "growing";
  if (ratio < 0.85) return "declining";
  return "stable";
}
