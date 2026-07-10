import { NextResponse } from "next/server";
import { getTradingWebhookHealth } from "@/lib/trading/persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getTradingWebhookHealth();
  return NextResponse.json(health, { status: health.configured && health.databaseConnected ? 200 : 503 });
}
