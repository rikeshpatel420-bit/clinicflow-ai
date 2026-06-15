export function LocationTable({
  locations,
}: {
  locations: { name: string; region: string; healthScore: number; recoveredRevenue: number; sla: number; utilisation: number }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-5 py-3 font-semibold">Clinic</th>
            <th className="px-5 py-3 font-semibold">Region</th>
            <th className="px-5 py-3 font-semibold">Health</th>
            <th className="px-5 py-3 font-semibold">Recovered revenue</th>
            <th className="px-5 py-3 font-semibold">SLA</th>
            <th className="px-5 py-3 font-semibold">Utilisation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {locations.map((location) => (
            <tr key={location.name}>
              <td className="px-5 py-4 font-semibold text-[#10201d]">{location.name}</td>
              <td className="px-5 py-4 text-[#394642]">{location.region}</td>
              <td className="px-5 py-4 text-[#087968]">{location.healthScore}</td>
              <td className="px-5 py-4 text-[#10201d]">GBP {location.recoveredRevenue.toLocaleString("en-GB")}</td>
              <td className="px-5 py-4 text-[#394642]">{location.sla}%</td>
              <td className="px-5 py-4 text-[#394642]">{location.utilisation}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

