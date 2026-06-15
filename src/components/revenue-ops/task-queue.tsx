export function TaskQueue({
  tasks,
}: {
  tasks: { id: string; title: string; owner: string; priority: string; due: string; value: number }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-5 py-3 font-semibold">Task</th>
            <th className="px-5 py-3 font-semibold">Owner</th>
            <th className="px-5 py-3 font-semibold">Priority</th>
            <th className="px-5 py-3 font-semibold">Due</th>
            <th className="px-5 py-3 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-5 py-4 font-semibold text-[#10201d]">{task.title}</td>
              <td className="px-5 py-4 text-[#394642]">{task.owner}</td>
              <td className="px-5 py-4 text-[#087968]">{task.priority}</td>
              <td className="px-5 py-4 text-[#65736f]">{task.due}</td>
              <td className="px-5 py-4 font-semibold text-[#10201d]">GBP {task.value.toLocaleString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

