import { test, expect } from '@playwright/test';

test.describe('Communications Page', () => {
  test('should load communications page without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the communications page
    await page.goto('/communications');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page title is visible
    await expect(page.locator('h1')).toContainText('Communications');

    // Check no React hydration errors
    const hydrationErrors = errors.filter(e => e.includes('418') || e.includes('Hydration'));
    expect(hydrationErrors).toHaveLength(0);
  });

  test('should load review queue without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/communications/review');
    await page.waitForLoadState('networkidle');

    // Check that review queue heading is visible
    await expect(page.locator('h1')).toContainText('Review Queue');

    // Check no React hydration errors
    const hydrationErrors = errors.filter(e => e.includes('418') || e.includes('Hydration'));
    expect(hydrationErrors).toHaveLength(0);
  });
});
