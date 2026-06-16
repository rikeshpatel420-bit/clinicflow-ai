export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: "active" | "paused" | "archived";
          timezone: string;
          phone: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: "active" | "paused" | "archived";
          timezone?: string;
          phone?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: "active" | "paused" | "archived";
          timezone?: string;
          phone?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          clinic_id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_members: {
        Row: {
          id: string;
          clinic_id: string;
          user_id: string | null;
          role: "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";
          status: "invited" | "active" | "suspended";
          invited_email: string | null;
          invited_by: string | null;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          user_id?: string | null;
          role?: "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";
          status?: "invited" | "active" | "suspended";
          invited_email?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          user_id?: string | null;
          role?: "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";
          status?: "invited" | "active" | "suspended";
          invited_email?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          clinic_id: string;
          full_name: string;
          preferred_name: string | null;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          status: "active" | "lead" | "inactive" | "archived";
          source: "manual" | "website" | "phone" | "referral" | "import";
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          full_name: string;
          preferred_name?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          status?: "active" | "lead" | "inactive" | "archived";
          source?: "manual" | "website" | "phone" | "referral" | "import";
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          full_name?: string;
          preferred_name?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          status?: "active" | "lead" | "inactive" | "archived";
          source?: "manual" | "website" | "phone" | "referral" | "import";
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      calls: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          direction: "inbound" | "outbound";
          status: "missed" | "answered" | "recovered" | "voicemail" | "queued";
          caller_number: string | null;
          clinic_number: string | null;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          summary: string | null;
          recovery_status: "not_started" | "queued" | "sms_draft" | "awaiting_reply" | "recovered" | "closed" | "failed";
          recovery_next_action: string | null;
          recovery_updated_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id?: string | null;
          direction?: "inbound" | "outbound";
          status?: "missed" | "answered" | "recovered" | "voicemail" | "queued";
          caller_number?: string | null;
          clinic_number?: string | null;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          summary?: string | null;
          recovery_status?: "not_started" | "queued" | "sms_draft" | "awaiting_reply" | "recovered" | "closed" | "failed";
          recovery_next_action?: string | null;
          recovery_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string | null;
          direction?: "inbound" | "outbound";
          status?: "missed" | "answered" | "recovered" | "voicemail" | "queued";
          caller_number?: string | null;
          clinic_number?: string | null;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          summary?: string | null;
          recovery_status?: "not_started" | "queued" | "sms_draft" | "awaiting_reply" | "recovered" | "closed" | "failed";
          recovery_next_action?: string | null;
          recovery_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          channel: "sms" | "phone" | "email" | "web";
          status: "open" | "pending" | "closed";
          priority: "low" | "normal" | "urgent";
          subject: string;
          ai_summary: string | null;
          follow_up_state: "not_started" | "scheduled" | "awaiting_reply" | "completed" | "failed" | "paused";
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id?: string | null;
          channel?: "sms" | "phone" | "email" | "web";
          status?: "open" | "pending" | "closed";
          priority?: "low" | "normal" | "urgent";
          subject: string;
          ai_summary?: string | null;
          follow_up_state?: "not_started" | "scheduled" | "awaiting_reply" | "completed" | "failed" | "paused";
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string | null;
          channel?: "sms" | "phone" | "email" | "web";
          status?: "open" | "pending" | "closed";
          priority?: "low" | "normal" | "urgent";
          subject?: string;
          ai_summary?: string | null;
          follow_up_state?: "not_started" | "scheduled" | "awaiting_reply" | "completed" | "failed" | "paused";
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      conversation_messages: {
        Row: {
          id: string;
          clinic_id: string;
          conversation_id: string;
          sender_type: "patient" | "staff" | "ai" | "system";
          direction: "inbound" | "outbound";
          body: string;
          delivery_status: "draft" | "queued" | "sent" | "delivered" | "failed" | "received";
          ai_generated: boolean;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          conversation_id: string;
          sender_type: "patient" | "staff" | "ai" | "system";
          direction: "inbound" | "outbound";
          body: string;
          delivery_status?: "draft" | "queued" | "sent" | "delivered" | "failed" | "received";
          ai_generated?: boolean;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          conversation_id?: string;
          sender_type?: "patient" | "staff" | "ai" | "system";
          direction?: "inbound" | "outbound";
          body?: string;
          delivery_status?: "draft" | "queued" | "sent" | "delivered" | "failed" | "received";
          ai_generated?: boolean;
          sent_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          status: "draft" | "scheduled" | "active" | "paused" | "completed";
          audience: string;
          message_template: string;
          follow_up_state: "not_started" | "scheduled" | "awaiting_reply" | "completed" | "failed" | "paused";
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          status?: "draft" | "scheduled" | "active" | "paused" | "completed";
          audience?: string;
          message_template: string;
          follow_up_state?: "not_started" | "scheduled" | "awaiting_reply" | "completed" | "failed" | "paused";
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          name?: string;
          status?: "draft" | "scheduled" | "active" | "paused" | "completed";
          audience?: string;
          message_template?: string;
          follow_up_state?: "not_started" | "scheduled" | "awaiting_reply" | "completed" | "failed" | "paused";
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      recovery_opportunities: {
        Row: {
          id: string;
          clinic_id: string;
          call_id: string | null;
          patient_id: string | null;
          stage: "missed" | "contacted" | "replied" | "booked" | "lost";
          priority_score: number;
          estimated_revenue_pence: number;
          booked_at: string | null;
          lost_reason: string | null;
          next_action: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          call_id?: string | null;
          patient_id?: string | null;
          stage?: "missed" | "contacted" | "replied" | "booked" | "lost";
          priority_score?: number;
          estimated_revenue_pence?: number;
          booked_at?: string | null;
          lost_reason?: string | null;
          next_action?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          call_id?: string | null;
          patient_id?: string | null;
          stage?: "missed" | "contacted" | "replied" | "booked" | "lost";
          priority_score?: number;
          estimated_revenue_pence?: number;
          booked_at?: string | null;
          lost_reason?: string | null;
          next_action?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      patient_leads: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          source: "manual" | "website" | "phone" | "missed_call" | "referral" | "campaign" | "import";
          status: "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "archived";
          priority: "low" | "normal" | "high" | "urgent";
          owner_user_id: string | null;
          estimated_value_pence: number;
          lead_score: number;
          enquiry_summary: string | null;
          loss_reason: string | null;
          next_follow_up_at: string | null;
          converted_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id?: string | null;
          source?: "manual" | "website" | "phone" | "missed_call" | "referral" | "campaign" | "import";
          status?: "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "archived";
          priority?: "low" | "normal" | "high" | "urgent";
          owner_user_id?: string | null;
          estimated_value_pence?: number;
          lead_score?: number;
          enquiry_summary?: string | null;
          loss_reason?: string | null;
          next_follow_up_at?: string | null;
          converted_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string | null;
          source?: "manual" | "website" | "phone" | "missed_call" | "referral" | "campaign" | "import";
          status?: "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "archived";
          priority?: "low" | "normal" | "high" | "urgent";
          owner_user_id?: string | null;
          estimated_value_pence?: number;
          lead_score?: number;
          enquiry_summary?: string | null;
          loss_reason?: string | null;
          next_follow_up_at?: string | null;
          converted_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      missed_call_recovery_workflows: {
        Row: {
          id: string;
          clinic_id: string;
          call_id: string | null;
          patient_id: string | null;
          lead_id: string | null;
          state:
            | "queued"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
            | "booked"
            | "closed"
            | "failed";
          channel: "sms" | "phone" | "email" | "whatsapp";
          current_step: number;
          max_steps: number;
          next_action_at: string | null;
          assigned_user_id: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          call_id?: string | null;
          patient_id?: string | null;
          lead_id?: string | null;
          state?:
            | "queued"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
            | "booked"
            | "closed"
            | "failed";
          channel?: "sms" | "phone" | "email" | "whatsapp";
          current_step?: number;
          max_steps?: number;
          next_action_at?: string | null;
          assigned_user_id?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          call_id?: string | null;
          patient_id?: string | null;
          lead_id?: string | null;
          state?:
            | "queued"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
            | "booked"
            | "closed"
            | "failed";
          channel?: "sms" | "phone" | "email" | "whatsapp";
          current_step?: number;
          max_steps?: number;
          next_action_at?: string | null;
          assigned_user_id?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      sms_events: {
        Row: {
          id: string;
          clinic_id: string;
          provider_account_id: string | null;
          conversation_id: string | null;
          patient_id: string | null;
          workflow_id: string | null;
          provider: "twilio" | "manual";
          provider_message_id: string | null;
          direction: "inbound" | "outbound";
          status: "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received" | "cancelled";
          from_number: string | null;
          to_number: string | null;
          body_preview: string | null;
          error_code: string | null;
          error_message: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          provider_account_id?: string | null;
          conversation_id?: string | null;
          patient_id?: string | null;
          workflow_id?: string | null;
          provider?: "twilio" | "manual";
          provider_message_id?: string | null;
          direction: "inbound" | "outbound";
          status?: "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received" | "cancelled";
          from_number?: string | null;
          to_number?: string | null;
          body_preview?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          provider_account_id?: string | null;
          conversation_id?: string | null;
          patient_id?: string | null;
          workflow_id?: string | null;
          provider?: "twilio" | "manual";
          provider_message_id?: string | null;
          direction?: "inbound" | "outbound";
          status?: "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received" | "cancelled";
          from_number?: string | null;
          to_number?: string | null;
          body_preview?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      dashboard_metric_snapshots: {
        Row: {
          id: string;
          clinic_id: string;
          period_start: string;
          period_end: string;
          missed_calls: number;
          recovered_calls: number;
          new_leads: number;
          booked_leads: number;
          sms_sent: number;
          revenue_recovered_pence: number;
          calculated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          period_start: string;
          period_end: string;
          missed_calls?: number;
          recovered_calls?: number;
          new_leads?: number;
          booked_leads?: number;
          sms_sent?: number;
          revenue_recovered_pence?: number;
          calculated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          period_start?: string;
          period_end?: string;
          missed_calls?: number;
          recovered_calls?: number;
          new_leads?: number;
          booked_leads?: number;
          sms_sent?: number;
          revenue_recovered_pence?: number;
          calculated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          clinic_id: string | null;
          actor_user_id: string | null;
          event_type: string;
          entity_table: string;
          entity_id: string | null;
          risk_level: "low" | "medium" | "high";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id?: string | null;
          actor_user_id?: string | null;
          event_type: string;
          entity_table: string;
          entity_id?: string | null;
          risk_level?: "low" | "medium" | "high";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string | null;
          actor_user_id?: string | null;
          event_type?: string;
          entity_table?: string;
          entity_id?: string | null;
          risk_level?: "low" | "medium" | "high";
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

export type Clinic = Tables<"clinics">;
export type Profile = Tables<"profiles">;
export type ClinicMember = Tables<"clinic_members">;
export type Patient = Tables<"patients">;
export type Call = Tables<"calls">;
export type Conversation = Tables<"conversations">;
export type ConversationMessage = Tables<"conversation_messages">;
export type Campaign = Tables<"campaigns">;
export type RecoveryOpportunity = Tables<"recovery_opportunities">;
export type PatientLead = Tables<"patient_leads">;
export type MissedCallRecoveryWorkflow = Tables<"missed_call_recovery_workflows">;
export type SmsEvent = Tables<"sms_events">;
export type DashboardMetricSnapshot = Tables<"dashboard_metric_snapshots">;
export type AuditEvent = Tables<"audit_events">;
