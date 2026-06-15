import { aggregateRevenue, averageScore, benchmarkPosition } from "@/lib/enterprise/engine";

const locations = [
  { id: "loc-1", name: "Marylebone", region: "London Central", healthScore: 88, recoveredRevenue: 18400, sla: 94, utilisation: 82 },
  { id: "loc-2", name: "Canary Wharf", region: "London East", healthScore: 79, recoveredRevenue: 14200, sla: 86, utilisation: 74 },
  { id: "loc-3", name: "Richmond", region: "London West", healthScore: 72, recoveredRevenue: 9600, sla: 78, utilisation: 69 },
  { id: "loc-4", name: "Manchester", region: "North West", healthScore: 81, recoveredRevenue: 12800, sla: 88, utilisation: 77 },
];

export const enterpriseDemo = {
  organisation: {
    name: "Harbour Dental Group",
    structure: "Group practice",
    whiteLabel: "Agency-ready tenant shell",
    role: "group_owner",
  },
  locations,
  metrics: [
    { label: "Group recovered revenue", value: `GBP ${aggregateRevenue(locations).toLocaleString("en-GB")}`, note: "demo total" },
    { label: "Average clinic health", value: String(averageScore(locations)), note: "group score" },
    { label: "Locations monitored", value: String(locations.length), note: "multi-site" },
    { label: "SLA compliance", value: "87%", note: "weighted" },
  ],
  regional: [
    { region: "London Central", clinics: 1, revenue: 18400, trend: "+12%" },
    { region: "London East", clinics: 1, revenue: 14200, trend: "+8%" },
    { region: "London West", clinics: 1, revenue: 9600, trend: "-3%" },
    { region: "North West", clinics: 1, revenue: 12800, trend: "+6%" },
  ],
  benchmarks: locations.map((location) => ({
    ...location,
    benchmark: 80,
    position: benchmarkPosition(location.healthScore, 80),
  })),
  governance: [
    { control: "Staff approval required for outbound automation", status: "active", owner: "Group admin" },
    { control: "Regional managers can view assigned clinics only", status: "modeled", owner: "Security" },
    { control: "Clinic audit logs retained for 365 days", status: "active", owner: "Compliance" },
  ],
  compliance: [
    { area: "Patient communication review", score: 92, status: "on track" },
    { area: "Access review", score: 86, status: "watch" },
    { area: "Escalation handling", score: 81, status: "watch" },
    { area: "Audit completeness", score: 95, status: "on track" },
  ],
  alerts: [
    { title: "Richmond SLA below group target", severity: "watch", owner: "Regional manager" },
    { title: "London West revenue recovery trending down", severity: "urgent", owner: "Group owner" },
    { title: "Agency tenant white-label checklist incomplete", severity: "normal", owner: "Agency admin" },
  ],
  audit: [
    { id: "audit-1", actor: "Group owner", action: "reviewed regional SLA report", scope: "Organisation", time: "Today 09:10" },
    { id: "audit-2", actor: "Regional manager", action: "assigned Richmond intervention plan", scope: "London West", time: "Yesterday 16:40" },
    { id: "audit-3", actor: "System", action: "recorded role visibility policy check", scope: "Security", time: "Yesterday 08:20" },
  ],
  reports: [
    "Weekly group performance summary",
    "Regional SLA compliance pack",
    "Clinic comparison board",
    "Agency white-label operating report",
  ],
};

