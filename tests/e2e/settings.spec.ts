import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('page loads successfully', async ({ page }) => {
    // Check for page title or settings content
    const heading = page.getByRole('heading', { name: /Settings/i })
    const welcomeCard = page.getByText(/Welcome|Organization|Settings/i).first()

    // Either heading or welcome content should be visible
    const hasHeading = await heading.isVisible().catch(() => false)
    const hasContent = await welcomeCard.isVisible().catch(() => false)

    expect(hasHeading || hasContent).toBeTruthy()
  })

  test('shows organization settings or welcome state', async ({ page }) => {
    // Check for welcome/setup message or settings form
    const welcomeText = page.getByText(/Welcome|Create.*Organization|Get Started/i).first()
    const settingsForm = page.getByText(/Organization|General|Profile/i).first()

    // Should show either welcome state or organization settings
    const hasWelcome = await welcomeText.isVisible().catch(() => false)
    const hasSettings = await settingsForm.isVisible().catch(() => false)

    expect(hasWelcome || hasSettings).toBeTruthy()
  })

  test('settings tabs load without error', async ({ page }) => {
    // Look for settings tabs
    const generalTab = page.getByRole('tab', { name: /General|Organization/i })
    const profileTab = page.getByRole('tab', { name: /Profile/i })
    const apiTab = page.getByRole('tab', { name: /API|Integrations/i })

    // Check if tabs exist
    if (await generalTab.isVisible()) {
      await generalTab.click()
      await page.waitForLoadState('networkidle')

      // Should not show error
      const errorMessage = page.getByText(/error|failed/i)
      const errorCount = await errorMessage.count()
      expect(errorCount).toBe(0)
    }

    if (await profileTab.isVisible()) {
      await profileTab.click()
      await page.waitForLoadState('networkidle')

      // Should not show error
      const errorMessage = page.getByText(/error|failed/i)
      const errorCount = await errorMessage.count()
      expect(errorCount).toBe(0)
    }
  })

  test('organization name can be edited', async ({ page }) => {
    // Look for organization name input
    const orgNameInput = page.getByLabel(/Organization Name/i).first()

    if (await orgNameInput.isVisible()) {
      // Should be editable
      await expect(orgNameInput).toBeEditable()

      // Should have save button
      const saveBtn = page.getByRole('button', { name: /Save|Update/i })
      await expect(saveBtn).toBeVisible()
    }
  })

  test('user profile section displays', async ({ page }) => {
    // Look for profile tab
    const profileTab = page.getByRole('tab', { name: /Profile/i })

    if (await profileTab.isVisible()) {
      await profileTab.click()
      await page.waitForLoadState('networkidle')

      // Should show user information
      const emailLabel = page.getByText(/Email/i).first()
      const nameLabel = page.getByText(/Name/i).first()

      // At least one should be visible
      const hasProfile =
        (await emailLabel.isVisible()) ||
        (await nameLabel.isVisible())

      expect(hasProfile).toBeTruthy()
    }
  })

  test('form validation works', async ({ page }) => {
    // Look for organization name input
    const orgNameInput = page.getByLabel(/Organization Name/i).first()

    if (await orgNameInput.isVisible()) {
      // Clear the input
      await orgNameInput.clear()

      // Try to save with empty name
      const saveBtn = page.getByRole('button', { name: /Save|Update/i })
      if (await saveBtn.isVisible()) {
        await saveBtn.click()

        // Should show validation error or use HTML5 validation
        await page.waitForTimeout(500)

        // Look for error message or check input is invalid
        const errorMessage = page.getByText(/required|cannot be empty/i)
        const hasError = await errorMessage.count() > 0
        const inputInvalid = await orgNameInput.evaluate((el: HTMLInputElement) => !el.validity.valid)

        // Validation should prevent save or show error (either way is valid)
        expect(hasError || inputInvalid).toBeTruthy()
      }
    }
  })

  test('navigation between settings tabs works', async ({ page }) => {
    // Look for tabs
    const tabs = page.locator('[role="tab"]')
    const tabCount = await tabs.count()

    if (tabCount > 1) {
      // Click through tabs
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click()
        await page.waitForLoadState('networkidle')

        // Should not crash or show error - use exact match for main heading
        const heading = page.getByRole('heading', { name: 'Settings', exact: true })
        await expect(heading).toBeVisible()
      }
    }
  })
})
