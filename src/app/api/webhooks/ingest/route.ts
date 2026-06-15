import { NextResponse } from "next/server";
import { acceptDemoWebhook, createWebhookEnvelope } from "@/lib/webhooks/ingestion";

export async function POST(request: Request) {
  const provider = request.headers.get("x-clinicflow-provider") ?? "internal";
  const eventType = request.headers.get("x-clinicflow-event") ?? "demo.event";
  const envelope = createWebhookEnvelope(provider === "twilio" || provider === "stripe" || provider === "supabase" ? provider : "internal", eventType);

  return NextResponse.json(acceptDemoWebhook(envelope));
}

