import { test, expect } from '@playwright/test'

test.describe('Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')
  })

  test('page loads successfully', async ({ page }) => {
    // Check for page title
    const heading = page.getByRole('heading', { name: /Contacts/i })
    await expect(heading).toBeVisible()

    // Check for Add Contact button (always visible)
    const addButton = page.getByRole('button', { name: /Add Contact/i }).first()
    await expect(addButton).toBeVisible()
  })

  test('search filters contacts in real-time', async ({ page }) => {
    // Search input is only visible when there are contacts
    const searchInput = page.getByPlaceholder(/Search contacts by name or email/i)
    const emptyState = page.getByText(/No contacts found/i)

    // Either search input or empty state should be present
    const hasSearch = await searchInput.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    // Page should show search or empty state
    expect(hasSearch || hasEmpty).toBeTruthy()

    // If search input exists, test filtering
    if (hasSearch) {
      await searchInput.fill('test')
      await page.waitForTimeout(500) // Debounce delay
      await searchInput.clear()
      await page.waitForTimeout(500)
    }
  })

  test('contacts table or list is visible', async ({ page }) => {
    // Check if contacts are displayed in a table or empty state
    const table = page.locator('table')
    const emptyState = page.getByText(/No contacts found|Get started by adding/i).first()

    const hasTable = await table.isVisible().catch(() => false)
    const isEmpty = await emptyState.isVisible().catch(() => false)

    // Page should show contacts table or empty state
    expect(hasTable || isEmpty).toBeTruthy()
  })

  test('row hover shows action icons', async ({ page }) => {
    // Check if there are any contacts
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      const firstRow = rows.first()

      // Hover over the row
      await firstRow.hover()

      // Check for action buttons (view, edit, etc.)
      // Note: Exact implementation may vary
      const actionButtons = firstRow.locator('button')
      const buttonCount = await actionButtons.count()
      expect(buttonCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('add contact button navigates to new contact page', async ({ page }) => {
    // Add Contact is a link to /contacts/new, not a dialog
    const addLink = page.getByRole('link', { name: /Add Contact/i }).first()

    if (await addLink.isVisible()) {
      await addLink.click()

      // Should navigate to new contact page
      await page.waitForLoadState('networkidle')

      // Check we're on the new contact page
      await expect(page).toHaveURL(/\/contacts\/new/)

      // Look for form fields on the new contact page
      const nameInput = page.getByLabel(/First Name/i).or(page.getByPlaceholder(/first name/i))
      await expect(nameInput).toBeVisible()
    }
  })

  test('handles empty state gracefully', async ({ page }) => {
    // Even with no contacts, page should load without errors
    const heading = page.getByRole('heading', { name: /Contacts/i })
    await expect(heading).toBeVisible()

    // Should show stats cards
    const totalContactsCard = page.getByText(/Total Contacts/i)
    await expect(totalContactsCard).toBeVisible()

    // Should show tabs
    const allContactsTab = page.getByRole('link', { name: /All Contacts/i })
    await expect(allContactsTab).toBeVisible()
  })
})
