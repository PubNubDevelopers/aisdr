// SDR Director's 12-Step Outreach Playbook
// Source: SDR Director feedback document (2026-03-18)
// This is the single source of truth for sequence structure.

export interface SequenceStepDef {
  step: number;
  day: number;
  channel: "EMAIL" | "LINKEDIN" | "PHONE";
  type:
    | "manual_email"
    | "automated_email"
    | "connect_request"
    | "linkedin_message"
    | "call";
  isNewThread: boolean;
  phase: "value" | "proof" | "competitor" | "breakup";
  maxWords: number;
  subjectMaxWords?: number;
  description: string;
  aiInstructions: string;
}

export const SEQUENCE_PLAYBOOK: SequenceStepDef[] = [
  // ── Batch 1: Value Phase (Days 1-5) ──────────────────────────
  {
    step: 1,
    day: 1,
    channel: "LINKEDIN",
    type: "connect_request",
    isNewThread: false,
    phase: "value",
    maxWords: 45,
    description: "LinkedIn connect request",
    aiInstructions: `Write a LinkedIn connection request note. Max 45 words. Highlight the value of connecting — "Reaching out because I discuss X" or "Would love to connect to discuss Y." Provide value upfront. Do NOT pitch. Do NOT sell. Keep it conversational and genuine.`,
  },
  {
    step: 2,
    day: 2,
    channel: "EMAIL",
    type: "manual_email",
    isNewThread: true,
    phase: "value",
    maxWords: 90,
    subjectMaxWords: 5,
    description: "Manual email — new thread, A/B/C subject lines",
    aiInstructions: `Write a cold email. Max 90 words. Three paragraphs:
1. Personalized problem statement the prospect likely faces
2. How PubNub solves it — hyperlink to the relevant solution page (the first mention of "PubNub" MUST be hyperlinked to the primary solution URL). Include a natural hyperlink to a relevant resource on pubnub.com.
3. Ask for a quick 15-minute meeting, suggest a specific timeframe ("later this week" or "next Tuesday")

Subject line: Max 5 words. Question or direct value. Generate 3 A/B/C subject line variants.
Examples: "Real-time fraud detection" "In-app chat" "{{company}} + PubNub" "Increasing fan engagement"

Sign off with "Best regards, {{sender.first_name}}"`,
  },
  {
    step: 3,
    day: 2,
    channel: "PHONE",
    type: "call",
    isNewThread: false,
    phase: "value",
    maxWords: 200,
    description: "Call script — qualify or disqualify",
    aiInstructions: `Write a cold call script. Keep the pitch SHORT. Structure:
- Opener: State the problem statement relevant to their company
- Value: Who PubNub has solved it for (mention a specific customer) and how
- Ask: "Are you interested in learning more?"
- Quick qualify/disqualify

Also write a voicemail script: Quick, high-level question about the problem statement. Max 30 words.`,
  },
  {
    step: 4,
    day: 5,
    channel: "EMAIL",
    type: "automated_email",
    isNewThread: false,
    phase: "proof",
    maxWords: 90,
    subjectMaxWords: 5,
    description: "Automated bump — social proof, reference previous email",
    aiInstructions: `Write a bump email replying to the previous email. Very short — max 60 words. Structure:
1. Reference the previous email — "any thoughts?" or "did you get a chance to see my note?"
2. Integrate social proof: mention 2-3 specific customer names with hyperlinks to their customer story pages
3. Ask if they'd like to learn how these companies implemented PubNub

Example format: "Companies like [Customer1](url), [Customer2](url), and more rely on PubNub to [value prop]. Are you interested in learning more?"

Sign off with "Best, {{sender.first_name}}"`,
  },

  // ── Batch 2: Proof Phase (Days 6-10) ─────────────────────────
  {
    step: 5,
    day: 6,
    channel: "LINKEDIN",
    type: "linkedin_message",
    isNewThread: false,
    phase: "proof",
    maxWords: 45,
    description: "LinkedIn message (if connected) or view profile",
    aiInstructions: `Write a LinkedIn message. Max 45 words. Similar to the first email's messaging but much shorter. Reference the problem statement and PubNub's solution. If they haven't connected, this will be a profile view — write the message for the connected scenario.`,
  },
  {
    step: 6,
    day: 8,
    channel: "EMAIL",
    type: "automated_email",
    isNewThread: false,
    phase: "proof",
    maxWords: 90,
    subjectMaxWords: 5,
    description: "Automated bump — demo/blog link, build on previous emails",
    aiInstructions: `Write a bump email building on the previous two emails. Max 90 words. Structure:
1. Continue the conversation — provide additional context on how PubNub solves the problem from email 1
2. Hyperlink to a relevant demo, blog post, or documentation on pubnub.com
3. Offer to show them a live example — "Want to see this live? Our [demo name](demo-url) shows how PubNub fits into your platform."
4. Ask for a conversation

Sign off with "Best, {{sender.first_name}}"`,
  },
  {
    step: 7,
    day: 10,
    channel: "LINKEDIN",
    type: "linkedin_message",
    isNewThread: false,
    phase: "proof",
    maxWords: 45,
    description: "LinkedIn message — social/technical proof",
    aiInstructions: `Write a LinkedIn message. Max 45 words. Similar to the second and third email messaging. Provide social and technical proof that PubNub solves the original problem statement. Reference a specific customer or technical capability.`,
  },
  {
    step: 8,
    day: 10,
    channel: "PHONE",
    type: "call",
    isNewThread: false,
    phase: "proof",
    maxWords: 200,
    description: "Call script — qualify or disqualify, build on previous",
    aiInstructions: `Write a second call script. Keep the pitch SHORT. Same structure as the first call but build on previous touchpoints:
- Opener: Reference that you've emailed/connected on LinkedIn
- Value: Problem statement + who PubNub has solved it for + how
- Ask: "Are you interested in learning more?"

Also write a voicemail: High-level question about the problem statement, building on the first voicemail. Max 30 words.`,
  },

  // ── Batch 3: Competitor + Breakup Phase (Days 14-22) ─────────
  {
    step: 9,
    day: 14,
    channel: "EMAIL",
    type: "manual_email",
    isNewThread: true,
    phase: "competitor",
    maxWords: 90,
    subjectMaxWords: 5,
    description: "Manual email — new thread, competitor/similar company angle",
    aiInstructions: `Write a NEW thread email (not a reply). Max 90 words. Three paragraphs:
1. The same problem statement from email 1
2. How their COMPETITOR or a similar company solved this problem using PubNub — hyperlink to a relevant customer story or resource. This hyperlink must read naturally in the sentence.
3. Ask for a quick meeting

Subject line: Max 5 words. Generate 3 A/B/C variants. Example: "How [Competitor] uses PubNub"

Sign off with "Best regards, {{sender.first_name}}"`,
  },
  {
    step: 10,
    day: 17,
    channel: "LINKEDIN",
    type: "linkedin_message",
    isNewThread: false,
    phase: "breakup",
    maxWords: 45,
    description: "LinkedIn breakup — ask if right person, social proof",
    aiInstructions: `Write a "breakup" LinkedIn message. Max 45 words. Structure:
- Ask if they are the right person to discuss this with
- If not, ask them to point you in the right direction
- Reiterate the value of the conversation
- Mention that you've helped a competitor or similar company`,
  },
  {
    step: 11,
    day: 19,
    channel: "PHONE",
    type: "call",
    isNewThread: false,
    phase: "breakup",
    maxWords: 200,
    description: "Call script — breakup, qualify or disqualify",
    aiInstructions: `Write a "breakup" call script. Short pitch:
- Opener: State the problem + who PubNub has solved it for + how
- Ask if they're interested in learning more
- If they can't help, ask for a referral to the right person

Also write a breakup voicemail: Quick question about whether they're the right person. Max 30 words. This is a "last attempt" tone — respectful, not pushy.`,
  },
  {
    step: 12,
    day: 22,
    channel: "EMAIL",
    type: "automated_email",
    isNewThread: false,
    phase: "breakup",
    maxWords: 90,
    subjectMaxWords: 5,
    description: "Automated breakup email — right person?",
    aiInstructions: `Write a short "breakup" email. Max 60 words. Structure:
- Ask if they are the right person to discuss this with
- If not, ask who they'd recommend you speak with
- Reiterate the value briefly — mention helping a competitor or similar company
- Keep tone respectful and not pushy

Subject line: Max 5 words. Generate 3 A/B/C variants. Examples: "Are you the right person?" "Right person?"

Sign off with "Best, {{sender.first_name}}"`,
  },
];

/** Get steps for a specific batch */
export function getStepsForBatch(batch: 1 | 2 | 3): SequenceStepDef[] {
  switch (batch) {
    case 1:
      return SEQUENCE_PLAYBOOK.filter((s) => s.step >= 1 && s.step <= 4);
    case 2:
      return SEQUENCE_PLAYBOOK.filter((s) => s.step >= 5 && s.step <= 8);
    case 3:
      return SEQUENCE_PLAYBOOK.filter((s) => s.step >= 9 && s.step <= 12);
  }
}

/** Get a human-readable summary of the playbook for display */
export function getPlaybookSummary(): Array<{
  step: number;
  day: number;
  channel: string;
  description: string;
  phase: string;
}> {
  return SEQUENCE_PLAYBOOK.map((s) => ({
    step: s.step,
    day: s.day,
    channel: s.channel,
    description: s.description,
    phase: s.phase,
  }));
}
