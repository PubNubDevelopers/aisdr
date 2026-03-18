const BASE_URL = "https://api.outreach.io/api/v2";

function getHeaders(): HeadersInit {
  const token = process.env.OUTREACH_ACCESS_TOKEN;
  if (!token) throw new Error("OUTREACH_ACCESS_TOKEN not configured");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/vnd.api+json",
  };
}

export function isOutreachConfigured(): boolean {
  return !!process.env.OUTREACH_ACCESS_TOKEN;
}

// --- Prospects ---

export async function createOutreachProspect(params: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  tags?: string[];
}): Promise<{ id: number }> {
  const response = await fetch(`${BASE_URL}/prospects`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "prospect",
        attributes: {
          firstName: params.firstName,
          lastName: params.lastName,
          emails: params.email ? [params.email] : [],
          homePhones: params.phone ? [params.phone] : [],
          title: params.title,
          company: params.company,
          linkedInUrl: params.linkedinUrl,
          tags: params.tags || [],
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Outreach create prospect failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return { id: data.data.id };
}

export async function findOutreachProspectByEmail(
  email: string
): Promise<{ id: number } | null> {
  const response = await fetch(
    `${BASE_URL}/prospects?filter[emails]=${encodeURIComponent(email)}`,
    { headers: getHeaders() }
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (data.data?.length > 0) {
    return { id: data.data[0].id };
  }
  return null;
}

// --- Sequences ---

export async function listSequences(): Promise<
  Array<{ id: number; name: string; enabled: boolean; stepCount: number }>
> {
  const response = await fetch(
    `${BASE_URL}/sequences?filter[enabled]=true&page[limit]=50`,
    { headers: getHeaders() }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return (data.data || []).map(
    (s: { id: number; attributes: { name: string; enabled: boolean; sequenceStepCount: number } }) => ({
      id: s.id,
      name: s.attributes.name,
      enabled: s.attributes.enabled,
      stepCount: s.attributes.sequenceStepCount,
    })
  );
}

export async function addProspectToSequence(params: {
  prospectId: number;
  sequenceId: number;
  mailboxId?: number;
}): Promise<{ id: number }> {
  const relationships: Record<string, { data: { type: string; id: number } }> = {
    prospect: { data: { type: "prospect", id: params.prospectId } },
    sequence: { data: { type: "sequence", id: params.sequenceId } },
  };

  if (params.mailboxId) {
    relationships.mailbox = { data: { type: "mailbox", id: params.mailboxId } };
  }

  const response = await fetch(`${BASE_URL}/sequenceStates`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "sequenceState",
        relationships,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Outreach add to sequence failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return { id: data.data.id };
}

// --- Personalized Steps ---

export async function createPersonalizedEmail(params: {
  sequenceStateId: number;
  stepNumber: number;
  subject: string;
  body: string;
}): Promise<void> {
  // Outreach allows overriding template content for specific prospects
  const response = await fetch(`${BASE_URL}/sequenceSteps`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "sequenceStep",
        attributes: {
          // Note: Outreach's personalization works via Templates + Snippets
          // For MVP, we'll use the mailing/create endpoint instead
        },
      },
    }),
  });

  // For personalized emails, use the mailings endpoint
  await fetch(`${BASE_URL}/mailings`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "mailing",
        attributes: {
          subject: params.subject,
          bodyHtml: `<p>${params.body.replace(/\n/g, "</p><p>")}</p>`,
        },
        relationships: {
          sequenceState: {
            data: { type: "sequenceState", id: params.sequenceStateId },
          },
        },
      },
    }),
  });

  void response;
}

// --- Engagement Data ---

export async function getProspectEngagement(outreachProspectId: number): Promise<{
  opens: number;
  clicks: number;
  replies: number;
  bounces: number;
}> {
  const response = await fetch(
    `${BASE_URL}/prospects/${outreachProspectId}?include=mailings`,
    { headers: getHeaders() }
  );

  if (!response.ok) return { opens: 0, clicks: 0, replies: 0, bounces: 0 };

  const data = await response.json();
  const attrs = data.data?.attributes || {};

  return {
    opens: attrs.openCount || 0,
    clicks: attrs.clickCount || 0,
    replies: attrs.replyCount || 0,
    bounces: attrs.bounceCount || 0,
  };
}

export async function getSequenceStats(sequenceId: number): Promise<{
  activeCount: number;
  bouncedCount: number;
  clickCount: number;
  deliverCount: number;
  openCount: number;
  replyCount: number;
}> {
  const response = await fetch(
    `${BASE_URL}/sequences/${sequenceId}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    return { activeCount: 0, bouncedCount: 0, clickCount: 0, deliverCount: 0, openCount: 0, replyCount: 0 };
  }

  const data = await response.json();
  const attrs = data.data?.attributes || {};

  return {
    activeCount: attrs.activeCount || 0,
    bouncedCount: attrs.bounceCount || 0,
    clickCount: attrs.clickCount || 0,
    deliverCount: attrs.deliverCount || 0,
    openCount: attrs.openCount || 0,
    replyCount: attrs.replyCount || 0,
  };
}
