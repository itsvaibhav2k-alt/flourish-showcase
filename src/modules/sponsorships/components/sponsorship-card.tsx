'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, GripVertical, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SponsorshipWithContact } from '../queries/get-sponsorships';

interface SponsorshipCardProps {
  sponsorship: SponsorshipWithContact;
  stageBorderColor?: string;
  benefitStats?: { total: number; delivered: number };
}

/**
 * Sortable card for the sponsorship kanban board.
 * Shows: sponsor name, tier badge, amount, season, next_follow_up, benefit progress.
 */
export function SponsorshipCard({
  sponsorship,
  stageBorderColor,
  benefitStats,
}: SponsorshipCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sponsorship.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const contact = sponsorship.contacts;
  const tier = sponsorship.sponsorship_tiers;
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name[0] || ''}${contact.last_name[0] || ''}`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Link href={`/sponsorships/${sponsorship.id}`}>
        <div
          className={cn(
            'bg-white border border-neutral-200 rounded-lg p-3 shadow-sm',
            'border-l-[3px]',
            stageBorderColor || 'border-l-neutral-300',
            'hover:shadow-md transition-all duration-200',
            'cursor-pointer group',
            isDragging && 'opacity-50 shadow-lg',
          )}
        >
          <div className="space-y-2.5">
            {/* Drag Handle & Contact Info */}
            <div className="flex items-start gap-2">
              <div
                {...attributes}
                {...listeners}
                className="mt-1.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                onClick={(e) => e.preventDefault()}
              >
                <GripVertical className="h-4 w-4 text-neutral-300 hover:text-neutral-500" />
              </div>
              <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-medium text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm truncate leading-tight">
                  {fullName}
                </p>
                {contact.email && (
                  <p className="text-xs text-neutral-400 truncate">
                    {contact.email}
                  </p>
                )}
              </div>
            </div>

            {/* Amount & Tier */}
            <div className="flex items-center justify-between gap-2">
              {sponsorship.amount ? (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-700">
                    {formatCurrency(sponsorship.amount)}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-neutral-400">No amount</span>
              )}
              {tier && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium h-5 px-1.5"
                  style={tier.color ? {
                    backgroundColor: `${tier.color}15`,
                    color: tier.color,
                  } : undefined}
                >
                  {tier.name}
                </Badge>
              )}
            </div>

            {/* Season */}
            {sponsorship.season && (
              <div className="text-[11px] text-neutral-500">
                Season: {sponsorship.season}
              </div>
            )}

            {/* Benefit Progress */}
            {benefitStats && benefitStats.total > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  {benefitStats.delivered}/{benefitStats.total} benefits delivered
                </span>
                <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(benefitStats.delivered / benefitStats.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Next Follow-up & Payment */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
              {sponsorship.next_follow_up && (
                <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(sponsorship.next_follow_up).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {sponsorship.payment_received && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 bg-green-50 text-green-700"
                >
                  Paid
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Overlay card shown while dragging.
 */
export function SponsorshipCardOverlay({
  sponsorship,
  stageBorderColor,
}: {
  sponsorship: SponsorshipWithContact;
  stageBorderColor?: string;
}) {
  const contact = sponsorship.contacts;
  const tier = sponsorship.sponsorship_tiers;
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name[0] || ''}${contact.last_name[0] || ''}`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={cn(
        'bg-white border border-neutral-200 rounded-lg p-3 shadow-lg w-[280px]',
        'border-l-[3px]',
        stageBorderColor || 'border-l-neutral-300',
      )}
    >
      <div className="space-y-2.5">
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-medium text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-neutral-900 text-sm truncate leading-tight">
              {fullName}
            </p>
            {contact.email && (
              <p className="text-xs text-neutral-400 truncate">
                {contact.email}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          {sponsorship.amount && (
            <span className="text-xs font-medium text-neutral-700">
              {formatCurrency(sponsorship.amount)}
            </span>
          )}
          {tier && (
            <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5">
              {tier.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
