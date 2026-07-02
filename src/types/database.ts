export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          business_configuration: Json;
          id: string;
          name: string;
          onboarding_draft: Json;
          launch_state: Json;
          slug: string;
          status: "active" | "paused" | "suspended" | "archived";
          timezone: string;
          phone: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          business_configuration?: Json;
          id?: string;
          name: string;
          onboarding_draft?: Json;
          launch_state?: Json;
          slug: string;
          status?: "active" | "paused" | "suspended" | "archived";
          timezone?: string;
          phone?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          business_configuration?: Json;
          id?: string;
          name?: string;
          onboarding_draft?: Json;
          launch_state?: Json;
          slug?: string;
          status?: "active" | "paused" | "suspended" | "archived";
          timezone?: string;
          phone?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          status: "active" | "disabled";
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          status?: "active" | "disabled";
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          status?: "active" | "disabled";
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_users: {
        Row: {
          id: string;
          clinic_id: string;
          user_id: string | null;
          auth_user_id: string | null;
          role: "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";
          status: "invited" | "active" | "suspended" | "removed";
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
          auth_user_id?: string | null;
          role?: "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";
          status?: "invited" | "active" | "suspended" | "removed";
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
          auth_user_id?: string | null;
          role?: "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";
          status?: "invited" | "active" | "suspended" | "removed";
          invited_email?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          lead_id: string | null;
          direction: "inbound" | "outbound";
          status: "missed" | "answered" | "recovered" | "voicemail" | "queued" | "failed" | "abandoned";
          caller_number_hash: string | null;
          caller_number_last4: string | null;
          clinic_number: string | null;
          provider: "manual" | "twilio";
          provider_call_id: string | null;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          recovery_status:
            | "not_started"
            | "queued"
            | "sms_draft"
            | "sms_sent"
            | "drafted"
            | "awaiting_reply"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "closed"
            | "failed";
          recovery_next_action: string | null;
          recovery_updated_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          lead_id?: string | null;
          direction?: "inbound" | "outbound";
          status?: "missed" | "answered" | "recovered" | "voicemail" | "queued" | "failed" | "abandoned";
          caller_number_hash?: string | null;
          caller_number_last4?: string | null;
          clinic_number?: string | null;
          provider?: "manual" | "twilio";
          provider_call_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          recovery_status?:
            | "not_started"
            | "queued"
            | "sms_draft"
            | "sms_sent"
            | "drafted"
            | "awaiting_reply"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "closed"
            | "failed";
          recovery_next_action?: string | null;
          recovery_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          lead_id?: string | null;
          direction?: "inbound" | "outbound";
          status?: "missed" | "answered" | "recovered" | "voicemail" | "queued" | "failed" | "abandoned";
          caller_number_hash?: string | null;
          caller_number_last4?: string | null;
          clinic_number?: string | null;
          provider?: "manual" | "twilio";
          provider_call_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          recovery_status?:
            | "not_started"
            | "queued"
            | "sms_draft"
            | "sms_sent"
            | "drafted"
            | "awaiting_reply"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "closed"
            | "failed";
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
          source: "manual" | "website" | "phone" | "missed_call" | "referral" | "campaign" | "import";
          status: "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "recovered" | "opted_out" | "archived";
          priority: "low" | "normal" | "high" | "urgent";
          owner_user_id: string | null;
          estimated_value_pence: number;
          lead_score: number;
          enquiry_summary: string | null;
          loss_reason: string | null;
          gdpr_lawful_basis: string;
          marketing_consent: boolean;
          retention_until: string | null;
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
          source?: "manual" | "website" | "phone" | "missed_call" | "referral" | "campaign" | "import";
          status?: "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "recovered" | "opted_out" | "archived";
          priority?: "low" | "normal" | "high" | "urgent";
          owner_user_id?: string | null;
          estimated_value_pence?: number;
          lead_score?: number;
          enquiry_summary?: string | null;
          loss_reason?: string | null;
          gdpr_lawful_basis?: string;
          marketing_consent?: boolean;
          retention_until?: string | null;
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
          source?: "manual" | "website" | "phone" | "missed_call" | "referral" | "campaign" | "import";
          status?: "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "recovered" | "opted_out" | "archived";
          priority?: "low" | "normal" | "high" | "urgent";
          owner_user_id?: string | null;
          estimated_value_pence?: number;
          lead_score?: number;
          enquiry_summary?: string | null;
          loss_reason?: string | null;
          gdpr_lawful_basis?: string;
          marketing_consent?: boolean;
          retention_until?: string | null;
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
            | "sms_sent"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "opted_out"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
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
            | "sms_sent"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "opted_out"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
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
            | "sms_sent"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "opted_out"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
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
      recovery_workflows: {
        Row: {
          id: string;
          clinic_id: string;
          call_id: string | null;
          patient_id: string | null;
          lead_id: string | null;
          state:
            | "queued"
            | "sms_sent"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "opted_out"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
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
            | "sms_sent"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "opted_out"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
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
            | "sms_sent"
            | "replied"
            | "booked"
            | "lost"
            | "recovered"
            | "opted_out"
            | "drafted"
            | "awaiting_staff_approval"
            | "message_queued"
            | "awaiting_patient_reply"
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
          lead_id: string | null;
          call_id: string | null;
          recovery_workflow_id: string | null;
          provider: "twilio" | "manual";
          provider_message_id: string | null;
          direction: "inbound" | "outbound";
          status: "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received" | "cancelled";
          from_number_hash: string | null;
          to_number_hash: string | null;
          to_number_last4: string | null;
          body_preview: string | null;
          error_code: string | null;
          error_message: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          lead_id?: string | null;
          call_id?: string | null;
          recovery_workflow_id?: string | null;
          provider?: "twilio" | "manual";
          provider_message_id?: string | null;
          direction: "inbound" | "outbound";
          status?: "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received" | "cancelled";
          from_number_hash?: string | null;
          to_number_hash?: string | null;
          to_number_last4?: string | null;
          body_preview?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          lead_id?: string | null;
          call_id?: string | null;
          recovery_workflow_id?: string | null;
          provider?: "twilio" | "manual";
          provider_message_id?: string | null;
          direction?: "inbound" | "outbound";
          status?: "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received" | "cancelled";
          from_number_hash?: string | null;
          to_number_hash?: string | null;
          to_number_last4?: string | null;
          body_preview?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      call_recordings: {
        Row: {
          id: string;
          clinic_id: string;
          call_id: string | null;
          provider: "twilio" | "manual";
          provider_recording_id: string;
          recording_url: string;
          recording_duration_seconds: number | null;
          status: "queued" | "available" | "transcribing" | "transcribed" | "failed";
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          call_id?: string | null;
          provider?: "twilio" | "manual";
          provider_recording_id: string;
          recording_url: string;
          recording_duration_seconds?: number | null;
          status?: "queued" | "available" | "transcribing" | "transcribed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          call_id?: string | null;
          provider?: "twilio" | "manual";
          provider_recording_id?: string;
          recording_url?: string;
          recording_duration_seconds?: number | null;
          status?: "queued" | "available" | "transcribing" | "transcribed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      voicemail_messages: {
        Row: {
          id: string;
          clinic_id: string;
          call_id: string | null;
          recording_id: string | null;
          provider: "twilio" | "manual";
          provider_voicemail_id: string;
          caller_number_hash: string | null;
          caller_number_last4: string | null;
          transcript_text: string | null;
          summary: string | null;
          status: "received" | "transcribed" | "resolved" | "failed";
          received_at: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          call_id?: string | null;
          recording_id?: string | null;
          provider?: "twilio" | "manual";
          provider_voicemail_id: string;
          caller_number_hash?: string | null;
          caller_number_last4?: string | null;
          transcript_text?: string | null;
          summary?: string | null;
          status?: "received" | "transcribed" | "resolved" | "failed";
          received_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          call_id?: string | null;
          recording_id?: string | null;
          provider?: "twilio" | "manual";
          provider_voicemail_id?: string;
          caller_number_hash?: string | null;
          caller_number_last4?: string | null;
          transcript_text?: string | null;
          summary?: string | null;
          status?: "received" | "transcribed" | "resolved" | "failed";
          received_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      call_transcripts: {
        Row: {
          id: string;
          clinic_id: string;
          call_id: string | null;
          recording_id: string | null;
          provider: "twilio" | "openai" | "manual";
          provider_transcript_id: string;
          source: "speech" | "voicemail" | "openai" | "manual";
          transcript_text: string;
          summary: string | null;
          confidence: number | null;
          language_code: string | null;
          status: "pending" | "ready" | "failed";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          call_id?: string | null;
          recording_id?: string | null;
          provider?: "twilio" | "openai" | "manual";
          provider_transcript_id: string;
          source?: "speech" | "voicemail" | "openai" | "manual";
          transcript_text: string;
          summary?: string | null;
          confidence?: number | null;
          language_code?: string | null;
          status?: "pending" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          call_id?: string | null;
          recording_id?: string | null;
          provider?: "twilio" | "openai" | "manual";
          provider_transcript_id?: string;
          source?: "speech" | "voicemail" | "openai" | "manual";
          transcript_text?: string;
          summary?: string | null;
          confidence?: number | null;
          language_code?: string | null;
          status?: "pending" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
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
          updated_at: string;
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
          updated_at?: string;
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
          updated_at?: string;
        };
        Relationships: [];
      };
      twilio_connections: {
        Row: {
          id: string;
          clinic_id: string;
          account_sid: string;
          active: boolean;
          encrypted_auth_token: string | null;
          voice_number: string;
          forward_to_number: string;
          auth_token_ciphertext: string;
          auth_token_iv: string;
          auth_token_tag: string;
          status: "inactive" | "active" | "error";
          last_validated_at: string | null;
          last_error: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          account_sid: string;
          active?: boolean;
          encrypted_auth_token?: string | null;
          voice_number: string;
          forward_to_number: string;
          auth_token_ciphertext: string;
          auth_token_iv: string;
          auth_token_tag: string;
          status?: "inactive" | "active" | "error";
          last_validated_at?: string | null;
          last_error?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          account_sid?: string;
          active?: boolean;
          encrypted_auth_token?: string | null;
          voice_number?: string;
          forward_to_number?: string;
          auth_token_ciphertext?: string;
          auth_token_iv?: string;
          auth_token_tag?: string;
          status?: "inactive" | "active" | "error";
          last_validated_at?: string | null;
          last_error?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: "twilio" | "stripe" | "supabase" | "internal";
          provider_event_id: string | null;
          clinic_id: string | null;
          event_type: string;
          processing_status: "received" | "processed" | "ignored" | "failed";
          idempotency_key: string | null;
          payload: Json;
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          provider: "twilio" | "stripe" | "supabase" | "internal";
          provider_event_id?: string | null;
          clinic_id?: string | null;
          event_type: string;
          processing_status?: "received" | "processed" | "ignored" | "failed";
          idempotency_key?: string | null;
          payload?: Json;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          provider?: "twilio" | "stripe" | "supabase" | "internal";
          provider_event_id?: string | null;
          clinic_id?: string | null;
          event_type?: string;
          processing_status?: "received" | "processed" | "ignored" | "failed";
          idempotency_key?: string | null;
          payload?: Json;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
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
      ai_audit_logs: {
        Row: {
          id: string;
          clinic_id: string;
          lead_id: string | null;
          call_id: string | null;
          recovery_workflow_id: string | null;
          actor_user_id: string | null;
          action:
            | "draft_created"
            | "draft_edited"
            | "draft_approved"
            | "draft_rejected"
            | "message_sent"
            | "summary_created"
            | "classification_created";
          model_provider: "none" | "openai" | "manual";
          model_name: string | null;
          prompt_version: string | null;
          input_hash: string | null;
          output_hash: string | null;
          safety_status: "not_required" | "passed" | "needs_review" | "blocked";
          human_approved: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          lead_id?: string | null;
          call_id?: string | null;
          recovery_workflow_id?: string | null;
          actor_user_id?: string | null;
          action:
            | "draft_created"
            | "draft_edited"
            | "draft_approved"
            | "draft_rejected"
            | "message_sent"
            | "summary_created"
            | "classification_created";
          model_provider?: "none" | "openai" | "manual";
          model_name?: string | null;
          prompt_version?: string | null;
          input_hash?: string | null;
          output_hash?: string | null;
          safety_status?: "not_required" | "passed" | "needs_review" | "blocked";
          human_approved?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          lead_id?: string | null;
          call_id?: string | null;
          recovery_workflow_id?: string | null;
          actor_user_id?: string | null;
          action?:
            | "draft_created"
            | "draft_edited"
            | "draft_approved"
            | "draft_rejected"
            | "message_sent"
            | "summary_created"
            | "classification_created";
          model_provider?: "none" | "openai" | "manual";
          model_name?: string | null;
          prompt_version?: string | null;
          input_hash?: string | null;
          output_hash?: string | null;
          safety_status?: "not_required" | "passed" | "needs_review" | "blocked";
          human_approved?: boolean;
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
export type AppUser = Tables<"users">;
export type ClinicUser = Tables<"clinic_users">;
export type Profile = Tables<"profiles">;
export type ClinicMember = Tables<"clinic_members">;
export type Patient = Tables<"patients">;
export type Call = Tables<"calls">;
export type Conversation = Tables<"conversations">;
export type ConversationMessage = Tables<"conversation_messages">;
export type Campaign = Tables<"campaigns">;
export type RecoveryOpportunity = Tables<"recovery_opportunities">;
export type PatientLead = Tables<"patient_leads">;
export type RecoveryWorkflow = Tables<"recovery_workflows">;
export type MissedCallRecoveryWorkflow = Tables<"missed_call_recovery_workflows">;
export type SmsEvent = Tables<"sms_events">;
export type CallRecording = Tables<"call_recordings">;
export type VoicemailMessage = Tables<"voicemail_messages">;
export type CallTranscript = Tables<"call_transcripts">;
export type DashboardMetricSnapshot = Tables<"dashboard_metric_snapshots">;
export type TwilioConnection = Tables<"twilio_connections">;
export type AiAuditLog = Tables<"ai_audit_logs">;
export type AuditEvent = Tables<"audit_events">;
