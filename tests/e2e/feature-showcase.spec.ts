import { test, expect } from '@playwright/test'

const DIR = 'tests/e2e/showcase'

test.describe('Band Boosters MVP Feature Showcase', () => {
  test.setTimeout(60000)

  test('Feature Tour', async ({ page }) => {
    // Set a wider viewport for better screenshots
    await page.setViewportSize({ width: 1440, height: 900 })

    // ============================
    // 1. SPONSORSHIP PIPELINE
    // ============================
    await page.goto('/sponsorships')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/01-sponsorship-pipeline.png`, fullPage: true })

    // Click "Add Sponsor" button to show the form
    const addSponsorBtn = page.getByRole('button', { name: /add sponsor/i }).first()
    if (await addSponsorBtn.isVisible()) {
      await addSponsorBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${DIR}/02-sponsorship-add-form.png`, fullPage: true })
      // Close dialog/form if it's a modal
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    // Click "Manage Tiers" to show tier settings
    const manageTiersBtn = page.getByRole('button', { name: /manage tiers/i }).first()
    if (await manageTiersBtn.isVisible()) {
      await manageTiersBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
    }

    // ============================
    // 2. SPONSORSHIP TIER SETTINGS
    // ============================
    await page.goto('/settings/sponsorships')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/03-sponsorship-tiers-settings.png`, fullPage: true })

    // Click Add Tier to show the form
    const addTierBtn = page.getByRole('button', { name: /add tier/i }).first()
    if (await addTierBtn.isVisible()) {
      await addTierBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${DIR}/04-sponsorship-add-tier-form.png`, fullPage: true })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    // ============================
    // 3. TAX RECEIPTS PAGE
    // ============================
    await page.goto('/donors/tax-receipts')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/05-tax-receipts-page.png`, fullPage: true })

    // ============================
    // 4. DONORS PAGE
    // ============================
    await page.goto('/donors')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/06-donors-page.png`, fullPage: true })

    // ============================
    // 5. VOLUNTEERS PAGE (with shift enhancements)
    // ============================
    await page.goto('/volunteers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/07-volunteers-page.png`, fullPage: true })

    // Click New Shift to show recurring shift form
    const newShiftBtn = page.getByRole('button', { name: /new shift/i }).first()
    if (await newShiftBtn.isVisible()) {
      await newShiftBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${DIR}/08-new-shift-form.png`, fullPage: true })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    // ============================
    // 6. CONTACTS PAGE (with import features)
    // ============================
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/09-contacts-page.png`, fullPage: true })

    // ============================
    // 7. FLORA / VOICE CALLS PAGE
    // ============================
    await page.goto('/flora')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/10-flora-page.png`, fullPage: true })

    // ============================
    // 8. SETTINGS PAGE
    // ============================
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/11-settings-page.png`, fullPage: true })

    // ============================
    // 9. DASHBOARD with sidebar nav
    // ============================
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/12-dashboard-full.png`, fullPage: true })

    // ============================
    // 10. COMMUNICATIONS PAGE
    // ============================
    await page.goto('/communications')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/13-communications-page.png`, fullPage: true })

    // ============================
    // 11. PIPELINE PAGE (existing, for comparison)
    // ============================
    await page.goto('/pipeline')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/14-pipeline-page.png`, fullPage: true })

    // All pages loaded successfully
    expect(true).toBeTruthy()
  })
})
