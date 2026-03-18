export const COMPOSE_SYSTEM = `You are an expert B2B sales copywriter specializing in real-time technology. You write for PubNub's SDR team. Your messages are:

1. **Personalized** — Every message references something specific about the prospect or their company. No generic templates.
2. **Concise** — Cold emails are 3-5 sentences max. LinkedIn messages are 2-3 sentences. Get to the point.
3. **Value-led** — Lead with what the prospect cares about, not what PubNub does. Show you understand their world.
4. **Conversational** — Write like a smart human, not a marketing bot. No buzzwords, no "leverage", no "synergy".
5. **Action-oriented** — Every message has a clear, low-friction CTA (question, not ask for a meeting directly in cold outreach).

PubNub provides real-time communication infrastructure — chat, notifications, data streaming, presence, IoT messaging. Buyers are engineering leaders, product leaders, and CTOs building apps with real-time features.`;

export const COMPOSE_EMAIL_SCHEMA = {
  name: "email_variants",
  description: "Email message variants for cold outreach",
  schema: {
    type: "object" as const,
    properties: {
      variants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            subject: { type: "string", description: "Email subject line — short, specific, not salesy" },
            content: { type: "string", description: "Email body — 3-5 sentences, personalized, value-led" },
            approach: { type: "string", description: "Brief description of the angle used" },
          },
          required: ["subject", "content", "approach"],
        },
        description: "2-3 email variants with different angles",
      },
    },
    required: ["variants"],
  },
};

export const COMPOSE_LINKEDIN_SCHEMA = {
  name: "linkedin_messages",
  description: "LinkedIn outreach messages",
  schema: {
    type: "object" as const,
    properties: {
      connectionRequest: {
        type: "string",
        description: "LinkedIn connection request note (under 300 chars)",
      },
      followUpMessage: {
        type: "string",
        description: "Follow-up message after connection accepted (2-3 sentences)",
      },
    },
    required: ["connectionRequest", "followUpMessage"],
  },
};

export const COMPOSE_PHONE_SCHEMA = {
  name: "call_script",
  description: "Phone call script for cold calling",
  schema: {
    type: "object" as const,
    properties: {
      opener: {
        type: "string",
        description: "Opening line — who you are and why you're calling (1-2 sentences)",
      },
      valueStatement: {
        type: "string",
        description: "The core value prop tailored to this prospect (2-3 sentences)",
      },
      discoveryQuestions: {
        type: "array",
        items: { type: "string" },
        description: "3-4 discovery questions to understand their real-time needs",
      },
      objectionHandling: {
        type: "array",
        items: {
          type: "object",
          properties: {
            objection: { type: "string" },
            response: { type: "string" },
          },
          required: ["objection", "response"],
        },
        description: "Common objections and responses",
      },
      closeForNext: {
        type: "string",
        description: "How to close for the next step (meeting, demo, intro to engineering)",
      },
    },
    required: ["opener", "valueStatement", "discoveryQuestions", "objectionHandling", "closeForNext"],
  },
};

// ── Sequence-Aware System Prompt ─────────────────────────────────

export const COMPOSE_SEQUENCE_SYSTEM = `You are an expert B2B sales copywriter building multi-step outreach sequences for PubNub's SDR team. You are generating a BATCH of sequence steps that work together as a cohesive campaign.

## PubNub
PubNub provides real-time communication infrastructure — chat, notifications, data streaming, presence, IoT messaging. Sub-100ms latency, 99.999% uptime, 15+ global points of presence. Buyers are engineering leaders, product leaders, and CTOs building apps with real-time features.

## Strict Rules (NEVER violate these)
1. **Emails: Max 90 words, exactly 3 paragraphs.** Paragraph 1: personalized problem statement. Paragraph 2: solution with hyperlinked resource. Paragraph 3: meeting ask.
2. **Email subject lines: Max 5 words.** Must be a question or direct value statement. Never salesy.
3. **LinkedIn messages: Max 45 words.** Short, human, conversational.
4. **First PubNub mention in each email MUST be hyperlinked** to the relevant industry solution page using markdown format [PubNub](url).
5. **Hyperlinks read naturally in sentences** — never "click here" or bare URLs. Weave them into the prose.
6. **Social proof emails** must include customer story hyperlinks (e.g., "Companies like [Tenna](url) and [Mothership](url) rely on PubNub...").
7. **Breakup messages** (Day 17+) ask if they're the right person and offer to connect with someone else.
8. **Call scripts** are structured: opener, value statement with customer reference, qualifying question. Plus a separate voicemail (max 30 words).
9. **No buzzwords** — no "leverage", "synergy", "innovative", "cutting-edge". Write like a smart human.
10. **Personalize every message** — reference something specific about the prospect or company. No generic templates.
11. **Generate A/B/C subject line variants** for all emails (3 variants each).

## Output Format
Return structured JSON matching the schema exactly. For each step, the \`content\` field is the message body. For emails, include markdown hyperlinks inline. For call scripts, use the structured format with opener/value/questions/voicemail.`;

