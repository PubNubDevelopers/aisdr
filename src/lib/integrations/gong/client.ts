const BASE_URL = "https://api.gong.io/v2";

function getHeaders(): HeadersInit {
  const key = process.env.GONG_ACCESS_KEY;
  const secret = process.env.GONG_ACCESS_KEY_SECRET;
  if (!key || !secret) throw new Error("Gong API keys not configured");

  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "Content-Type": "application/json",
  };
}

export function isGongConfigured(): boolean {
  return !!(process.env.GONG_ACCESS_KEY && process.env.GONG_ACCESS_KEY_SECRET);
}

export interface GongCall {
  id: string;
  title: string;
  started: string;
  duration: number;
  parties: Array<{ name: string; emailAddress: string; title?: string; affiliation: "internal" | "external" }>;
  url: string;
}

export interface GongTranscript {
  callId: string;
  transcript: Array<{
    speakerName: string;
    topic?: string;
    sentences: Array<{ text: string; start: number; end: number }>;
  }>;
}

export interface GongCallInsights {
  callId: string;
  topics: string[];
  questions: string[];
  actionItems: string[];
  trackers: Array<{ name: string; count: number; phrases: string[] }>;
}

// Search calls by company/contact
export async function searchCalls(params: {
  companyName?: string;
  contactEmail?: string;
  fromDate?: string; // ISO date
  toDate?: string;
  limit?: number;
}): Promise<GongCall[]> {
  if (!isGongConfigured()) return [];

  try {
    const filter: Record<string, unknown> = {};
    if (params.fromDate) filter.fromDateTime = params.fromDate;
    if (params.toDate) filter.toDateTime = params.toDate;

    // Gong uses content search to find calls mentioning a company
    const body: Record<string, unknown> = {
      filter,
      cursor: undefined,
    };

    if (params.contactEmail) {
      body.filter = {
        ...filter,
        callParticipants: {
          emailAddresses: [params.contactEmail],
        },
      };
    }

    const response = await fetch(`${BASE_URL}/calls`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const calls: GongCall[] = (data.calls || [])
      .slice(0, params.limit || 20)
      .map((call: Record<string, unknown>) => ({
        id: call.id,
        title: call.title,
        started: call.started,
        duration: call.duration,
        parties: call.parties || [],
        url: call.url,
      }));

    // If searching by company name, filter client-side
    if (params.companyName && !params.contactEmail) {
      const name = params.companyName.toLowerCase();
      return calls.filter(
        (c) =>
          c.title?.toLowerCase().includes(name) ||
          c.parties.some(
            (p) =>
              p.affiliation === "external" &&
              p.name?.toLowerCase().includes(name)
          )
      );
    }

    return calls;
  } catch (error) {
    console.error("Gong search calls error:", error);
    return [];
  }
}

// Get call transcript
export async function getTranscript(callId: string): Promise<GongTranscript | null> {
  if (!isGongConfigured()) return null;

  try {
    const response = await fetch(`${BASE_URL}/calls/transcript`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        filter: { callIds: [callId] },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const transcript = data.callTranscripts?.[0];
    if (!transcript) return null;

    return {
      callId: transcript.callId,
      transcript: transcript.transcript || [],
    };
  } catch (error) {
    console.error("Gong get transcript error:", error);
    return null;
  }
}

// Get call insights (topics, questions, action items, trackers)
export async function getCallInsights(callId: string): Promise<GongCallInsights | null> {
  if (!isGongConfigured()) return null;

  try {
    const response = await fetch(
      `${BASE_URL}/stats/activity/detailed?filter.callIds=${callId}`,
      { headers: getHeaders() }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return {
      callId,
      topics: data.topics || [],
      questions: data.questions || [],
      actionItems: data.actionItems || [],
      trackers: data.trackers || [],
    };
  } catch (error) {
    console.error("Gong get insights error:", error);
    return null;
  }
}

// Get talk track insights for a company/industry
export async function getTalkTrackInsights(params: {
  companyName?: string;
  industry?: string;
}): Promise<{
  topTopics: string[];
  effectiveQuestions: string[];
  commonObjections: string[];
  winningTalkTracks: string[];
}> {
  if (!isGongConfigured()) {
    return { topTopics: [], effectiveQuestions: [], commonObjections: [], winningTalkTracks: [] };
  }

  try {
    // Search for recent calls with similar companies
    const calls = await searchCalls({
      companyName: params.companyName,
      limit: 10,
    });

    if (calls.length === 0) {
      return { topTopics: [], effectiveQuestions: [], commonObjections: [], winningTalkTracks: [] };
    }

    // Gather insights from these calls
    const allInsights = await Promise.all(
      calls.slice(0, 5).map((c) => getCallInsights(c.id))
    );

    const topics = new Set<string>();
    const questions = new Set<string>();
    const trackerPhrases = new Set<string>();

    for (const insight of allInsights) {
      if (!insight) continue;
      insight.topics.forEach((t) => topics.add(t));
      insight.questions.forEach((q) => questions.add(q));
      insight.trackers.forEach((t) => t.phrases.forEach((p) => trackerPhrases.add(p)));
    }

    return {
      topTopics: Array.from(topics).slice(0, 10),
      effectiveQuestions: Array.from(questions).slice(0, 5),
      commonObjections: [], // Would need Gong's tracker data for objections
      winningTalkTracks: Array.from(trackerPhrases).slice(0, 5),
    };
  } catch (error) {
    console.error("Gong talk track insights error:", error);
    return { topTopics: [], effectiveQuestions: [], commonObjections: [], winningTalkTracks: [] };
  }
}
