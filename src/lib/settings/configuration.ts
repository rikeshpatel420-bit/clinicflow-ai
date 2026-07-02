import { billingDemo } from "@/lib/billing/data";
import { getOnboardingBlueprintDefaults, type BusinessOnboardingBlueprint } from "@/lib/onboarding";
import { clinicRoles, permissionLabels } from "@/lib/permissions/roles";
import { enterpriseSettingsDemo } from "@/lib/settings/data";

export type ClinicBusinessBranch = {
  address: string;
  name: string;
  notes: string;
  phone: string;
};

export type ClinicBusinessService = {
  category: string;
  description: string;
  name: string;
  price: string;
};

export type ClinicBusinessStaffMember = {
  branch: string;
  email: string;
  location: string;
  name: string;
  role: string;
  status: string;
};

export type ClinicBusinessConfiguration = {
  aiSettings: {
    afterHours: string;
    faqBehaviour: string;
    greeting: string;
    humanTransfer: string;
    language: string;
    prompt: string;
    speechRate: string;
    ssmlEnabled: boolean;
    voice: string;
    voicePersonality: string;
  };
  billingPreferences: {
    currency: string;
    cycle: string;
    invoicing: string;
    paymentTerms: string;
    planKey: string;
    seats: string;
    taxMode: string;
  };
  branding: {
    accent: string;
    backgroundColour: string;
    logo: string;
    primaryColour: string;
    secondaryColour: string;
    surfaceColour: string;
    tagline: string;
    textColour: string;
    tone: string;
  };
  branches: ClinicBusinessBranch[];
  businessProfile: {
    activeBranch: string;
    businessDescription: string;
    businessEmail: string;
    businessName: string;
    businessPhone: string;
    businessWebsite: string;
    ownerEmail: string;
    ownerName: string;
    phoneNumbers: string[];
    timezone: string;
  };
  calendarSettings: {
    bookingLink: string;
    connected: boolean;
    provider: string;
    syncMode: string;
  };
  customerDetails: {
    contactPreferences: string;
    leadCategories: string[];
    reportPreferences: string;
    tags: string[];
  };
  emergencyRules: string[];
  knowledgeBase: {
    documents: string[];
    policies: string[];
    prompts: string[];
    questionsToAsk: string[];
    requiredCustomerInformation: string[];
    summary: string;
  };
  notificationSettings: {
    email: boolean;
    highPriorityMissedCalls: boolean;
    inApp: boolean;
    lowPriorityReplies: boolean;
    sms: boolean;
    weeklyOwnerReport: boolean;
    whatsapp: boolean;
    workflowFailures: boolean;
  };
  permissions: string[];
  pricing: {
    consultationFee: string;
    emergencyFee: string;
    notes: string;
    quotePolicy: string;
  };
  roles: string[];
  services: ClinicBusinessService[];
  staff: ClinicBusinessStaffMember[];
  subscription: {
    plan: string;
    renewal: string;
    status: string;
    trialEndsAt: string;
  };
  openingHours: {
    holidayHours: string;
    saturday: string;
    sunday: string;
    weekdays: string;
    weekendNotes: string;
  };
  workflowSettings: {
    active: boolean;
    bookingBehaviour: string;
    calendarProvider: string;
    escalationRules: string[];
    followUpCadence: string;
    stages: string[];
  };
};

export type ClinicLaunchState = {
  blockers: string[];
  completeCount: number;
  lastCheckedAt: string | null;
  ready: boolean;
  score: number;
  warnings: string[];
};

