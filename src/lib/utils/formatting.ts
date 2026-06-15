export function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatGBP(pence: number) {
  return new Intl.NumberFormat("en-GB", { currency: "GBP", style: "currency" }).format(pence / 100);
}

export function formatShortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "Not set";
}

