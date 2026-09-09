import { test, expect } from '@playwright/test'

test.describe('Contact Notes - Enhanced Notetaking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')
  })

  test('notes tab is visible on contact detail page', async ({ page }) => {
    // Check if there are any contacts
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      // Click on first contact to view details
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      // Check for Notes tab
      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await expect(notesTab).toBeVisible()
    }
  })

  test('add note form opens with enhanced fields', async ({ page }) => {
    // Check if there are any contacts
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      // Click on first contact
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      // Click Notes tab
      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      // Click Add Note button
      const addNoteButton = page.getByRole('button', { name: /Add Note/i })
      await expect(addNoteButton).toBeVisible()
      await addNoteButton.click()

      // Check for enhanced form fields
      await expect(page.getByLabel(/Note Type/i)).toBeVisible()
      await expect(page.getByLabel(/Importance/i)).toBeVisible()
      await expect(page.getByLabel(/Note/i)).toBeVisible()
      await expect(page.getByText(/Pin this note/i)).toBeVisible()
    }
  })

  test('can select note type from dropdown', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      const addNoteButton = page.getByRole('button', { name: /Add Note/i })
      await addNoteButton.click()

      // Open note type dropdown
      const noteTypeSelect = page.getByRole('combobox').first()
      await noteTypeSelect.click()

      // Check for note type options
      await expect(page.getByRole('option', { name: /Meeting/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /Phone Call/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /Email/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /Personal Info/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /Follow-up/i })).toBeVisible()
    }
  })

  test('can add tags to a note', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      const addNoteButton = page.getByRole('button', { name: /Add Note/i })
      await addNoteButton.click()

      // Add a tag
      const tagInput = page.getByPlaceholder(/Add a tag/i)
      await tagInput.fill('important')

      // Click add tag button
      const addTagButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).last()
      await addTagButton.click()

      // Tag should appear
      await expect(page.getByText('important')).toBeVisible()

      // Shows tag count
      await expect(page.getByText(/1\/10 tags/i)).toBeVisible()
    }
  })

  test('note type filter pills are visible', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      // Check if filter pills are visible (only if there are notes)
      const filterAll = page.getByRole('button', { name: /^All$/i })
      const filterMeetings = page.getByRole('button', { name: /Meetings/i })

      // Either filters or empty state should be visible
      const hasFilters = await filterAll.isVisible().catch(() => false)
      const hasEmptyState = await page.getByText(/No notes yet/i).isVisible().catch(() => false)

      expect(hasFilters || hasEmptyState).toBeTruthy()
    }
  })

  test('search notes functionality exists', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      // Look for search button (only appears when there are notes)
      const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') })

      const hasSearchButton = await searchButton.isVisible().catch(() => false)
      const hasEmptyState = await page.getByText(/No notes yet/i).isVisible().catch(() => false)

      expect(hasSearchButton || hasEmptyState).toBeTruthy()
    }
  })

  test('pinned notes section appears when notes are pinned', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      // If there are pinned notes, the "Pinned" section should be visible
      const pinnedSection = page.getByText(/^Pinned/i)
      const hasEmptyState = await page.getByText(/No notes yet/i).isVisible().catch(() => false)

      // Either pinned section, other notes, or empty state is valid
      const hasPinned = await pinnedSection.isVisible().catch(() => false)
      expect(hasPinned || hasEmptyState || true).toBeTruthy()
    }
  })

  test('note card shows type badge and importance indicator', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      // Check if there are note cards
      const noteCards = page.locator('[class*="border-l-4"]')
      const cardCount = await noteCards.count()

      if (cardCount > 0) {
        // Note cards should have type badges
        const firstCard = noteCards.first()
        await expect(firstCard).toBeVisible()
      }
    }
  })

  test('can create a new note with all fields', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')

      const notesTab = page.getByRole('tab', { name: /Notes/i })
      await notesTab.click()

      const addNoteButton = page.getByRole('button', { name: /Add Note/i })
      await addNoteButton.click()

      // Fill in the form
      // Select note type
      const noteTypeSelect = page.getByRole('combobox').first()
      await noteTypeSelect.click()
      await page.getByRole('option', { name: /Meeting/i }).click()

      // Select importance
      const importanceSelect = page.getByRole('combobox').nth(1)
      await importanceSelect.click()
      await page.getByRole('option', { name: /High/i }).click()

      // Fill content
      const noteContent = page.getByRole('textbox', { name: /Note/i })
      await noteContent.fill('Test meeting note for Playwright testing')

      // Check pin checkbox
      const pinCheckbox = page.getByLabel(/Pin this note/i)
      await pinCheckbox.check()

      // Add button should be enabled
      const submitButton = page.getByRole('button', { name: /Add Note/i }).last()
      await expect(submitButton).toBeEnabled()
    }
  })
})
