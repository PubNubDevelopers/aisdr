// Deterministic content matching — maps prospect industry/use case to relevant PubNub content
// No AI call needed; keyword matching against the content library

import { PUBNUB_CONTENT, type ContentItem, type Vertical, type UseCase } from "./pubnub-content";

export interface MatchedContent {
  /** The best-matching solution page URL — use for first PubNub mention hyperlink */
  primarySolutionUrl: string;
  primarySolutionTitle: string;
  /** Top relevant solution pages (max 2) */
  solutions: ContentItem[];
  /** Relevant customer stories for social proof (max 3) */
  customerStories: ContentItem[];
  /** Best demo to share (max 1) */
  demos: ContentItem[];
  /** Best tutorial for technical stakeholders (max 1) */
  tutorials: ContentItem[];
  /** Best ebook for content offer (max 1) */
  ebooks: ContentItem[];
  /** Relevant compliance pages (max 2) */
  compliance: ContentItem[];
  /** Relevant blog posts (max 2) */
  blogPosts: ContentItem[];
}

// Keyword → Vertical mapping for fuzzy industry matching
const INDUSTRY_KEYWORDS: Record<string, Vertical> = {
  health: "healthcare",
  medical: "healthcare",
  hospital: "healthcare",
  pharma: "healthcare",
  telehealth: "healthcare",
  telemedicine: "healthcare",
  clinical: "healthcare",
  patient: "healthcare",
  sport: "sports-media",
  media: "sports-media",
  broadcast: "sports-media",
  entertainment: "sports-media",
  game: "gaming",
  gaming: "gaming",
  esport: "gaming",
  casino: "igaming",
  betting: "igaming",
  igaming: "igaming",
  gambling: "igaming",
  bank: "fintech",
  fintech: "fintech",
  finance: "fintech",
  financial: "fintech",
  payment: "fintech",
  insurance: "fintech",
  trading: "fintech",
  ecommerce: "ecommerce",
  commerce: "ecommerce",
  retail: "ecommerce",
  shopping: "ecommerce",
  marketplace: "ecommerce",
  transport: "transport-logistics",
  logistics: "transport-logistics",
  delivery: "transport-logistics",
  fleet: "transport-logistics",
  shipping: "transport-logistics",
  freight: "transport-logistics",
  ride: "transport-logistics",
  mobility: "transport-logistics",
  social: "social",
  community: "social",
  dating: "social",
  network: "social",
  education: "education",
  edtech: "education",
  learning: "education",
  school: "education",
  iot: "iot",
  sensor: "iot",
  device: "iot",
  hardware: "iot",
  smart: "iot",
  connected: "iot",
  artificial: "ai",
  "ai ": "ai",
  "ml ": "ai",
  machine: "ai",
  contact: "call-center",
  "call center": "call-center",
  "customer service": "call-center",
  support: "call-center",
  streaming: "streaming",
  video: "streaming",
  live: "streaming",
};

// Keyword → UseCase mapping
const USECASE_KEYWORDS: Record<string, UseCase> = {
  chat: "chat",
  messaging: "chat",
  "in-app": "chat",
  notification: "notifications",
  alert: "notifications",
  push: "notifications",
  stream: "data-streaming",
  dashboard: "data-streaming",
  analytics: "data-streaming",
  "real-time data": "data-streaming",
  presence: "presence",
  "online/offline": "presence",
  status: "presence",
  location: "geolocation",
  tracking: "geolocation",
  gps: "geolocation",
  map: "geolocation",
  iot: "iot-messaging",
  sensor: "iot-messaging",
  device: "iot-messaging",
  telemetry: "iot-messaging",
  moderat: "moderation",
  safety: "moderation",
  "content filter": "moderation",
  live: "live-events",
  event: "live-events",
  "second screen": "live-events",
  engagement: "live-events",
  collaborat: "collaboration",
  whiteboard: "collaboration",
  "real-time edit": "collaboration",
  telehealth: "telehealth",
  telemedicine: "telehealth",
  "patient": "telehealth",
  "doctor": "telehealth",
  delivery: "delivery-tracking",
  "order track": "delivery-tracking",
  "fleet": "delivery-tracking",
  "last mile": "delivery-tracking",
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[-_]/g, " ");
}

function detectVerticals(industry?: string, textFields?: string[]): Vertical[] {
  const verticals = new Set<Vertical>();
  const searchText = normalizeText(
    [industry ?? "", ...(textFields ?? [])].join(" ")
  );

  for (const [keyword, vertical] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (searchText.includes(keyword)) {
      verticals.add(vertical);
    }
  }

  return verticals.size > 0 ? Array.from(verticals) : ["general"];
}

function detectUseCases(textFields: string[]): UseCase[] {
  const useCases = new Set<UseCase>();
  const searchText = normalizeText(textFields.join(" "));

  for (const [keyword, useCase] of Object.entries(USECASE_KEYWORDS)) {
    if (searchText.includes(keyword)) {
      useCases.add(useCase);
    }
  }

  return Array.from(useCases);
}

