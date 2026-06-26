import { type NextRequest } from "next/server";
import { handleTwilioVoiceWebhook } from "@/lib/twilio/integration";

export async function POST(request: NextRequest) {
  return handleTwilioVoiceWebhook(request);
}
