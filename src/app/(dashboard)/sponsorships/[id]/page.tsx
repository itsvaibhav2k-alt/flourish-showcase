export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { getSponsorship, getTiers } from '@/modules/sponsorships';
import { SponsorshipDetail } from '@/modules/sponsorships/components/sponsorship-detail';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';

interface SponsorshipDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorshipDetailPage({
  params,
}: SponsorshipDetailPageProps) {
  const { id } = await params;

  const [sponsorship, tiers] = await Promise.all([
    getSponsorship(id),
    getTiers(),
  ]);

  if (!sponsorship) {
    notFound();
  }

  // Fetch contacts for the edit form
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId();

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email')
    .eq('organization_id', organizationId!)
    .order('first_name', { ascending: true })
    .limit(200);

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-[1200px] mx-auto">
        <SponsorshipDetail
          sponsorship={sponsorship}
          tiers={tiers}
          contacts={contacts || []}
        />
      </div>
    </div>
  );
}