function scoreItem(
  item: ContentItem,
  verticals: Vertical[],
  useCases: UseCase[]
): number {
  let score = 0;
  for (const v of verticals) {
    if (item.verticals.includes(v)) score += 2;
  }
  for (const u of useCases) {
    if (item.useCases.includes(u)) score += 1;
  }
  return score;
}

function topN<T extends ContentItem>(
  items: T[],
  verticals: Vertical[],
  useCases: UseCase[],
  n: number
): T[] {
  return items
    .map((item) => ({ item, score: scoreItem(item, verticals, useCases) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ item }) => item);
}

export function matchContent(params: {
  industry?: string;
  realtimeRelevance: string;
  recommendedAngle: string;
  competitiveIntel?: string;
}): MatchedContent {
  const textFields = [
    params.realtimeRelevance,
    params.recommendedAngle,
    params.competitiveIntel ?? "",
  ];

  const verticals = detectVerticals(params.industry, textFields);
  const useCases = detectUseCases(textFields);

  const solutions = topN(PUBNUB_CONTENT.solutions, verticals, useCases, 2);
  const customerStories = topN(PUBNUB_CONTENT.customerStories, verticals, useCases, 3);
  const demos = topN(PUBNUB_CONTENT.demos, verticals, useCases, 1);
  const tutorials = topN(PUBNUB_CONTENT.tutorials, verticals, useCases, 1);
  const ebooks = topN(PUBNUB_CONTENT.ebooks, verticals, useCases, 1);
  const compliance = topN(PUBNUB_CONTENT.compliance, verticals, useCases, 2);
  const blogPosts = topN(PUBNUB_CONTENT.blogPosts, verticals, useCases, 2);

  // Primary solution: best match, or fallback to Chat (most generic)
  const primary = solutions[0] ?? PUBNUB_CONTENT.solutions.find((s) => s.title === "Chat")!;

  // If no customer stories matched, include high-profile general ones
  if (customerStories.length === 0) {
    const fallbacks = ["Clubhouse", "Swiggy", "DAZN"];
    for (const name of fallbacks) {
      const story = PUBNUB_CONTENT.customerStories.find((s) => s.title === name);
      if (story) customerStories.push(story);
    }
  }

  return {
    primarySolutionUrl: primary.url,
    primarySolutionTitle: primary.title,
    solutions,
    customerStories,
    demos,
    tutorials,
    ebooks,
    compliance,
    blogPosts,
  };
}

/** Format matched content as a section for the AI prompt */
export function formatContentForPrompt(content: MatchedContent): string {
  const parts: string[] = [
    "## PubNub Content Library (use these URLs in outreach)",
    "",
    `**Primary solution page (hyperlink on first PubNub mention):** [${content.primarySolutionTitle}](${content.primarySolutionUrl})`,
    "",
  ];

  if (content.solutions.length > 0) {
    parts.push("**Solution pages:**");
    for (const s of content.solutions) {
      parts.push(`- [${s.title}](${s.url}) — ${s.description}`);
    }
    parts.push("");
  }

  if (content.customerStories.length > 0) {
    parts.push("**Customer stories (use for social proof in bump emails):**");
    for (const s of content.customerStories) {
      parts.push(`- [${s.title}](${s.url}) — ${s.description}`);
    }
    parts.push("");
  }

  if (content.demos.length > 0) {
    parts.push("**Demos (share for \"see it in action\" moments):**");
    for (const d of content.demos) {
      parts.push(`- [${d.title}](${d.url}) — ${d.description}`);
    }
    parts.push("");
  }

  if (content.tutorials.length > 0) {
    parts.push("**Tutorials (for technical stakeholders):**");
    for (const t of content.tutorials) {
      parts.push(`- [${t.title}](${t.url}) — ${t.description}`);
    }
    parts.push("");
  }

  if (content.ebooks.length > 0) {
    parts.push("**eBooks (gated content offers):**");
    for (const e of content.ebooks) {
      parts.push(`- [${e.title}](${e.url}) — ${e.description}`);
    }
    parts.push("");
  }

  if (content.compliance.length > 0) {
    parts.push("**Compliance (for security-conscious buyers):**");
    for (const c of content.compliance) {
      parts.push(`- [${c.title}](${c.url}) — ${c.description}`);
    }
    parts.push("");
  }

  if (content.blogPosts.length > 0) {
    parts.push("**Blog posts:**");
    for (const b of content.blogPosts) {
      parts.push(`- [${b.title}](${b.url}) — ${b.description}`);
    }
    parts.push("");
  }

  parts.push(
    "**Rules for using these links:**",
    "- First time you mention \"PubNub\" in an email, hyperlink it to the primary solution page",
    "- Hyperlinks must read naturally as part of the sentence — never use \"click here\" or bare URLs",
    "- Bump emails should include customer story links as social proof",
    "- Demos and tutorials are great for technical stakeholders or \"see it live\" CTAs",
    "- Only use compliance pages when the prospect's industry requires it (healthcare, finance, enterprise)",
  );

  return parts.join("\n");
}
