/**
 * Initiate Voice Call
 *
 * Orchestrates an outbound voice call via Retell AI:
 * 1. Checks org settings (voice enabled, budget)
 * 2. Validates contact (has phone, not opted out)
 * 3. Checks calling hours, schedules if outside window
 * 4. Builds context using donor/volunteer context builders
 * 5. Creates voice_calls record
 * 6. Gets/creates Retell agent for org
 * 7. Creates outbound call via Retell SDK
 * 8. Updates voice_calls with retell_call_id
 */

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
// Context is built directly with admin client in this background job
import { getOrCreateAgentForOrg } from '@/lib/retell/agent-config';
import { getRetellClient } from '@/lib/retell/client';
import { isWithinCallingHours, checkVoiceBudget, scheduleForNextWindow } from '@/lib/retell/guards';
import { getFloraInstructions } from '@/modules/voice-calls/config/call-types';

export const initiateVoiceCall = inngest.createFunction(
  {
    id: 'initiate-voice-call',
    name: 'Initiate Voice Call',
  },
  { event: 'voice/call.initiate' },
  async ({ event, step }) => {
    const {
      contactId,
      organizationId,
      callType,
      triggerEvent,
      triggerEventId,
      scheduledFor,
      initiatedBy,
    } = event.data;

    // Step 1: Check organization settings
    const orgSettings = await step.run('check-org-settings', async () => {
      const supabase = createAdminClient();

      const { data: org, error } = await supabase
        .from('organizations')
        .select(
          'voice_calls_enabled, voice_monthly_budget, voice_call_hours_start, voice_call_hours_end, retell_phone_number, name',
        )
        .eq('id', organizationId)
        .single();

      if (error || !org) {
        throw new Error(`Failed to fetch organization: ${error?.message}`);
      }

      return org;
    });

    // If voice calls are disabled, skip
    if (!orgSettings.voice_calls_enabled) {
      return {
        skipped: true,
        reason: 'Voice calls are disabled for this organization',
      };
    }

    // Step 2: Check budget
    const budgetCheck = await step.run('check-budget', async () => {
      return await checkVoiceBudget(
        organizationId,
        orgSettings.voice_monthly_budget ?? 50,
      );
    });

    if (!budgetCheck.withinBudget) {
      return {
        skipped: true,
        reason: `Monthly voice budget exceeded ($${budgetCheck.currentSpend.toFixed(2)} of $${budgetCheck.budget})`,
      };
    }

    // Step 3: Check contact (has phone, not opted out)
    const contactData = await step.run('check-contact', async () => {
      const supabase = createAdminClient();

      const { data: contact, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone, phone_call_opt_out')
        .eq('id', contactId)
        .single();

      if (error || !contact) {
        throw new Error(`Failed to fetch contact: ${error?.message}`);
      }

      return contact;
    });

    if (!contactData.phone) {
      return {
        skipped: true,
        reason: 'Contact does not have a phone number',
      };
    }

    if (contactData.phone_call_opt_out) {
      return {
        skipped: true,
        reason: 'Contact has opted out of phone calls',
      };
    }

    // Step 4: Check calling hours
    const callingHoursCheck = await step.run('check-calling-hours', async () => {
      const withinHours = isWithinCallingHours({
        voice_call_hours_start: orgSettings.voice_call_hours_start ?? 9,
        voice_call_hours_end: orgSettings.voice_call_hours_end ?? 20,
        voice_monthly_budget: orgSettings.voice_monthly_budget ?? 50,
      });

      if (!withinHours && !scheduledFor) {
        const nextWindow = scheduleForNextWindow({
          voice_call_hours_start: orgSettings.voice_call_hours_start ?? 9,
          voice_call_hours_end: orgSettings.voice_call_hours_end ?? 20,
          voice_monthly_budget: orgSettings.voice_monthly_budget ?? 50,
        });

        return { withinHours: false, scheduledFor: nextWindow.toISOString() };
      }

      return { withinHours: true, scheduledFor: null };
    });

    // If outside calling hours, re-schedule
    if (!callingHoursCheck.withinHours && callingHoursCheck.scheduledFor) {
      await step.run('schedule-for-next-window', async () => {
        await inngest.send({
          name: 'voice/call.initiate',
          data: {
            ...event.data,
            scheduledFor: callingHoursCheck.scheduledFor!,
          },
          ts: new Date(callingHoursCheck.scheduledFor!).getTime(),
        });
      });

      return {
        scheduled: true,
        scheduledFor: callingHoursCheck.scheduledFor,
        reason: 'Outside calling hours, scheduled for next window',
      };
    }

    // Step 5: Build context using admin client (background job context)
    const contextSnapshot = await step.run('build-context', async () => {
      const supabase = createAdminClient();

      // Fetch contact details with giving history
      const { data: contact } = await supabase
        .from('contacts')
        .select('*, gifts(*), shift_signups(*)')
        .eq('id', contactId)
        .single();

      const { data: org } = await supabase
        .from('organizations')
        .select('name, settings, voice_summary, voice_call_config')
        .eq('id', organizationId)
        .single();

      const contextData = {
        contact: contact ? {
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          lifetimeGiving: contact.lifetime_giving,
          totalGifts: contact.total_gifts,
          lastGiftDate: contact.last_gift_date,
        } : {},
        organization: org ? {
          name: org.name,
          voiceSummary: org.voice_summary,
        } : {},
        callType,
        voiceCallConfig: org?.voice_call_config || {},
      };

      return contextData;
    });

    // Step 6: Find and update existing voice_calls record (created by server action)
    const voiceCall = await step.run('update-voice-call-record', async () => {
      const supabase = createAdminClient();

      // Find the queued record created by the server action
      const { data: existing } = await supabase
        .from('voice_calls')
        .select('*')
        .eq('contact_id', contactId)
        .eq('organization_id', organizationId)
        .eq('call_type', callType)
        .eq('status', 'queued')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        // Update with context and trigger info
        const { data, error } = await supabase
          .from('voice_calls')
          .update({
            context_snapshot: contextSnapshot,
            from_phone: orgSettings.retell_phone_number || null,
            trigger_event: triggerEvent || null,
            trigger_event_id: triggerEventId || null,
            initiated_by: initiatedBy || null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error || !data) {
          throw new Error(`Failed to update voice call record: ${error?.message}`);
        }
        return data;
      }

      // Fallback: create new record if none found
      const { data, error } = await supabase
        .from('voice_calls')
        .insert({
          organization_id: organizationId,
          contact_id: contactId,
          call_type: callType,
          direction: 'outbound',
          status: 'queued',
          from_phone: orgSettings.retell_phone_number || null,
          to_phone: contactData.phone,
          context_snapshot: contextSnapshot,
          trigger_event: triggerEvent || null,
          trigger_event_id: triggerEventId || null,
          initiated_by: initiatedBy || null,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to create voice call record: ${error?.message}`);
      }

      return data;
    });

    // Step 7: Get or create Retell agent for org
    const retellAgentId = await step.run('get-retell-agent', async () => {
      return await getOrCreateAgentForOrg(organizationId);
    });

    // Step 8: Create call via Retell SDK
    // Use phone call if org has a Retell phone number, otherwise web call
    const retellCall = await step.run('create-retell-call', async () => {
      const retell = getRetellClient();

      // Build dynamic variables for per-call context injection
      const voiceConfig = (contextSnapshot.voiceCallConfig || {}) as any;
      const orgKnowledge = voiceConfig.orgKnowledge || {};
      const callBehavior = voiceConfig.callBehavior || {};
      const callOverrides = voiceConfig.callTypeOverrides?.[callType] || {};

      const dynamicVars = {
        org_name: orgSettings.name || 'Our Organization',
        contact_name: `${contactData.first_name} ${contactData.last_name}`,
        contact_context: [
          contactData.first_name ? `Name: ${contactData.first_name} ${contactData.last_name}` : '',
          contextSnapshot.contact?.lifetimeGiving ? `Lifetime Giving: $${contextSnapshot.contact.lifetimeGiving.toLocaleString()}` : '',
          contextSnapshot.contact?.totalGifts ? `Total Gifts: ${contextSnapshot.contact.totalGifts}` : '',
          contextSnapshot.contact?.lastGiftDate ? `Last Gift: ${new Date(contextSnapshot.contact.lastGiftDate).toLocaleDateString()}` : '',
        ].filter(Boolean).join('\n'),
        call_purpose: getFloraInstructions(callType, callOverrides),
        org_knowledge: [
          orgKnowledge.mission,
          orgKnowledge.description,
        ].filter(Boolean).join('\n\n') || 'A nonprofit organization dedicated to making a positive impact.',
        org_programs: orgKnowledge.programs?.length
          ? orgKnowledge.programs.map((p: { name: string; description: string }) => `- ${p.name}: ${p.description}`).join('\n')
          : 'Contact the organization for details about current programs.',
        info_to_collect: [
          ...(callBehavior.infoToCollect || []),
          ...(callBehavior.customQuestions || []).map((q: string) => `Ask: ${q}`),
        ].join('\n') || 'No specific information to collect.',
        topics_to_avoid: orgKnowledge.topicsToAvoid?.length
          ? orgKnowledge.topicsToAvoid.join('\n- ')
          : 'No specific topics to avoid.',
        impact_facts: orgKnowledge.impactFacts?.length
          ? orgKnowledge.impactFacts.map((f: string) => `- ${f}`).join('\n')
          : 'No specific impact facts available.',
        closing_guidance: callBehavior.closingGuidance || 'Thank them for their time and end on a warm note.',
      };

      if (orgSettings.retell_phone_number) {
        // Normalize phone to E.164 format (+1XXXXXXXXXX)
        let toPhone = contactData.phone!.replace(/\D/g, '');
        if (toPhone.length === 10) toPhone = '1' + toPhone;
        if (!toPhone.startsWith('+')) toPhone = '+' + toPhone;

        // Phone call (requires provisioned number)
        const call = await retell.call.createPhoneCall({
          from_number: orgSettings.retell_phone_number,
          to_number: toPhone,
          override_agent_id: retellAgentId,
          retell_llm_dynamic_variables: dynamicVars,
          metadata: {
            voice_call_id: voiceCall.id,
            organization_id: organizationId,
            contact_id: contactId,
            call_type: callType,
          },
        });

        return {
          callId: call.call_id,
          agentId: call.agent_id,
          callType: 'phone' as const,
        };
      } else {
        // Web call (no phone number needed - for testing and web-based calls)
        const call = await retell.call.createWebCall({
          agent_id: retellAgentId,
          retell_llm_dynamic_variables: dynamicVars,
          metadata: {
            voice_call_id: voiceCall.id,
            organization_id: organizationId,
            contact_id: contactId,
            call_type: callType,
          },
        });

        return {
          callId: call.call_id,
          agentId: call.agent_id,
          callType: 'web' as const,
          accessToken: call.access_token,
        };
      }
    });

    // Step 9: Update voice_calls with retell_call_id
    await step.run('update-voice-call-with-retell-id', async () => {
      const supabase = createAdminClient();

      await supabase
        .from('voice_calls')
        .update({
          retell_call_id: retellCall.callId,
          retell_agent_id: retellCall.agentId,
          status: retellCall.callType === 'web' ? 'in_progress' : 'ringing',
        })
        .eq('id', voiceCall.id);
    });

    // Step 10: Start polling for call completion (fallback for when webhooks aren't reachable)
    await step.run('start-call-polling', async () => {
      await inngest.send({
        name: 'voice/call.poll',
        data: {
          callId: voiceCall.id,
          retellCallId: retellCall.callId,
          organizationId,
          contactId,
        },
      });
    });

    return {
      callId: voiceCall.id,
      retellCallId: retellCall.callId,
      contactName: `${contactData.first_name} ${contactData.last_name}`,
      callType,
    };
  },
);
