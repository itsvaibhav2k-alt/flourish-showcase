'use server';

import { inngest } from '@/lib/inngest/client';
import { getCurrentOrganizationId } from '@/lib/auth/organization';

export type TriggerBatchReceiptsResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server action to trigger batch tax receipt generation via Inngest
 */
export async function triggerBatchReceipts(
  year: number,
): Promise<TriggerBatchReceiptsResult> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    await inngest.send({
      name: 'receipts/batch.generate',
      data: {
        organizationId,
        year,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error triggering batch receipts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger batch generation',
    };
  }
}
