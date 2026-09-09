'use server';

import { parsePDFContacts } from '@/lib/import/pdf-parser';
import type { ParseResult } from '@/lib/import/csv-parser';

export async function parsePDFAction(formData: FormData): Promise<ParseResult> {
  const file = formData.get('file') as File;
  if (!file) {
    return { headers: [], rows: [], errors: ['No file provided'] };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return parsePDFContacts(buffer);
}
