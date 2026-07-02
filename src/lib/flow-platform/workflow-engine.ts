import type {
  FlowPlatformProfile,
  FlowWorkflowAction,
  FlowWorkflowActionType,
  FlowWorkflowCondition,
  FlowWorkflowDefinition,
  FlowWorkflowStep,
  FlowWorkflowTrigger,
} from "./types";

export type WorkflowPlan = {
  channel: FlowWorkflowDefinition["channel"];
  description: string;
  handler: string;
  key: string;
  label: string;
  trigger: FlowWorkflowDefinition["trigger"];
};

export type FlowWorkflowExecutionContext = {
  aiResponseFailed?: boolean;
  businessHours?: boolean;
  callId?: string | null;
  clinicId?: string | null;
  confidenceScore?: number | null;
  customerType?: string | null;
  existingCustomer?: boolean | null;
  intent?: string | null;
  leadId?: string | null;
  metadata?: Record<string, unknown>;
  noResponse?: boolean | null;
  patientId?: string | null;
  payload?: Record<string, unknown>;
  postcode?: string | null;
  profileId?: string | null;
  responseState?: string | null;
  serviceCategory?: string | null;
  trigger: string;
  urgency?: number | null;
};

export type FlowWorkflowActionOutcome = {
  actionId: string;
  actionType: FlowWorkflowActionType;
  detail: string;
  label: string;
  ok: boolean;
  skipped?: boolean;
  output?: Record<string, unknown>;
};

export type FlowWorkflowStepOutcome = {
  actionOutcomes: FlowWorkflowActionOutcome[];
  detail: string;
  id: string;
  label: string;
  ok: boolean;
  matched: boolean;
};

export type FlowWorkflowExecutionOutcome = {
  actionOutcomes: FlowWorkflowActionOutcome[];
  conditionMatched: boolean;
  errors: string[];
  fallbackApplied: boolean;
  matched: boolean;
  stepOutcomes: FlowWorkflowStepOutcome[];
  status: "completed" | "failed" | "fallback" | "skipped";
  trigger: string;
  workflowId: string;
  workflowKey: string;
  workflowLabel: string;
};

export type FlowWorkflowAuditEntry = {
  actionId?: string;
  actionType?: FlowWorkflowActionType;
  clinicId?: string | null;
  detail: string;
  eventType: string;
  fallbackApplied?: boolean;
  metadata?: Record<string, unknown>;
  profileId: string;
  stepId?: string;
  workflowId: string;
  workflowKey: string;
  workflowLabel: string;
};

export type FlowWorkflowActionHandler = (input: {
  action: FlowWorkflowAction;
  context: FlowWorkflowExecutionContext;
  step?: FlowWorkflowStep;
  workflow: FlowWorkflowDefinition;
}) => Promise<FlowWorkflowActionOutcome | void> | FlowWorkflowActionOutcome | void;

export type FlowWorkflowExecutorOptions = {
  actionHandlers?: Partial<Record<FlowWorkflowActionType, FlowWorkflowActionHandler>>;
  audit?: (entry: FlowWorkflowAuditEntry) => Promise<void> | void;
  logger?: Pick<Console, "error" | "info" | "warn">;
};

export type WorkflowOverview = {
  actionCount: number;
  conditionCount: number;
  description: string;
  handler: string;
  key: string;
  label: string;
  lastRunAt: string | null;
  profileId: string | null;
  status: FlowWorkflowDefinition["status"] | null;
  stepCount: number;
  trigger: string;
};

type WorkflowComparable = string | number | boolean | null | readonly WorkflowComparable[];

const TRIGGER_ALIASES: Record<string, string> = {
  "call.missed": "missed_call",
  "call.summary.created": "follow_up_due",
  "call.summary.requested": "follow_up_due",
  "twilio.call.missed": "missed_call",
  "twilio.call.received": "inbound_call_completed",
  "twilio.sms.received": "message_received",
  "twilio.voice.received": "inbound_call_completed",
  "twilio.voice.speech": "message_received",
};

