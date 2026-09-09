'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { updateTaxReceiptSettings } from '../actions/update-tax-receipt-settings';

interface TaxReceiptSettingsProps {
  ein: string | null;
  taxExemptStatus: string | null;
  taxReceiptFooter: string | null;
}

export function TaxReceiptSettings({
  ein: initialEin,
  taxExemptStatus: initialStatus,
  taxReceiptFooter: initialFooter,
}: TaxReceiptSettingsProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [ein, setEin] = React.useState(initialEin || '');
  const [taxExemptStatus, setTaxExemptStatus] = React.useState(initialStatus || '');
  const [taxReceiptFooter, setTaxReceiptFooter] = React.useState(initialFooter || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateTaxReceiptSettings({
        ein: ein || null,
        taxExemptStatus: taxExemptStatus || null,
        taxReceiptFooter: taxReceiptFooter || null,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to update settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="px-6 py-5">
        <h3 className="text-sm font-semibold text-neutral-900">Tax Receipt Settings</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Configure your organization&apos;s tax information for IRS-compliant donation receipts.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 pb-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">Tax receipt settings saved!</p>
            </div>
          )}

          <div className="flex items-start gap-8">
            <div className="w-48 flex-shrink-0 pt-2">
              <Label className="text-sm font-medium text-neutral-700">EIN</Label>
              <p className="text-xs text-neutral-400 mt-0.5">Federal Tax ID Number</p>
            </div>
            <div className="flex-1 min-w-0">
              <Input
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                placeholder="XX-XXXXXXX"
                className="max-w-xs"
              />
            </div>
          </div>

          <div className="flex items-start gap-8">
            <div className="w-48 flex-shrink-0 pt-2">
              <Label className="text-sm font-medium text-neutral-700">Tax-Exempt Status</Label>
              <p className="text-xs text-neutral-400 mt-0.5">IRS classification</p>
            </div>
            <div className="flex-1 min-w-0">
              <Input
                value={taxExemptStatus}
                onChange={(e) => setTaxExemptStatus(e.target.value)}
                placeholder="501(c)(3)"
                className="max-w-xs"
              />
            </div>
          </div>

          <div className="flex items-start gap-8">
            <div className="w-48 flex-shrink-0 pt-2">
              <Label className="text-sm font-medium text-neutral-700">Receipt Footer</Label>
              <p className="text-xs text-neutral-400 mt-0.5">Custom text on receipts</p>
            </div>
            <div className="flex-1 min-w-0">
              <Textarea
                value={taxReceiptFooter}
                onChange={(e) => setTaxReceiptFooter(e.target.value)}
                placeholder="Optional custom text to include at the bottom of tax receipts..."
                rows={3}
                className="max-w-md"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Required for generating IRS-compliant donation receipts.
          </p>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
