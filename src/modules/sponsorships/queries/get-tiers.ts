'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';

export interface SponsorshipTier {
  id: string;
  organization_id: string;
  name: string;
  amount: number;
  sort_order: number;
  default_benefits: string[];
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active sponsorship tiers for the current organization,
 * ordered by sort_order.
 */
export async function getTiers(): Promise<SponsorshipTier[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('sponsorship_tiers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('amount', { ascending: true });

  if (error) {
    console.error('Error fetching sponsorship tiers:', error);
    throw new Error('Failed to fetch sponsorship tiers');
  }

  return (data as SponsorshipTier[]) || [];
}

/**
 * Fetch all tiers (including inactive) for tier management settings.
 */
export async function getAllTiers(): Promise<SponsorshipTier[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('sponsorship_tiers')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })
    .order('amount', { ascending: true });

  if (error) {
    console.error('Error fetching all sponsorship tiers:', error);
    throw new Error('Failed to fetch sponsorship tiers');
  }

  return (data as SponsorshipTier[]) || [];
}
