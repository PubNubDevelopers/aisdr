export const SCORING_SYSTEM = `You are a lead scoring expert for PubNub, a real-time communication infrastructure company. Score prospects on how likely they are to need and buy PubNub's technology.

Scoring criteria (0-100):
- **Product fit (0-30):** Does their product need real-time features? Chat, notifications, streaming, presence, IoT?
- **Company stage (0-20):** Series A-C companies actively building are ideal. Very early or very large have different dynamics.
- **Title/authority (0-15):** Engineering leaders, product leaders, CTOs can champion and buy.
- **Signal strength (0-20):** Active hiring for relevant roles? Recent funding? Tech changes?
- **Competitive landscape (0-15):** Not locked into a competitor? Using a weaker alternative? Built in-house and struggling?`;

export const SCORING_SCHEMA = {
  name: "prospect_score",
  description: "Scored prospect with explanation",
  schema: {
    type: "object" as const,
    properties: {
      score: {
        type: "number",
        description: "Overall score 0-100",
      },
      breakdown: {
        type: "object",
        properties: {
          productFit: { type: "number", description: "0-30" },
          companyStage: { type: "number", description: "0-20" },
          titleAuthority: { type: "number", description: "0-15" },
          signalStrength: { type: "number", description: "0-20" },
          competitiveLandscape: { type: "number", description: "0-15" },
        },
        required: ["productFit", "companyStage", "titleAuthority", "signalStrength", "competitiveLandscape"],
      },
      explanation: {
        type: "string",
        description: "2-3 sentence explanation of the score",
      },
    },
    required: ["score", "breakdown", "explanation"],
  },
};

export function buildScoringPrompt(params: {
  prospectName: string;
  prospectTitle?: string;
  companyName: string;
  companyDescription?: string;
  industry?: string;
  employeeCount?: number;
  fundingStage?: string;
  techStack?: string[];
  signals?: Array<{ type: string; title: string; details: string }>;
}): string {
  const parts = [
    `Score the following prospect for PubNub fit:`,
    ``,
    `**Prospect:** ${params.prospectName}${params.prospectTitle ? ` — ${params.prospectTitle}` : ""}`,
    `**Company:** ${params.companyName}`,
  ];

  if (params.companyDescription) parts.push(`**Description:** ${params.companyDescription}`);
  if (params.industry) parts.push(`**Industry:** ${params.industry}`);
  if (params.employeeCount) parts.push(`**Employees:** ${params.employeeCount}`);
  if (params.fundingStage) parts.push(`**Funding:** ${params.fundingStage}`);
  if (params.techStack?.length) parts.push(`**Tech Stack:** ${params.techStack.join(", ")}`);

  if (params.signals?.length) {
    parts.push(`\n**Signals:**`);
    params.signals.forEach((s) => parts.push(`- [${s.type}] ${s.title}: ${s.details}`));
  }

  return parts.join("\n");
}
