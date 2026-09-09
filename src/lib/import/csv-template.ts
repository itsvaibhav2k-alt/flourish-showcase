/**
 * Generate and download a sample CSV template for contact imports
 */
export function downloadContactsTemplate() {
  const headers = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'street',
    'city',
    'state',
    'zip',
    'tags',
    'notes',
    'is_donor',
    'is_volunteer',
  ]

  const sampleRows = [
    [
      'John',
      'Doe',
      'john.doe@example.com',
      '555-123-4567',
      '123 Main St',
      'Springfield',
      'IL',
      '62701',
      'donor,volunteer',
      'Met at annual fundraiser',
      'true',
      'true',
    ],
    [
      'Jane',
      'Smith',
      'jane.smith@example.com',
      '555-987-6543',
      '456 Oak Ave',
      'Portland',
      'OR',
      '97201',
      'volunteer',
      'Helped with food drive',
      'false',
      'true',
    ],
    [
      'Bob',
      'Johnson',
      'bob.j@example.com',
      '',
      '',
      'Seattle',
      'WA',
      '98101',
      'donor',
      'Monthly donor since 2020',
      'true',
      'false',
    ],
  ]

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...sampleRows.map((row) =>
      row.map((cell) => {
        // Escape cells that contain commas or quotes
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')
    ),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', 'contacts-import-template.csv')
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Generate field descriptions for the template
 */
export const FIELD_DESCRIPTIONS: Record<string, string> = {
  first_name: 'Required. Contact\'s first name',
  last_name: 'Required. Contact\'s last name',
  email: 'Optional. Email address (used for duplicate detection)',
  phone: 'Optional. Phone number in any format',
  street: 'Optional. Street address',
  city: 'Optional. City',
  state: 'Optional. State or province',
  zip: 'Optional. ZIP or postal code',
  tags: 'Optional. Comma-separated tags (e.g., "donor,volunteer")',
  notes: 'Optional. Additional notes about the contact',
  is_donor: 'Optional. Set to "true" or "yes" if contact is a donor',
  is_volunteer: 'Optional. Set to "true" or "yes" if contact is a volunteer',
}

/**
 * Get import tips for users
 */
export const IMPORT_TIPS = [
  'Required fields: First Name and Last Name',
  'Email is highly recommended for duplicate detection',
  'Use consistent formatting for phone numbers',
  'Boolean fields (is_donor, is_volunteer) accept: true/false, yes/no, 1/0',
  'Tags should be comma-separated within the same cell',
  'Maximum file size: 10 MB',
  'Recommended batch size: Up to 10,000 contacts',
]
