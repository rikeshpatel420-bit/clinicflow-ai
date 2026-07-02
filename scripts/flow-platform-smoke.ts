import {
  buildFlowEventTopicSummary,
  buildFlowTemplateRegistry,
  buildNotificationRules,
  createFlowAuditEngine,
  createFlowCustomer360Snapshot,
  createFlowEventBus,
  createFlowNotificationEngine,
  createFlowTimelineItemFromSource,
  getActiveFlowPlatformProfile,
  getActiveFlowPlatformProfileId,
  getFlowPlatformProfileSummaries,
  getFlowPlatformProfileValidationSummaries,
  summarizeFlowTemplates,
} from "../src/lib/flow-platform";

async function main() {
  const expectedProfileIds = ["buildflow", "clinicflow", "estateflow", "plumbflow", "sparkflow", "heatflow", "vetflow"] as const;

  const summaries = getFlowPlatformProfileSummaries();
  const validations = getFlowPlatformProfileValidationSummaries();
  const summaryIds = summaries.map((summary) => summary.id).sort();
  const expectedIds = [...expectedProfileIds].sort();
  const validationMap = new Map(validations.map((validation) => [validation.id, validation]));

  if (JSON.stringify(summaryIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`Flow Platform profile catalog mismatch: expected ${expectedIds.join(", ")}, received ${summaryIds.join(", ")}`);
  }

  const activeProfileId = getActiveFlowPlatformProfileId();
  const activeProfile = getActiveFlowPlatformProfile();

  if (activeProfile.id !== activeProfileId) {
    throw new Error(`Active profile mismatch: runtime resolved ${activeProfileId} but profile object reports ${activeProfile.id}`);
  }

  for (const profile of summaries) {
    if (profile.intentCount <= 0) {
      throw new Error(`Profile ${profile.id} has no registered intents`);
    }

    if (profile.entityCount <= 0) {
      throw new Error(`Profile ${profile.id} has no registered entities`);
    }

    if (profile.workflowCount <= 0) {
      throw new Error(`Profile ${profile.id} has no registered workflows`);
    }

    if (profile.notificationCount <= 0) {
      throw new Error(`Profile ${profile.id} has no registered notifications`);
    }

    if (profile.templateCount <= 0) {
      throw new Error(`Profile ${profile.id} has no registered templates`);
    }

    if (profile.triggerCount <= 0) {
      throw new Error(`Profile ${profile.id} has no registered triggers`);
    }

    const validation = validationMap.get(profile.id);
    if (!validation) {
      throw new Error(`Profile ${profile.id} has no validation summary`);
    }

    if (!validation.platformReady) {
      throw new Error(`Profile ${profile.id} failed validation: ${validation.missing.join(", ")}`);
    }
  }

  const activeTemplateRegistry = buildFlowTemplateRegistry(activeProfile);
  const activeNotificationRules = buildNotificationRules(activeProfile);
  const activeNotificationSummary = summarizeFlowTemplates(activeTemplateRegistry);
  const eventBus = createFlowEventBus();
  const auditEngine = createFlowAuditEngine({ profileId: activeProfile.id });
  const notificationEngine = createFlowNotificationEngine({
    eventBus,
    profileId: activeProfile.id,
    templateRegistry: activeTemplateRegistry,
  });

  if (activeNotificationSummary.templateCount <= 0) {
    throw new Error("Flow Platform did not build any notification templates");
  }

  if (activeNotificationRules.length <= 0) {
    throw new Error("Flow Platform did not build any notification rules");
  }

  if (buildFlowEventTopicSummary().registeredTopics <= 0) {
    throw new Error("Flow Platform did not register event topics");
  }

  const dispatched = await notificationEngine.dispatch({
    clinicId: "clinic-demo",
    eventType: "call.missed",
    profileId: activeProfile.id,
    templateId: "missed-call",
    variables: {
      clinicName: activeProfile.clinic.name,
      customerName: "Alex Smith",
      followUpTime: "today at 3pm",
    },
  });

  if (dispatched.outcome === "failed") {
    throw new Error("Flow Platform notification engine smoke test failed");
  }

  const auditRecord = await auditEngine.record({
    category: "workflow",
    clinicId: "clinic-demo",
    detail: "Smoke test audit entry captured.",
    eventType: "workflow.completed",
    profileId: activeProfile.id,
    outcome: "success",
  });

  const timelineItem = createFlowTimelineItemFromSource({ kind: "audit", record: auditRecord });

  const customer = createFlowCustomer360Snapshot({
    contact: { fullName: "Alex Smith", phone: "+447700900123" },
    id: "customer-demo",
    history: [timelineItem],
    profileId: activeProfile.id,
    tags: ["smoke-test"],
  });

  if (customer.history.length <= 0) {
    throw new Error("Flow Platform customer model smoke test failed");
  }

  if (eventBus.snapshot().topics.length === 0) {
    throw new Error("Flow Platform event bus snapshot failed");
  }

  console.log("Flow Platform smoke check passed");
  console.log(`Active profile: ${activeProfile.id}`);
  console.log(
    summaries
      .map(
        (profile) =>
          `${profile.id}:${profile.intentCount} intents/${profile.entityCount} entities/${profile.workflowCount} workflows/${profile.notificationCount} notifications/${profile.templateCount} templates`,
      )
      .join(" | "),
  );
  console.log(`Templates: ${activeNotificationSummary.templateCount} | Notifications: ${activeNotificationRules.length} | Audit: ${auditEngine.summary().count} | Customer timeline: ${customer.history.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
