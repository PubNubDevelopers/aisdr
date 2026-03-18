const BASE_URL = "https://api.perplexity.ai";

export function isPerplexityConfigured(): boolean {
  return !!process.env.PERPLEXITY_API_KEY;
}

function getHeaders(): HeadersInit {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("Perplexity API key not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export async function perplexitySearch(params: {
  system: string;
  query: string;
}): Promise<string> {
  const messages: PerplexityMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: params.query },
  ];

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: "sonar",
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as PerplexityResponse;
  return data.choices[0]?.message?.content ?? "";
}

export interface DiscoveredCompany {
  name: string;
  domain?: string;
  description?: string;
  industry?: string;
  employeeCount?: number;
  fundingStage?: string;
  techStack?: string[];
  whyRelevant: string;
}

export interface DiscoveredContact {
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  linkedinUrl?: string;
  companyName: string;
  companyDomain?: string;
}

/**
 * Use Perplexity to find companies matching targeting criteria.
 * Returns structured results via a two-step process: Perplexity for research, Claude for structuring.
 */
export async function searchCompanies(params: {
  industries?: string[];
  companySize?: string;
  titles?: string[];
  techSignals?: string[];
  triggers?: string[];
  limit?: number;
}): Promise<DiscoveredCompany[]> {
  if (!isPerplexityConfigured()) return [];

  const limit = params.limit ?? 15;

  const criteriaLines: string[] = [];
  if (params.industries?.length) {
    criteriaLines.push(`Industries: ${params.industries.join(", ")}`);
  }
  if (params.companySize) {
    criteriaLines.push(`Company size: ${params.companySize} employees`);
  }
  if (params.techSignals?.length) {
    criteriaLines.push(`Tech signals: ${params.techSignals.join(", ")}`);
  }
  if (params.triggers?.length) {
    criteriaLines.push(`Trigger events: ${params.triggers.join(", ")}`);
  }
  if (params.titles?.length) {
    criteriaLines.push(`Target buyer titles: ${params.titles.join(", ")}`);
  }

  const system = `You are a B2B sales research assistant specializing in finding companies that need real-time communication infrastructure (chat, notifications, data streaming, presence, IoT messaging). You return factual, accurate company data based on real companies you can verify exist.`;

  const query = `Find ${limit} real companies that match these targeting criteria for selling real-time communication infrastructure (like PubNub):

${criteriaLines.join("\n")}

For each company, provide:
- Company name
- Website domain
- What they do (1 sentence)
- Industry
- Approximate employee count
- Funding stage if known
- Known tech stack items if any
- Why they might need real-time features (1 sentence)

Return ONLY a JSON array, no other text. Each object must have these exact keys:
{"name", "domain", "description", "industry", "employeeCount", "fundingStage", "techStack", "whyRelevant"}

techStack should be a string array. employeeCount should be a number or null. Return real companies only.`;

  try {
    const raw = await perplexitySearch({ system, query });

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;

    return parsed.slice(0, limit).map((c) => ({
      name: (c.name as string) || "Unknown",
      domain: (c.domain as string) || undefined,
      description: (c.description as string) || undefined,
      industry: (c.industry as string) || undefined,
      employeeCount: typeof c.employeeCount === "number" ? c.employeeCount : undefined,
      fundingStage: (c.fundingStage as string) || undefined,
      techStack: Array.isArray(c.techStack) ? (c.techStack as string[]) : undefined,
      whyRelevant: (c.whyRelevant as string) || "",
    }));
  } catch (error) {
    console.error("Perplexity company search error:", error);
    return [];
  }
}

/**
 * Use Perplexity to find contacts at a specific company matching target titles.
 */
export async function searchContacts(params: {
  companyName: string;
  companyDomain?: string;
  titles?: string[];
  limit?: number;
}): Promise<DiscoveredContact[]> {
  if (!isPerplexityConfigured()) return [];

  const limit = params.limit ?? 5;

  const titleFilter = params.titles?.length
    ? `who hold titles like: ${params.titles.join(", ")}`
    : "in engineering, product, or technical leadership roles";

  const system = `You are a B2B sales research assistant. You find real people at real companies using publicly available information. Only return people you're confident actually work at the specified company.`;

  const query = `Find up to ${limit} real people at ${params.companyName}${params.companyDomain ? ` (${params.companyDomain})` : ""} ${titleFilter}.

For each person, provide:
- First name
- Last name
- Job title
- LinkedIn URL if findable
- Work email if publicly available

Return ONLY a JSON array, no other text. Each object must have these exact keys:
{"firstName", "lastName", "title", "email", "linkedinUrl"}

email and linkedinUrl can be null if not found. Only include people you're confident actually work there.`;

  try {
    const raw = await perplexitySearch({ system, query });

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;

    return parsed.slice(0, limit).map((c) => ({
      firstName: (c.firstName as string) || "Unknown",
      lastName: (c.lastName as string) || "Contact",
      title: (c.title as string) || undefined,
      email: (c.email as string) || undefined,
      linkedinUrl: (c.linkedinUrl as string) || undefined,
      companyName: params.companyName,
      companyDomain: params.companyDomain,
    }));
  } catch (error) {
    console.error("Perplexity contact search error:", error);
    return [];
  }
}

/**
 * Use Perplexity to research a specific company for enrichment.
 */
export async function researchCompany(params: {
  companyName: string;
  companyDomain?: string;
}): Promise<{
  description?: string;
  industry?: string;
  employeeCount?: number;
  fundingStage?: string;
  techStack?: string[];
  recentNews?: string[];
} | null> {
  if (!isPerplexityConfigured()) return null;

  const system = `You are a B2B company research assistant. Provide accurate, factual information about companies based on publicly available data.`;

  const query = `Research ${params.companyName}${params.companyDomain ? ` (${params.companyDomain})` : ""} and provide:

1. What they do (1-2 sentences)
2. Industry
3. Approximate employee count
4. Funding stage and last round details
5. Known technology stack
6. 2-3 recent news items or developments

Return ONLY a JSON object with these exact keys:
{"description", "industry", "employeeCount", "fundingStage", "techStack", "recentNews"}

techStack and recentNews should be string arrays. employeeCount should be a number or null.`;

  try {
    const raw = await perplexitySearch({ system, query });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    return {
      description: (parsed.description as string) || undefined,
      industry: (parsed.industry as string) || undefined,
      employeeCount: typeof parsed.employeeCount === "number" ? parsed.employeeCount : undefined,
      fundingStage: (parsed.fundingStage as string) || undefined,
      techStack: Array.isArray(parsed.techStack) ? (parsed.techStack as string[]) : undefined,
      recentNews: Array.isArray(parsed.recentNews) ? (parsed.recentNews as string[]) : undefined,
    };
  } catch (error) {
    console.error("Perplexity company research error:", error);
    return null;
  }
}
