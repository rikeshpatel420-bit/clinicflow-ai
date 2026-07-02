import type { FlowPlatformProfile, FlowTemplateDefinition, FlowTemplateRegistry } from "./types";

type FlowTemplateProfile = Pick<FlowPlatformProfile<string, string, string, string, string>, "clinic" | "conversation" | "industry" | "id">;

const DEFAULT_TEMPLATE_VARIABLES = {
  clinicName: "{{clinicName}}",
  customerName: "{{customerName}}",
  followUpTime: "{{followUpTime}}",
  industryName: "{{industryName}}",
  nextStep: "{{nextStep}}",
  quoteReference: "{{quoteReference}}",
  urgency: "{{urgency}}",
};

const CORE_TEMPLATE_DEFINITIONS: readonly Omit<FlowTemplateDefinition, "body" | "subject">[] = [
  {
    channel: "sms",
    description: "Confirm the booking and let the customer know the next step.",
    id: "appointment-confirmed",
    priority: "normal",
    title: "Appointment confirmed",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.followUpTime],
  },
  {
    channel: "sms",
    description: "Warm reminder before the appointment time.",
    id: "appointment-reminder",
    priority: "normal",
    title: "Appointment reminder",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.followUpTime],
  },
  {
    channel: "email",
    description: "Follow up a quote request with a calm next step.",
    id: "quote-follow-up",
    priority: "normal",
    title: "Quote follow-up",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.quoteReference],
  },
  {
    channel: "sms",
    description: "Recover a missed call with a short, friendly callback prompt.",
    id: "missed-call",
    priority: "high",
    title: "Missed call",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.followUpTime],
  },
  {
    channel: "internal",
    description: "Escalate urgent issues to the team with a calm operational note.",
    id: "emergency-escalation",
    priority: "urgent",
    title: "Emergency escalation",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.urgency],
  },
  {
    channel: "sms",
    description: "Remind about an upcoming payment or balance due.",
    id: "payment-reminder",
    priority: "normal",
    title: "Payment reminder",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.followUpTime],
  },
  {
    channel: "sms",
    description: "Invite the customer to leave a review after a successful outcome.",
    id: "review-request",
    priority: "low",
    title: "Review request",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.followUpTime],
  },
  {
    channel: "sms",
    description: "Confirm the booking request has been captured and will be reviewed by staff.",
    id: "booking-received",
    priority: "normal",
    title: "Booking received",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.followUpTime],
  },
  {
    channel: "internal",
    description: "Confirm a new lead has been created and is ready for the team.",
    id: "new-lead",
    priority: "normal",
    title: "New lead",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.industryName],
  },
  {
    channel: "internal",
    description: "Let staff know a human transfer is needed or has been requested.",
    id: "human-transfer",
    priority: "high",
    title: "Human transfer",
    variables: [DEFAULT_TEMPLATE_VARIABLES.clinicName, DEFAULT_TEMPLATE_VARIABLES.customerName, DEFAULT_TEMPLATE_VARIABLES.nextStep],
  },
];

function interpolateTemplate(value: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce((accumulator, [key, replacement]) => accumulator.split(`{{${key}}}`).join(replacement), value);
}

