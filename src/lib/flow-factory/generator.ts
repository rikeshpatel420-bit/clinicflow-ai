import type {
  FlowFactoryArtifact,
  FlowFactoryBlueprint,
  FlowFactoryGeneratedProfile,
  FlowFactoryPlatformDefaults,
  FlowFactoryRoutePlan,
} from "./types";

const DEFAULT_BLUEPRINT: FlowFactoryBlueprint = {
  aiPrompt:
    "You are a calm, premium UK receptionist. Keep answers short, warm, and professional. Capture only what is needed to route the request safely.",
  bookingBehaviour: "Capture the request, collect contact details, and confirm that the team will follow up to book or schedule the next step.",
  businessName: "New Flow Business",
  calendarProvider: "Manual receptionist booking",
  colours: {
    accent: "teal",
    background: "#f6fbf9",
    primary: "#0d3b36",
    secondary: "#18b7a0",
    surface: "#ffffff",
    text: "#10201d",
  },
  crmFields: ["fullName", "phoneNumber", "email", "requestType", "preferredTime", "notes"],
  dashboardWording: {
    activeCalls: "Active calls",
    followUp: "Follow-up queue",
    missedCalls: "Missed calls",
    recovery: "Recovery progress",
    revenueRecovered: "Revenue recovered",
    responseRate: "Response rate",
  },
  emailTemplates: {
    body: "Thanks for getting in touch. The team will review the request and follow up shortly.",
    subject: "Thanks for contacting us",
  },
  emergencyRules: [
    "Treat breathing, swallowing, heavy bleeding, collapse, or severe pain as urgent.",
    "Escalate immediately when the caller sounds distressed or asks for a human.",
  ],
  escalationRules: [
    "Always allow a human handoff when the caller requests it.",
    "Escalate urgent safety concerns before any booking flow.",
  ],
  followUpCadence: "Same day callback, then a reminder after 24 hours if the lead is still unanswered.",
  greeting: "Hello, thanks for calling. Of course, I can help with that today.",
  industry: "Professional services",
  language: "en-GB",
  logo: "NF",
  questionsToAsk: [
    "How can I help you today?",
    "What is the best phone number to reach you on?",
    "What time would suit you best for a follow-up?",
  ],
  requiredCustomerInformation: ["Name", "Phone number", "Email address", "Reason for calling", "Preferred time"],
  smsTemplates: {
    help: "Thanks for getting in touch. We'll have the team review this and reply shortly.",
    missedCallRecovery: "Hi, thanks for contacting us. Sorry we missed you. Reply YES and we'll call you back.",
    optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
    replyYes: "Thanks. We'll call you back shortly.",
    resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
  },
  speechRate: "95%",
  ssmlEnabled: true,
  tone: "Warm, calm, premium, British, professional",
  voice: "Polly.Amy-Neural",
  voicePersonality: "Warm, calm, premium, British, professional receptionist tone",
  workflowStages: ["new", "triaged", "follow-up", "booked", "closed"],
};

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "flow-product"
  );
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildRoutes(profileId: string, businessName: string): FlowFactoryRoutePlan[] {
  const prettyName = businessName.trim();

  return [
    { href: `/${profileId}`, label: `${prettyName} landing route`, description: "Branded product entry point generated from configuration." },
    { href: `/${profileId}/dashboard`, label: `${prettyName} dashboard route`, description: "Operations dashboard for the generated product." },
    { href: `/${profileId}/calls`, label: `${prettyName} calls route`, description: "Call log and conversation history." },
    { href: `/${profileId}/inbox`, label: `${prettyName} inbox route`, description: "Follow-up queue for recovery and callbacks." },
    { href: `/${profileId}/setup`, label: `${prettyName} setup route`, description: "Onboarding and activation flow for the new vertical." },
  ];
}

