import type { User } from "@supabase/supabase-js";
import type { Campaign, Clinic, Conversation, ConversationMessage } from "@/types/database";
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

  const [{ data: clinic }, conversationsResult, campaignsResult] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("conversations")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false })
      .returns<Conversation[]>(),
    supabase
      .from("campaigns")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .returns<Campaign[]>(),
  ]);

  const conversationIds = (conversationsResult.data ?? []).map((conversation) => conversation.id);
  const messagesResult =
    conversationIds.length > 0
      ? await supabase
          .from("conversation_messages")
          .select("*")
          .in("conversation_id", conversationIds)
          .order("sent_at", { ascending: true })
          .returns<ConversationMessage[]>()
      : { data: [] as ConversationMessage[], error: null };

  return buildData({
    campaigns: campaignsResult.data ?? [],
    clinic: clinic ?? null,
    conversations: conversationsResult.data ?? [],
    error: conversationsResult.error || campaignsResult.error || messagesResult.error ? "Could not load communication records." : null,
    messages: messagesResult.data ?? [],
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
