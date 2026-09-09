'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import { sponsorshipTierSchema, type SponsorshipTierInput } from '../schemas/sponsorship.schema';

export type TierResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Create a new sponsorship tier.
 */
export async function createTier(input: SponsorshipTierInput): Promise<TierResult> {
  try {
    const validated = sponsorshipTierSchema.parse(input);
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    const { data, error } = await supabase
      .from('sponsorship_tiers')
      .insert({
        organization_id: organizationId,
        name: validated.name,
        amount: validated.amount,
        sort_order: validated.sort_order,
        default_benefits: validated.default_benefits,
        color: validated.color ?? null,
        is_active: validated.is_active,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating tier:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/sponsorships');
    revalidatePath('/sponsorships');

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in createTier:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

/**
 * Update an existing sponsorship tier.
 */
export async function updateTier(
  tierId: string,
  input: Partial<SponsorshipTierInput>,
): Promise<TierResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
    if (input.default_benefits !== undefined) updateData.default_benefits = input.default_benefits;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await supabase
      .from('sponsorship_tiers')
      .update(updateData)
      .eq('id', tierId)
      .eq('organization_id', organizationId)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating tier:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/sponsorships');
    revalidatePath('/sponsorships');

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in updateTier:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

/**
 * Soft-delete a tier by setting is_active=false.
 */
export async function deleteTier(tierId: string): Promise<TierResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    const { data, error } = await supabase
      .from('sponsorship_tiers')
      .update({ is_active: false })
      .eq('id', tierId)
      .eq('organization_id', organizationId)
      .select('id')
      .single();

    if (error) {
      console.error('Error deleting tier:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/sponsorships');
    revalidatePath('/sponsorships');

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in deleteTier:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}
