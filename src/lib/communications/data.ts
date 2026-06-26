import type { User } from "@supabase/supabase-js";
import type { Call, Campaign, Clinic, Conversation, ConversationMessage, PatientLead, SmsEvent } from "@/types/database";
import { demoClinic, demoPatients } from "@/lib/dashboard/data";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const now = new Date().toISOString();

export const demoConversations: Conversation[] = [
  {
    id: "44444444-4444-4444-8444-444444444441",
    clinic_id: demoClinic.id,
    patient_id: demoPatients[0]?.id ?? null,
    channel: "sms",
    status: "open",
    priority: "urgent",
    subject: "New consultation enquiry",
    ai_summary: "Placeholder summary: patient wants pricing and earliest consultation availability.",
    follow_up_state: "awaiting_reply",
    last_message_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: "44444444-4444-4444-8444-444444444442",
    clinic_id: demoClinic.id,
    patient_id: demoPatients[1]?.id ?? null,
    channel: "sms",
    status: "pending",
    priority: "normal",
    subject: "Reschedule request",
    ai_summary: "Placeholder summary: patient asked to move an appointment to next week.",
    follow_up_state: "scheduled",
    last_message_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

export const demoMessages: ConversationMessage[] = [
  {
    id: "55555555-5555-4555-8555-555555555551",
    clinic_id: demoClinic.id,
    conversation_id: demoConversations[0].id,
    sender_type: "patient",
    direction: "inbound",
    body: "Hi, I missed your call. Can you tell me consultation availability?",
    delivery_status: "received",
    ai_generated: false,
    sent_at: now,
    created_at: now,
  },
  {
    id: "55555555-5555-4555-8555-555555555552",
    clinic_id: demoClinic.id,
    conversation_id: demoConversations[0].id,
    sender_type: "ai",
    direction: "outbound",
    body: "Draft only: Thanks for reaching out. Our team can help with consultation availability shortly.",
    delivery_status: "draft",
    ai_generated: true,
    sent_at: now,
    created_at: now,
  },
];

export const demoCampaigns: Campaign[] = [
  {
    id: "66666666-6666-4666-8666-666666666661",
    clinic_id: demoClinic.id,
    name: "Hygiene recall draft",
    status: "draft",
    audience: "inactive_patients",
    message_template: "Hi {{first_name}}, you are due for a hygiene appointment. Reply to book.",
    follow_up_state: "not_started",
    scheduled_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

export type CommunicationsData = {
  activity: Array<{ label: string; meta: string; status: string }>;
  campaigns: Campaign[];
  clinic: Clinic | null;
  conversations: Conversation[];
  emptyMessage: string | null;
  error: string | null;
  messages: ConversationMessage[];
  source: "demo" | "supabase";
};

function buildData(input: Omit<CommunicationsData, "activity" | "emptyMessage">): CommunicationsData {
  return {
    ...input,
    activity: input.conversations.slice(0, 4).map((conversation) => ({
      label: conversation.subject,
      meta: conversation.ai_summary ?? "No AI summary yet.",
      status: conversation.follow_up_state,
    })),
    emptyMessage: input.clinic ? null : "No clinic workspace found. Create a clinic before using the inbox.",
  };
}

function messageStatusFromSmsEvent(status: SmsEvent["status"]): ConversationMessage["delivery_status"] {
  if (status === "cancelled" || status === "undelivered") return "failed";
  return status;
}

function messageFromSmsEvent(event: SmsEvent, conversationId: string): ConversationMessage {
  return {
    ai_generated: event.direction === "outbound",
    body: event.body_preview ?? "SMS event recorded.",
    clinic_id: event.clinic_id,
    conversation_id: conversationId,
    created_at: event.occurred_at,
    delivery_status: messageStatusFromSmsEvent(event.status),
    direction: event.direction,
    id: event.id,
    sender_type: event.direction === "inbound" ? "patient" : "ai",
    sent_at: event.occurred_at,
  };
}

function conversationKey(event: SmsEvent) {
  return event.recovery_workflow_id ?? event.call_id ?? event.lead_id ?? event.to_number_hash ?? event.from_number_hash ?? event.id;
}

function replyStateFromEvents(events: SmsEvent[]): Conversation["follow_up_state"] {
  const latest = events[events.length - 1];
  if (!latest) return "not_started";
  if (events.some((event) => event.direction === "inbound")) return "awaiting_reply";
  if (latest.status === "delivered" || latest.status === "sent") return "scheduled";
  if (latest.status === "failed" || latest.status === "undelivered") return "failed";
  return "not_started";
}

function conversationFromGroup(input: {
  events: SmsEvent[];
  leadsById: Map<string, PatientLead>;
  callsById: Map<string, Call>;
}): Conversation {
  const sorted = [...input.events].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  const latest = sorted[sorted.length - 1];
  const lead = latest?.lead_id ? input.leadsById.get(latest.lead_id) ?? null : null;
  const call = latest?.call_id ? input.callsById.get(latest.call_id) ?? null : null;
  const outbound = [...sorted].reverse().find((event) => event.direction === "outbound");
  const subject =
    lead?.enquiry_summary?.split(".")[0]?.trim() ||
    call?.recovery_next_action ||
    (outbound?.body_preview ? outbound.body_preview.slice(0, 48) : "SMS conversation");
  const priority = lead?.priority === "urgent" || lead?.priority === "high" || sorted.some((event) => event.direction === "inbound") ? "urgent" : "normal";

  return {
    ai_summary: latest?.body_preview ?? lead?.enquiry_summary ?? "SMS conversation in progress.",
    channel: "sms",
    clinic_id: latest?.clinic_id ?? call?.clinic_id ?? lead?.clinic_id ?? demoClinic.id,
    created_at: sorted[0]?.occurred_at ?? latest?.occurred_at ?? new Date().toISOString(),
    deleted_at: null,
    follow_up_state: replyStateFromEvents(sorted),
    id: `sms-thread-${conversationKey(latest ?? sorted[0])}`,
    last_message_at: latest?.occurred_at ?? new Date().toISOString(),
    patient_id: lead?.id ?? null,
    priority,
    status: sorted.some((event) => event.direction === "inbound") ? "open" : "pending",
    subject,
    updated_at: latest?.occurred_at ?? new Date().toISOString(),
  };
}

export function getDemoCommunicationsData(): CommunicationsData {
  return buildData({
    campaigns: demoCampaigns,
    clinic: demoClinic,
    conversations: demoConversations,
    error: null,
    messages: demoMessages,
    source: "demo",
  });
}

export async function getCommunicationsData(user: Pick<User, "email" | "id" | "user_metadata"> | null): Promise<CommunicationsData> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) return getDemoCommunicationsData();

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return buildData({
      campaigns: [],
      clinic: null,
      conversations: [],
      error: null,
      messages: [],
      source: "supabase",
    });
  }

  const [{ data: clinic, error: clinicError }, { data: smsEvents, error: smsError }, { data: leads }, { data: calls }] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("sms_events")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .order("occurred_at", { ascending: false })
      .limit(25)
      .returns<SmsEvent[]>(),
    supabase.from("patient_leads").select("*").eq("clinic_id", membership.clinic_id).is("deleted_at", null).limit(50).returns<PatientLead[]>(),
    supabase.from("calls").select("*").eq("clinic_id", membership.clinic_id).is("deleted_at", null).limit(50).returns<Call[]>(),
  ]);

  const grouped = new Map<string, SmsEvent[]>();
  for (const event of smsEvents ?? []) {
    const key = conversationKey(event);
    const bucket = grouped.get(key) ?? [];
    bucket.push(event);
    grouped.set(key, bucket);
  }

  const leadsById = new Map((leads ?? []).map((lead) => [lead.id, lead]));
  const callsById = new Map((calls ?? []).map((call) => [call.id, call]));
  const conversations = Array.from(grouped.values()).map((events) => conversationFromGroup({ callsById, events, leadsById }));
  const messages = Array.from(grouped.entries()).flatMap(([conversationKeyValue, events]) =>
    [...events]
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .map((event) => messageFromSmsEvent({ ...event, provider_message_id: event.provider_message_id ?? `thread-${conversationKeyValue}` }, `sms-thread-${conversationKeyValue}`)),
  );

  return buildData({
    campaigns: [],
    clinic: clinic ?? null,
    conversations,
    error: clinicError || smsError ? "Could not load communication records." : null,
    messages,
    source: "supabase",
  });
}

export async function getConversationDetailData(user: Pick<User, "email" | "id" | "user_metadata"> | null, conversationId: string) {
  const data = await getCommunicationsData(user);
  const conversation = data.conversations.find((item) => item.id === conversationId) ?? null;
  const messages = data.messages.filter((message) => message.conversation_id === conversationId);

  return {
    ...data,
    conversation,
    messages,
  };
}