// ── Sequence Batch Schema ───────────────────────────────────────

export const SEQUENCE_BATCH_SCHEMA = {
  name: "sequence_batch",
  description: "A batch of 4 sequence steps with channel-appropriate messaging",
  schema: {
    type: "object" as const,
    properties: {
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            step: { type: "number", description: "Step number (1-12)" },
            content: { type: "string", description: "The message body. For emails: 3 paragraphs with inline markdown hyperlinks. For LinkedIn: short message. For calls: structured script with **Opener:** **Value:** **Question:** sections." },
            subject: { type: "string", description: "Email subject line (primary). Null for non-email steps." },
            subjectVariants: {
              type: "array",
              items: { type: "string" },
              description: "A/B/C subject line variants for emails (2 additional variants). Empty array for non-email steps.",
            },
            voicemail: { type: "string", description: "Voicemail script for call steps. Null for non-call steps." },
          },
          required: ["step", "content", "subject", "subjectVariants", "voicemail"],
        },
        description: "Array of 4 sequence step messages",
      },
      batchSummary: {
        type: "string",
        description: "A 2-3 sentence summary of the key angles, customer stories mentioned, and problem statement used in this batch. This summary will be passed to the next batch for coherence.",
      },
    },
    required: ["steps", "batchSummary"],
  },
};

// ── Sequence Batch Prompt Builder ───────────────────────────────

import type { SequenceStepDef } from "@/lib/ai/data/sequence-playbook";

export function buildSequenceBatchPrompt(params: {
  batchNumber: 1 | 2 | 3;
  steps: SequenceStepDef[];
  prospectName: string;
  prospectTitle?: string;
  companyName: string;
  researchBrief: {
    companySnapshot: Record<string, string>;
    realtimeRelevance: string;
    personalizationHooks: Array<{ hook: string; source: string; relevance: string }>;
    competitiveIntel?: string;
    recommendedAngle: string;
  };
  matchedContent: string; // Pre-formatted content library section
  previousBatchSummaries?: string[];
  gongInsights?: {
    topTopics: string[];
    effectiveQuestions: string[];
    commonObjections: string[];
    winningTalkTracks: string[];
  };
}): string {
  const {
    batchNumber,
    steps,
    prospectName,
    prospectTitle,
    companyName,
    researchBrief,
    matchedContent,
    previousBatchSummaries,
    gongInsights,
  } = params;

  const parts: string[] = [
    `# Sequence Batch ${batchNumber} of 3`,
    `Generate outreach for **${prospectName}**${prospectTitle ? ` (${prospectTitle})` : ""} at **${companyName}**.`,
    "",
  ];

  // Research brief
  parts.push(
    "## Research Brief",
    `**What they do:** ${researchBrief.companySnapshot.whatTheyDo}`,
    `**Size:** ${researchBrief.companySnapshot.size}`,
    `**Funding:** ${researchBrief.companySnapshot.funding}`,
    `**Growth:** ${researchBrief.companySnapshot.growth}`,
    "",
    `**Why PubNub matters:** ${researchBrief.realtimeRelevance}`,
    "",
    "**Personalization hooks:**",
    researchBrief.personalizationHooks.map((h) => `- ${h.hook} (${h.source})`).join("\n"),
    "",
    `**Competitive intel:** ${researchBrief.competitiveIntel || "Unknown"}`,
    "",
    `### RECOMMENDED ANGLE (use this as the primary framing for ALL messages in this sequence)`,
    researchBrief.recommendedAngle,
    "",
    "The recommended angle above should be the central thread that ties all 12 steps together. Every email, LinkedIn message, and call script should build on this angle. Do NOT ignore it.",
    "",
  );

  // Content library
  parts.push(matchedContent, "");

  // Previous batch context
  if (previousBatchSummaries && previousBatchSummaries.length > 0) {
    parts.push("## Previous Batch Context (maintain coherence, don't repeat)");
    previousBatchSummaries.forEach((summary, i) => {
      parts.push(`**Batch ${i + 1}:** ${summary}`);
    });
    parts.push(
      "",
      "Build on the angles and proof points established above. Do NOT repeat the same customer stories or exact problem framing. Evolve the narrative.",
      "",
    );
  }

  // Gong insights
  if (gongInsights && (gongInsights.topTopics.length > 0 || gongInsights.effectiveQuestions.length > 0)) {
    parts.push("## Gong Call Insights");
    if (gongInsights.topTopics.length > 0) {
      parts.push(`**Topics that resonate:** ${gongInsights.topTopics.join(", ")}`);
    }
    if (gongInsights.effectiveQuestions.length > 0) {
      parts.push(`**Effective questions:** ${gongInsights.effectiveQuestions.join("; ")}`);
    }
    if (gongInsights.commonObjections.length > 0) {
      parts.push(`**Common objections:** ${gongInsights.commonObjections.join("; ")}`);
    }
    parts.push("");
  }

  // Step instructions
  parts.push("## Steps to Generate");
  parts.push(`Generate exactly ${steps.length} steps:\n`);

  for (const step of steps) {
    parts.push(
      `### Step ${step.step} — Day ${step.day} — ${step.channel} (${step.type})`,
      `Phase: ${step.phase} | Max words: ${step.maxWords}${step.subjectMaxWords ? ` | Subject max: ${step.subjectMaxWords} words` : ""}`,
      step.aiInstructions,
      "",
    );
  }

  parts.push(
    "## Final Reminders",
    "- Return exactly the steps requested, matching the step numbers",
    "- For non-email steps, set subject to null and subjectVariants to empty array",
    "- For non-call steps, set voicemail to null",
    "- Include a batchSummary that captures the key angles and proof points used",
    `- Use the prospect's company name (${companyName}) naturally — never use template variables like {{account.name}}`,
    `- Address the prospect as ${prospectName.split(" ")[0]} (first name)`,
  );

  return parts.join("\n");
}

