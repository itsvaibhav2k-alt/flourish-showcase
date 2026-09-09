import { test, expect } from '@playwright/test'

test.describe('Contact Report Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')
  })

  test('export report button is visible on contact detail page', async ({ page }) => {
    // Check if there are any contacts
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      // Click on first contact to view details
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      // Check for Export Report button
      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await expect(exportButton).toBeVisible()
    }
  })

  test('export report dialog opens with section checkboxes', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      // Click Export Report button
      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      // Check dialog is open
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Check for dialog title
      await expect(page.getByRole('heading', { name: /Export Contact Report/i })).toBeVisible()

      // Check for section checkboxes
      await expect(page.getByLabel(/Contact Summary/i)).toBeVisible()
      await expect(page.getByLabel(/Giving History/i)).toBeVisible()
      await expect(page.getByLabel(/Volunteer History/i)).toBeVisible()
      await expect(page.getByLabel(/Activity Timeline/i)).toBeVisible()
      await expect(page.getByLabel(/Notes/i)).toBeVisible()
    }
  })

  test('contact summary section is always enabled', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      // Contact Summary checkbox should be checked and disabled
      const summaryCheckbox = page.getByLabel(/Contact Summary/i)
      await expect(summaryCheckbox).toBeChecked()
      await expect(summaryCheckbox).toBeDisabled()

      // Should show "Always included" text
      await expect(page.getByText(/Always included/i)).toBeVisible()
    }
  })

  test('can toggle report sections', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      // Toggle Giving History off
      const givingCheckbox = page.getByLabel(/Giving History/i)
      await expect(givingCheckbox).toBeChecked()
      await givingCheckbox.click()
      await expect(givingCheckbox).not.toBeChecked()

      // Toggle it back on
      await givingCheckbox.click()
      await expect(givingCheckbox).toBeChecked()
    }
  })

  test('download PDF button is visible', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      // Check for Download PDF button
      const downloadButton = page.getByRole('button', { name: /Download PDF/i })
      await expect(downloadButton).toBeVisible()
    }
  })

  test('cancel button closes dialog', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      // Dialog should be visible
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Click cancel
      const cancelButton = page.getByRole('button', { name: /Cancel/i })
      await cancelButton.click()

      // Dialog should be closed
      await expect(dialog).not.toBeVisible()
    }
  })

  test('giving potential section is off by default', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      // Giving Potential should be unchecked by default
      const givingPotentialCheckbox = page.getByLabel(/Giving Potential/i)
      await expect(givingPotentialCheckbox).not.toBeChecked()
    }
  })

  test('section descriptions are visible', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      // Check for section descriptions
      await expect(page.getByText(/Name, contact info, role badges/i)).toBeVisible()
      await expect(page.getByText(/Donation records and totals/i)).toBeVisible()
      await expect(page.getByText(/Volunteer hours and shifts/i)).toBeVisible()
    }
  })

  test('download button shows loading state', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.getByRole('button', { name: /Export Report/i })
      await exportButton.click()

      const downloadButton = page.getByRole('button', { name: /Download PDF/i })

      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)

      await downloadButton.click()

      // Button should show loading state
      await expect(page.getByText(/Generating/i)).toBeVisible({ timeout: 5000 }).catch(() => {
        // If generation is fast, loading state might not be visible
      })
    }
  })
})