function buildPlatformDefaults(blueprint: FlowFactoryBlueprint, profileId: string, routes: FlowFactoryRoutePlan[]): FlowFactoryPlatformDefaults {
  const defaultCards = [
    { id: "active-calls", label: blueprint.dashboardWording.activeCalls, description: "Live queue volume and inbound activity." },
    { id: "follow-up", label: blueprint.dashboardWording.followUp, description: "Callbacks, reviews, and recovery actions waiting for the team." },
    { id: "recovery", label: blueprint.dashboardWording.recovery, description: "Missed-call and lead recovery performance." },
    { id: "response-rate", label: blueprint.dashboardWording.responseRate, description: "Customer response and handoff momentum." },
  ];

  const workflowBlueprints = [
    { channel: "voice" as const, description: "Answer the inbound call and start the profile conversation.", key: `${profileId}-voice-intake`, label: "Inbound voice intake", trigger: "inbound_call_completed" },
    { channel: "workflow" as const, description: "Continue the conversation after speech is captured.", key: `${profileId}-speech-follow-up`, label: "Speech follow-up", trigger: "message_received" },
    { channel: "sms" as const, description: "Send the missed-call recovery message and track the follow-up.", key: `${profileId}-missed-call-recovery`, label: "Missed call recovery", trigger: "missed_call" },
    { channel: "workflow" as const, description: "Escalate urgent leads and create a follow-up task.", key: `${profileId}-escalation`, label: "Escalation workflow", trigger: "emergency_detected" },
  ];

  return {
    branding: blueprint.colours,
    dashboardCards: defaultCards,
    navigation: routes,
    notificationTemplates: [
      {
        body: blueprint.smsTemplates.missedCallRecovery,
        channel: "sms",
        id: "missed-call",
        label: "Missed call recovery",
      },
      {
        body: blueprint.smsTemplates.replyYes,
        channel: "sms",
        id: "reply-yes",
        label: "Reply yes",
      },
      {
        body: blueprint.smsTemplates.optOut,
        channel: "sms",
        id: "opt-out",
        label: "Opt out",
      },
      {
        body: blueprint.emailTemplates.body,
        channel: "email",
        id: "follow-up-email",
        label: "Follow-up email",
        subject: blueprint.emailTemplates.subject,
      },
      {
        body: blueprint.aiPrompt,
        channel: "internal",
        id: "ai-prompt",
        label: "AI prompt",
      },
    ],
    promptProfile: {
      aiPrompt: blueprint.aiPrompt,
      greeting: blueprint.greeting,
      language: blueprint.language ?? "en-GB",
      tone: blueprint.tone,
      voicePersonality: blueprint.voicePersonality,
    },
    sampleAutomationRules: [
      "If a call is missed, send recovery SMS and create a follow-up task.",
      "If urgency is high, flag the workflow for staff escalation.",
      "If the caller requests a human, transfer immediately and preserve the transcript.",
    ],
    voiceProfile: {
      language: blueprint.language ?? "en-GB",
      rate: blueprint.speechRate ?? "95%",
      ssmlEnabled: blueprint.ssmlEnabled ?? true,
      voice: blueprint.voice ?? "Polly.Amy-Neural",
    },
    workflowBlueprints,
  };
}

function buildGeneratedConfig(blueprint: FlowFactoryBlueprint, profileId: string, platformDefaults: FlowFactoryPlatformDefaults) {
  return {
    aiPrompt: blueprint.aiPrompt,
    bookingBehaviour: blueprint.bookingBehaviour,
    businessName: blueprint.businessName,
    calendarProvider: blueprint.calendarProvider,
    colours: blueprint.colours,
    crmFields: blueprint.crmFields,
    dashboardWording: blueprint.dashboardWording,
    emergencyRules: blueprint.emergencyRules,
    escalationRules: blueprint.escalationRules,
    followUpCadence: blueprint.followUpCadence,
    greeting: blueprint.greeting,
    industry: blueprint.industry,
    language: blueprint.language ?? "en-GB",
    logo: blueprint.logo,
    profileId,
    questionsToAsk: blueprint.questionsToAsk,
    requiredCustomerInformation: blueprint.requiredCustomerInformation,
    smsTemplates: blueprint.smsTemplates,
    tone: blueprint.tone,
    voice: blueprint.voice ?? "Polly.Amy-Neural",
    voicePersonality: blueprint.voicePersonality,
    workflowStages: blueprint.workflowStages,
    platformDefaults,
  };
}

function buildDocumentation(blueprint: FlowFactoryBlueprint, profileId: string, routes: FlowFactoryRoutePlan[], platformDefaults: FlowFactoryPlatformDefaults) {
  return `# ${blueprint.businessName} Flow Profile

Generated by Flow Factory.

## Summary

- Industry: ${blueprint.industry}
- Profile ID: ${profileId}
- Voice: ${blueprint.voice ?? "Polly.Amy-Neural"}
- Language: ${blueprint.language ?? "en-GB"}
- Calendar provider: ${blueprint.calendarProvider}

## Blueprint

### Greeting

${blueprint.greeting}

### Voice personality

${blueprint.voicePersonality}

### Questions to ask

${blueprint.questionsToAsk.map((question) => `- ${question}`).join("\n")}

### Required customer information

${blueprint.requiredCustomerInformation.map((item) => `- ${item}`).join("\n")}

### Emergency rules

${blueprint.emergencyRules.map((rule) => `- ${rule}`).join("\n")}

### Booking behaviour

${blueprint.bookingBehaviour}

### Workflow stages

${blueprint.workflowStages.map((stage) => `- ${stage}`).join("\n")}

## Route plan

${routes.map((route) => `- ${route.href} - ${route.description}`).join("\n")}

## Platform defaults

### Navigation

${platformDefaults.navigation.map((item) => `- ${item.href} - ${item.label}`).join("\n")}

### Dashboard cards

${platformDefaults.dashboardCards.map((card) => `- ${card.label} - ${card.description}`).join("\n")}

### Notification templates

${platformDefaults.notificationTemplates.map((template) => `- ${template.id} - ${template.label} (${template.channel})`).join("\n")}

### Workflow blueprints

${platformDefaults.workflowBlueprints.map((workflow) => `- ${workflow.key} - ${workflow.trigger}`).join("\n")}

## Next step

Save the generated configuration into a new profile folder, register it in the Flow Platform registry, and point the runtime at the new profile ID when you are ready to launch the product.
`;
}

