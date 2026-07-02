import type { FlowCustomer360, FlowTimelineItem } from "./types";

export type FlowCustomerContact = {
  email?: string;
  fullName: string;
  phone?: string;
};

export type FlowCustomerAppointment = FlowCustomer360["appointments"][number];
export type FlowCustomerInvoice = FlowCustomer360["invoices"][number];
export type FlowCustomerJob = FlowCustomer360["jobs"][number];

export type FlowCustomerSnapshotInput = {
  aiNotes?: readonly string[];
  appointments?: readonly FlowCustomerAppointment[];
  addresses?: readonly string[];
  clinicId?: string | null;
  communications?: readonly FlowCustomer360["communications"][number][];
  contact: FlowCustomerContact;
  conversationSummaries?: readonly string[];
  history?: readonly FlowTimelineItem[];
  id: string;
  invoices?: readonly FlowCustomerInvoice[];
  intentHistory?: readonly string[];
  jobs?: readonly FlowCustomerJob[];
  metadata?: Record<string, unknown>;
  profileId: string;
  tags?: readonly string[];
};

export function createFlowCustomer360Snapshot(input: FlowCustomerSnapshotInput): FlowCustomer360 {
  return {
    aiNotes: [...(input.aiNotes ?? [])],
    appointments: [...(input.appointments ?? [])],
    addresses: [...(input.addresses ?? [])],
    clinicId: input.clinicId ?? null,
    communications: [...(input.communications ?? [])],
    contact: input.contact,
    conversationSummaries: [...(input.conversationSummaries ?? [])],
    history: [...(input.history ?? [])],
    id: input.id,
    invoices: [...(input.invoices ?? [])],
    intentHistory: [...(input.intentHistory ?? [])],
    jobs: [...(input.jobs ?? [])],
    metadata: input.metadata,
    profileId: input.profileId,
    tags: [...(input.tags ?? [])],
  };
}

export function summarizeFlowCustomer360(customer: FlowCustomer360) {
  return {
    appointmentCount: customer.appointments.length,
    communicationCount: customer.communications.length,
    conversationSummaryCount: customer.conversationSummaries.length,
    historyCount: customer.history.length,
    invoiceCount: customer.invoices.length,
    intentHistoryCount: customer.intentHistory.length,
    jobCount: customer.jobs.length,
    noteCount: customer.aiNotes.length,
    tagCount: customer.tags.length,
  };
}

