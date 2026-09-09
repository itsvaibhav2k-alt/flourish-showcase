/**
 * Process Call Transcript
 *
 * Post-call AI analysis of voice call transcripts:
 * 1. Fetches call and transcript from database
 * 2. Uses Claude to analyze: summary, key topics, action items, sentiment
 * 3. Updates call_transcripts with analysis results
 * 4. Emails org admins with summary, action items, and full transcript
 * 5. Logs activity
 */

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
import { generateWithCaching, MODELS } from '@/lib/ai/claude';
import { trackUsage } from '@/lib/ai/cost-tracker';
import { sendEmail } from '@/lib/email/resend';
import { render } from '@react-email/render';
import { CallSummaryEmail } from '@/lib/email/templates/call-summary';

export const processCallTranscript = inngest.createFunction(
  {
    id: 'process-call-transcript',
    name: 'Process Call Transcript',
  },
  { event: 'voice/transcript.process' },
  async ({ event, step }) => {
    const { callId, organizationId, contactId } = event.data;

    // Step 1: Fetch call, transcript, contact, and org data
    const callData = await step.run('fetch-call-and-transcript', async () => {
      const supabase = createAdminClient();

      const [
        { data: call },
        { data: transcript },
        { data: org },
      ] = await Promise.all([
        supabase
          .from('voice_calls')
          .select('id, call_type, direction, context_snapshot, duration_seconds, from_phone, to_phone, created_at')
          .eq('id', callId)
          .single(),
        supabase
          .from('call_transcripts')
          .select('id, transcript, summary')
          .eq('call_id', callId)
          .single(),
        supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single(),
      ]);

      // Fetch contact only if we have a valid contactId
      let contact = null;
      if (contactId) {
        const { data } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, phone, email')
          .eq('id', contactId)
          .single();
        contact = data;
      }

      if (!call) {
        throw new Error(`Voice call not found: ${callId}`);
      }

      if (!transcript) {
        throw new Error(`Transcript not found for call: ${callId}`);
      }

      return { call, transcript, contact, org };
    });

    // If transcript is empty, skip
    const existingTranscript = callData.transcript;
    const transcriptEntries = existingTranscript.transcript as Array<{
      role: string;
      content: string;
    }>;

    if (!transcriptEntries || transcriptEntries.length === 0) {
      return {
        skipped: true,
        reason: 'Transcript is empty',
      };
    }

    // Step 2: Analyze transcript with Claude
    const analysis = await step.run('analyze-transcript', async () => {
      // Format transcript for the prompt
      const contactName = callData.contact
        ? `${callData.contact.first_name} ${callData.contact.last_name}`
        : 'the caller';

      const formattedTranscript = transcriptEntries
        .map((t) => `${t.role === 'agent' ? 'Flora' : contactName}: ${t.content}`)
        .join('\n');

      const systemPrompt = `You are an expert at analyzing nonprofit donor/volunteer phone call transcripts.
Analyze the following call transcript and extract structured insights.

Return your analysis as a JSON object with this exact structure:
{
  "summary": "A concise 2-3 sentence summary of the call including key outcomes",
  "key_topics": ["topic1", "topic2", "topic3"],
  "action_items": ["action1", "action2"],
  "sentiment": "very_positive|positive|neutral|negative|very_negative",
  "follow_up_needed": true|false,
  "follow_up_notes": "Description of any follow-up needed, or null if none"
}

Guidelines:
- Summary should capture the purpose, key moments, and outcome of the call
- Key topics should be 2-5 concise topic labels
- Action items should be specific, actionable follow-ups for the nonprofit staff
  - If Flora promised to pass along information, relay a message, or have someone follow up, include that as a specific action item with details of what was promised
  - If the caller expressed interest in something (volunteering, events, donating), note it as an action item
  - If the caller had a complaint or concern, note it as a high-priority action item
  - If the caller requested to speak with a specific person or team, note exactly who and why
- Sentiment reflects the overall tone of the donor/volunteer during the call
- follow_up_needed should be true if there are ANY pending commitments, promises Flora made, requests from the caller, or unresolved topics
- follow_up_notes should clearly describe what needs to happen next, including any promises Flora made to the caller`;

      const userPrompt = `Call type: ${callData.call.call_type}
Duration: ${callData.call.duration_seconds || 0} seconds
Contact: ${contactName}

Transcript:
${formattedTranscript}

Provide your analysis as a JSON object.`;

      const response = await generateWithCaching({
        systemPrompt,
        userPrompt,
        maxTokens: 1024,
        model: MODELS.HAIKU,
        temperature: 0.3,
      });

      // Track usage
      await trackUsage({
        organizationId,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
        cacheReadInputTokens: response.usage.cacheReadInputTokens,
        model: response.model,
        emailType: 'voice_call_analysis',
        contactId: contactId || undefined,
      }).catch((err) => {
        console.error('Failed to track transcript analysis usage:', err);
      });

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse transcript analysis response');
      }

      return JSON.parse(jsonMatch[0]) as {
        summary: string;
        key_topics: string[];
        action_items: string[];
        sentiment: string;
        follow_up_needed: boolean;
        follow_up_notes: string | null;
      };
    });

    // Step 3: Update call_transcripts with analysis
    await step.run('update-transcript-analysis', async () => {
      const supabase = createAdminClient();

      await supabase
        .from('call_transcripts')
        .update({
          summary: analysis.summary,
          key_topics: analysis.key_topics,
          action_items: analysis.action_items,
          sentiment_analysis: {
            overall: analysis.sentiment,
            follow_up_needed: analysis.follow_up_needed,
            follow_up_notes: analysis.follow_up_notes,
          },
        })
        .eq('id', existingTranscript.id);

      // Also update the voice_calls record with sentiment and follow-up info
      await supabase
        .from('voice_calls')
        .update({
          sentiment: analysis.sentiment.toLowerCase(),
          follow_up_needed: analysis.follow_up_needed,
          follow_up_notes: analysis.follow_up_notes,
        })
        .eq('id', callId);
    });

    // Step 4: Email org admins with call summary
    await step.run('notify-admins', async () => {
      const supabase = createAdminClient();

      // Get all admin/owner members of the org
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organizationId)
        .in('role', ['owner', 'admin']);

      if (!members || members.length === 0) {
        console.warn(`No admins found for org ${organizationId}, skipping notification`);
        return;
      }

      // Get admin emails by looking up each user individually
      // (listUsers() paginates at 50 and can miss users)
      const adminEmails: string[] = [];
      for (const member of members) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.user_id);
        if (userError) {
          console.error(`Failed to fetch user ${member.user_id}:`, userError);
          continue;
        }
        if (userData?.user?.email) {
          adminEmails.push(userData.user.email);
        }
      }

      if (adminEmails.length === 0) {
        console.warn('No admin emails found, skipping notification');
        return;
      }

      const contactName = callData.contact
        ? `${callData.contact.first_name} ${callData.contact.last_name}`
        : 'Unknown Caller';
      // For inbound calls, the caller's number is from_phone; for outbound, it's to_phone
      const contactPhone = callData.contact?.phone
        || (callData.call.direction === 'inbound' ? callData.call.from_phone : callData.call.to_phone)
        || 'N/A';

      // Format duration
      const durationSecs = callData.call.duration_seconds || 0;
      const mins = Math.floor(durationSecs / 60);
      const secs = durationSecs % 60;
      const callDuration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      // Format date
      const callDate = new Date(callData.call.created_at).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
      const dashboardUrl = contactId
        ? `${appUrl}/contacts/${contactId}`
        : `${appUrl}/contacts`;

      const callTypeLabel = callData.call.call_type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      // Build the subject line
      const urgencyPrefix = analysis.follow_up_needed ? '[Action Required] ' : '';
      const subject = `${urgencyPrefix}Flora Call Summary: ${callTypeLabel} with ${contactName}`;

      // Render the email template
      const emailHtml = await render(
        CallSummaryEmail({
          orgName: callData.org?.name || 'Your Organization',
          contactName,
          contactPhone,
          callType: callData.call.call_type,
          callDuration,
          callDate,
          sentiment: analysis.sentiment,
          summary: analysis.summary,
          keyTopics: analysis.key_topics,
          actionItems: analysis.action_items,
          followUpNeeded: analysis.follow_up_needed,
          followUpNotes: analysis.follow_up_notes,
          transcript: transcriptEntries.map((t) => ({
            role: t.role,
            content: t.content,
          })),
          dashboardUrl,
        }),
      );

      // Send to all admins
      const results = await Promise.allSettled(
        adminEmails.map((email) =>
          sendEmail({
            to: email,
            subject,
            body: emailHtml,
          }),
        ),
      );

      const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - sent;
      console.log(`[notify-admins] Emailing ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);
      console.log(`[notify-admins] Sent: ${sent}, Failed: ${failed}`);
      // Log individual failures for debugging
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[notify-admins] Email to ${adminEmails[i]} rejected:`, r.reason);
        } else if (!r.value.success) {
          console.error(`[notify-admins] Email to ${adminEmails[i]} failed:`, r.value.error);
        }
      });
    });

    // Step 5: Log activity (only if we have a matched contact)
    if (contactId) {
      await step.run('log-activity', async () => {
        const supabase = createAdminClient();

        const contactName = callData.contact
          ? `${callData.contact.first_name} ${callData.contact.last_name}`
          : 'Unknown Caller';

        await supabase.from('activities').insert({
          organization_id: organizationId,
          contact_id: contactId,
          activity_type: 'voice_call',
          description: `Call with ${contactName} analyzed: ${analysis.summary}`,
          metadata: {
            callId,
            sentiment: analysis.sentiment,
            keyTopics: analysis.key_topics,
            actionItems: analysis.action_items,
            followUpNeeded: analysis.follow_up_needed,
            followUpNotes: analysis.follow_up_notes,
          },
        });
      });
    }

    return {
      callId,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      keyTopics: analysis.key_topics,
      actionItems: analysis.action_items,
      followUpNeeded: analysis.follow_up_needed,
      adminNotified: true,
    };
  },
);