function buildTests(blueprint: FlowFactoryBlueprint, profileId: string) {
  return `import { generateFlowFactoryPackage, getFlowFactoryBlueprintDefaults } from "@/lib/flow-factory";

const generated = generateFlowFactoryPackage({
  ...getFlowFactoryBlueprintDefaults(),
  businessName: ${JSON.stringify(blueprint.businessName)},
  industry: ${JSON.stringify(blueprint.industry)},
});

if (generated.profileId !== ${JSON.stringify(profileId)}) {
  throw new Error(\`Expected profile ID ${profileId}, received \${generated.profileId}\`);
}

if (generated.routes.length < 3) {
  throw new Error("Flow Factory did not generate enough route plan entries");
}

if (generated.platformDefaults.workflowBlueprints.length === 0) {
  throw new Error("Flow Factory did not generate default workflow blueprints");
}

console.log("Flow Factory smoke test passed");
`;
}

export function getFlowFactoryBlueprintDefaults(): FlowFactoryBlueprint {
  return DEFAULT_BLUEPRINT;
}

export function generateFlowFactoryPackage(blueprint: FlowFactoryBlueprint): FlowFactoryGeneratedProfile {
  const profileId = slugify(blueprint.businessName || blueprint.industry);
  const routes = buildRoutes(profileId, blueprint.businessName);
  const platformDefaults = buildPlatformDefaults(blueprint, profileId, routes);
  const workflowStages = unique(blueprint.workflowStages);
  const requiredCustomerInformation = unique(blueprint.requiredCustomerInformation);
  const questionsToAsk = unique(blueprint.questionsToAsk);
  const files: FlowFactoryArtifact[] = [
    {
      filename: `profiles/${profileId}/profile.json`,
      description: "Canonical config manifest for the generated vertical.",
      content: JSON.stringify(buildGeneratedConfig({ ...blueprint, questionsToAsk, requiredCustomerInformation, workflowStages }, profileId, platformDefaults), null, 2),
    },
    {
      filename: `profiles/${profileId}/README.md`,
      description: "Starter guide for wiring the generated configuration into the Flow Platform registry.",
      content: buildDocumentation({ ...blueprint, questionsToAsk, requiredCustomerInformation, workflowStages }, profileId, routes, platformDefaults),
    },
    {
      filename: `docs/${profileId}-profile.md`,
      description: "Profile documentation and operator notes.",
      content: buildDocumentation({ ...blueprint, questionsToAsk, requiredCustomerInformation, workflowStages }, profileId, routes, platformDefaults),
    },
    {
      filename: `tests/${profileId}.smoke.ts`,
      description: "Factory smoke test for the generated profile package.",
      content: buildTests({ ...blueprint, questionsToAsk, requiredCustomerInformation, workflowStages }, profileId),
    },
  ];

  return {
    blueprint: { ...blueprint, questionsToAsk, requiredCustomerInformation, workflowStages },
    dashboard: {
      colors: blueprint.colours,
      labels: blueprint.dashboardWording,
    },
    documentation: buildDocumentation({ ...blueprint, questionsToAsk, requiredCustomerInformation, workflowStages }, profileId, routes, platformDefaults),
    files,
    intentSummary: {
      entityCount: unique([...requiredCustomerInformation, ...blueprint.crmFields]).length,
      intentCount: Math.max(questionsToAsk.length + blueprint.emergencyRules.length + blueprint.escalationRules.length, 1),
      workflowCount: Math.max(workflowStages.length, 1),
    },
    profileId,
    platformDefaults,
    routes,
    tests: buildTests({ ...blueprint, questionsToAsk, requiredCustomerInformation, workflowStages }, profileId),
    voice: {
      empathy: blueprint.voicePersonality,
      greeting: blueprint.greeting,
      language: blueprint.language ?? "en-GB",
      personality: blueprint.voicePersonality,
      rate: blueprint.speechRate ?? "95%",
      ssmlEnabled: blueprint.ssmlEnabled ?? true,
      voice: blueprint.voice ?? "Polly.Amy-Neural",
    },
    workflowStages,
  };
}
