/**
 * Inngest Event Type Definitions
 *
 * This file contains all the typed event definitions for the Inngest event-driven system.
 * Each event represents a significant action or trigger in the application.
 */

export type Events = {
  /**
   * Triggered when a new gift is recorded
   * Kicks off thank-you email generation
   */
  'gift/created': {
    data: {
      giftId: string
      contactId: string
      organizationId: string
      amount: number
      isFirstGift?: boolean
    }
  }

  /**
   * Triggered when thank-you generation is explicitly requested
   * (Alternative trigger for gift/created)
   */
  'gift/thankyou.generate': {
    data: {
      giftId: string
      contactId: string
      organizationId: string
    }
  }

  /**
   * Scheduled event to calculate lapse risk for donors
   * Runs periodically to identify at-risk donors
   */
  'donor/lapse-risk.calculate': {
    data: {
      organizationId: string
    }
  }

  /**
   * Triggered when a donor is identified as having lapse risk
   * Used to automatically enroll in re-engagement sequences
   */
  'donor/lapse-risk-detected': {
    data: {
      contactId: string
      organizationId: string
      riskLevel: 'low' | 'medium' | 'high'
      monthsSinceLastGift: number
    }
  }

  /**
   * Triggered when a volunteer signs up for a shift
   * Used for confirmation emails and tracking
   */
  'volunteer/signup': {
    data: {
      signupId: string
      shiftId: string
      contactId: string
      organizationId: string
      status: 'confirmed' | 'waitlisted'
      isFirstShift?: boolean
    }
  }

  /**
   * Triggered when a volunteer is checked in for a shift
   * Used for tracking attendance and hours
   */
  'volunteer/checkin': {
    data: {
      signupId: string
      shiftId: string
      contactId: string
      organizationId: string
      checkedInAt: string
      hoursLogged?: number
    }
  }

  /**
   * Scheduled event to send volunteer shift reminders
   * Handles 7-day, 1-day, and morning-of reminders
   */
  'volunteer/shift.reminder': {
    data: {
      signupId: string
      shiftId: string
      reminderType: '7day' | '1day' | 'morning'
    }
  }

  /**
   * Triggered to send a single approved email
   */
  'email/send': {
    data: {
      emailId: string
    }
  }

  /**
   * Triggered to send multiple approved emails in batch
   */
  'email/batch-send': {
    data: {
      emailIds: string[]
    }
  }

  /**
   * Scheduled event to generate daily copilot actions
   * Runs overnight to provide fresh suggestions each morning
   */
  'copilot/actions.generate': {
    data: {
      organizationId?: string // Optional - if not provided, runs for all orgs
    }
  }

  /**
   * Triggered when a copilot action is completed
   * Used for tracking effectiveness and learning
   */
  'copilot/action.completed': {
    data: {
      actionId: string
      organizationId: string
      contactId: string
      outcome?: string
    }
  }

  /**
   * Triggered to refresh all AI tiles for an organization
   * Can optionally specify which tile types to refresh
   */
  'ai-tiles/refresh': {
    data: {
      organizationId: string
      tileTypes?: string[] // Optional - if not provided, refreshes all enabled tiles
    }
  }

  /**
   * Triggered to refresh a single specific AI tile
   * Used for manual refresh of individual tiles
   */
  'ai-tiles/refresh-single': {
    data: {
      organizationId: string
      tileType: string // Built-in tile ID or 'custom'
      tileId?: string // Required for custom tiles
    }
  }

  /**
   * Triggered to manually run a scheduled email
   * Bypasses the normal schedule and runs immediately
   */
  'scheduled-email/trigger': {
    data: {
      scheduledEmailId: string
      organizationId: string
    }
  }

  /**
   * Triggered to initiate an outbound voice call via Retell AI
   * Handles context building, budget checks, and call placement
   */
  'voice/call.initiate': {
    data: {
      contactId: string
      organizationId: string
      callType: 'thank_you' | 'reengagement' | 'donation_ask' | 'volunteer_recruitment' | 'shift_reminder' | 'event_invitation' | 'cultivation' | 'campaign_outreach' | 'follow_up' | 'survey' | 'custom' | 'sponsor_outreach' | 'employer_match' | 'fee_reminder'
      triggerEvent?: string
      triggerEventId?: string
      scheduledFor?: string
      initiatedBy?: string
    }
  }

  /**
   * Triggered when a voice call is completed
   * Used for post-call processing and follow-up actions
   */
  'voice/call.completed': {
    data: {
      callId: string
      retellCallId: string
      organizationId: string
      contactId: string | null
      durationSeconds: number
      outcome: string
    }
  }

  /**
   * Triggered to process and analyze a call transcript with AI
   * Generates summary, key topics, action items, and sentiment
   */
  'voice/transcript.process': {
    data: {
      callId: string
      organizationId: string
      contactId: string | null
    }
  }

  /**
   * Triggered to poll Retell API for call status when webhooks aren't reachable.
   * Used in development or as a fallback.
   */
  'voice/call.poll': {
    data: {
      callId: string
      retellCallId: string
      organizationId: string
      contactId: string | null
    }
  }

  /**
   * Triggered to process a call queue — sequentially dials contacts in the queue
   */
  'voice/queue.process': {
    data: {
      queueId: string
      organizationId: string
    }
  }

  /**
   * Triggered to generate and email tax receipts for all donors in an organization
   * Processes all contacts with gifts in the specified year
   */
  'receipts/batch.generate': {
    data: {
      organizationId: string
      year: number
    }
  }

}
