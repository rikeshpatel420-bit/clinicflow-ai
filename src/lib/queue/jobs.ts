export type QueueName = "notifications" | "ai" | "billing" | "webhooks" | "sync" | "briefings";
export type QueueJobStatus = "queued" | "scheduled" | "running" | "completed" | "failed";

export type QueueJob<TPayload = Record<string, unknown>> = {
  id: string;
  queue: QueueName;
  status: QueueJobStatus;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
  runAt: string;
};

export function enqueueDemoJob<TPayload>(queue: QueueName, payload: TPayload, runAt = new Date().toISOString()): QueueJob<TPayload> {
  return {
    attempts: 0,
    id: `job_${queue}_${Date.now()}`,
    maxAttempts: 3,
    payload,
    queue,
    runAt,
    status: "queued",
  };
}

export function shouldRetryJob(job: QueueJob) {
  return job.status === "failed" && job.attempts < job.maxAttempts;
}

