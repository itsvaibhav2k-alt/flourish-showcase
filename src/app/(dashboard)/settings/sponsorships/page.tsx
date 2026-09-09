export const dynamic = 'force-dynamic';
import { getAllTiers } from '@/modules/sponsorships';
import { TierManager } from '@/modules/sponsorships/components/tier-manager';
import { PageHeader } from '@/components/layouts/page-header';

/**
 * Tier management settings page.
 */
export default async function SponsorshipSettingsPage() {
  let tiers = [];

  try {
    tiers = await getAllTiers();
  } catch (error) {
    console.error('Error fetching tiers:', error);
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-[1000px] mx-auto space-y-6">
        <PageHeader
          title="Sponsorship Tiers"
          description="Configure sponsorship tiers, amounts, and default benefits"
        />
        <TierManager tiers={tiers} />
      </div>
    </div>
  );
}
