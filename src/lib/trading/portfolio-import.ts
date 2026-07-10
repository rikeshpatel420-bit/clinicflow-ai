import type { ImportValidationResult, PortfolioSnapshotRow, ReconciliationRow, TransactionHistoryRow } from "@/lib/trading/types";

export type ColumnMapping = Record<string, string>;

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function readMapped(row: Record<string, string>, mapping: ColumnMapping, field: string) {
  return row[mapping[field] ?? field] ?? "";
}

function numberField(value: string) {
  return Number(value.replace(/[,£$]/g, ""));
}

export function importPortfolioSnapshotCsv(csv: string, mapping: ColumnMapping): ImportValidationResult<PortfolioSnapshotRow> {
  const errors: string[] = [];
  const rows = parseCsv(csv).flatMap((raw, index) => {
    const rowNumber = index + 2;
    const row: PortfolioSnapshotRow = {
      accountIdentifier: readMapped(raw, mapping, "accountIdentifier"),
      bookCost: numberField(readMapped(raw, mapping, "bookCost")),
      currency: readMapped(raw, mapping, "currency").toUpperCase(),
      exchange: readMapped(raw, mapping, "exchange").toUpperCase(),
      isin: readMapped(raw, mapping, "isin").toUpperCase(),
      quantity: numberField(readMapped(raw, mapping, "quantity")),
      ticker: readMapped(raw, mapping, "ticker").toUpperCase(),
    };

    if (!row.accountIdentifier) errors.push(`Row ${rowNumber}: account identifier is required.`);
    if (!row.ticker) errors.push(`Row ${rowNumber}: ticker is required.`);
    if (!/^[A-Z0-9]{12}$/.test(row.isin)) errors.push(`Row ${rowNumber}: valid ISIN is required.`);
    if (!row.exchange) errors.push(`Row ${rowNumber}: exchange is required.`);
    if (!Number.isFinite(row.quantity)) errors.push(`Row ${rowNumber}: quantity is invalid.`);
    if (!Number.isFinite(row.bookCost)) errors.push(`Row ${rowNumber}: book cost is invalid.`);
    if (!/^[A-Z]{3}$/.test(row.currency)) errors.push(`Row ${rowNumber}: currency must be ISO-4217.`);

    return [row];
  });

  return { duplicateTransactionIds: [], errors, rows };
}

export function importTransactionHistoryCsv(csv: string, mapping: ColumnMapping): ImportValidationResult<TransactionHistoryRow> {
  const errors: string[] = [];
  const seen = new Set<string>();
  const duplicateTransactionIds: string[] = [];

  const rows = parseCsv(csv).map((raw, index) => {
    const rowNumber = index + 2;
    const row: TransactionHistoryRow = {
      accountIdentifier: readMapped(raw, mapping, "accountIdentifier"),
      currency: readMapped(raw, mapping, "currency").toUpperCase(),
      exchange: readMapped(raw, mapping, "exchange").toUpperCase(),
      fees: numberField(readMapped(raw, mapping, "fees")),
      isin: readMapped(raw, mapping, "isin").toUpperCase(),
      price: numberField(readMapped(raw, mapping, "price")),
      quantity: numberField(readMapped(raw, mapping, "quantity")),
      settlementDate: readMapped(raw, mapping, "settlementDate"),
      ticker: readMapped(raw, mapping, "ticker").toUpperCase(),
      transactionDate: readMapped(raw, mapping, "transactionDate"),
      transactionId: readMapped(raw, mapping, "transactionId"),
    };

    if (!row.accountIdentifier) errors.push(`Row ${rowNumber}: account identifier is required.`);
    if (!row.transactionId) errors.push(`Row ${rowNumber}: transaction id is required.`);
    if (seen.has(row.transactionId)) duplicateTransactionIds.push(row.transactionId);
    seen.add(row.transactionId);
    if (!row.ticker) errors.push(`Row ${rowNumber}: ticker is required.`);
    if (!/^[A-Z0-9]{12}$/.test(row.isin)) errors.push(`Row ${rowNumber}: valid ISIN is required.`);
    if (!row.exchange) errors.push(`Row ${rowNumber}: exchange is required.`);
    if (!Number.isFinite(row.quantity)) errors.push(`Row ${rowNumber}: quantity is invalid.`);
    if (!Number.isFinite(row.price)) errors.push(`Row ${rowNumber}: price is invalid.`);
    if (!row.transactionDate || Number.isNaN(new Date(row.transactionDate).getTime())) errors.push(`Row ${rowNumber}: transaction date is invalid.`);
    if (!row.settlementDate || Number.isNaN(new Date(row.settlementDate).getTime())) errors.push(`Row ${rowNumber}: settlement date is invalid.`);
    if (!Number.isFinite(row.fees)) errors.push(`Row ${rowNumber}: fees are invalid.`);

    return row;
  });

  return { duplicateTransactionIds, errors, rows };
}

export function reconcilePortfolioPositions(
  botPositions: PortfolioSnapshotRow[],
  importedPositions: PortfolioSnapshotRow[],
  unresolvedTransactionIds: string[],
): ReconciliationRow[] {
  const tickers = Array.from(new Set([...botPositions.map((row) => row.ticker), ...importedPositions.map((row) => row.ticker)])).sort();

  return tickers.map((ticker) => {
    const bot = botPositions.find((row) => row.ticker === ticker);
    const imported = importedPositions.find((row) => row.ticker === ticker);
    const botQuantity = bot?.quantity ?? 0;
    const importedQuantity = imported?.quantity ?? 0;
    const botCostBasis = bot?.bookCost ?? 0;
    const importedCostBasis = imported?.bookCost ?? 0;

    return {
      botCostBasis,
      botQuantity,
      costBasisDifference: Number((importedCostBasis - botCostBasis).toFixed(2)),
      importedCostBasis,
      importedQuantity,
      quantityDifference: Number((importedQuantity - botQuantity).toFixed(4)),
      ticker,
      unresolvedTransactions: unresolvedTransactionIds,
    };
  });
}
