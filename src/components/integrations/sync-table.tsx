import { SyncStatusBadge } from "@/components/integrations/health-badge";
import { getProviderName } from "@/lib/integrations/registry";
import type { SyncJob } from "@/lib/integrations/types";
import { shouldRetry } from "@/lib/integrations/sync";

export function SyncTable({ jobs }: { jobs: SyncJob[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-5 py-3 font-semibold">Provider</th>
            <th className="px-5 py-3 font-semibold">Object</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Records</th>
            <th className="px-5 py-3 font-semibold">Failures</th>
            <th className="px-5 py-3 font-semibold">Retry</th>
            <th className="px-5 py-3 font-semibold">Summary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="px-5 py-4 font-semibold text-[#10201d]">{getProviderName(job.provider)}</td>
              <td className="px-5 py-4 text-[#394642]">{job.objectType}</td>
              <td className="px-5 py-4"><SyncStatusBadge status={job.status} /></td>
              <td className="px-5 py-4 text-[#394642]">{job.recordsProcessed}</td>
              <td className="px-5 py-4 text-[#394642]">{job.failures}</td>
              <td className="px-5 py-4 text-[#65736f]">{shouldRetry(job.status, job.retryCount) ? `retry ${job.retryCount + 1}` : "none"}</td>
              <td className="px-5 py-4 text-[#65736f]">{job.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

