/**
 * Send Impact Story Action
 *
 * Server action to send an impact story to a donor via email
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { sendStorySchema } from '../schemas'
import { sendEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'

export interface SendStoryResult {
  success: boolean
  error?: string
}

/**
 * Send an impact story to a donor via email
 */
export async function sendStory(data: unknown): Promise<SendStoryResult> {
  try {
    // Validate input
    const parsed = sendStorySchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      }
    }

    const supabase = await createClient()

    // Verify user has access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get the story with contact and organization info
    const { data: story, error: storyError } = await supabase
      .from('impact_stories')
      .select(
        `
        *,
        contact:contacts(first_name, last_name, email),
        organization:organizations(name)
      `
      )
      .eq('id', parsed.data.story_id)
      .single()

    if (storyError || !story) {
      return { success: false, error: 'Story not found' }
    }

    // Verify user has access to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', story.organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return { success: false, error: 'Access denied' }
    }

    // Determine recipient email
    const recipientEmail =
      parsed.data.recipient_email || (story.contact as any)?.email

    if (!recipientEmail) {
      return { success: false, error: 'No email address available for recipient' }
    }

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/impact/${story.share_token}`

    // Build email content
    const orgName = (story.organization as any)?.name || 'Our Organization'
    const contactName =
      (story.contact as any)?.first_name || 'Friend'

    const emailSubject = `Your Impact with ${orgName}`
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">${story.title}</h2>

            <p>Dear ${contactName},</p>

            <p>We wanted to share something special with you - a personalized look at the impact you've created through your generosity.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${story.story_content.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${shareUrl}"
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Your Full Impact Story
              </a>
            </p>

            <p>Thank you for being such an important part of our community.</p>

            <p>With gratitude,<br>
            The ${orgName} Team</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280;">
              This is a personalized impact story created just for you.
              <a href="${shareUrl}" style="color: #2563eb;">View online</a>
            </p>
          </div>
        </body>
      </html>
    `

    // Send the email
    const result = await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      body: emailBody,
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send email' }
    }

    // Update story with sent timestamp
    await supabase
      .from('impact_stories')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', parsed.data.story_id)

    // Revalidate paths
    revalidatePath(`/flora/impact-stories`)

    return { success: true }
  } catch (error) {
    console.error('Send story error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send story. Please try again.',
    }
  }
}
