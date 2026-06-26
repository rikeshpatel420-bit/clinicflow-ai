import { type NextRequest } from "next/server";
import { handleTwilioVoicemailWebhook } from "@/lib/twilio/integration";

export async function POST(request: NextRequest) {
  return handleTwilioVoicemailWebhook(request);
}
