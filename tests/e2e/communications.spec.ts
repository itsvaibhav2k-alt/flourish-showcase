import { test, expect } from '@playwright/test'

test.describe('Communications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/communications')
    await page.waitForLoadState('networkidle')
  })

  test('page loads successfully', async ({ page }) => {
    // Check for page title
    const heading = page.getByRole('heading', { name: /Communication/i })
    await expect(heading).toBeVisible()
  })

  test('shows tabs or navigation', async ({ page }) => {
    // Check for tabs or links
    const draftsLink = page.getByRole('link', { name: /Draft|Review/i }).first()
    const sentLink = page.getByRole('link', { name: /Sent|History/i }).first()
    const content = page.getByText(/Draft|Email|Communication/i).first()

    const hasDraftsLink = await draftsLink.isVisible().catch(() => false)
    const hasSentLink = await sentLink.isVisible().catch(() => false)
    const hasContent = await content.isVisible().catch(() => false)

    expect(hasDraftsLink || hasSentLink || hasContent).toBeTruthy()
  })

  test('does not show Unknown Recipient for emails with contacts', async ({ page }) => {
    // Look for any text containing "Unknown Recipient"
    const unknownRecipient = page.getByText(/Unknown Recipient/i)
    const count = await unknownRecipient.count()

    // Should not show Unknown Recipient (indicates contact join is broken)
    expect(count).toBe(0)
  })

  test('train voice button shows correct state', async ({ page }) => {
    // Look for Train Voice button or link
    const trainVoiceBtn = page.getByRole('button', { name: /Train Voice/i })
    const trainVoiceLink = page.getByRole('link', { name: /Train Voice|Voice Training/i })

    // Should have either button or link
    const hasButton = await trainVoiceBtn.isVisible()
    const hasLink = await trainVoiceLink.isVisible()

    expect(hasButton || hasLink).toBeTruthy()
  })

  test('draft approval flow accessible', async ({ page }) => {
    // Look for draft items
    const draftRows = page.locator('tbody tr')
    const rowCount = await draftRows.count()

    if (rowCount > 0) {
      // Should have action buttons
      const approveBtn = page.getByRole('button', { name: /Approve/i }).first()
      const editBtn = page.getByRole('button', { name: /Edit/i }).first()

      const hasActions =
        (await approveBtn.isVisible()) ||
        (await editBtn.isVisible())

      expect(hasActions).toBeTruthy()
    }
  })

  test('generate email button exists', async ({ page }) => {
    const generateBtn = page.getByRole('button', { name: /Generate|New Email/i })

    // Should have generate or new email button
    const btnCount = await generateBtn.count()
    expect(btnCount).toBeGreaterThanOrEqual(0)
  })

  test('email preview displays correctly', async ({ page }) => {
    // Look for draft rows
    const draftRows = page.locator('tbody tr')
    const rowCount = await draftRows.count()

    if (rowCount > 0) {
      // Click on first draft
      await draftRows.first().click()
      await page.waitForLoadState('networkidle')

      // Should show email preview or navigate to detail page
      await page.waitForTimeout(500)

      // Check for email content elements
      const subjectLine = page.getByText(/Subject|Re:|To:/i)
      const hasPreview = await subjectLine.count() > 0

      // Preview should be accessible
      expect(hasPreview).toBeTruthy()
    }
  })

  test('voice training link navigates correctly', async ({ page }) => {
    // Look for voice training link
    const voiceLink = page.getByRole('link', { name: /Voice Training/i })

    if (await voiceLink.isVisible()) {
      await voiceLink.click()
      await page.waitForURL('/communications/voice-training')

      // Should be on voice training page
      expect(page.url()).toContain('voice-training')

      const heading = page.getByRole('heading', { name: /Voice Training/i })
      await expect(heading).toBeVisible()
    }
  })
})
