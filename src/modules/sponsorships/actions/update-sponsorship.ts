'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import {
  updateSponsorshipStatusSchema,
  type UpdateSponsorshipStatusInput,
  type SponsorshipInput,
} from '../schemas/sponsorship.schema';

export type UpdateSponsorshipResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Update sponsorship status (used for drag-drop stage changes in kanban).
 */
export async function updateSponsorshipStatus(
  input: UpdateSponsorshipStatusInput,
): Promise<UpdateSponsorshipResult> {
  try {
    const validated = updateSponsorshipStatusSchema.parse(input);
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    const updateData: Record<string, unknown> = {
      status: validated.new_status,
    };

    if (validated.notes) {
      const { data: existing } = await supabase
        .from('sponsorships')
        .select('notes')
        .eq('id', validated.sponsorship_id)
        .eq('organization_id', organizationId)
        .single();

      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] Status changed to ${validated.new_status}: ${validated.notes}`;
      updateData.notes = existing?.notes
        ? `${existing.notes}\n\n${newNote}`
        : newNote;
    }

    const { data, error } = await supabase
      .from('sponsorships')
      .update(updateData)
      .eq('id', validated.sponsorship_id)
      .eq('organization_id', organizationId)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating sponsorship status:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/sponsorships');
    revalidatePath(`/sponsorships/${validated.sponsorship_id}`);

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in updateSponsorshipStatus:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

/**
 * Update sponsorship details (amount, dates, tier, etc.).
 */
export async function updateSponsorship(
  sponsorshipId: string,
  input: Partial<SponsorshipInput>,
): Promise<UpdateSponsorshipResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { success: false, error: 'Organization not found' };
    }

    const updateData: Record<string, unknown> = {};
    if (input.tier_id !== undefined) updateData.tier_id = input.tier_id;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.season !== undefined) updateData.season = input.season;
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.renewal_date !== undefined) updateData.renewal_date = input.renewal_date;
    if (input.payment_received !== undefined) updateData.payment_received = input.payment_received;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.assigned_to !== undefined) updateData.assigned_to = input.assigned_to;
    if (input.next_follow_up !== undefined) updateData.next_follow_up = input.next_follow_up;

    const { data, error } = await supabase
      .from('sponsorships')
      .update(updateData)
      .eq('id', sponsorshipId)
      .eq('organization_id', organizationId)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating sponsorship:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/sponsorships');
    revalidatePath(`/sponsorships/${sponsorshipId}`);

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in updateSponsorship:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}
