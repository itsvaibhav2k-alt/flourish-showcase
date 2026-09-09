'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { createTier, updateTier, deleteTier } from '../actions/manage-tiers';
import type { SponsorshipTier } from '../queries/get-tiers';

interface TierManagerProps {
  tiers: SponsorshipTier[];
}

const TIER_COLORS = [
  '#CD7F32', // Bronze
  '#C0C0C0', // Silver
  '#FFD700', // Gold
  '#E5E4E2', // Platinum
  '#B9F2FF', // Diamond
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
];

/**
 * Settings UI for creating/editing sponsorship tiers.
 */
export function TierManager({ tiers }: TierManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Sponsorship Tiers</h3>
          <p className="text-sm text-neutral-500">
            Define tiers with amounts and default benefits for sponsors.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sponsorship Tier</DialogTitle>
            </DialogHeader>
            <TierForm
              onSubmit={async (data) => {
                startTransition(async () => {
                  const result = await createTier(data);
                  if (result.success) {
                    setIsCreateOpen(false);
                  }
                });
              }}
              isPending={isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tiers Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Default Benefits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                  No tiers created yet. Add your first sponsorship tier.
                </TableCell>
              </TableRow>
            ) : (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="text-neutral-500">{tier.sort_order}</TableCell>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>
                    ${Number(tier.amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    {tier.color && (
                      <div
                        className="h-5 w-5 rounded-full border border-neutral-200"
                        style={{ backgroundColor: tier.color }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(tier.default_benefits) && tier.default_benefits.map((b, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Dialog
                        open={editingTier?.id === tier.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingTier(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingTier(tier)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Tier: {tier.name}</DialogTitle>
                          </DialogHeader>
                          <TierForm
                            tier={tier}
                            onSubmit={async (data) => {
                              startTransition(async () => {
                                const result = await updateTier(tier.id, data);
                                if (result.success) {
                                  setEditingTier(null);
                                }
                              });
                            }}
                            isPending={isPending}
                            onCancel={() => setEditingTier(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => {
                          startTransition(async () => {
                            await deleteTier(tier.id);
                          });
                        }}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface TierFormData {
  name: string;
  amount: number;
  sort_order: number;
  default_benefits: string[];
  color?: string;
  is_active: boolean;
}

interface TierFormProps {
  tier?: SponsorshipTier;
  onSubmit: (data: TierFormData) => Promise<void>;
  isPending: boolean;
  onCancel: () => void;
}

function TierForm({ tier, onSubmit, isPending, onCancel }: TierFormProps) {
  const [name, setName] = useState(tier?.name || '');
  const [amount, setAmount] = useState(tier?.amount?.toString() || '');
  const [sortOrder, setSortOrder] = useState(tier?.sort_order?.toString() || '0');
  const [color, setColor] = useState(tier?.color || '');
  const [benefits, setBenefits] = useState<string[]>(
    Array.isArray(tier?.default_benefits) ? tier.default_benefits : [],
  );
  const [newBenefit, setNewBenefit] = useState('');

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      amount: parseFloat(amount) || 0,
      sort_order: parseInt(sortOrder) || 0,
      default_benefits: benefits,
      color: color || undefined,
      is_active: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Tier Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Gold Sponsor"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Sort Order</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Color</Label>
        <div className="flex items-center gap-2">
          {TIER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                color === c ? 'border-neutral-900 scale-110' : 'border-neutral-200'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#hex"
            className="h-8 w-24 text-xs"
          />
        </div>
      </div>

      {/* Default Benefits */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Default Benefits</Label>
        <div className="space-y-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {benefit}
                <button type="button" onClick={() => removeBenefit(index)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              placeholder="Add a benefit..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBenefit();
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addBenefit} className="h-8">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name || !amount}>
          {isPending ? 'Saving...' : tier ? 'Update Tier' : 'Create Tier'}
        </Button>
      </div>
    </form>
  );
}
