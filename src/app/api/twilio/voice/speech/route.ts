import type { NextRequest } from "next/server";
import { handleTwilioVoiceSpeechWebhook } from "@/lib/twilio/integration";

export async function POST(request: NextRequest) {
  return handleTwilioVoiceSpeechWebhook(request);
}
