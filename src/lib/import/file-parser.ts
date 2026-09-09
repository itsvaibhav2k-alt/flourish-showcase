import { parseCSV, type ParseResult } from './csv-parser';
import { parseXLSX } from './xlsx-parser';
import { parseVCF } from './vcf-parser';

export type FileFormat = 'csv' | 'xlsx' | 'vcf' | 'pdf' | 'unknown';

export type FileParseResult = ParseResult & {
  format: FileFormat;
  sheetNames?: string[];
};

const SUPPORTED_EXTENSIONS: Record<string, FileFormat> = {
  '.csv': 'csv',
  '.xlsx': 'xlsx',
  '.xls': 'xlsx',
  '.vcf': 'vcf',
  '.vcard': 'vcf',
  '.pdf': 'pdf',
};

/**
 * Detect file format from extension
 */
export function detectFileFormat(file: File): FileFormat {
  const name = file.name.toLowerCase();
  for (const [ext, format] of Object.entries(SUPPORTED_EXTENSIONS)) {
    if (name.endsWith(ext)) return format;
  }
  return 'unknown';
}

/**
 * Get list of supported file extensions for input accept attribute
 */
export function getSupportedExtensions(includeVCF = true): string {
  const exts = ['.csv', '.xlsx', '.xls', '.pdf'];
  if (includeVCF) exts.push('.vcf', '.vcard');
  return exts.join(',');
}

/**
 * Check if a file has a supported extension
 */
export function isSupportedFile(file: File): boolean {
  return detectFileFormat(file) !== 'unknown';
}

/**
 * Parse any supported file format. Routes to the appropriate parser.
 * For PDF files, throws an error — use the server action parsePDFAction instead.
 */
export async function parseFile(
  file: File,
  options?: { sheetIndex?: number },
): Promise<FileParseResult> {
  const format = detectFileFormat(file);

  switch (format) {
    case 'csv': {
      const result = await parseCSV(file);
      return { ...result, format };
    }
    case 'xlsx': {
      const result = await parseXLSX(file, options?.sheetIndex);
      return { ...result, format };
    }
    case 'vcf': {
      const result = await parseVCF(file);
      return { ...result, format };
    }
    case 'pdf':
      throw new Error(
        'PDF files must be parsed server-side. Use the parsePDFAction server action instead.',
      );
    default:
      return {
        headers: [],
        rows: [],
        errors: [`Unsupported file format: ${file.name}. Supported: CSV, Excel (.xlsx/.xls), vCard (.vcf), PDF`],
        format: 'unknown',
      };
  }
}
