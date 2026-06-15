import type { OperationalAlert } from "@/lib/operations/data";
import { SeverityBadge, SlaBadge } from "@/components/operations/severity-badge";

export function AlertTable({ alerts }: { alerts: OperationalAlert[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-5 py-3 font-semibold">Patient</th>
            <th className="px-5 py-3 font-semibold">Alert</th>
            <th className="px-5 py-3 font-semibold">Severity</th>
            <th className="px-5 py-3 font-semibold">SLA</th>
            <th className="px-5 py-3 font-semibold">Owner</th>
            <th className="px-5 py-3 font-semibold">Value at risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-[#fbfdfc]">
              <td className="px-5 py-4 font-semibold text-[#10201d]">{alert.patient}</td>
              <td className="px-5 py-4">
                <p className="font-medium text-[#394642]">{alert.title}</p>
                <p className="mt-1 text-[#65736f]">{alert.nextAction}</p>
              </td>
              <td className="px-5 py-4"><SeverityBadge value={alert.severity} /></td>
              <td className="px-5 py-4">
                <div className="grid gap-1">
                  <SlaBadge value={alert.slaStatus} />
                  <span className="text-xs text-[#65736f]">{alert.minutesWaiting} min waiting</span>
                </div>
              </td>
              <td className="px-5 py-4 text-[#394642]">{alert.owner}</td>
              <td className="px-5 py-4 font-semibold text-[#10201d]">GBP {alert.valueAtRisk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

