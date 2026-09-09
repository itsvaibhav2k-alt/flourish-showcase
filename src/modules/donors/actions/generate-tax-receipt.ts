'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import { TaxReceiptDocument } from '../templates/tax-receipt-document';
import type { TaxReceiptProps } from '../templates/tax-receipt-document';
import { Resend } from 'resend';

export type GenerateTaxReceiptResult =
  | { success: true; pdf: number[]; filename: string }
  | { success: false; error: string };

export type EmailTaxReceiptResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

/**
 * Generate a unique receipt number based on org, contact, and year
 */
function generateReceiptNumber(
  orgId: string,
  contactId: string,
  year: number,
): string {
  const orgPart = orgId.slice(0, 4).toUpperCase();
  const contactPart = contactId.slice(0, 4).toUpperCase();
  return `${orgPart}-${contactPart}-${year}`;
}

/**
 * Build the tax receipt props from database data
 */
async function buildReceiptData(
  contactId: string,
  year: number,
): Promise<{ success: true; data: TaxReceiptProps; email?: string } | { success: false; error: string }> {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) {
    return { success: false, error: 'No organization selected' };
  }

  const supabase = await createClient();

  // Fetch all data in parallel
  const [contactResult, giftsResult, orgResult] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, address')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single(),

    supabase
      .from('gifts')
      .select('id, amount, gift_date, gift_type, payment_method, notes')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .gte('gift_date', `${year}-01-01`)
      .lte('gift_date', `${year}-12-31`)
      .order('gift_date', { ascending: true }),

    supabase
      .from('organizations')
      .select('name, ein, tax_exempt_status, tax_receipt_footer')
      .eq('id', organizationId)
      .single(),
  ]);

  if (contactResult.error || !contactResult.data) {
    return { success: false, error: 'Contact not found' };
  }

  if (orgResult.error || !orgResult.data) {
    return { success: false, error: 'Organization not found' };
  }

  const org = orgResult.data;
  if (!org.ein || !org.tax_exempt_status) {
    return {
      success: false,
      error: 'Organization EIN and tax-exempt status must be configured in Settings before generating tax receipts.',
    };
  }

  const gifts = giftsResult.data || [];
  if (gifts.length === 0) {
    return { success: false, error: `No gifts found for ${year}` };
  }

  const contact = contactResult.data;
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const totalAmount = gifts.reduce((sum, g) => sum + g.amount, 0);

  // Parse address
  let donorAddress: { street?: string; city?: string; state?: string; zip?: string } | undefined;
  if (contact.address) {
    if (typeof contact.address === 'string') {
      donorAddress = { street: contact.address };
    } else {
      donorAddress = contact.address as { street?: string; city?: string; state?: string; zip?: string };
    }
  }

  const data: TaxReceiptProps = {
    organization: {
      name: org.name,
      ein: org.ein,
      taxExemptStatus: org.tax_exempt_status,
      receiptFooter: org.tax_receipt_footer || undefined,
    },
    donor: {
      name: fullName,
      address: donorAddress,
    },
    gifts: gifts.map((g) => ({
      date: g.gift_date,
      amount: g.amount,
      campaign: g.gift_type || undefined,
      paymentMethod: g.payment_method || undefined,
    })),
    year,
    totalAmount,
    receiptNumber: generateReceiptNumber(organizationId, contactId, year),
    generatedAt: new Date(),
  };

  return { success: true, data, email: contact.email || undefined };
}

/**
 * Server action to generate a tax receipt PDF for a contact
 */
export async function generateTaxReceipt(
  contactId: string,
  year: number,
): Promise<GenerateTaxReceiptResult> {
  try {
    const result = await buildReceiptData(contactId, year);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      TaxReceiptDocument(result.data),
    );

    // Sanitize filename
    const sanitize = (str: string) =>
      str.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `tax-receipt-${sanitize(result.data.donor.name)}-${year}.pdf`;

    // Convert ArrayBuffer to number array for serialization
    const pdfArray = Array.from(new Uint8Array(pdfBuffer));

    return {
      success: true,
      pdf: pdfArray,
      filename,
    };
  } catch (error) {
    console.error('Error generating tax receipt:', error);
    return { success: false, error: 'Failed to generate tax receipt' };
  }
}

/**
 * Server action to generate and email a tax receipt to a contact
 */
export async function emailTaxReceipt(
  contactId: string,
  year: number,
): Promise<EmailTaxReceiptResult> {
  try {
    const result = await buildReceiptData(contactId, year);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (!result.email) {
      return { success: false, error: 'Contact does not have an email address' };
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      TaxReceiptDocument(result.data),
    );

    // Send via Resend with attachment
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY is not configured' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = result.data.donor.name.split(' ')[0];

    const sanitize = (str: string) =>
      str.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `tax-receipt-${sanitize(result.data.donor.name)}-${year}.pdf`;

    const response = await resend.emails.send({
      from: 'noreply@flourishnpo.com',
      to: result.email,
      subject: `Your ${year} Donation Receipt from ${result.data.organization.name}`,
      html: `
        <p>Dear ${firstName},</p>
        <p>Attached is your donation receipt for ${year}. Thank you for your generous support!</p>
        <p>Your total contributions for ${year}: <strong>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result.data.totalAmount)}</strong></p>
        <p>Please keep this receipt for your tax records.</p>
        <p>With gratitude,<br/>${result.data.organization.name}</p>
      `,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    console.error('Error emailing tax receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to email tax receipt',
    };
  }
}
