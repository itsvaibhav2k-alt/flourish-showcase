import { Resend } from 'resend'

// Lazy-initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export interface SendEmailParams {
  to: string
  subject: string
  body: string
  from?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend
 * @param params Email parameters
 * @returns Result with success status and message ID or error
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    const { to, subject, body, from, replyTo } = params

    // Always use verified domain for sending - Resend requires domain verification
    const verifiedFromEmail = 'noreply@flourishnpo.com'

    // Helper to validate email domain
    const isVerifiedDomain = (email: string | undefined): boolean => {
      if (!email) return false
      const domain = email.split('@')[1]?.toLowerCase()
      return domain === 'flourishnpo.com'
    }

    // Determine safe from email - ALWAYS validate, even env vars
    let fromAddress = verifiedFromEmail // Start with verified domain

    // Check if from parameter is valid
    if (from && isVerifiedDomain(from)) {
      fromAddress = from
    }
    // Check if env var is valid (but only if no valid from provided)
    else if (!from && process.env.RESEND_FROM_EMAIL && isVerifiedDomain(process.env.RESEND_FROM_EMAIL)) {
      fromAddress = process.env.RESEND_FROM_EMAIL
    }
    // Log warning if invalid domain was attempted
    else if (from || process.env.RESEND_FROM_EMAIL) {
      const attemptedEmail = from || process.env.RESEND_FROM_EMAIL
      console.warn(`Invalid from email domain: ${attemptedEmail}. Using verified domain: ${verifiedFromEmail}`)
    }

    const response = await getResendClient().emails.send({
      from: fromAddress,
      to,
      subject,
      html: body,
      replyTo,
    })

    if (response.error) {
      console.error('Resend error:', response.error)
      return {
        success: false,
        error: response.error.message,
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send multiple emails in batch
 * @param emails Array of email parameters
 * @returns Array of results
 */
export async function sendBatchEmails(
  emails: SendEmailParams[]
): Promise<SendEmailResult[]> {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  )

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Failed to send email',
      }
    }
  })
}
