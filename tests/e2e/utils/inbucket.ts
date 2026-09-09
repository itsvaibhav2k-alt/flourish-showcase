/**
 * Inbucket Email Testing Utilities
 *
 * Helpers for interacting with Inbucket API during E2E tests.
 * Inbucket is the local email service used by Supabase for development.
 *
 * Default Inbucket API: http://localhost:54324
 */

const INBUCKET_API_URL = process.env.INBUCKET_URL || 'http://localhost:54324'

interface InbucketHeader {
  name: string
  value: string
}

interface InbucketMessage {
  mailbox: string
  id: string
  from: string
  subject: string
  date: string
  size: number
  'posix-millis': number
  seen: boolean
}

interface InbucketMessageBody {
  mailbox: string
  id: string
  from: string
  subject: string
  date: string
  size: number
  body: {
    text: string
    html: string
  }
  headers: InbucketHeader[]
}

/**
 * Extract mailbox name from email address
 * Inbucket uses the local part of the email as the mailbox name
 */
function getMailboxName(email: string): string {
  return email.split('@')[0]
}

/**
 * Fetch all messages in a mailbox
 */
async function getMailboxMessages(email: string): Promise<InbucketMessage[]> {
  const mailbox = getMailboxName(email)
  const response = await fetch(`${INBUCKET_API_URL}/api/v1/mailbox/${mailbox}`)

  if (!response.ok) {
    if (response.status === 404) {
      return []
    }
    throw new Error(`Failed to fetch mailbox: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch full message details including body
 */
async function getMessage(email: string, messageId: string): Promise<InbucketMessageBody> {
  const mailbox = getMailboxName(email)
  const response = await fetch(`${INBUCKET_API_URL}/api/v1/mailbox/${mailbox}/${messageId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch message: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get the most recent email for a given email address
 *
 * @param email - The email address to check
 * @param options - Optional configuration
 * @param options.timeout - Maximum time to wait for email (default: 10000ms)
 * @param options.pollInterval - How often to check for new emails (default: 500ms)
 * @returns The latest email message body, or null if no emails found
 */
export async function getLatestEmail(
  email: string,
  options: { timeout?: number; pollInterval?: number } = {}
): Promise<InbucketMessageBody | null> {
  const { timeout = 10000, pollInterval = 500 } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const messages = await getMailboxMessages(email)

    if (messages.length > 0) {
      // Sort by date descending and get the most recent
      const sorted = messages.sort((a, b) => b['posix-millis'] - a['posix-millis'])
      const latestMessage = sorted[0]

      return getMessage(email, latestMessage.id)
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  return null
}

/**
 * Wait for a new email to arrive after a specific timestamp
 *
 * @param email - The email address to check
 * @param afterTimestamp - Only return emails received after this timestamp
 * @param options - Optional configuration
 * @returns The new email message body, or null if timeout
 */
export async function waitForEmail(
  email: string,
  afterTimestamp: number,
  options: { timeout?: number; pollInterval?: number } = {}
): Promise<InbucketMessageBody | null> {
  const { timeout = 15000, pollInterval = 500 } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const messages = await getMailboxMessages(email)

    // Find messages received after the given timestamp
    const newMessages = messages.filter((m) => m['posix-millis'] > afterTimestamp)

    if (newMessages.length > 0) {
      const sorted = newMessages.sort((a, b) => b['posix-millis'] - a['posix-millis'])
      return getMessage(email, sorted[0].id)
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  return null
}

/**
 * Extract a link from an email body that matches the given pattern
 *
 * @param email - The email message body object
 * @param linkPattern - A RegExp pattern to match the desired link
 * @returns The matched URL, or null if not found
 *
 * @example
 * // Extract Supabase auth confirmation link
 * const link = extractLinkFromEmail(email, AUTH_LINK_PATTERNS.confirm)
 *
 * @example
 * // Extract password reset link
 * const link = extractLinkFromEmail(email, AUTH_LINK_PATTERNS.recovery)
 */
export function extractLinkFromEmail(
  email: InbucketMessageBody,
  linkPattern: RegExp
): string | null {
  // Try HTML body first (more reliable for links)
  if (email.body.html) {
    const htmlMatch = email.body.html.match(linkPattern)
    if (htmlMatch) {
      return cleanExtractedLink(htmlMatch[0])
    }
  }

  // Fall back to text body
  if (email.body.text) {
    const textMatch = email.body.text.match(linkPattern)
    if (textMatch) {
      return cleanExtractedLink(textMatch[0])
    }
  }

  return null
}

/**
 * Clean up an extracted link by removing trailing characters
 */
function cleanExtractedLink(link: string): string {
  // Remove trailing quotes, brackets, or whitespace that might have been captured
  return link.replace(/["'<>\s]+$/, '')
}

/**
 * Extract all links from an email body
 *
 * @param email - The email message body object
 * @returns Array of all URLs found in the email
 */
export function extractAllLinksFromEmail(email: InbucketMessageBody): string[] {
  const links: Set<string> = new Set()
  const urlPattern = /https?:\/\/[^\s"'<>]+/g

  if (email.body.html) {
    const htmlMatches = email.body.html.match(urlPattern)
    if (htmlMatches) {
      htmlMatches.forEach((link) => links.add(cleanExtractedLink(link)))
    }
  }

  if (email.body.text) {
    const textMatches = email.body.text.match(urlPattern)
    if (textMatches) {
      textMatches.forEach((link) => links.add(cleanExtractedLink(link)))
    }
  }

  return Array.from(links)
}

/**
 * Clear all emails in a mailbox
 *
 * Use this in test setup to ensure a clean state
 *
 * @param email - The email address whose mailbox should be cleared
 */
export async function clearMailbox(email: string): Promise<void> {
  const mailbox = getMailboxName(email)
  const response = await fetch(`${INBUCKET_API_URL}/api/v1/mailbox/${mailbox}`, {
    method: 'DELETE',
  })

  // 200 OK or 404 Not Found are both acceptable (mailbox might not exist yet)
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to clear mailbox: ${response.statusText}`)
  }
}

/**
 * Delete a specific email message
 *
 * @param email - The email address
 * @param messageId - The ID of the message to delete
 */
export async function deleteMessage(email: string, messageId: string): Promise<void> {
  const mailbox = getMailboxName(email)
  const response = await fetch(`${INBUCKET_API_URL}/api/v1/mailbox/${mailbox}/${messageId}`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete message: ${response.statusText}`)
  }
}

/**
 * Get count of emails in a mailbox
 *
 * @param email - The email address to check
 * @returns Number of emails in the mailbox
 */
export async function getEmailCount(email: string): Promise<number> {
  const messages = await getMailboxMessages(email)
  return messages.length
}

/**
 * Common regex patterns for Supabase auth emails
 */
export const AUTH_LINK_PATTERNS = {
  /**
   * Matches email confirmation/verification links
   * e.g., http://localhost:3000/auth/confirm?token_hash=...&type=signup
   */
  CONFIRM_EMAIL: /https?:\/\/[^\s"<]*\/auth\/confirm\?[^\s"<]*/,

  /**
   * Matches password recovery/reset links
   * e.g., http://localhost:3000/auth/confirm?token_hash=...&type=recovery
   */
  PASSWORD_RESET: /https?:\/\/[^\s"<]*\/auth\/confirm\?[^\s"<]*type=recovery[^\s"<]*/,

  /**
   * Matches magic link login links
   * e.g., http://localhost:3000/auth/confirm?token_hash=...&type=magiclink
   */
  MAGIC_LINK: /https?:\/\/[^\s"<]*\/auth\/confirm\?[^\s"<]*type=magiclink[^\s"<]*/,

  /**
   * Matches email change confirmation links
   * e.g., http://localhost:3000/auth/confirm?token_hash=...&type=email_change
   */
  EMAIL_CHANGE: /https?:\/\/[^\s"<]*\/auth\/confirm\?[^\s"<]*type=email_change[^\s"<]*/,

  /**
   * Matches invite links
   * e.g., http://localhost:3000/auth/confirm?token_hash=...&type=invite
   */
  INVITE: /https?:\/\/[^\s"<]*\/auth\/confirm\?[^\s"<]*type=invite[^\s"<]*/,
}