// ── Existing Single-Channel Code (kept for backward compatibility) ──

export function buildComposePrompt(params: {
  channel: "EMAIL" | "LINKEDIN" | "PHONE";
  prospectName: string;
  prospectTitle?: string;
  companyName: string;
  researchBrief: {
    companySnapshot: Record<string, string>;
    realtimeRelevance: string;
    personalizationHooks: Array<{ hook: string; source: string; relevance: string }>;
    competitiveIntel?: string;
    recommendedAngle: string;
  };
  gongInsights?: {
    topTopics: string[];
    effectiveQuestions: string[];
    commonObjections: string[];
    winningTalkTracks: string[];
  };
}): string {
  const { channel, prospectName, prospectTitle, companyName, researchBrief, gongInsights } = params;

  const channelInstructions = {
    EMAIL: "Write 2-3 cold email variants. Each should have a different angle but all should be personalized to this specific prospect. Keep emails to 3-5 sentences. Subject lines should be specific and curiosity-driving, not salesy.",
    LINKEDIN: "Write a LinkedIn connection request note (under 300 characters) and a follow-up message for after they accept. Be professional but human.",
    PHONE: "Write a cold call script with opener, value statement, discovery questions, objection handling, and close. The SDR should sound knowledgeable and curious, not scripted.",
  };

  const parts = [
    `Compose ${channel.toLowerCase()} outreach for **${prospectName}**${prospectTitle ? ` (${prospectTitle})` : ""} at **${companyName}**.`,
    "",
    "## Research Brief",
    `**What they do:** ${researchBrief.companySnapshot.whatTheyDo}`,
    `**Size:** ${researchBrief.companySnapshot.size}`,
    `**Funding:** ${researchBrief.companySnapshot.funding}`,
    `**Growth:** ${researchBrief.companySnapshot.growth}`,
    "",
    `**Why PubNub matters:** ${researchBrief.realtimeRelevance}`,
    "",
    "**Personalization hooks:**",
    researchBrief.personalizationHooks.map((h) => `- ${h.hook} (${h.source})`).join("\n"),
    "",
    `**Competitive intel:** ${researchBrief.competitiveIntel || "Unknown"}`,
    "",
    `### RECOMMENDED ANGLE (use this as the primary framing)`,
    researchBrief.recommendedAngle,
    "",
    "Build your outreach around this recommended angle. It should be the central theme of your messaging.",
  ];

  // Add Gong talk track insights if available
  if (gongInsights && (gongInsights.topTopics.length > 0 || gongInsights.effectiveQuestions.length > 0)) {
    parts.push("", "## Gong Call Insights (from calls with similar companies)");
    if (gongInsights.topTopics.length > 0) {
      parts.push(`**Topics that resonate:** ${gongInsights.topTopics.join(", ")}`);
    }
    if (gongInsights.effectiveQuestions.length > 0) {
      parts.push(`**Questions that work:** ${gongInsights.effectiveQuestions.join("; ")}`);
    }
    if (gongInsights.commonObjections.length > 0) {
      parts.push(`**Common objections:** ${gongInsights.commonObjections.join("; ")}`);
    }
    if (gongInsights.winningTalkTracks.length > 0) {
      parts.push(`**Winning talk tracks:** ${gongInsights.winningTalkTracks.join("; ")}`);
    }
    parts.push("Use these insights to inform your messaging — reference topics that resonate and pre-handle common objections.");
  }

  parts.push("", "## Instructions", channelInstructions[channel]);

  return parts.join("\n");
}
