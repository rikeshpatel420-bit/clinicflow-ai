import { type NextRequest } from "next/server";
import { handleTwilioStatusWebhook } from "@/lib/twilio/integration";

export async function POST(request: NextRequest) {
  return handleTwilioStatusWebhook(request);
}
