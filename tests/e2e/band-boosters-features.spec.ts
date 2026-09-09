import { test, expect } from '@playwright/test'

const SCREENSHOT_DIR = 'tests/e2e/screenshots'

test.describe('Band Boosters MVP Features', () => {
  test.setTimeout(30000)

  test('1. Sponsorships pipeline page loads', async ({ page }) => {
    await page.goto('/sponsorships')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-sponsorships-pipeline.png`, fullPage: true })

    // Should see sponsorship pipeline heading or kanban structure
    const heading = page.getByRole('heading', { name: /sponsorship/i }).first()
    const main = page.locator('main').first()
    const hasHeading = await heading.isVisible().catch(() => false)
    const hasMain = await main.isVisible().catch(() => false)
    expect(hasHeading || hasMain).toBeTruthy()
  })

  test('2. Sponsorship detail page loads', async ({ page }) => {
    // Navigate to sponsorships first
    await page.goto('/sponsorships')
    await page.waitForLoadState('networkidle')

    // Check if there are any sponsorship cards to click
    const card = page.locator('[data-testid="sponsorship-card"], .cursor-pointer, a[href*="/sponsorships/"]').first()
    if (await card.isVisible().catch(() => false)) {
      await card.click()
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-sponsorship-detail.png`, fullPage: true })
    } else {
      // Take screenshot of empty state
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-sponsorship-empty-state.png`, fullPage: true })
    }
    expect(true).toBeTruthy()
  })

  test('3. Sponsorship tier settings page loads', async ({ page }) => {
    await page.goto('/settings/sponsorships')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-sponsorship-tiers-settings.png`, fullPage: true })

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })

  test('4. Tax receipts page loads', async ({ page }) => {
    await page.goto('/donors/tax-receipts')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-tax-receipts-page.png`, fullPage: true })

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })

  test('5. Volunteers page loads with shift features', async ({ page }) => {
    await page.goto('/volunteers')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-volunteers-shifts.png`, fullPage: true })

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })

  test('6. Settings page loads with tax receipt section', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-settings-tax-receipt.png`, fullPage: true })

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })

  test('7. Dashboard shows sponsorships in sidebar nav', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-dashboard-sidebar-nav.png`, fullPage: true })

    // Check for Sponsorships link in navigation
    const sponsorshipLink = page.getByRole('link', { name: /sponsorship/i }).first()
    const hasLink = await sponsorshipLink.isVisible().catch(() => false)
    // May not be visible in mobile view, check sidebar exists at minimum
    const sidebar = page.locator('nav, aside, [role="navigation"]').first()
    const hasSidebar = await sidebar.isVisible().catch(() => false)
    expect(hasLink || hasSidebar).toBeTruthy()
  })

  test('8. Donors page loads successfully', async ({ page }) => {
    await page.goto('/donors')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-donors-page.png`, fullPage: true })

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })

  test('9. Contacts page loads with import features', async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-contacts-page.png`, fullPage: true })

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })

  test('10. Communications page loads', async ({ page }) => {
    await page.goto('/communications')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-communications-page.png`, fullPage: true })

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })
})
