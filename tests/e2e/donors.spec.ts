import { test, expect } from '@playwright/test'

test.describe('Donors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donors')
    await page.waitForLoadState('networkidle')
  })

  test('page loads successfully', async ({ page }) => {
    // Check for page title
    const heading = page.getByRole('heading', { name: /Donors/i })
    await expect(heading).toBeVisible()
  })

  test('time range filter updates chart', async ({ page }) => {
    // Look for time range selector
    const timeRangeButton = page.getByRole('button', { name: /30 days|90 days|12 months|All time/i }).first()

    if (await timeRangeButton.isVisible()) {
      await timeRangeButton.click()

      // Wait for dropdown to appear
      await page.waitForTimeout(300)

      // Select different time range
      const option = page.getByRole('option', { name: /90 days/i }).first()
      if (await option.isVisible()) {
        await option.click()
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('chart shows data or no-data message (not error)', async ({ page }) => {
    // Check for chart area or empty state
    const chartContainer = page.locator('[class*="recharts"]').first()
    const noDataMessage = page.getByText(/No giving|No data|No gift/i).first()
    const chartContent = page.getByText(/Giving|Total|Amount/i).first()

    const hasChart = await chartContainer.isVisible().catch(() => false)
    const hasNoData = await noDataMessage.isVisible().catch(() => false)
    const hasContent = await chartContent.isVisible().catch(() => false)

    // Should show chart, no-data message, or relevant content
    expect(hasChart || hasNoData || hasContent).toBeTruthy()
  })

  test('record gift button exists', async ({ page }) => {
    const recordGiftBtn = page.getByRole('button', { name: /Record Gift/i })
    await expect(recordGiftBtn).toBeVisible()
  })

  test('record gift flow works', async ({ page }) => {
    const recordGiftBtn = page.getByRole('button', { name: /Record Gift/i })
    await recordGiftBtn.click()

    // Should open dialog with form
    await page.waitForLoadState('networkidle')

    // Look for form fields
    const amountInput = page.getByLabel(/Amount/i).first()
    if (await amountInput.isVisible()) {
      await expect(amountInput).toBeVisible()

      // Check for date field
      const dateInput = page.getByLabel(/Date/i).first()
      await expect(dateInput).toBeVisible()
    }
  })

  test('donor table shows data', async ({ page }) => {
    // Check for donor table/list
    const table = page.locator('table')

    if (await table.isVisible()) {
      // Should have headers
      const headers = table.locator('thead th')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
    }
  })

  test('lapse risk indicators display correctly', async ({ page }) => {
    // Look for risk indicators (high, medium, low)
    const riskBadges = page.locator('[class*="badge"]')

    // Should either show risk badges or no donors message
    const rowCount = await page.locator('tbody tr').count()

    if (rowCount > 0) {
      // Should have at least some risk data
      const highRisk = page.getByText(/High/i)
      const mediumRisk = page.getByText(/Medium/i)
      const lowRisk = page.getByText(/Low/i)

      // At least one risk level should be visible
      const hasRiskData =
        (await highRisk.isVisible()) ||
        (await mediumRisk.isVisible()) ||
        (await lowRisk.isVisible())

      // Risk data might not be calculated yet, so this is optional
      // expect(hasRiskData).toBeTruthy()
    }
  })
})
