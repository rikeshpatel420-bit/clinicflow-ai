export function EntitlementTable({
  rows,
}: {
  rows: { feature: string; starter: boolean; growth: boolean; enterprise: boolean }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-5 py-3 font-semibold">Feature</th>
            <th className="px-5 py-3 font-semibold">Starter</th>
            <th className="px-5 py-3 font-semibold">Growth</th>
            <th className="px-5 py-3 font-semibold">Enterprise</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {rows.map((row) => (
            <tr key={row.feature}>
              <td className="px-5 py-4 font-semibold text-[#10201d]">{row.feature}</td>
              {(["starter", "growth", "enterprise"] as const).map((plan) => (
                <td key={plan} className="px-5 py-4 text-[#394642]">{row[plan] ? "Included" : "Not included"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

