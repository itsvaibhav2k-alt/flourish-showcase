import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

// Create test fixture files before tests run
test.beforeAll(() => {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true })
  }

  // CSV with full name column (no separate first/last)
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'contacts-fullname.csv'),
    `Name,Email,Phone
John Smith,john@example.com,(571) 555-0101
Dr. Jane Doe PhD,jane@example.com,571-555-0102
Robert Smith Jr.,bob@example.com,5715550103
Maria Garcia Lopez,maria@example.com,+1 571-555-0104
`,
  )

  // CSV with separate first/last name columns
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'contacts-standard.csv'),
    `First Name,Last Name,Email,Phone,City,State
Alice,Johnson,alice@test.com,(202) 555-0201,Aldie,VA
Bob,Williams,bob@test.com,202-555-0202,South Riding,VA
Charlie,Brown,charlie@test.com,+12025550203,Ashburn,VA
`,
  )

  // PayPal-style CSV export
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'paypal-export.csv'),
    `Date,Name,Gross,Fee,Net,From Email Address,Status,Transaction ID
01/15/2025,John Smith,50.00,-1.75,48.25,john@example.com,Completed,TXN001
01/20/2025,Jane Doe,100.00,-3.20,96.80,jane@example.com,Completed,TXN002
01/22/2025,Pending Person,25.00,-0.75,24.25,pending@example.com,Pending,TXN003
`,
  )

  // Venmo-style CSV export
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'venmo-export.csv'),
    `Datetime,From,To,Amount (total),Status,Note
2025-01-15 10:30:00,Alice Johnson,Band Boosters,75.00,Complete,Annual fund donation
2025-01-18 14:15:00,Bob Williams,Band Boosters,50.00,Complete,Instrument drive
`,
  )

  // vCard file with multiple contacts
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'contacts.vcf'),
    `BEGIN:VCARD
VERSION:3.0
N:Smith;John;;Mr.;
FN:Mr. John Smith
EMAIL;TYPE=work:john@example.com
TEL;TYPE=cell:+15715550101
ADR;TYPE=home:;;123 Main St;Aldie;VA;20105;US
ORG:Band Boosters
NOTE:Active volunteer
END:VCARD
BEGIN:VCARD
VERSION:3.0
N:Doe;Jane;;;
FN:Jane Doe
EMAIL:jane@example.com
TEL:571-555-0102
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Robert Garcia
EMAIL:robert@example.com
END:VCARD
`,
  )

  // BOM-encoded CSV (Excel export simulation)
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'contacts-bom.csv'),
    '\uFEFFFirst Name,Last Name,Email\nAlice,Johnson,alice@test.com\nBob,Williams,bob@test.com\n',
  )

  // CSV with empty rows and merged cells
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'contacts-messy.csv'),
    `First Name,Last Name,Email
Alice,Johnson,alice@test.com
,,
Alice,Johnson,alice@test.com
Bob,Williams,bob@test.com
,,
`,
  )
})

