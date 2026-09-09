'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createSponsorship } from '../actions/create-sponsorship';
import { updateSponsorship } from '../actions/update-sponsorship';
import type { SponsorshipTier } from '../queries/get-tiers';
import type { SponsorshipStatus } from '../schemas/sponsorship.schema';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface SponsorFormProps {
  contacts: Contact[];
  tiers: SponsorshipTier[];
  sponsorship?: {
    id: string;
    contact_id: string;
    tier_id: string | null;
    status: SponsorshipStatus;
    amount: number | null;
    season: string | null;
    start_date: string | null;
    end_date: string | null;
    renewal_date: string | null;
    payment_received: boolean;
    notes: string | null;
    next_follow_up: string | null;
  };
  onClose?: () => void;
}

const STATUSES: { value: SponsorshipStatus; label: string }[] = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'pitched', label: 'Pitched' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'lapsed', label: 'Lapsed' },
  { value: 'declined', label: 'Declined' },
];

/**
 * Form for creating or editing a sponsorship.
 */
export function SponsorForm({ contacts, tiers, sponsorship, onClose }: SponsorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!sponsorship;

  const [contactId, setContactId] = useState(sponsorship?.contact_id || '');
  const [tierId, setTierId] = useState(sponsorship?.tier_id || '');
  const [status, setStatus] = useState<SponsorshipStatus>(sponsorship?.status || 'prospect');
  const [amount, setAmount] = useState(sponsorship?.amount?.toString() || '');
  const [season, setSeason] = useState(sponsorship?.season || '');
  const [startDate, setStartDate] = useState(sponsorship?.start_date || '');
  const [endDate, setEndDate] = useState(sponsorship?.end_date || '');
  const [renewalDate, setRenewalDate] = useState(sponsorship?.renewal_date || '');
  const [paymentReceived, setPaymentReceived] = useState(sponsorship?.payment_received || false);
  const [notes, setNotes] = useState(sponsorship?.notes || '');
  const [nextFollowUp, setNextFollowUp] = useState(
    sponsorship?.next_follow_up ? sponsorship.next_follow_up.split('T')[0] : '',
  );

  // When tier changes, auto-fill amount
  const handleTierChange = (newTierId: string) => {
    setTierId(newTierId);
    const tier = tiers.find((t) => t.id === newTierId);
    if (tier && !amount) {
      setAmount(tier.amount.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEditing && !contactId) {
      setError('Please select a contact');
      return;
    }

    startTransition(async () => {
      const data = {
        contact_id: contactId,
        tier_id: tierId || null,
        status,
        amount: amount ? parseFloat(amount) : null,
        season: season || null,
        start_date: startDate || null,
        end_date: endDate || null,
        renewal_date: renewalDate || null,
        payment_received: paymentReceived,
        notes: notes || null,
        next_follow_up: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
      };

      let result;
      if (isEditing) {
        result = await updateSponsorship(sponsorship.id, data);
      } else {
        result = await createSponsorship(data);
      }

      if (result.success) {
        router.refresh();
        if (onClose) {
          onClose();
        } else {
          router.push(`/sponsorships/${result.id}`);
        }
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Contact Selector */}
      {!isEditing && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Contact</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a contact" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                  {contact.email && ` (${contact.email})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tier & Status Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Tier</Label>
          <Select value={tierId} onValueChange={handleTierChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              {tiers.map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>
                  {tier.name} (${tier.amount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as SponsorshipStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amount & Season */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Season</Label>
          <Input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="e.g., 2025-2026"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Renewal Date</Label>
          <Input
            type="date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
          />
        </div>
      </div>

      {/* Next Follow-Up */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Next Follow-Up</Label>
        <Input
          type="date"
          value={nextFollowUp}
          onChange={(e) => setNextFollowUp(e.target.value)}
        />
      </div>

      {/* Payment & Notes */}
      <div className="flex items-center gap-3">
        <Switch
          checked={paymentReceived}
          onCheckedChange={setPaymentReceived}
        />
        <Label className="text-sm font-medium">Payment Received</Label>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Update Sponsorship' : 'Create Sponsorship'}
        </Button>
      </div>
    </form>
  );
}