function coerceComparableValue(value: unknown): WorkflowComparable {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => coerceComparableValue(item));
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function resolvePath(source: Record<string, unknown>, path: string): unknown {
  if (path in source) return source[path];

  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function resolveConditionValue(context: FlowWorkflowExecutionContext, field: string) {
  const directValue = resolvePath(context as unknown as Record<string, unknown>, field);
  if (directValue !== undefined) return directValue;

  if (context.payload) {
    const payloadValue = resolvePath(context.payload, field);
    if (payloadValue !== undefined) return payloadValue;
  }

  if (context.metadata) {
    const metadataValue = resolvePath(context.metadata, field);
    if (metadataValue !== undefined) return metadataValue;
  }

  return undefined;
}

function matchesOperator(actual: unknown, operator: FlowWorkflowCondition["operator"], expected?: FlowWorkflowCondition["value"]) {
  const actualValue = coerceComparableValue(actual);
  const expectedValue = coerceComparableValue(expected);

  switch (operator) {
    case "equals":
      return actualValue === expectedValue;
    case "not_equals":
      return actualValue !== expectedValue;
    case "contains":
      return typeof actualValue === "string" && typeof expectedValue === "string" ? actualValue.toLowerCase().includes(expectedValue.toLowerCase()) : false;
    case "not_contains":
      return typeof actualValue === "string" && typeof expectedValue === "string" ? !actualValue.toLowerCase().includes(expectedValue.toLowerCase()) : true;
    case "greater_than":
      return typeof actualValue === "number" && typeof expectedValue === "number" ? actualValue > expectedValue : false;
    case "greater_than_or_equal":
      return typeof actualValue === "number" && typeof expectedValue === "number" ? actualValue >= expectedValue : false;
    case "less_than":
      return typeof actualValue === "number" && typeof expectedValue === "number" ? actualValue < expectedValue : false;
    case "less_than_or_equal":
      return typeof actualValue === "number" && typeof expectedValue === "number" ? actualValue <= expectedValue : false;
    case "in":
      return Array.isArray(expectedValue) ? expectedValue.includes(actualValue as never) : false;
    case "not_in":
      return Array.isArray(expectedValue) ? !expectedValue.includes(actualValue as never) : true;
    case "starts_with":
      return typeof actualValue === "string" && typeof expectedValue === "string" ? actualValue.startsWith(expectedValue) : false;
    case "ends_with":
      return typeof actualValue === "string" && typeof expectedValue === "string" ? actualValue.endsWith(expectedValue) : false;
    case "exists":
      return actualValue !== null && actualValue !== undefined && actualValue !== "";
    case "missing":
      return actualValue === null || actualValue === undefined || actualValue === "";
    case "truthy":
      return Boolean(actualValue);
    case "falsy":
      return !Boolean(actualValue);
    case "matches": {
      if (typeof actualValue !== "string" || typeof expectedValue !== "string") return false;
      return new RegExp(expectedValue, "i").test(actualValue);
    }
    default:
      return false;
  }
}

export function evaluateWorkflowCondition(condition: FlowWorkflowCondition, context: FlowWorkflowExecutionContext) {
  const actual = resolveConditionValue(context, condition.field);
  return matchesOperator(actual, condition.operator, condition.value);
}

export function evaluateWorkflowConditions(
  conditions: readonly FlowWorkflowCondition[] | undefined,
  context: FlowWorkflowExecutionContext,
  mode: "all" | "any" = "all",
) {
  if (!conditions || conditions.length === 0) return true;
  return mode === "any" ? conditions.some((condition) => evaluateWorkflowCondition(condition, context)) : conditions.every((condition) => evaluateWorkflowCondition(condition, context));
}

export function normalizeWorkflowTrigger(trigger: string): string {
  return TRIGGER_ALIASES[trigger] ?? trigger;
}

export function workflowTriggersMatch(expected: FlowWorkflowTrigger, actual: string) {
  return normalizeWorkflowTrigger(expected) === normalizeWorkflowTrigger(actual) || expected === actual;
}

export function listWorkflowDefinitions(profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">) {
  return [...profile.workflows];
}

export function resolveWorkflowDefinition(
  profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">,
  key: string,
): FlowWorkflowDefinition | null {
  return profile.workflows.find((workflow) => workflow.key === key) ?? null;
}

export function createWorkflowPlan(
  profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">,
  key: string,
): WorkflowPlan | null {
  const workflow = resolveWorkflowDefinition(profile, key);
  if (!workflow) {
    return null;
  }

  return {
    channel: workflow.channel,
    description: workflow.description,
    handler: workflow.handler,
    key: workflow.key,
    label: workflow.label,
    trigger: workflow.trigger,
  };
}

export function workflowHandlerNames(profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">) {
  return profile.workflows.map((workflow) => workflow.handler);
}

function workflowOverviewLastRun(workflow: FlowWorkflowDefinition, auditEntries?: readonly { created_at: string; metadata?: unknown }[]) {
  const entry = auditEntries?.find((item) => {
    if (!item.metadata || typeof item.metadata !== "object") {
      return false;
    }

    const metadata = item.metadata as Record<string, unknown>;
    return metadata.workflow_key === workflow.key || metadata.workflowId === workflow.key || metadata.workflowId === workflow.profileId;
  });
  return entry?.created_at ?? null;
}

export function getWorkflowOverviews(
  profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows" | "id">,
  auditEntries?: readonly { created_at: string; metadata?: unknown }[],
): WorkflowOverview[] {
  return profile.workflows.map((workflow) => ({
    actionCount: workflow.actions?.length ?? 0,
    conditionCount: workflow.conditions?.length ?? 0,
    description: workflow.description,
    handler: workflow.handler,
    key: workflow.key,
    label: workflow.label,
    lastRunAt: workflowOverviewLastRun(workflow, auditEntries),
    profileId: workflow.profileId ?? profile.id,
    status: workflow.status ?? null,
    stepCount: workflow.steps?.length ?? 0,
    trigger: workflow.trigger,
  }));
}

function createActionOutcome(action: FlowWorkflowAction, detail: string, ok: boolean, output?: Record<string, unknown>): FlowWorkflowActionOutcome {
  return {
    actionId: action.id,
    actionType: action.type,
    detail,
    label: action.label,
    ok,
    output,
  };
}

async function executeWorkflowAction(
  action: FlowWorkflowAction,
  context: FlowWorkflowExecutionContext,
  workflow: FlowWorkflowDefinition,
  step: FlowWorkflowStep | undefined,
  options: FlowWorkflowExecutorOptions,
): Promise<FlowWorkflowActionOutcome> {
  if (action.enabled === false) {
    return createActionOutcome(action, "Action is disabled in configuration.", true, { skipped: true });
  }

  const handler = options.actionHandlers?.[action.type];

  if (!handler) {
    return createActionOutcome(action, "No runtime handler is registered yet; configuration captured the action plan.", true, { skipped: true });
  }

  try {
    const result = await handler({ action, context, step, workflow });
    if (!result) {
      return createActionOutcome(action, "Action completed without a structured result.", true);
    }

    return {
      actionId: result.actionId ?? action.id,
      actionType: result.actionType ?? action.type,
      detail: result.detail ?? "Action completed.",
      label: result.label ?? action.label,
      ok: result.ok ?? true,
      output: result.output,
      skipped: result.skipped,
    };
  } catch (error) {
    options.logger?.warn("[Flow Workflow Engine] action failed", {
      actionId: action.id,
      actionType: action.type,
      error: error instanceof Error ? error.message : String(error),
      workflowKey: workflow.key,
    });

    return createActionOutcome(action, error instanceof Error ? error.message : String(error), false);
  }
}

function getWorkflowAction(workflow: FlowWorkflowDefinition, actionId: string) {
  return workflow.actions?.find((action) => action.id === actionId) ?? null;
}

async function executeWorkflowStep(
  workflow: FlowWorkflowDefinition,
  step: FlowWorkflowStep,
  context: FlowWorkflowExecutionContext,
  options: FlowWorkflowExecutorOptions,
) {
  const matched = evaluateWorkflowConditions(step.conditions, context, step.conditionMode ?? "all");
  if (!matched) {
    return {
      actionOutcomes: [],
      detail: "Step conditions did not match.",
      id: step.id,
      label: step.label,
      matched: false,
      ok: true,
    } satisfies FlowWorkflowStepOutcome;
  }

  const actionOutcomes: FlowWorkflowActionOutcome[] = [];
  let ok = true;

  for (const actionId of step.actionIds) {
    const action = getWorkflowAction(workflow, actionId);
    if (!action) {
      ok = false;
      actionOutcomes.push({
        actionId,
        actionType: "add_note",
        detail: "Action definition not found in workflow configuration.",
        label: actionId,
        ok: false,
      });
      if (!step.continueOnError) break;
      continue;
    }

    const outcome = await executeWorkflowAction(action, context, workflow, step, options);
    actionOutcomes.push(outcome);
    if (!outcome.ok) {
      ok = false;
      if (!step.continueOnError) break;
    }
  }

  if (!ok && step.fallbackActionIds?.length) {
    for (const actionId of step.fallbackActionIds) {
      const action = getWorkflowAction(workflow, actionId);
      if (!action) continue;
      const outcome = await executeWorkflowAction(action, context, workflow, step, options);
      actionOutcomes.push(outcome);
    }
  }

  return {
    actionOutcomes,
    detail: ok ? "Step completed." : "One or more actions failed.",
    id: step.id,
    label: step.label,
    matched: true,
    ok,
  } satisfies FlowWorkflowStepOutcome;
}

export async function executeWorkflowDefinition(
  workflow: FlowWorkflowDefinition,
  context: FlowWorkflowExecutionContext,
  options: FlowWorkflowExecutorOptions = {},
): Promise<FlowWorkflowExecutionOutcome> {
  const matched = workflowTriggersMatch(workflow.trigger, context.trigger) && evaluateWorkflowConditions(workflow.conditions, context, "all");
  if (!matched) {
    return {
      actionOutcomes: [],
      conditionMatched: false,
      errors: [],
      fallbackApplied: false,
      matched: false,
      stepOutcomes: [],
      status: "skipped",
      trigger: context.trigger,
      workflowId: workflow.profileId ?? workflow.key,
      workflowKey: workflow.key,
      workflowLabel: workflow.label,
    };
  }

  const actionOutcomes: FlowWorkflowActionOutcome[] = [];
  const stepOutcomes: FlowWorkflowStepOutcome[] = [];
  const errors: string[] = [];
  let fallbackApplied = false;
  let status: FlowWorkflowExecutionOutcome["status"] = "completed";

  const steps = workflow.steps && workflow.steps.length > 0 ? workflow.steps : undefined;
  if (!steps) {
    for (const action of workflow.actions ?? []) {
      const outcome = await executeWorkflowAction(action, context, workflow, undefined, options);
      actionOutcomes.push(outcome);
      if (!outcome.ok) {
        status = "failed";
        errors.push(outcome.detail);
      }
    }
  } else {
    for (const step of steps) {
      const stepOutcome = await executeWorkflowStep(workflow, step, context, options);
      stepOutcomes.push(stepOutcome);
      actionOutcomes.push(...stepOutcome.actionOutcomes);
      if (!stepOutcome.ok) {
        status = "failed";
        errors.push(stepOutcome.detail);
        if (!step.continueOnError) {
          break;
        }
      }
    }
  }

  if (status === "failed" && workflow.fallback) {
    fallbackApplied = true;
    const fallbackActions = workflow.fallback.actionIds
      .map((actionId) => getWorkflowAction(workflow, actionId))
      .filter((action): action is FlowWorkflowAction => Boolean(action));

    for (const action of fallbackActions) {
      const outcome = await executeWorkflowAction(action, context, workflow, undefined, options);
      actionOutcomes.push(outcome);
    }
  }

  const outcome: FlowWorkflowExecutionOutcome = {
    actionOutcomes,
    conditionMatched: true,
    errors,
    fallbackApplied,
    matched: true,
    stepOutcomes,
    status,
    trigger: context.trigger,
    workflowId: workflow.profileId ?? workflow.key,
    workflowKey: workflow.key,
    workflowLabel: workflow.label,
  };

  if (options.audit) {
    await options.audit({
      actionId: actionOutcomes.at(-1)?.actionId,
      actionType: actionOutcomes.at(-1)?.actionType,
      clinicId: context.clinicId ?? null,
      detail: status === "completed" ? "Workflow completed." : "Workflow completed with fallback or failure.",
      eventType: status === "completed" ? "workflow.completed" : status === "failed" ? "workflow.failed" : "workflow.fallback",
      fallbackApplied,
      metadata: {
        action_count: actionOutcomes.length,
        errors,
        event_trigger: context.trigger,
        profile_id: workflow.profileId ?? context.profileId ?? null,
        step_count: stepOutcomes.length,
        workflow_key: workflow.key,
        workflow_status: workflow.status ?? "active",
      },
      profileId: workflow.profileId ?? context.profileId ?? "unknown",
      workflowId: workflow.profileId ?? workflow.key,
      workflowKey: workflow.key,
      workflowLabel: workflow.label,
    });
  }

  return outcome;
}

export async function runWorkflowEngine(
  profile: Pick<FlowPlatformProfile<string, string, string, string>, "id" | "workflows">,
  context: FlowWorkflowExecutionContext,
  options: FlowWorkflowExecutorOptions = {},
) {
  const matchedWorkflows = profile.workflows.filter((workflow) => (workflow.status === undefined || workflow.status === "active") && workflowTriggersMatch(workflow.trigger, context.trigger) && evaluateWorkflowConditions(workflow.conditions, context, "all"));
  const executions: FlowWorkflowExecutionOutcome[] = [];
  const unmatchedFallback = matchedWorkflows.length === 0;

  for (const workflow of matchedWorkflows) {
    executions.push(await executeWorkflowDefinition(workflow, context, options));
  }

  if (options.audit) {
    await options.audit({
      detail: unmatchedFallback ? "No workflow matched trigger; fallback path retained." : "Workflow engine executed.",
      eventType: unmatchedFallback ? "workflow.unmatched" : "workflow.run",
      fallbackApplied: unmatchedFallback,
      metadata: {
        matched_workflow_count: matchedWorkflows.length,
        profile_id: profile.id,
        trigger: context.trigger,
      },
      profileId: profile.id,
      workflowId: profile.id,
      workflowKey: context.trigger,
      workflowLabel: "Workflow engine",
    });
  }

  if (unmatchedFallback) {
    options.logger?.warn("[Flow Workflow Engine] no workflow matched trigger", {
      profileId: profile.id,
      trigger: context.trigger,
    });
  } else {
    options.logger?.info("[Flow Workflow Engine] workflows executed", {
      executed: executions.length,
      profileId: profile.id,
      trigger: context.trigger,
    });
  }

  return {
    fallbackApplied: unmatchedFallback,
    executions,
    matchedWorkflows: matchedWorkflows.length,
    profileId: profile.id,
    trigger: context.trigger,
  };
}
