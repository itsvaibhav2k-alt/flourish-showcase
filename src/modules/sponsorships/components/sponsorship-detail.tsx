'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Pencil,
  Calendar,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BenefitChecklist } from './benefit-checklist';
import { SponsorForm } from './sponsor-form';
import type { SponsorshipDetail as SponsorshipDetailType } from '../queries/get-sponsorship';
import type { SponsorshipTier } from '../queries/get-tiers';

interface SponsorshipDetailProps {
  sponsorship: SponsorshipDetailType;
  tiers: SponsorshipTier[];
  contacts: { id: string; first_name: string; last_name: string; email: string | null }[];
}

const STATUS_STYLES: Record<string, string> = {
  prospect: 'bg-blue-50 text-blue-700',
  pitched: 'bg-violet-50 text-violet-700',
  confirmed: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  lapsed: 'bg-orange-50 text-orange-700',
  declined: 'bg-red-50 text-red-700',
};

/**
 * Detail panel with sponsor info, tier, amount, dates, benefit checklist, notes.
 */
export function SponsorshipDetail({ sponsorship, tiers, contacts }: SponsorshipDetailProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const contact = sponsorship.contacts;
  const tier = sponsorship.sponsorship_tiers;
  const benefits = sponsorship.sponsorship_benefits || [];
  const fullName = `${contact.first_name} ${contact.last_name}`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/sponsorships">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn('text-xs', STATUS_STYLES[sponsorship.status])}>
                {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
              </Badge>
              {tier && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={tier.color ? {
                    backgroundColor: `${tier.color}15`,
                    color: tier.color,
                  } : undefined}
                >
                  {tier.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Sponsorship</DialogTitle>
            </DialogHeader>
            <SponsorForm
              contacts={contacts}
              tiers={tiers}
              sponsorship={{
                id: sponsorship.id,
                contact_id: sponsorship.contact_id,
                tier_id: sponsorship.tier_id,
                status: sponsorship.status,
                amount: sponsorship.amount,
                season: sponsorship.season,
                start_date: sponsorship.start_date,
                end_date: sponsorship.end_date,
                renewal_date: sponsorship.renewal_date,
                payment_received: sponsorship.payment_received,
                notes: sponsorship.notes,
                next_follow_up: sponsorship.next_follow_up,
              }}
              onClose={() => setIsEditOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sponsorship Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sponsorship Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow icon={DollarSign} label="Amount">
                  {sponsorship.amount ? formatCurrency(sponsorship.amount) : 'Not set'}
                </DetailRow>
                <DetailRow icon={FileText} label="Season">
                  {sponsorship.season || 'Not set'}
                </DetailRow>
                <DetailRow icon={Calendar} label="Start Date">
                  {formatDate(sponsorship.start_date) || 'Not set'}
                </DetailRow>
                <DetailRow icon={Calendar} label="End Date">
                  {formatDate(sponsorship.end_date) || 'Not set'}
                </DetailRow>
                <DetailRow icon={Clock} label="Renewal Date">
                  {formatDate(sponsorship.renewal_date) || 'Not set'}
                </DetailRow>
                <DetailRow icon={Calendar} label="Next Follow-Up">
                  {formatDate(sponsorship.next_follow_up) || 'Not set'}
                </DetailRow>
                <DetailRow icon={CheckCircle2} label="Payment">
                  {sponsorship.payment_received ? (
                    <Badge className="bg-green-50 text-green-700 text-xs">Received</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Pending</Badge>
                  )}
                </DetailRow>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <BenefitChecklist
                benefits={benefits}
                sponsorshipId={sponsorship.id}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          {sponsorship.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {sponsorship.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sponsor Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-medium text-sm">
                  {contact.first_name[0]}{contact.last_name[0]}
                </div>
                <div>
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-sm font-medium text-neutral-900 hover:underline"
                  >
                    {fullName}
                  </Link>
                  {contact.email && (
                    <p className="text-xs text-neutral-500">{contact.email}</p>
                  )}
                  {contact.phone && (
                    <p className="text-xs text-neutral-500">{contact.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Info */}
          {tier && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  {tier.color && (
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                  )}
                  <span className="font-medium text-sm">{tier.name}</span>
                </div>
                <p className="text-sm text-neutral-500">
                  ${Number(tier.amount).toLocaleString()} tier
                </p>
                {tier.default_benefits && Array.isArray(tier.default_benefits) && tier.default_benefits.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tier.default_benefits.map((b, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {b}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-600">
              <p>
                <span className="text-neutral-400">Created:</span>{' '}
                {formatDate(sponsorship.created_at)}
              </p>
              <p>
                <span className="text-neutral-400">Updated:</span>{' '}
                {formatDate(sponsorship.updated_at)}
              </p>
              {sponsorship.last_contact_date && (
                <p>
                  <span className="text-neutral-400">Last Contact:</span>{' '}
                  {formatDate(sponsorship.last_contact_date)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof DollarSign;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-neutral-400">{label}</p>
        <div className="text-sm text-neutral-700">{children}</div>
      </div>
    </div>
  );
}
