/**
 * Types for personalized contact report generation
 */

export interface ReportSection {
  id: string
  label: string
  enabled: boolean
  description?: string
}

export interface ReportConfig {
  sections: ReportSection[]
  includeEmptySections: boolean
}

export const DEFAULT_REPORT_SECTIONS: ReportSection[] = [
  { id: 'summary', label: 'Contact Summary', enabled: true, description: 'Name, contact info, role badges' },
  { id: 'giving', label: 'Giving History', enabled: true, description: 'Donation records and totals' },
  { id: 'volunteer', label: 'Volunteer History', enabled: true, description: 'Volunteer hours and shifts' },
  { id: 'activities', label: 'Activity Timeline', enabled: true, description: 'Recent activities' },
  { id: 'notes', label: 'Notes', enabled: true, description: 'Contact notes and interactions' },
  { id: 'giving_potential', label: 'Giving Potential', enabled: false, description: 'Capacity and propensity scores' },
]

export interface ContactReportData {
  contact: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    address: {
      street?: string
      city?: string
      state?: string
      zip?: string
    } | null
    tags: string[] | null
    is_donor: boolean | null
    is_volunteer: boolean | null
    lifetime_giving: number | null
    total_gifts: number | null
    last_gift_date: string | null
    total_volunteer_hours: number | null
    created_at: string
  }
  gifts: Array<{
    id: string
    amount: number
    gift_date: string
    gift_type: string | null
    payment_method: string | null
    notes: string | null
    campaign_name?: string | null
  }>
  volunteerShifts: Array<{
    id: string
    shift_id: string
    status: string
    hours_logged: number | null
    shift: {
      title: string
      shift_date: string
      location: string | null
    } | null
  }>
  activities: Array<{
    id: string
    activity_type: string
    description: string | null
    metadata: Record<string, unknown> | null
    created_at: string
  }>
  notes: Array<{
    id: string
    content: string
    note_type: string
    importance: string
    tags: string[] | null
    interaction_date: string | null
    created_at: string | null
  }>
  givingPotential: {
    overall_score: number | null
    capacity_score: number | null
    affinity_score: number | null
    propensity_score: number | null
    estimated_net_worth: number | null
    employer: string | null
  } | null
  organization: {
    name: string
  }
  generatedAt: Date
}
