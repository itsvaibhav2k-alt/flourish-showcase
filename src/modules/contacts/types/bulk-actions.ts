import type { Contact } from '../schemas/contact.schema'

export type BulkActionResult = {
  success: boolean
  affectedCount: number
  error?: string
}

export type ExportField = {
  key: keyof Contact | 'full_name' | 'address_full'
  label: string
  selected: boolean
}

export type ExportContactsResult = {
  success: boolean
  csv?: string
  filename?: string
  error?: string
}

export const DEFAULT_EXPORT_FIELDS: ExportField[] = [
  { key: 'first_name', label: 'First Name', selected: true },
  { key: 'last_name', label: 'Last Name', selected: true },
  { key: 'email', label: 'Email', selected: true },
  { key: 'phone', label: 'Phone', selected: true },
  { key: 'address_full', label: 'Full Address', selected: false },
  { key: 'tags', label: 'Tags', selected: true },
  { key: 'is_donor', label: 'Is Donor', selected: true },
  { key: 'is_volunteer', label: 'Is Volunteer', selected: true },
  { key: 'lifetime_giving', label: 'Lifetime Giving', selected: true },
  { key: 'total_gifts', label: 'Total Gifts', selected: false },
  { key: 'last_gift_date', label: 'Last Gift Date', selected: false },
  { key: 'total_volunteer_hours', label: 'Volunteer Hours', selected: false },
  { key: 'created_at', label: 'Created Date', selected: false },
]
