'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import type { SponsorshipStatus } from '../schemas/sponsorship.schema';
import type { SponsorshipWithContact } from './get-sponsorships';

export interface SponsorshipPipelineColumn {
  status: SponsorshipStatus;
  label: string;
  color: string;
  sponsorships: SponsorshipWithContact[];
}

const STATUS_CONFIG: Record<SponsorshipStatus, { label: string; color: string }> = {
  prospect: { label: 'Prospect', color: 'blue' },
  pitched: { label: 'Pitched', color: 'violet' },
  confirmed: { label: 'Confirmed', color: 'amber' },
  active: { label: 'Active', color: 'emerald' },
  lapsed: { label: 'Lapsed', color: 'orange' },
  declined: { label: 'Declined', color: 'red' },
};

/**
 * Fetch sponsorships grouped by status for kanban view.
 */
export async function getSponsorPipeline(): Promise<SponsorshipPipelineColumn[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('sponsorships')
    .select(`
      *,
      contacts (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      sponsorship_tiers (
        id,
        name,
        amount,
        color
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sponsor pipeline:', error);
    throw new Error('Failed to fetch sponsor pipeline');
  }

  const sponsorships = (data as SponsorshipWithContact[]) || [];

  // Group by status
  const grouped: Record<SponsorshipStatus, SponsorshipWithContact[]> = {
    prospect: [],
    pitched: [],
    confirmed: [],
    active: [],
    lapsed: [],
    declined: [],
  };

  for (const s of sponsorships) {
    const status = s.status as SponsorshipStatus;
    if (grouped[status]) {
      grouped[status].push(s);
    }
  }

  // Build pipeline columns
  const statuses: SponsorshipStatus[] = [
    'prospect', 'pitched', 'confirmed', 'active', 'lapsed', 'declined',
  ];

  return statuses.map((status) => ({
    status,
    label: STATUS_CONFIG[status].label,
    color: STATUS_CONFIG[status].color,
    sponsorships: grouped[status],
  }));
}

/**
 * Get summary stats for the sponsorship pipeline.
 */
export async function getSponsorshipStats() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('sponsorships')
    .select('id, status, amount')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching sponsorship stats:', error);
    return {
      totalSponsors: 0,
      activeAmount: 0,
      confirmedCount: 0,
      activeCount: 0,
    };
  }

  const sponsorships = data || [];

  return {
    totalSponsors: sponsorships.length,
    activeAmount: sponsorships
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount || 0), 0),
    confirmedCount: sponsorships.filter((s) => s.status === 'confirmed').length,
    activeCount: sponsorships.filter((s) => s.status === 'active').length,
  };
}
