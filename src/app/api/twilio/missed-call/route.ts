import { type NextRequest } from "next/server";
import { handleTwilioMissedCallWebhook } from "@/lib/twilio/integration";

export async function POST(request: NextRequest) {
  return handleTwilioMissedCallWebhook(request);
}
