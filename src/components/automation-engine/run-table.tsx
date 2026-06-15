import { ExecutionStatus } from "@/components/automation-engine/execution-status";
import type { AutomationRun } from "@/lib/automation-engine/types";

export function RunTable({ runs }: { runs: AutomationRun[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-5 py-3 font-semibold">Run</th>
            <th className="px-5 py-3 font-semibold">Patient</th>
            <th className="px-5 py-3 font-semibold">State</th>
            <th className="px-5 py-3 font-semibold">Attempts</th>
            <th className="px-5 py-3 font-semibold">Next step</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {runs.map((run) => (
            <tr key={run.id}>
              <td className="px-5 py-4 font-semibold text-[#10201d]">{run.id}</td>
              <td className="px-5 py-4 text-[#394642]">{run.patientLabel}</td>
              <td className="px-5 py-4"><ExecutionStatus state={run.state} /></td>
              <td className="px-5 py-4 text-[#65736f]">{run.attempts}/{run.maxAttempts}</td>
              <td className="px-5 py-4 text-[#65736f]">{run.nextStep}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

