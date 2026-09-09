import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { TaxReceiptDocument } from '@/modules/donors/templates/tax-receipt-document';
import type { TaxReceiptProps } from '@/modules/donors/templates/tax-receipt-document';
import { Resend } from 'resend';

/**
 * Batch generate and email tax receipts for all donors in an organization
 * for a given tax year.
 */
export const generateBatchTaxReceipts = inngest.createFunction(
  {
    id: 'generate-batch-tax-receipts',
    name: 'Generate Batch Tax Receipts',
  },
  { event: 'receipts/batch.generate' },
  async ({ event, step }) => {
    const { organizationId, year } = event.data;

    // Step 1: Fetch organization details
    const org = await step.run('fetch-organization', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('organizations')
        .select('name, ein, tax_exempt_status, tax_receipt_footer')
        .eq('id', organizationId)
        .single();

      if (error || !data) {
        throw new Error(`Organization not found: ${error?.message}`);
      }

      if (!data.ein || !data.tax_exempt_status) {
        throw new Error(
          'Organization EIN and tax-exempt status must be configured before generating receipts.',
        );
      }

      return data;
    });

    // Step 2: Fetch all contacts with gifts in the given year
    const donors = await step.run('fetch-donors-with-gifts', async () => {
      const supabase = createAdminClient();

      // Get distinct contact IDs with gifts in the year
      const { data: gifts, error } = await supabase
        .from('gifts')
        .select('contact_id')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .gte('gift_date', `${year}-01-01`)
        .lte('gift_date', `${year}-12-31`);

      if (error) {
        throw new Error(`Failed to fetch gifts: ${error.message}`);
      }

      // Get unique contact IDs
      const contactIds = [...new Set((gifts || []).map((g) => g.contact_id))];

      if (contactIds.length === 0) {
        return [];
      }

      // Fetch contact details
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, address')
        .in('id', contactIds);

      if (contactsError) {
        throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
      }

      return contacts || [];
    });

    if (donors.length === 0) {
      return { total: 0, sent: 0, failed: 0, skipped: 0 };
    }

    // Step 3: Process each donor — generate and email receipt
    const BATCH_SIZE = 10;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < donors.length; i += BATCH_SIZE) {
      const batch = donors.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);

      const batchResult = await step.run(
        `process-batch-${batchIndex}`,
        async () => {
          const supabase = createAdminClient();
          let batchSent = 0;
          let batchFailed = 0;
          let batchSkipped = 0;

          for (const donor of batch) {
            // Skip donors without email
            if (!donor.email) {
              batchSkipped++;
              continue;
            }

            try {
              // Fetch gifts for this donor
              const { data: donorGifts } = await supabase
                .from('gifts')
                .select('amount, gift_date, gift_type, payment_method')
                .eq('contact_id', donor.id)
                .eq('organization_id', organizationId)
                .is('deleted_at', null)
                .gte('gift_date', `${year}-01-01`)
                .lte('gift_date', `${year}-12-31`)
                .order('gift_date', { ascending: true });

              if (!donorGifts || donorGifts.length === 0) {
                batchSkipped++;
                continue;
              }

              const totalAmount = donorGifts.reduce((sum, g) => sum + g.amount, 0);
              const fullName = `${donor.first_name} ${donor.last_name}`;

              // Parse address
              let donorAddress: { street?: string; city?: string; state?: string; zip?: string } | undefined;
              if (donor.address) {
                if (typeof donor.address === 'string') {
                  donorAddress = { street: donor.address };
                } else {
                  donorAddress = donor.address as { street?: string; city?: string; state?: string; zip?: string };
                }
              }

              const orgPart = organizationId.slice(0, 4).toUpperCase();
              const contactPart = donor.id.slice(0, 4).toUpperCase();
              const receiptNumber = `${orgPart}-${contactPart}-${year}`;

              const receiptData: TaxReceiptProps = {
                organization: {
                  name: org.name,
                  ein: org.ein!,
                  taxExemptStatus: org.tax_exempt_status!,
                  receiptFooter: org.tax_receipt_footer || undefined,
                },
                donor: {
                  name: fullName,
                  address: donorAddress,
                },
                gifts: donorGifts.map((g) => ({
                  date: g.gift_date,
                  amount: g.amount,
                  campaign: g.gift_type || undefined,
                  paymentMethod: g.payment_method || undefined,
                })),
                year,
                totalAmount,
                receiptNumber,
                generatedAt: new Date(),
              };

              // Generate PDF
              const pdfBuffer = await renderToBuffer(
                TaxReceiptDocument(receiptData),
              );

              // Send email
              if (!process.env.RESEND_API_KEY) {
                throw new Error('RESEND_API_KEY is not configured');
              }

              const resend = new Resend(process.env.RESEND_API_KEY);
              const firstName = donor.first_name;

              const sanitize = (str: string) =>
                str.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
              const filename = `tax-receipt-${sanitize(fullName)}-${year}.pdf`;

              const response = await resend.emails.send({
                from: 'noreply@flourishnpo.com',
                to: donor.email,
                subject: `Your ${year} Donation Receipt from ${org.name}`,
                html: `
                  <p>Dear ${firstName},</p>
                  <p>Attached is your donation receipt for ${year}. Thank you for your generous support!</p>
                  <p>Your total contributions for ${year}: <strong>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}</strong></p>
                  <p>Please keep this receipt for your tax records.</p>
                  <p>With gratitude,<br/>${org.name}</p>
                `,
                attachments: [
                  {
                    filename,
                    content: Buffer.from(pdfBuffer),
                  },
                ],
              });

              if (response.error) {
                console.error(`Failed to email receipt to ${donor.email}:`, response.error);
                batchFailed++;
              } else {
                batchSent++;
              }
            } catch (err) {
              console.error(`Error processing receipt for contact ${donor.id}:`, err);
              batchFailed++;
            }
          }

          return { sent: batchSent, failed: batchFailed, skipped: batchSkipped };
        },
      );

      sent += batchResult.sent;
      failed += batchResult.failed;
      skipped += batchResult.skipped;
    }

    return {
      total: donors.length,
      sent,
      failed,
      skipped,
    };
  },
);
