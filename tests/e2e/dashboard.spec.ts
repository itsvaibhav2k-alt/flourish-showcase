import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Page should load with dashboard content - check for heading or stats
    const heading = page.getByRole('heading', { name: /Dashboard/i })
    const statsCard = page.getByText(/Total|Contacts|Donors/i).first()

    const hasHeading = await heading.isVisible().catch(() => false)
    const hasStats = await statsCard.isVisible().catch(() => false)

    expect(hasHeading || hasStats).toBeTruthy()
  })

  test('metrics cards are visible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for metric cards - at least one should be visible
    const contactsCard = page.getByText(/Contacts/i).first()
    const donorsCard = page.getByText(/Donors/i).first()

    const hasContacts = await contactsCard.isVisible()
    const hasDonors = await donorsCard.isVisible()

    expect(hasContacts || hasDonors).toBeTruthy()
  })

  test('quick actions section exists', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Look for quick action buttons or links
    const addContactBtn = page.getByRole('link', { name: /Add Contact/i }).or(
      page.getByRole('button', { name: /Add Contact/i })
    )
    const recordGiftBtn = page.getByRole('link', { name: /Record Gift/i }).or(
      page.getByRole('button', { name: /Record Gift/i })
    )

    // At least one quick action should be visible
    const hasAddContact = await addContactBtn.first().isVisible().catch(() => false)
    const hasRecordGift = await recordGiftBtn.first().isVisible().catch(() => false)

    expect(hasAddContact || hasRecordGift).toBeTruthy()
  })

  test('pending drafts panel shows', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for pending drafts section
    const pendingDrafts = page.getByText(/Pending Drafts|Email Drafts/i).first()
    const hasPanel = await pendingDrafts.isVisible().catch(() => false)

    // Panel should exist (either with drafts or empty state)
    expect(hasPanel).toBeTruthy()
  })

  test('navigation sidebar works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Click on Contacts in sidebar
    const contactsLink = page.getByRole('link', { name: /Contacts/i }).first()
    await contactsLink.click()
    await page.waitForURL('**/contacts**')
    expect(page.url()).toContain('/contacts')
  })
})
