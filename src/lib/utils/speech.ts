const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHtmlEntity(entity: string) {
  if (entity.startsWith("&#x")) {
    const codePoint = Number.parseInt(entity.slice(3, -1), 16);
    return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
  }

  if (entity.startsWith("&#")) {
    const codePoint = Number.parseInt(entity.slice(2, -1), 10);
    return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
  }

  const key = entity.slice(1, -1);
  return ENTITY_MAP[key] ?? entity;
}

export function sanitizeSpeechText(value: string) {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|apos|gt|lt|nbsp|quot);|&#x[0-9a-fA-F]+;|&#\d+;/g, (match) => decodeHtmlEntity(match))
    .replace(/\s+/g, " ")
    .trim();
}
