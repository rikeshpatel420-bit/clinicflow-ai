import type { StaffWorkload } from "@/lib/operations/data";

export function WorkloadPanel({ staff }: { staff: StaffWorkload[] }) {
  return (
    <div className="grid gap-3">
      {staff.map((member) => (
        <div key={member.name} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[#10201d]">{member.name}</p>
              <p className="mt-1 text-sm text-[#65736f]">{member.role}</p>
            </div>
            <p className="text-sm font-semibold text-[#087968]">{member.capacity}%</p>
          </div>
          <div className="mt-3 h-2 rounded-md bg-[#edf2f0]">
            <div className="h-2 rounded-md bg-[#18b7a0]" style={{ width: `${member.capacity}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#65736f]">
            {member.activeTasks} tasks, {member.unresolvedAlerts} unresolved alerts
          </p>
        </div>
      ))}
    </div>
  );
}

