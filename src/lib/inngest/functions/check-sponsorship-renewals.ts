import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Weekly cron job to check for sponsorship renewals.
 * Finds active sponsorships with renewal_date within 30 days
 * and creates activity reminders.
 */
export const checkSponsorshipRenewals = inngest.createFunction(
  {
    id: 'check-sponsorship-renewals',
    name: 'Check Sponsorship Renewals',
  },
  { cron: '0 9 * * 1' }, // Every Monday at 9 AM
  async ({ step }) => {
    // Step 1: Find sponsorships approaching renewal
    const sponsorships = await step.run('find-renewals', async () => {
      const supabase = createAdminClient();

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('sponsorships')
        .select(`
          id,
          organization_id,
          contact_id,
          amount,
          season,
          renewal_date,
          contacts (
            id,
            first_name,
            last_name,
            email
          ),
          sponsorship_tiers (
            name
          )
        `)
        .eq('status', 'active')
        .not('renewal_date', 'is', null)
        .lte('renewal_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('renewal_date', new Date().toISOString().split('T')[0]);

      if (error) {
        throw new Error(`Failed to fetch sponsorships for renewal: ${error.message}`);
      }

      return data || [];
    });

    if (sponsorships.length === 0) {
      return {
        message: 'No sponsorship renewals found within 30 days',
        processed: 0,
      };
    }

    // Step 2: Create renewal reminders
    const remindersCreated = await step.run('create-reminders', async () => {
      const supabase = createAdminClient();
      let count = 0;

      for (const sponsorship of sponsorships) {
        const contact = sponsorship.contacts as {
          first_name: string;
          last_name: string;
          email: string | null;
        } | null;
        const tier = sponsorship.sponsorship_tiers as { name: string } | null;

        if (!contact) continue;

        const contactName = `${contact.first_name} ${contact.last_name}`;
        const tierName = tier?.name || 'Unknown tier';
        const renewalDate = new Date(sponsorship.renewal_date!).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        // Insert an activity record as a reminder
        const { error } = await supabase
          .from('activities')
          .insert({
            organization_id: sponsorship.organization_id,
            contact_id: sponsorship.contact_id,
            activity_type: 'note',
            description: `Sponsorship renewal reminder: ${contactName}'s ${tierName} sponsorship ($${sponsorship.amount}) is due for renewal on ${renewalDate}. Season: ${sponsorship.season || 'N/A'}.`,
            metadata: {
              source: 'sponsorship-renewal-check',
              sponsorship_id: sponsorship.id,
              renewal_date: sponsorship.renewal_date,
            },
          });

        if (error) {
          console.error(
            `Error creating renewal reminder for sponsorship ${sponsorship.id}:`,
            error,
          );
        } else {
          count++;
        }
      }

      return count;
    });

    return {
      message: 'Sponsorship renewal check completed',
      sponsorshipsFound: sponsorships.length,
      remindersCreated,
    };
  },
);
