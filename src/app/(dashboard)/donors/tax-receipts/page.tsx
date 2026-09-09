'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layouts/page-header';
import { triggerBatchReceipts } from '@/modules/donors/actions/trigger-batch-receipts';
import { FileText, Loader2, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TaxReceiptsPage() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = React.useState(String(currentYear - 1));
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGenerateAll = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await triggerBatchReceipts(Number(selectedYear));
      if (res.success) {
        setResult({
          type: 'success',
          message: `Batch tax receipt generation has been started for ${selectedYear}. Receipts will be emailed to all donors with valid email addresses.`,
        });
      } else {
        setResult({ type: 'error', message: res.error });
      }
    } catch {
      setResult({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        <Link
          href="/donors"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Donors
        </Link>

        <PageHeader
          title="Tax Receipts"
          description="Generate and email IRS-compliant donation receipts to your donors."
        />

        {/* Status Messages */}
        {result && (
          <div
            className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
              result.type === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {result.type === 'success' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className={`text-sm ${result.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>
          </div>
        )}

        <Card className="shadow-card border-neutral-200/60 bg-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  Batch Generate Tax Receipts
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Generate IRS-compliant donation receipts for all donors who gave during the
                  selected year. Each donor will receive an email with their personalized receipt
                  PDF attached.
                </p>
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Tax Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleGenerateAll} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate All Tax Receipts
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Before you begin</h4>
              <ul className="text-sm text-neutral-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-0.5">1.</span>
                  <span>
                    Ensure your organization&apos;s EIN and tax-exempt status are configured in{' '}
                    <Link href="/settings?tab=organization" className="text-primary-600 hover:underline">
                      Settings
                    </Link>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-0.5">2.</span>
                  <span>
                    Receipts will only be emailed to donors with valid email addresses on file.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-0.5">3.</span>
                  <span>
                    Each receipt includes an itemized list of donations and IRS-required language.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-0.5">4.</span>
                  <span>
                    You can also generate individual receipts from each donor&apos;s detail page.
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
