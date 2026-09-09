import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { generateWithCaching, MODELS } from '@/lib/ai/claude'

export const generateThankYou = inngest.createFunction(
  {
    id: 'generate-thank-you',
    name: 'Generate Thank You Email',
  },
  { event: 'gift/created' },
  async ({ event, step }) => {
    const { giftId, contactId, organizationId, amount } = event.data

    // Step 1: Check automation settings
    const shouldAutomate = await step.run('check-automation-settings', async () => {
      const supabase = createAdminClient()

      const { data: org } = await supabase
        .from('organizations')
        .select('auto_thank_you_emails, ai_email_generation')
        .eq('id', organizationId)
        .single()

      return {
        autoSend: org?.auto_thank_you_emails ?? false,
        aiEnabled: org?.ai_email_generation ?? true,
      }
    })

    // If AI is disabled, skip email generation
    if (!shouldAutomate.aiEnabled) {
      return {
        skipped: true,
        reason: 'AI email generation is disabled for this organization',
      }
    }

    // Step 2: Fetch gift and contact details
    const giftData = await step.run('fetch-gift-details', async () => {
      const supabase = createAdminClient()

      const [{ data: gift }, { data: contact }, { data: org }] =
        await Promise.all([
          supabase.from('gifts').select('*').eq('id', giftId).single(),
          supabase.from('contacts').select('*').eq('id', contactId).single(),
          supabase
            .from('organizations')
            .select('*')
            .eq('id', organizationId)
            .single(),
        ])

      if (!gift || !contact || !org) {
        throw new Error('Failed to fetch gift, contact, or organization data')
      }

      return { gift, contact, org }
    })

    // Step 3: Generate thank you message using Claude
    const thankYouContent = await step.run(
      'generate-thank-you-content',
      async () => {
        const { gift, contact, org } = giftData

        // Build the prompt with organization voice and context
        // Use default voice if org hasn't trained their voice yet
        const defaultVoice = 'Warm, heartfelt, and genuine nonprofit communication style. Professional yet personal, focusing on gratitude and community impact.'
        const voiceContext = `Organization voice profile: ${org.voice_summary || defaultVoice}`

        const prompt = `You are helping ${org.name} write a heartfelt thank-you email to a donor.

${voiceContext}

Donor Details:
- Name: ${contact.first_name} ${contact.last_name}
- Gift Amount: $${gift.amount}
- Gift Date: ${new Date(gift.gift_date).toLocaleDateString()}
${gift.campaign ? `- Campaign: ${gift.campaign}` : ''}
${gift.notes ? `- Notes: ${gift.notes}` : ''}

Donor History:
- Total Lifetime Giving: $${contact.lifetime_giving || 0}
- Total Number of Gifts: ${contact.total_gifts || 1}
${contact.last_gift_date ? `- Last Gift Date: ${new Date(contact.last_gift_date).toLocaleDateString()}` : ''}

Write a warm, personalized thank-you email body. The email should:
1. Express genuine gratitude for this specific gift
2. Acknowledge their ongoing support if they're a repeat donor
3. Briefly mention the impact their donation will have
4. Be authentic and match the organization's voice
5. Be 2-3 paragraphs long

Do not include:
- Subject line (will be added separately)
- Greeting or salutation (will be added separately)
- Closing signature (will be added separately)
- Tax receipt information (will be added in footer)

Return ONLY the body paragraphs of the email.`

        const response = await generateWithCaching({
          systemPrompt: `You are helping ${org.name} write heartfelt thank-you emails to donors. ${voiceContext}`,
          userPrompt: prompt,
          model: MODELS.HAIKU,
          maxTokens: 1024,
        })

        return response.content
      }
    )

    // Step 4: Create email draft
    const emailDraft = await step.run('create-email-draft', async () => {
      const supabase = createAdminClient()
      const { gift, contact, org } = giftData

      const subject = `Thank you for your gift, ${contact.first_name}!`

      // Set status based on automation settings
      // If auto-send is enabled, mark as 'reviewed' so it can be sent automatically
      // Otherwise, keep as 'draft' for manual review
      const status = shouldAutomate.autoSend ? 'reviewed' : 'draft'

      const { data, error } = await supabase
        .from('email_drafts')
        .insert({
          organization_id: organizationId,
          contact_id: contactId,
          email_type: 'thank_you',
          trigger_event: 'gift_received',
          trigger_event_id: giftId,
          subject,
          body: thankYouContent,
          model_used: MODELS.HAIKU,
          prompt_version: 'v1',
          context_snapshot: {
            giftAmount: gift.amount,
            giftDate: gift.gift_date,
            campaign: gift.campaign,
            lifetimeGiving: contact.lifetime_giving,
            totalGifts: contact.total_gifts,
          },
          status,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create email draft: ${error.message}`)
      }

      return data
    })

    // Step 5: Log activity
    await step.run('log-activity', async () => {
      const supabase = createAdminClient()
      const { contact } = giftData

      await supabase.from('activities').insert({
        organization_id: organizationId,
        contact_id: contactId,
        activity_type: 'email_sent',
        description: `Thank you email draft generated for $${amount} gift`,
        metadata: {
          emailDraftId: emailDraft.id,
          giftId,
          amount,
        },
      })
    })

    // Step 6: Check if a thank-you voice call should also be initiated
    const voiceCallInitiated = await step.run('check-voice-call', async () => {
      const supabase = createAdminClient()

      // Fetch org voice call settings
      const { data: org } = await supabase
        .from('organizations')
        .select(
          'voice_calls_enabled, auto_thank_you_calls, voice_thank_you_threshold',
        )
        .eq('id', organizationId)
        .single()

      if (!org?.voice_calls_enabled || !org?.auto_thank_you_calls) {
        return false
      }

      const threshold = org.voice_thank_you_threshold ?? 100
      if (amount < threshold) {
        return false
      }

      // Check contact has phone and hasn't opted out
      const { data: contact } = await supabase
        .from('contacts')
        .select('phone, phone_call_opt_out')
        .eq('id', contactId)
        .single()

      if (!contact?.phone || contact.phone_call_opt_out) {
        return false
      }

      // Emit voice call initiate event
      await inngest.send({
        name: 'voice/call.initiate',
        data: {
          contactId,
          organizationId,
          callType: 'thank_you' as const,
          triggerEvent: 'gift_received',
          triggerEventId: giftId,
        },
      })

      return true
    })

    return {
      emailDraftId: emailDraft.id,
      subject: emailDraft.subject,
      voiceCallInitiated,
    }
  }
)
