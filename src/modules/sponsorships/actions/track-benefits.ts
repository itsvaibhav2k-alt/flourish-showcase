'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';

export type TrackBenefitResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Mark a benefit as delivered.
 */
export async function markBenefitDelivered(benefitId: string): Promise<TrackBenefitResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    // Get user for delivered_by
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('sponsorship_benefits')
      .update({
        delivered: true,
        delivered_at: new Date().toISOString(),
        delivered_by: user?.id ?? null,
      })
      .eq('id', benefitId)
      .eq('organization_id', organizationId)
      .select('id, sponsorship_id')
      .single();

    if (error) {
      console.error('Error marking benefit delivered:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/sponsorships/${data.sponsorship_id}`);
    revalidatePath('/sponsorships');

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in markBenefitDelivered:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

/**
 * Unmark a benefit as delivered (undo).
 */
export async function unmarkBenefitDelivered(benefitId: string): Promise<TrackBenefitResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    const { data, error } = await supabase
      .from('sponsorship_benefits')
      .update({
        delivered: false,
        delivered_at: null,
        delivered_by: null,
      })
      .eq('id', benefitId)
      .eq('organization_id', organizationId)
      .select('id, sponsorship_id')
      .single();

    if (error) {
      console.error('Error unmarking benefit:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/sponsorships/${data.sponsorship_id}`);
    revalidatePath('/sponsorships');

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in unmarkBenefitDelivered:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

/**
 * Add a new benefit to a sponsorship.
 */
export async function addBenefit(
  sponsorshipId: string,
  benefitName: string,
  description?: string,
): Promise<TrackBenefitResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    const { data, error } = await supabase
      .from('sponsorship_benefits')
      .insert({
        sponsorship_id: sponsorshipId,
        organization_id: organizationId,
        benefit_name: benefitName,
        description: description ?? null,
        delivered: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding benefit:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/sponsorships/${sponsorshipId}`);

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in addBenefit:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}
