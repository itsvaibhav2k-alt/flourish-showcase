'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateTaxReceipt } from '@/modules/donors/actions/generate-tax-receipt';
import { FileText, Loader2 } from 'lucide-react';

interface TaxReceiptButtonProps {
  contactId: string;
  availableYears: number[];
}

export function TaxReceiptButton({ contactId, availableYears }: TaxReceiptButtonProps) {
  const currentYear = new Date().getFullYear();
  const defaultYear = availableYears.includes(currentYear - 1)
    ? currentYear - 1
    : availableYears[0];
  const [selectedYear, setSelectedYear] = React.useState(String(defaultYear));
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (availableYears.length === 0) return null;

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateTaxReceipt(contactId, Number(selectedYear));
      if (result.success) {
        // Convert number array back to Uint8Array and trigger download
        const bytes = new Uint8Array(result.pdf);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to generate receipt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-[100px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        Tax Receipt
      </Button>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
