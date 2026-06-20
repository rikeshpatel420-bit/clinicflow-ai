"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Inserts } from "@/types/database";

const demoMarker = "[ClinicFlow demo]";

const demoCases = [
  {
    caller: "+44 7700 900101",
    email: "amelia.turner@example.test",
    estimatedValue: 420000,
    name: "Amelia Turner",
    notes: "Missed implant enquiry. Wants to understand consultation cost and earliest availability.",
    preferredName: "Amelia",
    scenario: "Missed implant enquiry",
    source: "phone",
    status: "booked",
    summary: "Missed implant enquiry from a high-intent private patient.",
  },
  {
    caller: "+44 7700 900102",
    email: "daniel-hughes@example.test",
    estimatedValue: 18000,
    name: "Daniel Hughes",
    notes: "Emergency toothache. Asked for same-day advice and availability.",
    preferredName: "Daniel",
    scenario: "Emergency toothache",
    source: "phone",
    status: "contacted",
    summary: "Emergency toothache call missed during lunch cover.",
  },
  {
    caller: "+44 7700 900103",
    email: "sara.khan@example.test",
    estimatedValue: 8500,
    name: "Sara Khan",
    notes: "Hygienist reactivation. Overdue patient responded to recall prompt.",
    preferredName: "Sara",
    scenario: "Hygienist reactivation",
    source: "campaign",
    status: "qualified",
    summary: "Hygienist reactivation call recovered after missed callback.",
  },
  {
    caller: "+44 7700 900104",
    email: "oliver-morgan@example.test",
    estimatedValue: 320000,
    name: "Oliver Morgan",
    notes: "Invisalign enquiry. Asked about finance options and evening appointments.",
    preferredName: "Oliver",
    scenario: "Invisalign enquiry",
    source: "website",
    status: "booked",
    summary: "Invisalign enquiry recovered and moved toward consultation.",
  },
  {
    caller: "+44 7700 900105",
    email: "maya.patel@example.test",
    estimatedValue: 65000,
    name: "Maya Patel",
    notes: "Extraction consultation. Wants sedation options and recovery guidance.",
    preferredName: "Maya",
    scenario: "Extraction consultation",
    source: "phone",
    status: "new",
    summary: "Extraction consultation request missed after front-desk queue overflow.",
  },
  {
    caller: "+44 7700 900106",
    email: "thomas-evans@example.test",
    estimatedValue: 12000,
    name: "Thomas Evans",
    notes: "Cancellation recovery. Offered short-notice hygiene slot after cancellation.",
    preferredName: "Thomas",
    scenario: "Cancellation recovery",
    source: "manual",
    status: "contacted",
    summary: "Cancellation recovery call placed to fill tomorrow morning slot.",
  },
  {
    caller: "+44 7700 900107",
    email: "nina-williams@example.test",
    estimatedValue: 95000,
    name: "Nina Williams",
    notes: "Composite bonding enquiry. Asked for smile makeover price range.",
    preferredName: "Nina",
    scenario: "Cosmetic bonding enquiry",
    source: "website",
    status: "qualified",
    summary: "Cosmetic bonding enquiry missed after opening hours.",
  },
  {
    caller: "+44 7700 900108",
    email: "james-brooks@example.test",
    estimatedValue: 14000,
    name: "James Brooks",
    notes: "Broken crown. Needs urgent assessment before travel.",
    preferredName: "James",
    scenario: "Broken crown",
    source: "phone",
    status: "new",
    summary: "Broken crown call queued for urgent triage.",
  },
  {
    caller: "+44 7700 900109",
    email: "emma-clarke@example.test",
    estimatedValue: 220000,
    name: "Emma Clarke",
    notes: "Implant follow-up. Previously requested treatment plan but did not book.",
    preferredName: "Emma",
    scenario: "Implant plan reactivation",
    source: "manual",
    status: "booked",
    summary: "Implant treatment plan reactivation recovered by follow-up workflow.",
  },
  {
    caller: "+44 7700 900110",
    email: "ryan-scott@example.test",
    estimatedValue: 26000,
    name: "Ryan Scott",
    notes: "Whitening consultation. Asked about suitability before a wedding.",
    preferredName: "Ryan",
    scenario: "Whitening consultation",
    source: "referral",
    status: "contacted",
    summary: "Whitening enquiry recovered from missed referral call.",
  },
] satisfies Array<{
  caller: string;
  email: string;
  estimatedValue: number;
  name: string;
  notes: string;
  preferredName: string;
  scenario: string;
  source: "campaign" | "manual" | "phone" | "referral" | "website";
  status: "booked" | "contacted" | "new" | "qualified";
  summary: string;
}>;

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function leadSource(source: (typeof demoCases)[number]["source"]): Inserts<"patient_leads">["source"] {
  if (source === "campaign") return "campaign";
  if (source === "website") return "website";
  if (source === "referral") return "referral";
  if (source === "manual") return "manual";
  return "missed_call";
}

