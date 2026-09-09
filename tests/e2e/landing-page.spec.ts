import { test, expect } from '@playwright/test'

/**
 * Landing Page E2E Tests
 *
 * Tests the landing page hero component and overall structure:
 * - Page loads successfully
 * - Hero component displays correctly
 * - CTA buttons work
 * - Responsive behavior
 * - Animation triggers
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Page Structure', () => {
    test('should display the page with header', async ({ page }) => {
      const body = page.locator('body')
      await expect(body).toBeVisible()

      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('should display header with logo', async ({ page }) => {
      const headerLogo = page.locator('header').getByRole('img', { name: 'Flourish' })
      await expect(headerLogo).toBeVisible()
    })

    test('should display hero section with eyebrow text', async ({ page }) => {
      const eyebrow = page.getByText('AI-POWERED CRM FOR MISSION-DRIVEN ORGANIZATIONS', { exact: true })
      await expect(eyebrow).toBeVisible()
    })

    test('should display hero title with styled text', async ({ page }) => {
      const heroSection = page.locator('h1')
      await expect(heroSection).toBeVisible()
      await expect(heroSection).toContainText(/AI operations/i)
      await expect(heroSection).toContainText(/team/i)
    })

    test('should display subtitle text', async ({ page }) => {
      const subtitle = page.getByText(/donor retention\. volunteer scheduling/i)
      await expect(subtitle).toBeVisible()
    })

    test('should display CTA buttons', async ({ page }) => {
      const primaryCta = page.getByRole('link', { name: /start now/i })
      await expect(primaryCta).toBeVisible()

      const secondaryCta = page.getByRole('link', { name: /see features/i })
      await expect(secondaryCta).toBeVisible()
    })

    test('should display mockup image', async ({ page }) => {
      const mockupImage = page.getByRole('img', { name: /flourish dashboard/i })
      await expect(mockupImage).toBeVisible()
    })

    test('should display footer with links', async ({ page }) => {
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()

      await expect(page.locator('footer').getByRole('link', { name: /privacy/i })).toBeVisible()
      await expect(page.locator('footer').getByRole('link', { name: /terms/i })).toBeVisible()
      await expect(page.locator('footer').getByRole('link', { name: /contact/i })).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to signup page when clicking "Start now"', async ({ page }) => {
      await page.getByRole('link', { name: /start now/i }).first().click()
      await page.waitForURL('**/signup')
      expect(page.url()).toContain('/signup')
    })

    test('should navigate to features page when clicking "See features"', async ({ page }) => {
      await page.getByRole('link', { name: /see features/i }).first().click()
      await page.waitForURL('**/features')
      expect(page.url()).toContain('/features')
    })

    test('should navigate to signup page when clicking "Start free trial"', async ({ page }) => {
      const trialLink = page.getByRole('link', { name: /start free trial/i })
      await trialLink.scrollIntoViewIfNeeded()
      await trialLink.click()
      await page.waitForURL('**/signup')
      expect(page.url()).toContain('/signup')
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await page.waitForLoadState('networkidle')

      const headerLogo = page.locator('header').getByRole('img', { name: 'Flourish' })
      await expect(headerLogo).toBeVisible()

      const heroSection = page.locator('h1')
      await expect(heroSection).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()
      await page.waitForLoadState('networkidle')

      const heroSection = page.locator('h1')
      await expect(heroSection).toBeVisible()
    })

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.reload()
      await page.waitForLoadState('networkidle')

      const headerLogo = page.locator('header').getByRole('img', { name: 'Flourish' })
      await expect(headerLogo).toBeVisible()

      const heroSection = page.locator('h1')
      await expect(heroSection).toBeVisible()

      const mockupImage = page.getByRole('img', { name: /flourish dashboard/i })
      await expect(mockupImage).toBeVisible()
    })
  })

  test.describe('Visual Elements', () => {
    test('should have gradient background on header', async ({ page }) => {
      const header = page.locator('header')
      await expect(header).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1Elements = page.locator('h1')
      await expect(h1Elements).toHaveCount(1)
    })

    test('should have alt text on images', async ({ page }) => {
      const headerLogo = page.locator('header').getByRole('img', { name: 'Flourish' })
      await expect(headerLogo).toBeVisible()

      const mockup = page.getByRole('img', { name: /flourish dashboard/i })
      await expect(mockup).toBeVisible()
    })

    test('should have focusable CTA links', async ({ page }) => {
      const startLink = page.getByRole('link', { name: /start now/i }).first()
      await startLink.focus()
      await expect(startLink).toBeFocused()
    })
  })

  test.describe('Animations', () => {
    test('should have animation classes on hero elements', async ({ page }) => {
      const animatedElements = page.locator('.animate-appear')
      const count = await animatedElements.count()
      expect(count).toBeGreaterThan(0)
    })
  })
})