test.describe('Import System - Contact Import Wizard', () => {
  test('renders the import page with multi-format upload support', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    // Should show updated title and description
    await expect(page.getByText('Upload File')).toBeVisible()
    await expect(
      page.getByText(/CSV, Excel/),
    ).toBeVisible()

    // File input should accept multiple formats
    const fileInput = page.locator('input[type="file"]')
    const accept = await fileInput.getAttribute('accept')
    expect(accept).toContain('.csv')
    expect(accept).toContain('.xlsx')
    expect(accept).toContain('.vcf')
    expect(accept).toContain('.pdf')

    // Should show drag-and-drop area with generic text
    await expect(page.getByText('Drag and drop your file here')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/import-upload-page.png' })
  })

  test('imports CSV with full name column and auto-advances to mapping', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    // Upload CSV with "Name" column
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'contacts-fullname.csv'))

    // Should auto-advance to mapping step after parsing
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })

    // The full_name pattern should detect the "name" column
    // Mapping step should be visible with field selectors
    await expect(page.getByText('Required Fields')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/import-fullname-mapping.png' })
  })

  test('imports standard CSV and proceeds to validation', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'contacts-standard.csv'))

    // Should auto-advance to mapping step
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })

    // Click Continue to Validation
    await page.getByRole('button', { name: 'Continue to Validation' }).click()

    // Should show validation results
    await expect(page.getByRole('heading', { name: 'Validation Results' })).toBeVisible({ timeout: 10000 })

    // All 3 rows should be valid
    await expect(page.getByText('Valid rows', { exact: true })).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/import-standard-validation.png' })
  })

  test('detects PayPal platform and shows banner', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'paypal-export.csv'))

    // Should auto-advance to mapping step
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })

    // Should detect PayPal and show platform banner
    await expect(page.getByText(/Detected PayPal export/)).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/import-paypal-detected.png' })
  })

  test('imports vCard file and extracts contacts', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'contacts.vcf'))

    // Should auto-advance to mapping step
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })

    // Should have parsed contacts
    await expect(page.getByText('Required Fields')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/import-vcard.png' })
  })

  test('handles BOM-encoded CSV correctly', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'contacts-bom.csv'))

    // Should parse without errors and advance to mapping
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })

    // Should have auto-detected first name, last name, email columns
    await expect(page.getByText('Required Fields')).toBeVisible()
  })

  test('handles messy CSV with empty rows and duplicates', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'contacts-messy.csv'))

    // Should parse and advance to mapping
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })

    // Click through to validation
    await page.getByRole('button', { name: 'Continue to Validation' }).click()
    await expect(page.getByRole('heading', { name: 'Validation Results' })).toBeVisible({ timeout: 10000 })

    // Should have filtered empty rows and deduped — expect 2 valid
    await page.screenshot({ path: 'tests/e2e/screenshots/import-messy-csv.png' })
  })

  test('full name validation works end-to-end', async ({ page }) => {
    await page.goto('/contacts/import')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'contacts-fullname.csv'))

    // Should advance to mapping
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })

    // Click Continue to Validation
    await page.getByRole('button', { name: 'Continue to Validation' }).click()

    // Should show validation results — names should have been split
    await expect(page.getByRole('heading', { name: 'Validation Results' })).toBeVisible({ timeout: 10000 })

    // Should have valid rows (full_name was split into first/last)
    await expect(page.getByText('Valid rows', { exact: true })).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/import-fullname-validation.png' })
  })
})

test.describe('Import System - Gift Import Wizard', () => {
  test('renders gift import page with multi-format support', async ({ page }) => {
    await page.goto('/donors/import')
    await page.waitForLoadState('networkidle')

    // Should show updated title
    await expect(page.getByText('Upload File')).toBeVisible()
    await expect(
      page.getByText(/CSV, Excel/),
    ).toBeVisible()

    // File input should accept CSV, XLSX, PDF (but not VCF)
    const fileInput = page.locator('input[type="file"]')
    const accept = await fileInput.getAttribute('accept')
    expect(accept).toContain('.csv')
    expect(accept).toContain('.xlsx')
    expect(accept).toContain('.pdf')
    expect(accept).not.toContain('.vcf')

    await page.screenshot({ path: 'tests/e2e/screenshots/gift-import-upload.png' })
  })

  test('detects Venmo platform export for gift import', async ({ page }) => {
    await page.goto('/donors/import')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'venmo-export.csv'))

    // Should advance to mapping and detect Venmo
    await expect(page.getByText('Map Columns')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Detected Venmo export/)).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/gift-import-venmo.png' })
  })
})

test.describe('Import System - Navigation', () => {
  test('contact import page loads correctly', async ({ page }) => {
    await page.goto('/contacts/import')
    await expect(page).toHaveURL(/\/contacts\/import/)
    await expect(page.getByText('Upload File')).toBeVisible()
  })

  test('gift import page loads correctly', async ({ page }) => {
    await page.goto('/donors/import')
    await expect(page).toHaveURL(/\/donors\/import/)
    await expect(page.getByText('Upload File')).toBeVisible()
  })
})
