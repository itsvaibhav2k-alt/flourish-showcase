import type { ParseResult } from './csv-parser';

/**
 * Parse an XLSX file and return headers, rows, sheet names, and errors.
 * Lazy-loads the xlsx library to keep bundle size small.
 *
 * @param file - The XLSX file to parse
 * @param sheetIndex - The sheet index to parse (defaults to 0)
 * @returns Parsed data with headers, rows, errors, and sheet names
 */
export async function parseXLSX(
  file: File,
  sheetIndex?: number,
): Promise<ParseResult & { sheetNames: string[] }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let XLSX: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    XLSX = await (Function('return import("xlsx")')() as Promise<any>);
    if (XLSX.default) XLSX = XLSX.default;
  } catch {
    return {
      headers: [],
      rows: [],
      errors: ['Excel file support requires the "xlsx" package. Please run: npm install xlsx'],
      sheetNames: [],
    };
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetNames = workbook.SheetNames;
  const selectedIndex = sheetIndex ?? 0;

  if (selectedIndex < 0 || selectedIndex >= sheetNames.length) {
    return {
      headers: [],
      rows: [],
      errors: [`Sheet index ${selectedIndex} is out of range. Available sheets: ${sheetNames.join(', ')}`],
      sheetNames,
    };
  }

  const sheet = workbook.Sheets[sheetNames[selectedIndex]];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  if (rawData.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: ['Sheet is empty'],
      sheetNames,
    };
  }

  // First row = headers, normalized to trimmed lowercase
  const headers = (rawData[0] || []).map((h: unknown) =>
    String(h).trim().toLowerCase(),
  );

  // Remaining rows = data
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const rawRow = rawData[i] as unknown[];
    if (!rawRow || rawRow.length === 0) continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const value = rawRow[j];
      row[headers[j]] = value != null ? String(value).trim() : '';
    }

    rows.push(row);
  }

  // Filter empty rows where all values are blank
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((v) => v !== ''),
  );

  return {
    headers,
    rows: filteredRows,
    errors: [],
    sheetNames,
  };
}
