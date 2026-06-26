import { type NextRequest } from "next/server";
import { handleTwilioSmsWebhook } from "@/lib/twilio/integration";

export async function POST(request: NextRequest) {
  return handleTwilioSmsWebhook(request);
}
