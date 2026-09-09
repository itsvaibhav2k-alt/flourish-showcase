'use server'

import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { ContactReportDocument } from '../templates/contact-report-document'
import type { ReportConfig, ContactReportData } from '../types/report.types'

export type GenerateContactReportResult =
  | { success: true; pdf: number[]; filename: string }
  | { success: false; error: string }

/**
 * Server action to generate a personalized PDF report for a contact
 */
export async function generateContactReport(
  contactId: string,
  config: ReportConfig
): Promise<GenerateContactReportResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Check which sections are enabled
    const isEnabled = (id: string) => config.sections.find((s) => s.id === id)?.enabled

    // Fetch all required data in parallel
    const [contactResult, giftsResult, shiftsResult, activitiesResult, notesResult, givingPotentialResult, orgResult] =
      await Promise.all([
        // Fetch contact
        supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('organization_id', organizationId)
          .single(),

        // Fetch gifts if section enabled
        isEnabled('giving')
          ? supabase
              .from('gifts')
              .select('id, amount, gift_date, gift_type, payment_method, notes')
              .eq('contact_id', contactId)
              .eq('organization_id', organizationId)
              .is('deleted_at', null)
              .order('gift_date', { ascending: false })
          : Promise.resolve({ data: [], error: null }),

        // Fetch volunteer shifts if enabled
        isEnabled('volunteer')
          ? supabase
              .from('shift_signups')
              .select('id, shift_id, status, hours_logged, shifts(title, shift_date, location)')
              .eq('contact_id', contactId)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),

        // Fetch activities if enabled
        isEnabled('activities')
          ? supabase
              .from('activities')
              .select('id, activity_type, description, metadata, created_at')
              .eq('contact_id', contactId)
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [], error: null }),

        // Fetch notes if enabled
        isEnabled('notes')
          ? supabase
              .from('contact_notes')
              .select('id, content, note_type, importance, tags, interaction_date, created_at')
              .eq('contact_id', contactId)
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),

        // Fetch giving potential if enabled
        isEnabled('giving_potential')
          ? supabase
              .from('giving_potential')
              .select('overall_score, capacity_score, affinity_score, propensity_score, estimated_net_worth, employer')
              .eq('contact_id', contactId)
              .single()
          : Promise.resolve({ data: null, error: null }),

        // Fetch organization for branding
        supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single(),
      ])

    if (contactResult.error || !contactResult.data) {
      return { success: false, error: 'Contact not found' }
    }

    if (orgResult.error || !orgResult.data) {
      return { success: false, error: 'Organization not found' }
    }

    // Transform shift data to expected format
    const transformedShifts = (shiftsResult.data || []).map((signup: Record<string, unknown>) => ({
      id: signup.id as string,
      shift_id: signup.shift_id as string,
      status: signup.status as string,
      hours_logged: signup.hours_logged as number | null,
      shift: signup.shifts as { title: string; shift_date: string; location: string | null } | null,
    }))

    const reportData: ContactReportData = {
      contact: contactResult.data,
      gifts: giftsResult.data || [],
      volunteerShifts: transformedShifts,
      activities: activitiesResult.data || [],
      notes: notesResult.data || [],
      givingPotential: givingPotentialResult.data,
      organization: orgResult.data,
      generatedAt: new Date(),
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ContactReportDocument({ data: reportData, config })
    )

    // Sanitize filename to prevent issues with special characters
    const sanitize = (str: string | null) => (str || 'unknown').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    const filename = `${sanitize(contactResult.data.first_name)}-${sanitize(contactResult.data.last_name)}-report-${new Date().toISOString().split('T')[0]}.pdf`

    // Convert ArrayBuffer to number array for serialization
    const pdfArray = Array.from(new Uint8Array(pdfBuffer))

    return {
      success: true,
      pdf: pdfArray,
      filename,
    }
  } catch (error) {
    console.error('Error generating contact report:', error)
    return { success: false, error: 'Failed to generate report' }
  }
}
