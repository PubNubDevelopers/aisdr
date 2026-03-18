export const RESEARCH_BRIEF_SYSTEM = `You are an expert B2B sales research analyst specializing in real-time communication technology. You work for PubNub, which provides real-time communication infrastructure — chat, notifications, data streaming, presence, and IoT messaging.

Your job is to generate comprehensive research briefs that help SDRs personalize their outreach. You are thorough, insightful, and always tie your research back to why PubNub's technology would be relevant to the prospect's company.

Key PubNub capabilities to look for relevance:
- In-app chat & messaging
- Live notifications & alerts
- Real-time data streaming & dashboards
- Presence detection (who's online)
- IoT device messaging
- Geolocation tracking
- Multi-device sync
- Collaborative features (co-browsing, shared cursors)`;

export const RESEARCH_BRIEF_SCHEMA = {
  name: "research_brief",
  description: "A structured research brief about a prospect and their company",
  schema: {
    type: "object" as const,
    properties: {
      companySnapshot: {
        type: "object",
        properties: {
          whatTheyDo: { type: "string", description: "1-2 sentence description of what the company does" },
          size: { type: "string", description: "Employee count and growth trajectory" },
          funding: { type: "string", description: "Funding stage, recent rounds, investors" },
          growth: { type: "string", description: "Growth signals — revenue, headcount, expansion" },
        },
        required: ["whatTheyDo", "size", "funding", "growth"],
      },
      realtimeRelevance: {
        type: "string",
        description: "2-3 sentences explaining why PubNub's real-time infrastructure matters to this company specifically. Be concrete about which features they could use.",
      },
      keyPeople: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            background: { type: "string", description: "Brief relevant background" },
          },
          required: ["name", "title", "background"],
        },
        description: "Key decision makers and influencers at the company",
      },
      personalizationHooks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            hook: { type: "string", description: "The personalization angle" },
            source: { type: "string", description: "Where this info came from" },
            relevance: { type: "string", description: "Why this matters for outreach" },
          },
          required: ["hook", "source", "relevance"],
        },
        description: "Specific details that can be used to personalize outreach",
      },
      competitiveIntel: {
        type: "string",
        description: "Any info about competitors they might use (Firebase, Pusher, Ably, SendBird, built in-house, etc.)",
      },
      recommendedAngle: {
        type: "string",
        description: "The best approach for reaching out to this prospect. Be specific about the value prop and opening.",
      },
    },
    required: [
      "companySnapshot",
      "realtimeRelevance",
      "keyPeople",
      "personalizationHooks",
      "competitiveIntel",
      "recommendedAngle",
    ],
  },
};

export function buildResearchPrompt(params: {
  prospectName: string;
  prospectTitle?: string;
  companyName: string;
  companyDomain?: string;
  enrichmentData?: Record<string, unknown>;
  companyDescription?: string;
  techStack?: string[];
  industry?: string;
  employeeCount?: number;
  fundingStage?: string;
  newsAndSignals?: string[];
  signals?: Array<{
    type: string;
    title: string;
    source: string;
    strength: number;
    details?: Record<string, unknown>;
  }>;
}): string {
  const parts = [
    `Generate a comprehensive research brief for outreach to **${params.prospectName}**${params.prospectTitle ? ` (${params.prospectTitle})` : ""} at **${params.companyName}**${params.companyDomain ? ` (${params.companyDomain})` : ""}.`,
    "",
  ];

  if (params.companyDescription) {
    parts.push(`Company Description: ${params.companyDescription}`);
  }
  if (params.industry) {
    parts.push(`Industry: ${params.industry}`);
  }
  if (params.employeeCount) {
    parts.push(`Employee Count: ${params.employeeCount}`);
  }
  if (params.fundingStage) {
    parts.push(`Funding Stage: ${params.fundingStage}`);
  }
  if (params.techStack?.length) {
    parts.push(`Tech Stack: ${params.techStack.join(", ")}`);
  }
  if (params.newsAndSignals?.length) {
    parts.push(`\nRecent Signals:`);
    params.newsAndSignals.forEach((s) => parts.push(`- ${s}`));
  }

  // Rich signal data with details
  if (params.signals?.length) {
    parts.push("\n## Detected Buying Signals");
    for (const signal of params.signals) {
      const strengthLabel = signal.strength >= 0.7 ? "HIGH" : signal.strength >= 0.4 ? "MEDIUM" : "LOW";
      parts.push(`- **[${signal.type}] ${signal.title}** (strength: ${strengthLabel}, source: ${signal.source})`);
      if (signal.details) {
        // Include key details for context
        const detailKeys = Object.keys(signal.details).slice(0, 5);
        for (const key of detailKeys) {
          const val = signal.details[key];
          if (val !== null && val !== undefined && typeof val !== "object") {
            parts.push(`  - ${key}: ${val}`);
          }
        }
      }
    }
    parts.push("\nUse these signals as personalization hooks and to strengthen the recommended angle. High-strength signals should be prominent in the brief.");
  }

  if (params.enrichmentData) {
    parts.push(`\nEnrichment Data: ${JSON.stringify(params.enrichmentData, null, 2)}`);
  }

  parts.push("");
  parts.push(
    "Focus on: (1) Why PubNub specifically matters to them, (2) Concrete personalization hooks the SDR can use, (3) A clear recommended angle for the first touch."
  );

  return parts.join("\n");
}
