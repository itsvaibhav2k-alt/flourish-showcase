import { render } from '@react-email/render'
import { ThankYouEmail } from './thank-you'
import { VolunteerConfirmationEmail } from './volunteer-confirmation'
import { VolunteerReminderEmail } from './volunteer-reminder'
import { VolunteerThankYouEmail } from './volunteer-thank-you'
import { ReengagementEmail } from './reengagement'
import { AuthVerificationEmail } from './auth-verification'
import { AuthMagicLinkEmail } from './auth-magic-link'
import { AuthPasswordResetEmail } from './auth-password-reset'
import { TeamInviteEmail } from './team-invite'

export type EmailType =
  | 'thank_you'
  | 'volunteer_confirmation'
  | 'volunteer_reminder'
  | 'volunteer_thank_you'
  | 'reengagement'
  | 'auth_verification'
  | 'auth_magic_link'
  | 'auth_password_reset'
  | 'team_invite'

export interface BaseEmailProps {
  body: string
  orgName: string
}

export interface ThankYouEmailData extends BaseEmailProps {
  donorName: string
  amount: number
  giftDate?: string
  signerName?: string
  signerTitle?: string
  websiteUrl?: string
}

export interface VolunteerConfirmationEmailData extends BaseEmailProps {
  volunteerName: string
  shiftTitle: string
  shiftDate: string
  shiftTime: string
  location?: string
  shiftDetailsUrl?: string
}

export interface VolunteerReminderEmailData {
  volunteerName: string
  orgName: string
  shiftTitle: string
  shiftDate: string
  shiftTime: string
  location?: string
  reminderType: '7day' | '1day' | 'morning'
  shiftDetailsUrl?: string
}

export interface VolunteerThankYouEmailData extends BaseEmailProps {
  volunteerName: string
  shiftTitle: string
  shiftDate: string
  hoursVolunteered?: number
  impactMessage?: string
}

export interface ReengagementEmailData extends BaseEmailProps {
  contactName: string
  lastInteractionDate?: string
  donationUrl?: string
  volunteerUrl?: string
}

export interface AuthVerificationEmailData {
  verificationUrl: string
  orgName?: string
}

export interface AuthMagicLinkEmailData {
  magicLinkUrl: string
  orgName?: string
}

export interface AuthPasswordResetEmailData {
  resetUrl: string
  orgName?: string
}

export interface TeamInviteEmailData {
  inviteUrl: string
  orgName: string
  inviterName: string
  inviterEmail: string
  role: 'admin' | 'member' | 'viewer'
}

export type EmailTemplateData =
  | ThankYouEmailData
  | VolunteerConfirmationEmailData
  | VolunteerReminderEmailData
  | VolunteerThankYouEmailData
  | ReengagementEmailData
  | AuthVerificationEmailData
  | AuthMagicLinkEmailData
  | AuthPasswordResetEmailData
  | TeamInviteEmailData

/**
 * Render an email template to HTML
 * @param type - The type of email template
 * @param data - The data to populate the template
 * @returns Rendered HTML string
 */
export async function renderEmailTemplate(
  type: EmailType,
  data: EmailTemplateData
): Promise<string> {
  try {
    switch (type) {
      case 'thank_you':
        return await render(ThankYouEmail(data as ThankYouEmailData))

      case 'volunteer_confirmation':
        return await render(
          VolunteerConfirmationEmail(data as VolunteerConfirmationEmailData)
        )

      case 'volunteer_reminder':
        return await render(VolunteerReminderEmail(data as VolunteerReminderEmailData))

      case 'volunteer_thank_you':
        return await render(
          VolunteerThankYouEmail(data as VolunteerThankYouEmailData)
        )

      case 'reengagement':
        return await render(ReengagementEmail(data as ReengagementEmailData))

      case 'auth_verification':
        return await render(AuthVerificationEmail(data as AuthVerificationEmailData))

      case 'auth_magic_link':
        return await render(AuthMagicLinkEmail(data as AuthMagicLinkEmailData))

      case 'auth_password_reset':
        return await render(AuthPasswordResetEmail(data as AuthPasswordResetEmailData))

      case 'team_invite':
        return await render(TeamInviteEmail(data as TeamInviteEmailData))

      default:
        throw new Error(`Unknown email type: ${type}`)
    }
  } catch (error) {
    console.error(`Error rendering email template ${type}:`, error)
    throw new Error(`Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if an email type supports React email templates
 * @param type - The email type to check
 * @returns True if the type has a React email template
 */
export function hasEmailTemplate(type: EmailType): boolean {
  return [
    'thank_you',
    'volunteer_confirmation',
    'volunteer_reminder',
    'volunteer_thank_you',
    'reengagement',
    'auth_verification',
    'auth_magic_link',
    'auth_password_reset',
    'team_invite',
  ].includes(type)
}

/**
 * Get a default/fallback HTML template
 * This is used when React email templates fail or for simple emails
 */
export function getDefaultEmailTemplate(params: {
  body: string
  orgName: string
  recipientName?: string
}): string {
  const { body, orgName, recipientName } = params

  // Convert line breaks to <p> tags
  const formattedBody = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('\n')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${orgName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f6f9fc;
    }
    .container {
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
    }
    p {
      margin: 0 0 16px 0;
      color: #374151;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    ${recipientName ? `<p>Dear ${recipientName},</p>` : ''}
    ${formattedBody}
    <div class="footer">
      <p>${orgName}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Export all templates for direct use if needed
export {
  ThankYouEmail,
  VolunteerConfirmationEmail,
  VolunteerReminderEmail,
  VolunteerThankYouEmail,
  ReengagementEmail,
  AuthVerificationEmail,
  AuthMagicLinkEmail,
  AuthPasswordResetEmail,
  TeamInviteEmail,
}
