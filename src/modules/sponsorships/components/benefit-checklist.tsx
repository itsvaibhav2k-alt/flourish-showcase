'use client';

import { useState, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markBenefitDelivered, unmarkBenefitDelivered, addBenefit } from '../actions/track-benefits';
import type { SponsorshipBenefit } from '../queries/get-sponsorship';

interface BenefitChecklistProps {
  benefits: SponsorshipBenefit[];
  sponsorshipId: string;
}

/**
 * Checkbox list of benefits with delivery tracking.
 * Each item: checkbox, benefit name, delivered_at date if delivered.
 */
export function BenefitChecklist({ benefits, sponsorshipId }: BenefitChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [newBenefitName, setNewBenefitName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const deliveredCount = benefits.filter((b) => b.delivered).length;
  const totalCount = benefits.length;

  const handleToggle = (benefit: SponsorshipBenefit) => {
    startTransition(async () => {
      if (benefit.delivered) {
        await unmarkBenefitDelivered(benefit.id);
      } else {
        await markBenefitDelivered(benefit.id);
      }
    });
  };

  const handleAddBenefit = () => {
    if (!newBenefitName.trim()) return;
    startTransition(async () => {
      await addBenefit(sponsorshipId, newBenefitName.trim());
      setNewBenefitName('');
      setShowAddForm(false);
    });
  };

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">
            {deliveredCount}/{totalCount} benefits delivered
          </span>
          <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (deliveredCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Benefit Items */}
      <div className="space-y-1">
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors',
              isPending && 'opacity-50',
            )}
          >
            <Checkbox
              checked={benefit.delivered}
              onCheckedChange={() => handleToggle(benefit)}
              disabled={isPending}
              className="h-4 w-4"
            />
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'text-sm',
                  benefit.delivered ? 'text-neutral-400 line-through' : 'text-neutral-700',
                )}
              >
                {benefit.benefit_name}
              </span>
              {benefit.description && (
                <p className="text-xs text-neutral-400 truncate">{benefit.description}</p>
              )}
            </div>
            {benefit.delivered && benefit.delivered_at && (
              <span className="text-[11px] text-neutral-400 flex-shrink-0">
                {new Date(benefit.delivered_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        ))}

        {totalCount === 0 && (
          <p className="text-sm text-neutral-400 py-2">No benefits tracked yet.</p>
        )}
      </div>

      {/* Add Benefit */}
      {showAddForm ? (
        <div className="flex items-center gap-2">
          <Input
            value={newBenefitName}
            onChange={(e) => setNewBenefitName(e.target.value)}
            placeholder="Benefit name..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddBenefit();
              if (e.key === 'Escape') setShowAddForm(false);
            }}
            autoFocus
          />
          <Button
            size="sm"
            className="h-8"
            onClick={handleAddBenefit}
            disabled={isPending || !newBenefitName.trim()}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-500 hover:text-neutral-700 h-8"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add benefit
        </Button>
      )}
    </div>
  );
}
