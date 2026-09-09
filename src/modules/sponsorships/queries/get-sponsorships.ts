'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import type { SponsorshipStatus } from '../schemas/sponsorship.schema';

export interface SponsorshipWithContact {
  id: string;
  organization_id: string;
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
  assigned_to: string | null;
  last_contact_date: string | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  sponsorship_tiers: {
    id: string;
    name: string;
    amount: number;
    color: string | null;
  } | null;
}

interface GetSponsorshipsOptions {
  status?: SponsorshipStatus;
  tier_id?: string;
}

/**
 * Fetch sponsorships with optional filters, including contact and tier data.
 */
export async function getSponsorships(
  options: GetSponsorshipsOptions = {},
): Promise<SponsorshipWithContact[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  let query = supabase
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

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.tier_id) {
    query = query.eq('tier_id', options.tier_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sponsorships:', error);
    throw new Error('Failed to fetch sponsorships');
  }

  return (data as SponsorshipWithContact[]) || [];
}
