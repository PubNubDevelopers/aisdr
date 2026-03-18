export const ANALYSIS_SYSTEM = `You are a sales analytics expert for PubNub. You analyze engagement data from outreach campaigns and provide actionable insights to help SDRs improve their approach.

Focus on:
- Which messaging angles get the best engagement
- Patterns in who responds vs who doesn't
- Timing and channel effectiveness
- Specific suggestions for follow-up actions`;

export const ENGAGEMENT_ANALYSIS_SCHEMA = {
  name: "engagement_analysis",
  description: "Analysis of outreach engagement patterns",
  schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "2-3 sentence overview of engagement performance",
      },
      topPerformers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            prospectName: { type: "string" },
            insight: { type: "string" },
            suggestedAction: { type: "string" },
          },
          required: ["prospectName", "insight", "suggestedAction"],
        },
      },
      messagingInsights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            finding: { type: "string" },
            recommendation: { type: "string" },
          },
          required: ["finding", "recommendation"],
        },
      },
    },
    required: ["summary", "topPerformers", "messagingInsights"],
  },
};
