export type AiWorkflowName = "intent_classification" | "reply_draft" | "summary" | "lead_scoring" | "next_action";

export type AiWorkflowRequest = {
  workflow: AiWorkflowName;
  clinicId: string;
  input: Record<string, string | number | boolean | null>;
  safetyMode: "staff_approval_required";
};

export function createAiWorkflowRequest(workflow: AiWorkflowName, clinicId: string, input: AiWorkflowRequest["input"]): AiWorkflowRequest {
  return {
    clinicId,
    input,
    safetyMode: "staff_approval_required",
    workflow,
  };
}

export function runDeterministicAiWorkflow(request: AiWorkflowRequest) {
  return {
    mode: "demo" as const,
    request,
    result: "Deterministic placeholder generated. No AI provider was called.",
  };
}

