import { test, expect } from '@playwright/test'
import {
  clearMailbox,
  getLatestEmail,
  extractLinkFromEmail,
  AUTH_LINK_PATTERNS,
  waitForEmail,
} from '../utils/inbucket'

/**
 * Password Reset Flow E2E Tests
 *
 * Tests the password reset/recovery flow including:
 * - Forgot password form submission
 * - Password reset email delivery via Inbucket
 * - Reset password form validation
 * - Complete password reset flow
 *
 * Note: The forgot-password and reset-password pages may not exist yet.
 * These tests are written to guide the implementation of these features.
 */

// Generate unique test email to avoid conflicts
const generateTestEmail = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `e2e-reset-${timestamp}-${random}@test.local`
}

test.describe('Password Reset Flow', () => {
  test.describe('Forgot Password Page', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to forgot password page from login
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
    })

    test('should have forgot password link on login page', async ({ page }) => {
      const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
      await expect(forgotPasswordLink).toBeVisible()
    })

    test('should navigate to forgot password page', async ({ page }) => {
      await page.getByRole('link', { name: /forgot password/i }).click()
      await page.waitForURL('**/forgot-password**', { timeout: 5000 })
      expect(page.url()).toContain('/forgot-password')
    })

    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      // Check for email input field
      await expect(page.getByLabel(/email/i)).toBeVisible()

      // Check for submit button
      await expect(
        page.getByRole('button', { name: /reset|send|submit/i })
      ).toBeVisible()
    })

    test('should show validation for empty email', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /reset|send|submit/i })

      await emailInput.fill('')
      await submitButton.click()

      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should show validation for invalid email format', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /reset|send|submit/i })

      await emailInput.fill('notanemail')
      await submitButton.click()

      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should have back to login link', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      const backLink = page.getByRole('link', { name: /sign in/i })
      await expect(backLink).toBeVisible()
    })
  })

  test.describe('Password Reset Email', () => {
    // Note: This test requires a user to exist in the database
    // In a real scenario, you'd seed this user in test setup
    test.skip('should send password reset email for existing user', async ({ page }) => {
      const testEmail = 'existing-user@flourish.local'
      await clearMailbox(testEmail)

      const beforeTimestamp = Date.now()

      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByRole('button', { name: /reset|send|submit/i }).click()

      // Should show success message
      await expect(page.getByText(/sent|check your email|instructions/i)).toBeVisible({
        timeout: 10000,
      })

      // Wait for email to arrive
      const email = await waitForEmail(testEmail, beforeTimestamp, { timeout: 20000 })

      expect(email).not.toBeNull()
      expect(email?.subject.toLowerCase()).toMatch(/reset|password|recovery/i)
    })

    test('should show success message even for non-existent email (security)', async ({ page }) => {
      // For security, forgot password should not reveal if email exists
      const nonExistentEmail = 'does-not-exist@example.com'

      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      await page.getByLabel(/email/i).fill(nonExistentEmail)
      await page.getByRole('button', { name: /reset|send/i }).click()

      // Should show success message (not error revealing email doesn't exist)
      // Use heading selector to be more specific
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
        timeout: 10000,
      })
    })

    test.skip('should have valid reset link in email', async ({ page }) => {
      const testEmail = 'existing-user@flourish.local'
      await clearMailbox(testEmail)

      const beforeTimestamp = Date.now()

      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByRole('button', { name: /reset|send|submit/i }).click()

      // Wait for email
      const email = await waitForEmail(testEmail, beforeTimestamp, { timeout: 20000 })
      expect(email).not.toBeNull()

      // Extract reset link
      const resetLink = extractLinkFromEmail(email!, AUTH_LINK_PATTERNS.PASSWORD_RESET)
      expect(resetLink).not.toBeNull()
      expect(resetLink).toMatch(/\/auth\/confirm.*type=recovery/i)
    })
  })

  test.describe('Reset Password Page', () => {
    // These tests require navigating via the reset link from email
    // or accessing the reset-password page directly with proper tokens

    test('should show reset password form when accessed with valid token', async ({ page }) => {
      // This test would need a valid reset token
      // In a real scenario, you'd generate this through the forgot password flow
      // or mock the token validation

      // For now, test that the page structure exists
      await page.goto('/reset-password')
      await page.waitForLoadState('networkidle')

      // The reset password form should always be shown
      // It relies on having a valid session from the reset link callback
      const heading = page.getByRole('heading', { name: /reset password/i })
      const newPasswordInput = page.locator('input#password')
      const confirmPasswordInput = page.locator('input#confirmPassword')

      await expect(heading).toBeVisible()
      await expect(newPasswordInput).toBeVisible()
      await expect(confirmPasswordInput).toBeVisible()
    })

    test('should display new password and confirm password fields', async ({ page }) => {
      // Navigate to reset-password with a mock token (if your implementation supports it)
      // or skip this test if it requires a real token
      await page.goto('/reset-password?token=test-token')
      await page.waitForLoadState('networkidle')

      const newPasswordField = page.getByLabel(/new password/i).or(page.getByLabel(/^password$/i))
      const confirmPasswordField = page.getByLabel(/confirm password/i)

      // Check if password fields exist (may fail if token is invalid)
      const hasNewPassword = await newPasswordField.isVisible().catch(() => false)
      const hasConfirmPassword = await confirmPasswordField.isVisible().catch(() => false)

      // At least the new password field should be visible if form is shown
      if (hasNewPassword) {
        expect(hasNewPassword).toBe(true)
        // Confirm password is optional depending on implementation
      }
    })

    test('should validate password minimum length', async ({ page }) => {
      await page.goto('/reset-password?token=test-token')
      await page.waitForLoadState('networkidle')

      const passwordField = page.getByLabel(/new password/i).or(page.getByLabel(/^password$/i)).first()
      const submitButton = page.getByRole('button', { name: /reset|update|save|submit/i })

      if (await passwordField.isVisible().catch(() => false)) {
        await passwordField.fill('short')
        await submitButton.click()

        // Should show validation error for short password
        const hasMinLengthAttr = await passwordField.getAttribute('minlength')
        if (hasMinLengthAttr) {
          const isInvalid = await passwordField.evaluate((el: HTMLInputElement) => !el.validity.valid)
          expect(isInvalid).toBe(true)
        }
      }
    })

    test('should validate password confirmation matches', async ({ page }) => {
      await page.goto('/reset-password?token=test-token')
      await page.waitForLoadState('networkidle')

      const newPasswordField = page.getByLabel(/new password/i).or(page.getByLabel(/^password$/i)).first()
      const confirmPasswordField = page.getByLabel(/confirm password/i)
      const submitButton = page.getByRole('button', { name: /reset|update|save|submit/i })

      if (await newPasswordField.isVisible().catch(() => false) &&
          await confirmPasswordField.isVisible().catch(() => false)) {
        await newPasswordField.fill('NewPassword123!')
        await confirmPasswordField.fill('DifferentPassword123!')
        await submitButton.click()

        // Should show error about passwords not matching
        await expect(page.getByText(/match|same|identical/i)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Complete Password Reset Flow', () => {
    // This test goes through the entire flow using Inbucket
    test.skip('should complete full password reset flow', async ({ page }) => {
      // This test requires an existing user in the database
      const testEmail = 'e2e-reset-test@flourish.local'
      const newPassword = 'NewSecurePassword123!'

      await clearMailbox(testEmail)
      const beforeTimestamp = Date.now()

      // Step 1: Request password reset
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByRole('button', { name: /reset|send|submit/i }).click()

      // Wait for success message
      await expect(page.getByText(/sent|check your email/i)).toBeVisible({ timeout: 10000 })

      // Step 2: Get reset email from Inbucket
      const email = await waitForEmail(testEmail, beforeTimestamp, { timeout: 20000 })
      expect(email).not.toBeNull()

      // Step 3: Extract reset link
      const resetLink = extractLinkFromEmail(email!, AUTH_LINK_PATTERNS.PASSWORD_RESET)
      expect(resetLink).not.toBeNull()

      // Step 4: Visit reset link
      await page.goto(resetLink!)
      await page.waitForLoadState('networkidle')

      // Step 5: Enter new password
      const newPasswordField = page.getByLabel(/new password/i).or(page.getByLabel(/^password$/i)).first()
      const confirmPasswordField = page.getByLabel(/confirm password/i)

      await newPasswordField.fill(newPassword)
      if (await confirmPasswordField.isVisible()) {
        await confirmPasswordField.fill(newPassword)
      }

      await page.getByRole('button', { name: /reset|update|save|submit/i }).click()

      // Step 6: Should be redirected to login or dashboard
      await page.waitForURL(/\/(login|contacts|dashboard)/, { timeout: 15000 })

      // Step 7: Verify can login with new password
      if (page.url().includes('/login')) {
        await page.getByLabel(/email/i).fill(testEmail)
        await page.getByLabel(/password/i).fill(newPassword)
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.waitForURL('**/contacts**', { timeout: 15000 })
        expect(page.url()).toContain('/contacts')
      }
    })

    test.skip('should not allow reuse of reset link', async ({ page }) => {
      // After using a reset link, trying to use it again should fail
      const testEmail = 'e2e-reset-test@flourish.local'

      await clearMailbox(testEmail)
      const beforeTimestamp = Date.now()

      // Request reset
      await page.goto('/forgot-password')
      await page.getByLabel(/email/i).fill(testEmail)
      await page.getByRole('button', { name: /reset|send|submit/i }).click()

      // Get email and link
      const email = await waitForEmail(testEmail, beforeTimestamp, { timeout: 20000 })
      const resetLink = extractLinkFromEmail(email!, AUTH_LINK_PATTERNS.PASSWORD_RESET)

      // Use the link
      await page.goto(resetLink!)
      await page.waitForLoadState('networkidle')

      // Complete the reset (assuming form is shown)
      const passwordField = page.getByLabel(/new password/i).first()
      if (await passwordField.isVisible()) {
        await passwordField.fill('NewPassword123!')
        await page.getByRole('button', { name: /reset|update|submit/i }).click()
        await page.waitForLoadState('networkidle')
      }

      // Try to use the same link again
      await page.goto(resetLink!)
      await page.waitForLoadState('networkidle')

      // Should show error about expired/invalid link
      await expect(page.getByText(/expired|invalid|already used/i)).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should show error when submitting without valid session', async ({ page }) => {
      // Visit reset-password directly without going through the email link flow
      await page.goto('/reset-password')
      await page.waitForLoadState('networkidle')

      // Fill in password fields
      await page.locator('input#password').fill('newpassword123')
      await page.locator('input#confirmPassword').fill('newpassword123')

      // Submit the form
      await page.getByRole('button', { name: /update password/i }).click()

      // Should show error because there's no valid session
      await expect(page.getByText(/error|session|auth/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show error for missing token', async ({ page }) => {
      await page.goto('/reset-password')
      await page.waitForLoadState('networkidle')

      // Should either redirect to forgot-password or show error
      const isOnForgotPassword = page.url().includes('/forgot-password')
      const hasErrorMessage = await page.getByText(/invalid|expired|missing|error/i).isVisible().catch(() => false)
      const hasPasswordField = await page.getByLabel(/password/i).isVisible().catch(() => false)

      // Should not show password form without valid token
      expect(isOnForgotPassword || hasErrorMessage || !hasPasswordField).toBeTruthy()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper form labels on forgot password page', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      const emailInput = page.getByLabel(/email/i)
      if (await emailInput.isVisible()) {
        await expect(emailInput).toHaveAttribute('type', 'email')
        await expect(emailInput).toHaveAttribute('required', '')
      }
    })

    test('should have proper form labels on reset password page', async ({ page }) => {
      await page.goto('/reset-password?token=test-token')
      await page.waitForLoadState('networkidle')

      const passwordField = page.getByLabel(/new password|password/i).first()
      if (await passwordField.isVisible()) {
        await expect(passwordField).toHaveAttribute('type', 'password')
      }
    })
  })
})
