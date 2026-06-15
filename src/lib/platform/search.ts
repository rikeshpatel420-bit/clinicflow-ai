export type SearchEntity = "patient" | "call" | "task" | "clinic" | "workflow" | "integration";

export type SearchFilter = {
  key: string;
  label: string;
  entity: SearchEntity;
};

export const globalSearchFilters: SearchFilter[] = [
  { key: "patients", label: "Patients", entity: "patient" },
  { key: "missed-calls", label: "Missed calls", entity: "call" },
  { key: "tasks", label: "Revenue tasks", entity: "task" },
  { key: "clinics", label: "Clinics", entity: "clinic" },
  { key: "workflows", label: "Workflows", entity: "workflow" },
  { key: "integrations", label: "Integrations", entity: "integration" },
];

export function normaliseSearchTerm(value: string) {
  return value.trim().toLowerCase();
}

