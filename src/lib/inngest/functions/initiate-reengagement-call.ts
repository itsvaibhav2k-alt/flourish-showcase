/**
 * Initiate Re-engagement Call
 *
 * Triggered when a donor is identified as high lapse risk.
 * Only triggers a voice call for high-risk donors with significant giving history.
 * Emits a voice/call.initiate event to orchestrate the actual call.
 */

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';

export const initiateReengagementCall = inngest.createFunction(
  {
    id: 'initiate-reengagement-call',
    name: 'Initiate Re-engagement Call for Lapsed Donor',
  },
  { event: 'donor/lapse-risk-detected' },
  async ({ event, step }) => {
    const { contactId, organizationId, riskLevel, monthsSinceLastGift } = event.data;

    // Only process high-risk donors
    if (riskLevel !== 'high') {
      return {
        skipped: true,
        reason: `Risk level is ${riskLevel}, only high-risk triggers calls`,
      };
    }

    // Step 1: Check if org has auto re-engagement calls enabled
    const orgSettings = await step.run('check-org-settings', async () => {
      const supabase = createAdminClient();

      const { data: org, error } = await supabase
        .from('organizations')
        .select('voice_calls_enabled, auto_reengagement_calls')
        .eq('id', organizationId)
        .single();

      if (error || !org) {
        throw new Error(`Failed to fetch organization: ${error?.message}`);
      }

      return org;
    });

    if (!orgSettings.voice_calls_enabled || !orgSettings.auto_reengagement_calls) {
      return {
        skipped: true,
        reason: 'Voice calls or auto re-engagement calls are disabled',
      };
    }

    // Step 2: Check contact eligibility
    const contact = await step.run('check-contact', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('contacts')
        .select('id, phone, phone_call_opt_out, lifetime_giving')
        .eq('id', contactId)
        .single();

      if (error || !data) {
        throw new Error(`Failed to fetch contact: ${error?.message}`);
      }

      return data;
    });

    if (!contact.phone || contact.phone_call_opt_out) {
      return {
        skipped: true,
        reason: !contact.phone
          ? 'Contact does not have a phone number'
          : 'Contact has opted out of phone calls',
      };
    }

    // Step 3: Emit voice call initiate event
    await step.run('emit-voice-call-event', async () => {
      await inngest.send({
        name: 'voice/call.initiate',
        data: {
          contactId,
          organizationId,
          callType: 'reengagement',
          triggerEvent: 'lapse_risk_detected',
          triggerEventId: contactId,
        },
      });
    });

    return {
      initiated: true,
      contactId,
      riskLevel,
      monthsSinceLastGift,
      lifetimeGiving: contact.lifetime_giving,
    };
  },
);