function buildTemplateBodies(profile: FlowTemplateProfile) {
  const clinicName = profile.clinic.name;
  const industryName = profile.industry.name;

  return {
    appointmentConfirmed: {
      body: `Hello {{customerName}}, thanks for choosing ${clinicName}. Your appointment has been confirmed for {{followUpTime}}. If anything changes, just let us know.`,
      subject: `Your appointment with ${clinicName} is confirmed`,
    },
    appointmentReminder: {
      body: `Hello {{customerName}}, this is a friendly reminder from ${clinicName} about your appointment at {{followUpTime}}. We look forward to seeing you.`,
      subject: `Reminder from ${clinicName}`,
    },
    bookingReceived: {
      body: `Thanks {{customerName}}. We've received your booking request for ${clinicName} and the team will confirm the next step shortly.`,
      subject: `Booking request received by ${clinicName}`,
    },
    emergencyEscalation: {
      body: `Urgent case for ${clinicName}. Please review immediately. Customer: {{customerName}}. Urgency: {{urgency}}.`,
    },
    humanTransfer: {
      body: `A human handoff is needed for ${clinicName}. Please review the next step for {{customerName}}.`,
    },
    missedCall: {
      body: profile.conversation.leads.templates.sms.missedCallRecovery,
      subject: `Missed call follow-up for ${clinicName}`,
    },
    newLead: {
      body: `A new ${industryName.toLowerCase()} enquiry has been captured for ${clinicName}. Please review the lead details and contact {{customerName}}.`,
    },
    paymentReminder: {
      body: `Hello {{customerName}}, a payment reminder from ${clinicName} is due. Please review when convenient.`,
      subject: `Payment reminder from ${clinicName}`,
    },
    quoteFollowUp: {
      body: `Hello {{customerName}}, thanks for your quote request with ${clinicName}. The team will review the details and follow up shortly.`,
      subject: `Quote follow-up from ${clinicName}`,
    },
    reviewRequest: {
      body: `Hello {{customerName}}, thank you for choosing ${clinicName}. If you've got a moment, we'd be grateful for a review.`,
      subject: `Thank you from ${clinicName}`,
    },
  };
}

export function buildFlowTemplateRegistry(profile: FlowTemplateProfile): FlowTemplateRegistry {
  const bodies = buildTemplateBodies(profile);

  const templates: FlowTemplateDefinition[] = CORE_TEMPLATE_DEFINITIONS.map((template) => {
    switch (template.id) {
      case "appointment-confirmed":
        return { ...template, body: bodies.appointmentConfirmed.body, subject: bodies.appointmentConfirmed.subject, profileOverride: true };
      case "appointment-reminder":
        return { ...template, body: bodies.appointmentReminder.body, subject: bodies.appointmentReminder.subject, profileOverride: true };
      case "booking-received":
        return { ...template, body: bodies.bookingReceived.body, subject: bodies.bookingReceived.subject, profileOverride: true };
      case "emergency-escalation":
        return { ...template, body: bodies.emergencyEscalation.body, profileOverride: true };
      case "human-transfer":
        return { ...template, body: bodies.humanTransfer.body, profileOverride: true };
      case "missed-call":
        return { ...template, body: bodies.missedCall.body, subject: bodies.missedCall.subject, profileOverride: true };
      case "new-lead":
        return { ...template, body: bodies.newLead.body, profileOverride: true };
      case "payment-reminder":
        return { ...template, body: bodies.paymentReminder.body, subject: bodies.paymentReminder.subject, profileOverride: true };
      case "quote-follow-up":
        return { ...template, body: bodies.quoteFollowUp.body, subject: bodies.quoteFollowUp.subject, profileOverride: true };
      case "review-request":
        return { ...template, body: bodies.reviewRequest.body, subject: bodies.reviewRequest.subject, profileOverride: true };
      default:
        return { ...template, body: template.description, profileOverride: false };
    }
  });

  return {
    defaultTemplateCount: CORE_TEMPLATE_DEFINITIONS.length,
    overrideTemplateCount: templates.filter((template) => template.profileOverride).length,
    profileId: profile.id,
    profileName: profile.clinic.name,
    templates,
  };
}

export function getFlowTemplateDefinition(registry: FlowTemplateRegistry, templateId: string) {
  return registry.templates.find((template) => template.id === templateId) ?? null;
}

export function renderFlowTemplate(template: Pick<FlowTemplateDefinition, "body" | "subject">, variables: Record<string, string>) {
  return {
    body: interpolateTemplate(template.body, variables),
    subject: template.subject ? interpolateTemplate(template.subject, variables) : undefined,
  };
}

export function summarizeFlowTemplates(registry: FlowTemplateRegistry) {
  return {
    defaultTemplateCount: registry.defaultTemplateCount,
    overrideTemplateCount: registry.overrideTemplateCount,
    profileId: registry.profileId,
    profileName: registry.profileName,
    templateCount: registry.templates.length,
    templatesByChannel: registry.templates.reduce<Record<string, number>>((accumulator, template) => {
      accumulator[template.channel] = (accumulator[template.channel] ?? 0) + 1;
      return accumulator;
    }, {}),
  };
}
