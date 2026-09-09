'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization';

type ActionResult = {
  success: boolean;
  error?: string;
};

interface TaxReceiptSettingsInput {
  ein: string | null;
  taxExemptStatus: string | null;
  taxReceiptFooter: string | null;
}

/**
 * Update organization tax receipt settings (EIN, tax-exempt status, receipt footer).
 */
export async function updateTaxReceiptSettings(
  input: TaxReceiptSettingsInput,
): Promise<ActionResult> {
  try {
    const role = await getCurrentUserRole();
    if (role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can update tax receipt settings.',
      };
    }

    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('organizations')
      .update({
        ein: input.ein,
        tax_exempt_status: input.taxExemptStatus,
        tax_receipt_footer: input.taxReceiptFooter,
      })
      .eq('id', organizationId);

    if (error) {
      console.error('Error updating tax receipt settings:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    console.error('Error in updateTaxReceiptSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}
