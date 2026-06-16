export type ClinicRole = "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";

export type PatientLeadStatus = "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "archived";

export type MissedCallWorkflowState =
  | "queued"
  | "drafted"
  | "awaiting_staff_approval"
  | "message_queued"
  | "awaiting_patient_reply"
  | "booked"
  | "closed"
  | "failed";

export type SmsEventStatus = "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received" | "cancelled";

export type AiAuditAction =
  | "draft_created"
  | "draft_edited"
  | "draft_approved"
  | "draft_rejected"
  | "message_sent"
  | "summary_created"
  | "classification_created";

export type SubscriptionRecordStatus = "trialing" | "active" | "past_due" | "paused" | "cancelled" | "incomplete";

export type PatientLeadRecord = {
  clinic_id: string;
  created_at: string;
  id: string;
  lead_score: number;
  owner_user_id: string | null;
  patient_id: string | null;
  status: PatientLeadStatus;
};

export type SmsEventRecord = {
  clinic_id: string;
  direction: "inbound" | "outbound";
  id: string;
  occurred_at: string;
  provider: "twilio" | "manual";
  provider_message_id: string | null;
  status: SmsEventStatus;
};

export type DashboardMetricSnapshot = {
  booked_leads: number;
  clinic_id: string;
  missed_calls: number;
  new_leads: number;
  period_end: string;
  period_start: string;
  recovered_calls: number;
  revenue_recovered_pence: number;
  sms_sent: number;
};
