import type { AutomationRule, AutomationRun, ExecutionState } from "@/lib/automation-engine/types";

export function detectSlaBreach(minutesWaiting: number, targetMinutes: number) {
  return minutesWaiting > targetMinutes;
}

export function shouldRetryRun(run: AutomationRun) {
  return (run.state === "failed" || run.state === "retrying") && run.attempts < run.maxAttempts;
}

export function nextBackoffMinutes(attempts: number) {
  return Math.min(60, Math.max(5, attempts * 10));
}

export function evaluateRule(rule: AutomationRule, context: { trigger: string; severity: number }) {
  return rule.enabled && rule.trigger === context.trigger && rule.priority <= context.severity;
}

export function transitionRun(run: AutomationRun, state: ExecutionState): AutomationRun {
  return { ...run, state };
}

