import type { PlatformJob } from "@/lib/platform/types";

export function JobBoard({ jobs }: { jobs: PlatformJob[] }) {
  return (
    <div className="grid gap-3">
      {jobs.map((job) => (
        <article key={job.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#10201d]">{job.name}</p>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">{job.status}</span>
          </div>
          <p className="mt-2 text-sm text-[#65736f]">{job.queue} / {job.scheduledFor}</p>
        </article>
      ))}
    </div>
  );
}

