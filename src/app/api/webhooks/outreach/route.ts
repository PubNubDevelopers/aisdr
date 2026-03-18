import { NextResponse } from "next/server";

// Outreach webhook handler (Phase 2)
// Receives engagement events: opens, clicks, replies, bounces
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Outreach webhook received:", JSON.stringify(body).slice(0, 200));

    // TODO: Process Outreach engagement events
    // - Update message status (opened, clicked, replied, bounced)
    // - Update prospect status based on engagement
    // - Trigger AI analysis for hot prospects

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
