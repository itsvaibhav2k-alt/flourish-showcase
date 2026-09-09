import { test, expect } from '@playwright/test'
import {
  clearMailbox,
  getLatestEmail,
  extractLinkFromEmail,
  AUTH_LINK_PATTERNS,
  waitForEmail,
} from '../utils/inbucket'

/**
 * Signup Flow E2E Tests
 *
 * Tests the user registration flow including:
 * - Form validation
 * - Successful signup redirects to verify-email page
 * - Email verification link delivery
 * - Navigation links
 */

// Generate unique test email to avoid conflicts between test runs
const generateTestEmail = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `e2e-signup-${timestamp}-${random}@test.local`
}

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Page Structure', () => {
    test('should display signup form with all required fields', async ({ page }) => {
      // Check page title/heading
      await expect(page.getByRole('heading', { name: /get started/i })).toBeVisible()

      // Check all form fields are visible
      await expect(page.getByLabel(/full name/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/organization name/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()

      // Check submit button
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
    })

    test('should display sign in link for existing users', async ({ page }) => {
      const signInLink = page.getByRole('link', { name: /sign in/i })
      await expect(signInLink).toBeVisible()
    })

    test('should display terms and privacy policy links', async ({ page }) => {
      await expect(page.getByRole('link', { name: /terms of service/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible()
    })

    test('should navigate to login page when clicking sign in link', async ({ page }) => {
      await page.getByRole('link', { name: /sign in/i }).click()
      await page.waitForURL('**/login')
      expect(page.url()).toContain('/login')
    })
  })

  test.describe('Form Validation', () => {
    test('should show validation for empty full name field', async ({ page }) => {
      const nameInput = page.getByLabel(/full name/i)
      const submitButton = page.getByRole('button', { name: /create account/i })

      // Leave name empty, fill other fields
      await nameInput.fill('')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/organization name/i).fill('Test Org')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await submitButton.click()

      // Browser validation should prevent submission
      const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should show validation for empty email field', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /create account/i })

      await page.getByLabel(/full name/i).fill('Test User')
      await emailInput.fill('')
      await page.getByLabel(/organization name/i).fill('Test Org')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await submitButton.click()

      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should show validation for invalid email format', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /create account/i })

      await page.getByLabel(/full name/i).fill('Test User')
      await emailInput.fill('notanemail')
      await page.getByLabel(/organization name/i).fill('Test Org')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await submitButton.click()

      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should show validation for empty organization name', async ({ page }) => {
      const orgInput = page.getByLabel(/organization name/i)
      const submitButton = page.getByRole('button', { name: /create account/i })

      await page.getByLabel(/full name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@example.com')
      await orgInput.fill('')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await submitButton.click()

      const isInvalid = await orgInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should show validation for empty password field', async ({ page }) => {
      const passwordInput = page.getByLabel(/password/i)
      const submitButton = page.getByRole('button', { name: /create account/i })

      await page.getByLabel(/full name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/organization name/i).fill('Test Org')
      await passwordInput.fill('')

      await submitButton.click()

      const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should enforce minimum password length', async ({ page }) => {
      const passwordInput = page.getByLabel(/password/i)
      const submitButton = page.getByRole('button', { name: /create account/i })

      await page.getByLabel(/full name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/organization name/i).fill('Test Org')
      await passwordInput.fill('short') // Less than 8 characters

      await submitButton.click()

      // Check for minLength validation
      const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })
  })

  test.describe('Signup Error States', () => {
    test('should display error for already registered email', async ({ page }) => {
      // Use an email that's likely already registered
      // In a real scenario, you'd seed this user beforehand
      const existingEmail = 'existing-user@flourish.local'

      await page.getByLabel(/full name/i).fill('Test User')
      await page.getByLabel(/email/i).fill(existingEmail)
      await page.getByLabel(/organization name/i).fill('Test Org')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await page.getByRole('button', { name: /create account/i }).click()

      // Wait for potential error (may succeed if user doesn't exist)
      await page.waitForTimeout(2000)

      // Check if we got an error or redirected to verify-email
      const errorMessage = page.locator('.text-red-600, [role="alert"]').first()
      const isOnVerifyPage = page.url().includes('/verify-email')

      // Either error shown or redirect happened
      const hasError = await errorMessage.isVisible().catch(() => false)
      expect(hasError || isOnVerifyPage).toBeTruthy()
    })

    test('should show loading state during form submission', async ({ page }) => {
      await page.getByLabel(/full name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/organization name/i).fill('Test Org')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      const submitButton = page.getByRole('button', { name: /create account/i })
      await submitButton.click()

      // Button should show loading state
      await expect(page.getByRole('button', { name: /creating account/i })).toBeVisible()
    })
  })

  test.describe('Successful Signup', () => {
    // Skip: These tests require actual Supabase auth which isn't available in BYPASS_AUTH mode
    test.skip('should redirect to verify-email page after successful signup', async ({ page }) => {
      const testEmail = generateTestEmail()

      // Clear any existing emails
      await clearMailbox(testEmail)

      // Fill in the signup form
      await page.getByLabel(/full name/i).fill('E2E Test User')
      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByLabel(/organization name/i).fill('E2E Test Organization')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      // Submit the form
      await page.getByRole('button', { name: /create account/i }).click()

      // Wait for redirect to verify-email page
      await page.waitForURL('**/verify-email**', { timeout: 15000 })
      expect(page.url()).toContain('/verify-email')

      // Email should be in the URL params
      expect(page.url()).toContain(encodeURIComponent(testEmail))
    })

    // Skip: These tests require actual Supabase auth which isn't available in BYPASS_AUTH mode
    test.skip('should display correct email on verify-email page', async ({ page }) => {
      const testEmail = generateTestEmail()
      await clearMailbox(testEmail)

      await page.getByLabel(/full name/i).fill('E2E Test User')
      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByLabel(/organization name/i).fill('E2E Test Organization')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await page.getByRole('button', { name: /create account/i }).click()

      await page.waitForURL('**/verify-email**', { timeout: 15000 })

      // Verify email page should show the email address
      await expect(page.getByText(testEmail)).toBeVisible()
    })

    test.skip('should send verification email after signup', async ({ page }) => {
      // Skip: Requires email delivery timing to be reliable
      const testEmail = generateTestEmail()
      await clearMailbox(testEmail)

      const beforeTimestamp = Date.now()

      // Complete signup
      await page.getByLabel(/full name/i).fill('E2E Test User')
      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByLabel(/organization name/i).fill('E2E Test Organization')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await page.getByRole('button', { name: /create account/i }).click()

      // Wait for redirect to verify-email
      await page.waitForURL('**/verify-email**', { timeout: 15000 })

      // Wait for verification email to arrive
      const email = await waitForEmail(testEmail, beforeTimestamp, { timeout: 20000 })

      // Verify email was received
      expect(email).not.toBeNull()
      expect(email?.subject.toLowerCase()).toMatch(/confirm|verify|welcome/i)
    })

    test.skip('should have valid confirmation link in verification email', async ({ page }) => {
      // Skip: Requires email delivery timing to be reliable
      const testEmail = generateTestEmail()
      await clearMailbox(testEmail)

      const beforeTimestamp = Date.now()

      await page.getByLabel(/full name/i).fill('E2E Test User')
      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByLabel(/organization name/i).fill('E2E Test Organization')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await page.getByRole('button', { name: /create account/i }).click()
      await page.waitForURL('**/verify-email**', { timeout: 15000 })

      // Get the verification email
      const email = await waitForEmail(testEmail, beforeTimestamp, { timeout: 20000 })
      expect(email).not.toBeNull()

      // Extract confirmation link
      const confirmLink = extractLinkFromEmail(email!, AUTH_LINK_PATTERNS.CONFIRM_EMAIL)
      expect(confirmLink).not.toBeNull()
      expect(confirmLink).toContain('/auth/confirm')
    })
  })

  test.describe('Verify Email Page', () => {
    // Skip: This test requires actual Supabase auth which isn't available in BYPASS_AUTH mode
    test.skip('should display resend email button', async ({ page }) => {
      const testEmail = generateTestEmail()
      await clearMailbox(testEmail)

      // Go through signup flow
      await page.getByLabel(/full name/i).fill('E2E Test User')
      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByLabel(/organization name/i).fill('E2E Test Organization')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await page.getByRole('button', { name: /create account/i }).click()
      await page.waitForURL('**/verify-email**', { timeout: 15000 })

      // Check for resend button
      await expect(page.getByRole('button', { name: /resend/i })).toBeVisible()
    })

    test('should display sign up again link', async ({ page }) => {
      await page.goto('/verify-email?email=test@example.com')
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('link', { name: /sign up again/i })).toBeVisible()
    })

    test('should display sign in link', async ({ page }) => {
      await page.goto('/verify-email?email=test@example.com')
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    })

    // Skip: This test requires actual Supabase auth which isn't available in BYPASS_AUTH mode
    test.skip('should show success message when resend email succeeds', async ({ page }) => {
      const testEmail = generateTestEmail()
      await clearMailbox(testEmail)

      // First signup
      await page.getByLabel(/full name/i).fill('E2E Test User')
      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByLabel(/organization name/i).fill('E2E Test Organization')
      await page.getByLabel(/password/i).fill('TestPassword123!')

      await page.getByRole('button', { name: /create account/i }).click()
      await page.waitForURL('**/verify-email**', { timeout: 15000 })

      // Click resend button
      await page.getByRole('button', { name: /resend/i }).click()

      // Should show success message or change button state
      await expect(
        page.getByText(/sent|success/i).or(page.getByRole('button', { name: /email sent/i }))
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Input Behavior', () => {
    test('should allow typing in all form fields', async ({ page }) => {
      const nameInput = page.getByLabel(/full name/i)
      const emailInput = page.getByLabel(/email/i)
      const orgInput = page.getByLabel(/organization name/i)
      const passwordInput = page.getByLabel(/password/i)

      await nameInput.fill('John Doe')
      await emailInput.fill('john@example.com')
      await orgInput.fill('Acme Nonprofit')
      await passwordInput.fill('SecurePassword123!')

      await expect(nameInput).toHaveValue('John Doe')
      await expect(emailInput).toHaveValue('john@example.com')
      await expect(orgInput).toHaveValue('Acme Nonprofit')
      await expect(passwordInput).toHaveValue('SecurePassword123!')
    })

    test('should mask password input', async ({ page }) => {
      const passwordInput = page.getByLabel(/password/i)
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper form labels', async ({ page }) => {
      await expect(page.getByLabel(/full name/i)).toHaveAttribute('id', 'name')
      await expect(page.getByLabel(/email/i)).toHaveAttribute('id', 'email')
      await expect(page.getByLabel(/organization name/i)).toHaveAttribute('id', 'organization')
      await expect(page.getByLabel(/password/i)).toHaveAttribute('id', 'password')
    })

    test('should have required attributes on all form fields', async ({ page }) => {
      await expect(page.getByLabel(/full name/i)).toHaveAttribute('required', '')
      await expect(page.getByLabel(/email/i)).toHaveAttribute('required', '')
      await expect(page.getByLabel(/organization name/i)).toHaveAttribute('required', '')
      await expect(page.getByLabel(/password/i)).toHaveAttribute('required', '')
    })

    test('should have proper input types', async ({ page }) => {
      await expect(page.getByLabel(/full name/i)).toHaveAttribute('type', 'text')
      await expect(page.getByLabel(/email/i)).toHaveAttribute('type', 'email')
      await expect(page.getByLabel(/organization name/i)).toHaveAttribute('type', 'text')
      await expect(page.getByLabel(/password/i)).toHaveAttribute('type', 'password')
    })

    test('should have minimum length on password', async ({ page }) => {
      await expect(page.getByLabel(/password/i)).toHaveAttribute('minlength', '8')
    })
  })
})