type PartialClinicBusinessConfiguration = Partial<ClinicBusinessConfiguration> & {
  aiSettings?: Partial<ClinicBusinessConfiguration["aiSettings"]>;
  billingPreferences?: Partial<ClinicBusinessConfiguration["billingPreferences"]>;
  branding?: Partial<ClinicBusinessConfiguration["branding"]>;
  calendarSettings?: Partial<ClinicBusinessConfiguration["calendarSettings"]>;
  customerDetails?: Partial<ClinicBusinessConfiguration["customerDetails"]>;
  knowledgeBase?: Partial<ClinicBusinessConfiguration["knowledgeBase"]>;
  notificationSettings?: Partial<ClinicBusinessConfiguration["notificationSettings"]>;
  openingHours?: Partial<ClinicBusinessConfiguration["openingHours"]>;
  pricing?: Partial<ClinicBusinessConfiguration["pricing"]>;
  subscription?: Partial<ClinicBusinessConfiguration["subscription"]>;
  workflowSettings?: Partial<ClinicBusinessConfiguration["workflowSettings"]>;
};

function cloneLines(lines: string[]) {
  return [...lines];
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitDelimitedRows(value: string) {
  return splitLines(value).map((line) => line.split("|").map((part) => part.trim()));
}

function parseBoolean(value: FormDataEntryValue | null, fallback = false) {
  if (value === null) return fallback;
  return value === "on" || value === "true" || value === "1";
}

function readString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function parseStringArray(formData: FormData, key: string, fallback: string[]) {
  const value = readString(formData, key, "");
  return value ? splitLines(value) : cloneLines(fallback);
}

function normalizeBranchRow(row: string[], fallback: ClinicBusinessBranch, index: number): ClinicBusinessBranch {
  const [name, address, phone, notes] = row;
  return {
    address: address || fallback.address,
    name: name || `${fallback.name} ${index + 1}`,
    notes: notes || fallback.notes,
    phone: phone || fallback.phone,
  };
}

function normalizeServiceRow(row: string[], fallback: ClinicBusinessService, index: number): ClinicBusinessService {
  const [name, description, price, category] = row;
  return {
    category: category || fallback.category,
    description: description || fallback.description,
    name: name || `${fallback.name} ${index + 1}`,
    price: price || fallback.price,
  };
}

function normalizeStaffRow(row: string[], fallback: ClinicBusinessStaffMember, index: number): ClinicBusinessStaffMember {
  const [name, email, role, location, status] = row;
  return {
    branch: location || fallback.branch,
    email: email || fallback.email,
    location: location || fallback.location,
    name: name || `${fallback.name} ${index + 1}`,
    role: role || fallback.role,
    status: status || fallback.status,
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function mergeObject<T extends Record<string, unknown>>(base: T, override?: Partial<T> | null): T {
  return {
    ...base,
    ...(override ?? {}),
  };
}

export function createDefaultClinicBusinessConfiguration(): ClinicBusinessConfiguration {
  const onboarding = getOnboardingBlueprintDefaults();
  const branchNames = enterpriseSettingsDemo.clinic.locations;

  return {
    aiSettings: {
      afterHours: "Tell the caller you will make a note and the team will follow up as soon as possible.",
      faqBehaviour: "Stay brief, factual, and offer a callback whenever the answer is not certain.",
      greeting: onboarding.greeting,
      humanTransfer: "Offer a warm transfer to the reception team whenever the caller asks for a person.",
      language: onboarding.language ?? "en-GB",
      prompt: onboarding.aiPrompt,
      speechRate: onboarding.speechRate ?? "95%",
      ssmlEnabled: onboarding.ssmlEnabled ?? true,
      voice: onboarding.voice ?? "Polly.Amy-Neural",
      voicePersonality: onboarding.voicePersonality,
    },
    billingPreferences: {
      currency: "GBP",
      cycle: billingDemo.subscription.cycle,
      invoicing: "Monthly invoicing",
      paymentTerms: "30 days",
      planKey: billingDemo.subscription.planKey,
      seats: String(billingDemo.subscription.seats),
      taxMode: "VAT inclusive",
    },
    branding: {
      accent: "teal",
      backgroundColour: "#f7faf9",
      logo: "CF",
      primaryColour: "#087968",
      secondaryColour: "#10201d",
      surfaceColour: "#ffffff",
      tagline: "Never miss a patient again",
      textColour: "#10201d",
      tone: "Premium, warm, calm, British",
    },
    branches: branchNames.map((branchName, index) => ({
      address: index === 0 ? "10 Harley Street, London" : `${branchName} branch address`,
      name: branchName,
      notes: index === 0 ? "Primary branch" : "Secondary branch",
      phone: enterpriseSettingsDemo.clinic.phone,
    })),
    businessProfile: {
      activeBranch: enterpriseSettingsDemo.clinic.activeClinic,
      businessDescription: "Premium private dental reception and missed-call recovery platform.",
      businessEmail: "hello@clinicflow-demo.co.uk",
      businessName: enterpriseSettingsDemo.clinic.name,
      businessPhone: enterpriseSettingsDemo.clinic.phone,
      businessWebsite: "clinicflow-demo.co.uk",
      ownerEmail: enterpriseSettingsDemo.account.email,
      ownerName: enterpriseSettingsDemo.account.name,
      phoneNumbers: [enterpriseSettingsDemo.clinic.phone, "+44 20 7946 1021"],
      timezone: enterpriseSettingsDemo.clinic.timezone,
    },
    calendarSettings: {
      bookingLink: "https://calendar.google.com",
      connected: false,
      provider: "Google Calendar",
      syncMode: "Two-way",
    },
    customerDetails: {
      contactPreferences: "SMS first, email second, phone for urgent items",
      leadCategories: ["Emergency", "Invisalign", "Hygiene", "Implant"],
      reportPreferences: "Daily calls summary and weekly owner report",
      tags: ["Private", "NHS", "Cosmetic"],
    },
    emergencyRules: [
      "Severe pain, swelling, or bleeding should be escalated the same day.",
      "Breathing or swallowing difficulty should be treated as urgent emergency care.",
      "If the caller sounds distressed or confused, offer a human transfer immediately.",
    ],
    knowledgeBase: {
      documents: ["Emergency policy", "Service menu", "Price guide"],
      policies: ["Protect patient privacy", "Do not promise fixed pricing without clinical assessment"],
      prompts: onboarding.questionsToAsk.length > 0 ? cloneLines(onboarding.questionsToAsk) : ["How can I help today?"],
      questionsToAsk: cloneLines(onboarding.questionsToAsk),
      requiredCustomerInformation: cloneLines(onboarding.requiredCustomerInformation),
      summary: "Use the uploaded business knowledge to answer safely, stay concise, and escalate when the answer is uncertain.",
    },
    notificationSettings: {
      email: enterpriseSettingsDemo.notificationPreferences[0]?.enabled ?? true,
      highPriorityMissedCalls: true,
      inApp: true,
      lowPriorityReplies: enterpriseSettingsDemo.notificationPreferences[3]?.enabled ?? false,
      sms: true,
      weeklyOwnerReport: enterpriseSettingsDemo.notificationPreferences[2]?.enabled ?? true,
      whatsapp: false,
      workflowFailures: enterpriseSettingsDemo.notificationPreferences[1]?.enabled ?? true,
    },
    permissions: [...Object.keys(permissionLabels)],
    pricing: {
      consultationFee: "From £95",
      emergencyFee: "From £180",
      notes: "Use general guidance and refer to the practice for definitive prices.",
      quotePolicy: "Quote only if clinic-approved knowledge confirms it.",
    },
    roles: [...clinicRoles],
    services: [
      { category: "Routine", description: "Routine examination and advice", name: "Check-up", price: "From £95" },
      { category: "Urgent", description: "Same-day pain and swelling assessment", name: "Emergency appointment", price: "From £180" },
      { category: "Hygiene", description: "Routine hygiene and prevention", name: "Hygiene", price: "From £85" },
      { category: "Cosmetic", description: "Smile alignment consultation", name: "Invisalign", price: "Consultation required" },
    ],
    staff: enterpriseSettingsDemo.team.map((member) => ({
      branch: member.location,
      email: member.email,
      location: member.location,
      name: member.name,
      role: member.role,
      status: member.status,
    })),
    subscription: {
      plan: billingDemo.subscription.planKey,
      renewal: billingDemo.subscription.renewsAt ?? "To be confirmed",
      status: billingDemo.subscription.status,
      trialEndsAt: billingDemo.subscription.trialEndsAt ?? "To be confirmed",
    },
    openingHours: {
      holidayHours: "Configured by admin",
      saturday: "09:00 - 13:00",
      sunday: "Closed",
      weekdays: "08:00 - 18:30",
      weekendNotes: "Emergency routing only",
    },
    workflowSettings: {
      active: true,
      bookingBehaviour: "Capture details, acknowledge the request, and let staff confirm the appointment.",
      calendarProvider: "Google Calendar",
      escalationRules: ["Emergency", "Complaint", "Urgent", "Breathing issues"],
      followUpCadence: "Urgent calls within 5 minutes, other missed calls within 30 minutes.",
      stages: ["received", "triaged", "followed_up", "booked", "closed"],
    },
  };
}

export function buildClinicBusinessConfigurationFromBlueprint(blueprint: BusinessOnboardingBlueprint): ClinicBusinessConfiguration {
  const defaults = createDefaultClinicBusinessConfiguration();

  return mergeClinicBusinessConfiguration({
    ...defaults,
    aiSettings: {
      ...defaults.aiSettings,
      greeting: blueprint.greeting,
      language: blueprint.language ?? defaults.aiSettings.language,
      prompt: blueprint.aiPrompt,
      speechRate: blueprint.speechRate ?? defaults.aiSettings.speechRate,
      ssmlEnabled: blueprint.ssmlEnabled ?? defaults.aiSettings.ssmlEnabled,
      voice: blueprint.voice ?? defaults.aiSettings.voice,
      voicePersonality: blueprint.voicePersonality,
    },
    businessProfile: {
      ...defaults.businessProfile,
      businessDescription: defaults.businessProfile.businessDescription,
      businessEmail: blueprint.businessEmail || defaults.businessProfile.businessEmail,
      businessName: blueprint.businessName,
      businessPhone: blueprint.businessPhone || defaults.businessProfile.businessPhone,
      businessWebsite: blueprint.businessWebsite || defaults.businessProfile.businessWebsite,
      ownerEmail: blueprint.ownerEmail || defaults.businessProfile.ownerEmail,
      ownerName: blueprint.ownerName,
      timezone: blueprint.timezone || defaults.businessProfile.timezone,
    },
    openingHours: {
      ...defaults.openingHours,
      weekdays: blueprint.businessHours || defaults.openingHours.weekdays,
    },
    calendarSettings: {
      ...defaults.calendarSettings,
      provider: blueprint.calendarProvider,
    },
    workflowSettings: {
      ...defaults.workflowSettings,
      bookingBehaviour: blueprint.bookingBehaviour,
      calendarProvider: blueprint.calendarProvider,
      followUpCadence: blueprint.followUpCadence,
      escalationRules: blueprint.escalationRules.length ? blueprint.escalationRules : defaults.workflowSettings.escalationRules,
      stages: blueprint.workflowStages.length ? blueprint.workflowStages : defaults.workflowSettings.stages,
    },
  });
}

export function mergeClinicBusinessConfiguration(
  input?: PartialClinicBusinessConfiguration | null,
): ClinicBusinessConfiguration {
  const defaults = createDefaultClinicBusinessConfiguration();
  const merged = input ?? {};

  return {
    aiSettings: mergeObject(defaults.aiSettings, merged.aiSettings),
    billingPreferences: mergeObject(defaults.billingPreferences, merged.billingPreferences),
    branding: mergeObject(defaults.branding, merged.branding),
    branches: merged.branches?.length
      ? merged.branches.map((branch, index) => normalizeBranchRow([branch.name, branch.address, branch.phone, branch.notes], defaults.branches[index] ?? defaults.branches[0], index))
      : defaults.branches,
    businessProfile: {
      ...defaults.businessProfile,
      ...merged.businessProfile,
      phoneNumbers: merged.businessProfile?.phoneNumbers?.length ? uniqueStrings(merged.businessProfile.phoneNumbers) : defaults.businessProfile.phoneNumbers,
    },
    calendarSettings: mergeObject(defaults.calendarSettings, merged.calendarSettings),
    customerDetails: {
      ...defaults.customerDetails,
      ...merged.customerDetails,
      leadCategories: merged.customerDetails?.leadCategories?.length ? uniqueStrings(merged.customerDetails.leadCategories) : defaults.customerDetails.leadCategories,
      tags: merged.customerDetails?.tags?.length ? uniqueStrings(merged.customerDetails.tags) : defaults.customerDetails.tags,
    },
    emergencyRules: merged.emergencyRules?.length ? uniqueStrings(merged.emergencyRules) : defaults.emergencyRules,
    knowledgeBase: {
      ...defaults.knowledgeBase,
      ...merged.knowledgeBase,
      documents: merged.knowledgeBase?.documents?.length ? uniqueStrings(merged.knowledgeBase.documents) : defaults.knowledgeBase.documents,
      policies: merged.knowledgeBase?.policies?.length ? uniqueStrings(merged.knowledgeBase.policies) : defaults.knowledgeBase.policies,
      prompts: merged.knowledgeBase?.prompts?.length ? uniqueStrings(merged.knowledgeBase.prompts) : defaults.knowledgeBase.prompts,
      questionsToAsk: merged.knowledgeBase?.questionsToAsk?.length ? uniqueStrings(merged.knowledgeBase.questionsToAsk) : defaults.knowledgeBase.questionsToAsk,
      requiredCustomerInformation: merged.knowledgeBase?.requiredCustomerInformation?.length
        ? uniqueStrings(merged.knowledgeBase.requiredCustomerInformation)
        : defaults.knowledgeBase.requiredCustomerInformation,
    },
    notificationSettings: mergeObject(defaults.notificationSettings, merged.notificationSettings),
    permissions: merged.permissions?.length ? uniqueStrings(merged.permissions) : defaults.permissions,
    pricing: mergeObject(defaults.pricing, merged.pricing),
    roles: merged.roles?.length ? uniqueStrings(merged.roles) : defaults.roles,
    services: merged.services?.length
      ? merged.services.map((service, index) => normalizeServiceRow([service.name, service.description, service.price, service.category], defaults.services[index] ?? defaults.services[0], index))
      : defaults.services,
    staff: merged.staff?.length
      ? merged.staff.map((staff, index) => normalizeStaffRow([staff.name, staff.email, staff.role, staff.location, staff.status], defaults.staff[index] ?? defaults.staff[0], index))
      : defaults.staff,
    subscription: mergeObject(defaults.subscription, merged.subscription),
    openingHours: mergeObject(defaults.openingHours, merged.openingHours),
    workflowSettings: {
      ...defaults.workflowSettings,
      ...merged.workflowSettings,
      escalationRules: merged.workflowSettings?.escalationRules?.length
        ? uniqueStrings(merged.workflowSettings.escalationRules)
        : defaults.workflowSettings.escalationRules,
      stages: merged.workflowSettings?.stages?.length ? uniqueStrings(merged.workflowSettings.stages) : defaults.workflowSettings.stages,
    },
  };
}

export function parseClinicBusinessConfiguration(formData: FormData, existing?: PartialClinicBusinessConfiguration | null) {
  const current = mergeClinicBusinessConfiguration(existing);

  const branches = splitDelimitedRows(readString(formData, "branches", ""))
    .map((row, index) => normalizeBranchRow(row, current.branches[index] ?? current.branches[0], index));

  const services = splitDelimitedRows(readString(formData, "services", ""))
    .map((row, index) => normalizeServiceRow(row, current.services[index] ?? current.services[0], index));

  const staff = splitDelimitedRows(readString(formData, "staff", ""))
    .map((row, index) => normalizeStaffRow(row, current.staff[index] ?? current.staff[0], index));

  return mergeClinicBusinessConfiguration({
    aiSettings: {
      afterHours: readString(formData, "ai_after_hours", current.aiSettings.afterHours),
      faqBehaviour: readString(formData, "ai_faq_behaviour", current.aiSettings.faqBehaviour),
      greeting: readString(formData, "ai_greeting", current.aiSettings.greeting),
      humanTransfer: readString(formData, "ai_human_transfer", current.aiSettings.humanTransfer),
      language: readString(formData, "ai_language", current.aiSettings.language),
      prompt: readString(formData, "ai_prompt", current.aiSettings.prompt),
      speechRate: readString(formData, "speech_rate", current.aiSettings.speechRate),
      ssmlEnabled: parseBoolean(formData.get("ssml_enabled"), current.aiSettings.ssmlEnabled),
      voice: readString(formData, "voice", current.aiSettings.voice),
      voicePersonality: readString(formData, "voice_personality", current.aiSettings.voicePersonality),
    },
    billingPreferences: {
      currency: readString(formData, "billing_currency", current.billingPreferences.currency),
      cycle: readString(formData, "billing_cycle", current.billingPreferences.cycle),
      invoicing: readString(formData, "billing_invoicing", current.billingPreferences.invoicing),
      paymentTerms: readString(formData, "billing_payment_terms", current.billingPreferences.paymentTerms),
      planKey: readString(formData, "billing_plan_key", current.billingPreferences.planKey),
      seats: readString(formData, "billing_seats", current.billingPreferences.seats),
      taxMode: readString(formData, "billing_tax_mode", current.billingPreferences.taxMode),
    },
    branding: {
      accent: readString(formData, "accent", current.branding.accent),
      backgroundColour: readString(formData, "background_colour", current.branding.backgroundColour),
      logo: readString(formData, "logo", current.branding.logo),
      primaryColour: readString(formData, "primary_colour", current.branding.primaryColour),
      secondaryColour: readString(formData, "secondary_colour", current.branding.secondaryColour),
      surfaceColour: readString(formData, "surface_colour", current.branding.surfaceColour),
      tagline: readString(formData, "brand_tagline", current.branding.tagline),
      textColour: readString(formData, "text_colour", current.branding.textColour),
      tone: readString(formData, "brand_tone", current.branding.tone),
    },
    branches: branches.length ? branches : current.branches,
    businessProfile: {
      activeBranch: readString(formData, "active_branch", current.businessProfile.activeBranch),
      businessDescription: readString(formData, "business_description", current.businessProfile.businessDescription),
      businessEmail: readString(formData, "business_email", current.businessProfile.businessEmail),
      businessName: readString(formData, "business_name", current.businessProfile.businessName),
      businessPhone: readString(formData, "business_phone", current.businessProfile.businessPhone),
      businessWebsite: readString(formData, "business_website", current.businessProfile.businessWebsite),
      ownerEmail: readString(formData, "owner_email", current.businessProfile.ownerEmail),
      ownerName: readString(formData, "owner_name", current.businessProfile.ownerName),
      phoneNumbers: parseStringArray(formData, "phone_numbers", current.businessProfile.phoneNumbers),
      timezone: readString(formData, "timezone", current.businessProfile.timezone),
    },
    calendarSettings: {
      bookingLink: readString(formData, "calendar_booking_link", current.calendarSettings.bookingLink),
      connected: parseBoolean(formData.get("calendar_connected"), current.calendarSettings.connected),
      provider: readString(formData, "calendar_provider", current.calendarSettings.provider),
      syncMode: readString(formData, "calendar_sync_mode", current.calendarSettings.syncMode),
    },
    customerDetails: {
      contactPreferences: readString(formData, "customer_contact_preferences", current.customerDetails.contactPreferences),
      leadCategories: parseStringArray(formData, "lead_categories", current.customerDetails.leadCategories),
      reportPreferences: readString(formData, "customer_report_preferences", current.customerDetails.reportPreferences),
      tags: parseStringArray(formData, "customer_tags", current.customerDetails.tags),
    },
    emergencyRules: parseStringArray(formData, "emergency_rules", current.emergencyRules),
    knowledgeBase: {
      documents: parseStringArray(formData, "knowledge_documents", current.knowledgeBase.documents),
      policies: parseStringArray(formData, "knowledge_policies", current.knowledgeBase.policies),
      prompts: parseStringArray(formData, "knowledge_prompts", current.knowledgeBase.prompts),
      questionsToAsk: parseStringArray(formData, "questions_to_ask", current.knowledgeBase.questionsToAsk),
      requiredCustomerInformation: parseStringArray(formData, "required_customer_information", current.knowledgeBase.requiredCustomerInformation),
      summary: readString(formData, "knowledge_summary", current.knowledgeBase.summary),
    },
    notificationSettings: {
      email: parseBoolean(formData.get("notify_email"), current.notificationSettings.email),
      highPriorityMissedCalls: parseBoolean(formData.get("notify_high_priority"), current.notificationSettings.highPriorityMissedCalls),
      inApp: parseBoolean(formData.get("notify_in_app"), current.notificationSettings.inApp),
      lowPriorityReplies: parseBoolean(formData.get("notify_low_priority"), current.notificationSettings.lowPriorityReplies),
      sms: parseBoolean(formData.get("notify_sms"), current.notificationSettings.sms),
      weeklyOwnerReport: parseBoolean(formData.get("notify_weekly_report"), current.notificationSettings.weeklyOwnerReport),
      whatsapp: parseBoolean(formData.get("notify_whatsapp"), current.notificationSettings.whatsapp),
      workflowFailures: parseBoolean(formData.get("notify_workflow_failures"), current.notificationSettings.workflowFailures),
    },
    permissions: parseStringArray(formData, "permissions", current.permissions),
    pricing: {
      consultationFee: readString(formData, "pricing_consultation_fee", current.pricing.consultationFee),
      emergencyFee: readString(formData, "pricing_emergency_fee", current.pricing.emergencyFee),
      notes: readString(formData, "pricing_notes", current.pricing.notes),
      quotePolicy: readString(formData, "pricing_quote_policy", current.pricing.quotePolicy),
    },
    roles: parseStringArray(formData, "roles", current.roles),
    services: services.length ? services : current.services,
    staff: staff.length ? staff : current.staff,
    subscription: {
      plan: readString(formData, "subscription_plan", current.subscription.plan),
      renewal: readString(formData, "subscription_renewal", current.subscription.renewal),
      status: readString(formData, "subscription_status", current.subscription.status),
      trialEndsAt: readString(formData, "subscription_trial_ends", current.subscription.trialEndsAt),
    },
    openingHours: {
      holidayHours: readString(formData, "holiday_hours", current.openingHours.holidayHours),
      saturday: readString(formData, "hours_saturday", current.openingHours.saturday),
      sunday: readString(formData, "hours_sunday", current.openingHours.sunday),
      weekdays: readString(formData, "hours_weekdays", current.openingHours.weekdays),
      weekendNotes: readString(formData, "hours_weekend_notes", current.openingHours.weekendNotes),
    },
    workflowSettings: {
      active: parseBoolean(formData.get("workflow_active"), current.workflowSettings.active),
      bookingBehaviour: readString(formData, "workflow_booking_behaviour", current.workflowSettings.bookingBehaviour),
      calendarProvider: readString(formData, "workflow_calendar_provider", current.workflowSettings.calendarProvider),
      escalationRules: parseStringArray(formData, "workflow_escalation_rules", current.workflowSettings.escalationRules),
      followUpCadence: readString(formData, "workflow_follow_up_cadence", current.workflowSettings.followUpCadence),
      stages: parseStringArray(formData, "workflow_stages", current.workflowSettings.stages),
    },
  });
}

export function buildClinicLaunchState(configuration: ClinicBusinessConfiguration): ClinicLaunchState {
  const checks = [
    {
      blocker: "Business name, owner, email, phone, and timezone must be set.",
      ok:
        Boolean(configuration.businessProfile.businessName) &&
        Boolean(configuration.businessProfile.ownerName) &&
        Boolean(configuration.businessProfile.ownerEmail) &&
        Boolean(configuration.businessProfile.businessPhone) &&
        Boolean(configuration.businessProfile.timezone),
    },
    {
      blocker: "Opening hours need at least weekday and Saturday coverage.",
      ok: Boolean(configuration.openingHours.weekdays) && Boolean(configuration.openingHours.saturday),
    },
    { blocker: "Add at least one branch.", ok: configuration.branches.length > 0 },
    { blocker: "Branding requires a logo and primary colour.", ok: Boolean(configuration.branding.logo) && Boolean(configuration.branding.primaryColour) },
    { blocker: "Add at least one service or package.", ok: configuration.services.length > 0 },
    { blocker: "AI greeting and prompt need to be configured.", ok: Boolean(configuration.aiSettings.greeting) && Boolean(configuration.aiSettings.prompt) },
    { blocker: "Add staff members so calls can be routed.", ok: configuration.staff.length > 0 },
    { blocker: "Emergency rules must be defined.", ok: configuration.emergencyRules.length > 0 },
    { blocker: "Knowledge prompts and required customer details must be set.", ok: configuration.knowledgeBase.questionsToAsk.length > 0 && configuration.knowledgeBase.requiredCustomerInformation.length > 0 },
    { blocker: "Notification settings need at least one active channel.", ok: configuration.notificationSettings.sms || configuration.notificationSettings.email || configuration.notificationSettings.inApp },
    { blocker: "Workflow stages need to be configured.", ok: configuration.workflowSettings.stages.length > 0 },
    { blocker: "Choose a calendar provider.", ok: Boolean(configuration.calendarSettings.provider) },
    { blocker: "Subscription and billing preferences should be set.", ok: Boolean(configuration.billingPreferences.planKey) && Boolean(configuration.subscription.status) },
    { blocker: "Customer tags and lead categories should be present.", ok: configuration.customerDetails.tags.length > 0 && configuration.customerDetails.leadCategories.length > 0 },
  ];

  const completeCount = checks.filter((check) => check.ok).length;
  const blockers = checks.filter((check) => !check.ok).map((check) => check.blocker);
  const score = Math.round((completeCount / checks.length) * 100);

  return {
    blockers,
    completeCount,
    lastCheckedAt: new Date().toISOString(),
    ready: blockers.length === 0,
    score,
    warnings: configuration.notificationSettings.whatsapp ? [] : ["WhatsApp is not configured; SMS and email are carrying notifications."],
  };
}

export function formatBranchList(branches: ClinicBusinessBranch[]) {
  return branches.map((branch) => [branch.name, branch.address, branch.phone, branch.notes].join(" | ")).join("\n");
}

export function formatServiceList(services: ClinicBusinessService[]) {
  return services.map((service) => [service.name, service.description, service.price, service.category].join(" | ")).join("\n");
}

export function formatStaffList(staff: ClinicBusinessStaffMember[]) {
  return staff.map((member) => [member.name, member.email, member.role, member.location, member.status].join(" | ")).join("\n");
}

export function formatLines(lines: string[]) {
  return lines.join("\n");
}
