'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import { sponsorshipSchema, type SponsorshipInput } from '../schemas/sponsorship.schema';

export type CreateSponsorshipResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Create a new sponsorship with contact link.
 * Auto-populates benefits from tier's default_benefits when a tier is selected.
 */
export async function createSponsorship(
  input: SponsorshipInput,
): Promise<CreateSponsorshipResult> {
  try {
    const validated = sponsorshipSchema.parse(input);
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    // Verify contact belongs to this org
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validated.contact_id)
      .eq('organization_id', organizationId)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Insert sponsorship
    const { data: sponsorship, error: insertError } = await supabase
      .from('sponsorships')
      .insert({
        organization_id: organizationId,
        contact_id: validated.contact_id,
        tier_id: validated.tier_id ?? null,
        status: validated.status,
        amount: validated.amount ?? null,
        season: validated.season ?? null,
        start_date: validated.start_date ?? null,
        end_date: validated.end_date ?? null,
        renewal_date: validated.renewal_date ?? null,
        payment_received: validated.payment_received,
        notes: validated.notes ?? null,
        assigned_to: validated.assigned_to ?? null,
        next_follow_up: validated.next_follow_up ?? null,
      })
      .select('id')
      .single();

    if (insertError || !sponsorship) {
      console.error('Error creating sponsorship:', insertError);
      return { success: false, error: insertError?.message || 'Failed to create sponsorship' };
    }

    // Auto-populate benefits from tier's default_benefits
    if (validated.tier_id) {
      const { data: tier } = await supabase
        .from('sponsorship_tiers')
        .select('default_benefits')
        .eq('id', validated.tier_id)
        .single();

      if (tier?.default_benefits && Array.isArray(tier.default_benefits)) {
        const benefits = (tier.default_benefits as string[]).map((benefitName) => ({
          sponsorship_id: sponsorship.id,
          organization_id: organizationId,
          benefit_name: benefitName,
          delivered: false,
        }));

        if (benefits.length > 0) {
          const { error: benefitsError } = await supabase
            .from('sponsorship_benefits')
            .insert(benefits);

          if (benefitsError) {
            console.error('Error creating default benefits:', benefitsError);
          }
        }
      }
    }

    revalidatePath('/sponsorships');
    revalidatePath(`/contacts/${validated.contact_id}`);

    return { success: true, id: sponsorship.id };
  } catch (error) {
    console.error('Error in createSponsorship:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}
