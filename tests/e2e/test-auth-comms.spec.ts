import { test, expect } from '@playwright/test';

test.describe('Communications Page (Authenticated)', () => {
  test('should load communications without hydration errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // With BYPASS_AUTH, navigate directly to communications
    await page.goto('/communications');
    await page.waitForLoadState('networkidle');

    // Verify the page loaded (should have tabs or content)
    await expect(page.locator('main')).toBeVisible();

    // Navigate to review queue
    await page.goto('/communications/review');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();

    // Check for hydration errors
    const hydrationErrors = errors.filter(e =>
      e.includes('418') || e.includes('Hydration') || e.includes('hydration')
    );
    expect(hydrationErrors).toHaveLength(0);
  });
});