function leadPriority(index: number): Inserts<"patient_leads">["priority"] {
  if (index === 0 || index === 1 || index === 3) return "urgent";
  if (index < 7) return "high";
  return "normal";
}

function callStatus(index: number): Inserts<"calls">["status"] {
  return [0, 3, 8].includes(index) ? "recovered" : "missed";
}

function recoveryStatus(index: number): Inserts<"calls">["recovery_status"] {
  if ([0, 3, 8].includes(index)) return "recovered";
  if ([1, 5, 9].includes(index)) return "awaiting_reply";
  return "queued";
}

function workflowState(index: number): Inserts<"recovery_workflows">["state"] {
  if ([0, 3, 8].includes(index)) return "booked";
  if ([1, 5, 9].includes(index)) return "awaiting_patient_reply";
  if ([2, 6].includes(index)) return "message_queued";
  return "queued";
}

export async function loadDemoDataAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership || !["admin", "owner"].includes(membership.role)) {
    redirect("/dashboard?demo=not-authorised");
  }

  const admin = createSupabaseAdminClient();
  const clinicId = membership.clinic_id;
  const now = new Date().toISOString();

  const { count: existingDemoCount } = await admin
    .from("patient_leads")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .ilike("enquiry_summary", `%${demoMarker}%`);

  if (existingDemoCount && existingDemoCount > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/patients");
    revalidatePath("/calls");
    redirect("/dashboard?demo=already-loaded");
  }

  const leads: Inserts<"patient_leads">[] = demoCases.map((item, index) => ({
    clinic_id: clinicId,
    converted_at: item.status === "booked" ? hoursAgo(5 + index) : null,
    created_at: hoursAgo(70 - index * 5),
    created_by: user.id,
    enquiry_summary: `${demoMarker} ${item.name}: ${item.scenario}. ${item.notes} Email: ${item.email}. Phone: ${item.caller}.`,
    estimated_value_pence: item.estimatedValue,
    lead_score: Math.max(54, 96 - index * 4),
    next_follow_up_at: item.status === "booked" ? null : hoursFromNow(4 + index * 3),
    owner_user_id: user.id,
    priority: leadPriority(index),
    source: leadSource(item.source),
    status: item.status,
    updated_at: hoursAgo(5 + index),
    updated_by: user.id,
  }));

  const { data: insertedLeads, error: leadsError } = await admin.from("patient_leads").insert(leads).select("id");

  if (leadsError || !insertedLeads) {
    redirect("/dashboard?demo=error");
  }

  const calls: Inserts<"calls">[] = demoCases.map((item, index) => ({
    caller_number_hash: `demo-hash-${clinicId.slice(0, 8)}-${index + 1}`,
    caller_number_last4: item.caller.slice(-4),
    clinic_id: clinicId,
    clinic_number: "+44 20 7946 0820",
    created_at: hoursAgo(64 - index * 5),
    direction: "inbound",
    duration_seconds: callStatus(index) === "recovered" ? 212 + index * 13 : null,
    ended_at: callStatus(index) === "recovered" ? hoursAgo(63.9 - index * 5) : null,
    lead_id: insertedLeads[index]?.id ?? null,
    provider: "manual",
    provider_call_id: `demo-call-${clinicId.slice(0, 8)}-${index + 1}`,
    recovery_next_action:
      callStatus(index) === "recovered" ? "Booked or handed over to reception." : "Ava drafted follow-up and queued next contact.",
    recovery_status: recoveryStatus(index),
    recovery_updated_at: hoursAgo(3 + index),
    started_at: hoursAgo(65 - index * 5),
    status: callStatus(index),
    updated_at: hoursAgo(3 + index),
  }));

  const { data: insertedCalls, error: callsError } = await admin.from("calls").insert(calls).select("id");

  if (callsError || !insertedCalls) {
    redirect("/dashboard?demo=error");
  }

  const workflows: Inserts<"recovery_workflows">[] = demoCases.map((item, index) => ({
    assigned_user_id: user.id,
    call_id: insertedCalls[index]?.id ?? null,
    channel: "sms",
    clinic_id: clinicId,
    created_at: hoursAgo(63 - index * 5),
    current_step: [0, 3, 8].includes(index) ? 3 : [1, 5, 9].includes(index) ? 2 : 1,
    lead_id: insertedLeads[index]?.id ?? null,
    max_steps: 3,
    next_action_at: [0, 3, 8].includes(index) ? null : hoursFromNow(3 + index),
    state: workflowState(index),
    updated_at: hoursAgo(2 + index),
  }));

  const { data: insertedWorkflows, error: workflowsError } = await admin.from("recovery_workflows").insert(workflows).select("id");

  if (workflowsError || !insertedWorkflows) {
    redirect("/dashboard?demo=error");
  }

  const smsEvents: Inserts<"sms_events">[] = insertedWorkflows.flatMap((workflow, index) => {
    const item = demoCases[index];
    const call = insertedCalls[index];
    const lead = insertedLeads[index];
    const outbound: Inserts<"sms_events"> = {
      body_preview: `${demoMarker} Hi ${item.preferredName}, sorry we missed your call. Would you like help booking this with the clinic?`,
      call_id: call?.id ?? null,
      clinic_id: clinicId,
      direction: "outbound",
      from_number_hash: `demo-clinic-${clinicId.slice(0, 8)}`,
      lead_id: lead?.id ?? null,
      occurred_at: hoursAgo(62.5 - index * 5),
      provider: "manual",
      provider_message_id: `demo-sms-out-${clinicId.slice(0, 8)}-${index + 1}`,
      recovery_workflow_id: workflow.id,
      status: "delivered",
      to_number_hash: `demo-patient-${index + 1}`,
      to_number_last4: item.caller.slice(-4),
    };

    if (![0, 1, 3, 5, 8, 9].includes(index)) {
      return [outbound];
    }

    return [
      outbound,
      {
        body_preview: `${demoMarker} Patient replied about ${item.scenario.toLowerCase()}.`,
        call_id: call?.id ?? null,
        clinic_id: clinicId,
        direction: "inbound",
        from_number_hash: `demo-patient-${index + 1}`,
        lead_id: lead?.id ?? null,
        occurred_at: hoursAgo(61.5 - index * 5),
        provider: "manual",
        provider_message_id: `demo-sms-in-${clinicId.slice(0, 8)}-${index + 1}`,
        recovery_workflow_id: workflow.id,
        status: "received",
        to_number_hash: `demo-clinic-${clinicId.slice(0, 8)}`,
        to_number_last4: "0820",
      },
    ];
  });

  const { error: smsError } = await admin.from("sms_events").insert(smsEvents);

  if (smsError) {
    redirect("/dashboard?demo=error");
  }

  const recoveredCalls = calls.filter((call) => call.status === "recovered").length;
  const bookedLeads = leads.filter((lead) => lead.status === "booked").length;
  const recoveredRevenue = leads
    .filter((lead) => lead.status === "booked")
    .reduce((total, lead) => total + (lead.estimated_value_pence ?? 0), 0);

  const { error: snapshotError } = await admin.from("dashboard_metric_snapshots").insert({
    booked_leads: bookedLeads,
    calculated_at: now,
    clinic_id: clinicId,
    created_at: now,
    missed_calls: calls.length,
    new_leads: leads.length,
    period_end: now.slice(0, 10),
    period_start: hoursAgo(24 * 7).slice(0, 10),
    recovered_calls: recoveredCalls,
    revenue_recovered_pence: recoveredRevenue,
    sms_sent: smsEvents.filter((event) => event.direction === "outbound").length,
  });

  if (snapshotError) {
    redirect("/dashboard?demo=error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/patients");
  revalidatePath("/calls");
  revalidatePath("/recovery");
  redirect("/dashboard?demo=loaded");
}
