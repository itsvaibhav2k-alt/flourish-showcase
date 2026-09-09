'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import type { SponsorshipStatus } from '../schemas/sponsorship.schema';

export interface SponsorshipBenefit {
  id: string;
  sponsorship_id: string;
  organization_id: string;
  benefit_name: string;
  description: string | null;
  delivered: boolean;
  delivered_at: string | null;
  delivered_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface SponsorshipDetail {
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
    default_benefits: string[];
  } | null;
  sponsorship_benefits: SponsorshipBenefit[];
}

/**
 * Fetch a single sponsorship with benefits, contact, and tier data.
 */
export async function getSponsorship(sponsorshipId: string): Promise<SponsorshipDetail | null> {
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
        color,
        default_benefits
      ),
      sponsorship_benefits (
        *
      )
    `)
    .eq('id', sponsorshipId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching sponsorship:', error);
    return null;
  }

  return data as SponsorshipDetail;
}
