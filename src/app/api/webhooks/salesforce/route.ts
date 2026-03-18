import { NextResponse } from "next/server";

// Salesforce webhook handler (Phase 2)
// Receives push notifications for account/contact updates
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Salesforce webhook received:", JSON.stringify(body).slice(0, 200));

    // TODO: Process Salesforce change events
    // - Update local company/prospect records
    // - Trigger re-enrichment if needed

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
