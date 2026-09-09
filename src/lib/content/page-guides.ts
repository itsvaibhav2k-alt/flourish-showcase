/**
 * Page Guides Content
 *
 * Help content for each major feature page in Flourish.
 * Used by the help widget to provide contextual guidance.
 */

export interface PageGuide {
  title: string
  purpose: string
  keyFeatures: {
    icon: string  // lucide icon name
    title: string
    description: string
  }[]
  bestPractices: string[]
  tips: string[]
}

export const pageGuides: Record<string, PageGuide> = {
  pipeline: {
    title: "Major Gift Pipeline",
    purpose: "Track major gift prospects through the 5-stage cultivation cycle",
    keyFeatures: [
      {
        icon: "kanban-square",
        title: "Kanban Board",
        description: "Visual drag-and-drop pipeline stages for easy prospect management"
      },
      {
        icon: "gauge",
        title: "Readiness Scoring",
        description: "AI-calculated score showing how ready a prospect is for an ask"
      },
      {
        icon: "activity",
        title: "Cultivation Moves",
        description: "Log every interaction (calls, meetings, emails, events)"
      },
      {
        icon: "target",
        title: "Target Ask Amount",
        description: "Set and track your fundraising goals per prospect"
      }
    ],
    bestPractices: [
      "Move prospects to the next stage when they show clear buying signals",
      "Log cultivation moves within 24 hours while details are fresh",
      "Focus on prospects with 60+ readiness scores for immediate asks",
      "Review stalled prospects (no activity in 30+ days) weekly"
    ],
    tips: [
      "The readiness score updates automatically as you log moves",
      "Prospects in Cultivation for 90-180 days typically have the highest success rates"
    ]
  },

  donors: {
    title: "Donor Management",
    purpose: "Manage donor relationships and track giving history",
    keyFeatures: [
      {
        icon: "alert-triangle",
        title: "Lapse Risk Alerts",
        description: "AI identifies donors who may stop giving"
      },
      {
        icon: "trending-up",
        title: "Giving Trends",
        description: "Visual charts showing donation patterns over time"
      },
      {
        icon: "users",
        title: "Donor Segments",
        description: "Automatic categorization (Major, Steady, Lapsed, etc.)"
      },
      {
        icon: "gift",
        title: "Gift Recording",
        description: "Log donations with campaigns and payment methods"
      }
    ],
    bestPractices: [
      "Reach out to \"At Risk\" donors within 7 days of the alert",
      "Review lapsed donors monthly for re-engagement opportunities",
      "Use segments to tailor your communication strategy"
    ],
    tips: [
      "Click any stat card to see detailed breakdowns",
      "Export donor lists for mail merges or external analysis"
    ]
  },

  prospects: {
    title: "Giving Potential",
    purpose: "Identify high-capacity donors using wealth screening and AI scoring",
    keyFeatures: [
      {
        icon: "star",
        title: "Overall Score",
        description: "Combined metric showing overall giving potential (0-100)"
      },
      {
        icon: "dollar-sign",
        title: "Capacity Score",
        description: "Estimates wealth and ability to give"
      },
      {
        icon: "heart",
        title: "Affinity Score",
        description: "Measures connection to your mission"
      },
      {
        icon: "trending-up",
        title: "Propensity Score",
        description: "Predicts likelihood to give based on history"
      },
      {
        icon: "gap",
        title: "Giving Gap",
        description: "Shows untapped potential (capacity minus current giving)"
      }
    ],
    bestPractices: [
      "Prioritize prospects with high capacity AND high affinity",
      "Use giving gap to identify upgrade opportunities",
      "Add high-scoring prospects to your major gift pipeline"
    ],
    tips: [
      "Scores update when you add wealth data or record new interactions",
      "A high capacity but low affinity score means you need more cultivation"
    ]
  },

  volunteers: {
    title: "Volunteer Management",
    purpose: "Schedule shifts, track attendance, and manage volunteer engagement",
    keyFeatures: [
      {
        icon: "calendar",
        title: "Shift Management",
        description: "Create and manage volunteer opportunities"
      },
      {
        icon: "percent",
        title: "Fill Rate",
        description: "See at a glance how staffed each shift is"
      },
      {
        icon: "award",
        title: "Reliability Score",
        description: "Track volunteer dependability over time"
      },
      {
        icon: "clipboard-check",
        title: "Check-in System",
        description: "Record attendance and log hours"
      }
    ],
    bestPractices: [
      "Create shifts at least 2 weeks in advance for better signup rates",
      "Send reminders 7 days and 1 day before shifts",
      "Recognize volunteers with high reliability scores"
    ],
    tips: [
      "Public signup links let volunteers register without logging in",
      "Hours are automatically logged when you complete check-in"
    ]
  },

  communications: {
    title: "AI Communications",
    purpose: "AI-powered email generation with human approval workflow",
    keyFeatures: [
      {
        icon: "sparkles",
        title: "AI Email Generation",
        description: "Claude writes personalized emails based on context"
      },
      {
        icon: "mic",
        title: "Voice Training",
        description: "Teach the AI your organization's writing style"
      },
      {
        icon: "check-circle",
        title: "Approval Workflow",
        description: "Review and edit before sending"
      },
      {
        icon: "mail",
        title: "Email Types",
        description: "Thank-you, re-engagement, volunteer reminders, custom"
      }
    ],
    bestPractices: [
      "Train your voice profile with at least 3 sample emails",
      "Review AI drafts for accuracy before approving",
      "Use \"Edit\" to personalize AI suggestions for major donors"
    ],
    tips: [
      "Thank-you emails are auto-generated when gifts are recorded",
      "Voice training improves the more samples you provide"
    ]
  },

  dashboard: {
    title: "Dashboard",
    purpose: "Your daily command center for nonprofit operations",
    keyFeatures: [
      {
        icon: "bar-chart-2",
        title: "Key Metrics",
        description: "Total contacts, active donors, volunteers, emails sent"
      },
      {
        icon: "bot",
        title: "AI Copilot",
        description: "Smart action recommendations updated daily"
      },
      {
        icon: "list-checks",
        title: "Today's Actions",
        description: "Priority tasks requiring immediate attention"
      },
      {
        icon: "activity",
        title: "Activity Feed",
        description: "Recent actions across your organization"
      }
    ],
    bestPractices: [
      "Start each day by reviewing Today's Actions",
      "Act on Copilot recommendations within 48 hours for best results",
      "Use quick actions to record gifts and create shifts without navigation"
    ],
    tips: [
      "All stat cards are clickable - tap to see detailed views",
      "The sidebar collapses for more workspace on smaller screens"
    ]
  },

  sequences: {
    title: "Email Sequences",
    purpose: "Create automated email journeys powered by AI that nurture donors and volunteers",
    keyFeatures: [
      {
        icon: "git-branch",
        title: "Sequence Builder",
        description: "Visual drag-and-drop sequence creator with AI-generated email content"
      },
      {
        icon: "zap",
        title: "Trigger-Based Automation",
        description: "Automatically enroll contacts based on events like first gift or high lapse risk"
      },
      {
        icon: "bar-chart",
        title: "Performance Tracking",
        description: "Monitor open rates, click rates, and conversions for each sequence"
      },
      {
        icon: "layout-template",
        title: "Quick Start Templates",
        description: "Pre-built sequences for common scenarios like welcome series and re-engagement"
      }
    ],
    bestPractices: [
      "Start with a template and customize for your organization's voice",
      "Keep sequences focused - 3-5 emails is ideal for most journeys",
      "Test your sequences with a small group before rolling out widely"
    ],
    tips: [
      "Sequences automatically pause when a contact takes the desired action",
      "Use the preview feature to see exactly what contacts will receive"
    ]
  },

  insights: {
    title: "AI Insights",
    purpose: "Real-time intelligence and recommendations powered by Flora AI",
    keyFeatures: [
      {
        icon: "heart",
        title: "Donor Health Score",
        description: "Overall health metric based on retention, activity, and engagement"
      },
      {
        icon: "list-checks",
        title: "Weekly Priorities",
        description: "AI-curated list of contacts needing immediate attention"
      },
      {
        icon: "activity",
        title: "Organization Pulse",
        description: "Key metrics including total raised, active donors, and volunteer hours"
      },
      {
        icon: "sparkles",
        title: "Flora Recommendations",
        description: "Personalized outreach suggestions with success probability"
      }
    ],
    bestPractices: [
      "Review Flora's recommendations daily for best results",
      "Act on high-priority suggestions within 48 hours",
      "Use insights to inform your weekly team meetings"
    ],
    tips: [
      "Insights refresh automatically - click Refresh All to force an update",
      "Donor health score above 70 indicates a healthy donor base"
    ]
  },

  'impact-stories': {
    title: "Impact Stories",
    purpose: "Generate personalized donor impact narratives that show the tangible difference their giving makes",
    keyFeatures: [
      {
        icon: "target",
        title: "Impact Metrics",
        description: "Define what each dollar accomplishes (e.g., meals served per $10)"
      },
      {
        icon: "sparkles",
        title: "AI Story Generation",
        description: "Create personalized narratives based on donor history"
      },
      {
        icon: "users",
        title: "Donor-Specific",
        description: "Each story reflects the individual donor's giving history"
      },
      {
        icon: "share-2",
        title: "Easy Sharing",
        description: "Copy or export stories for use in emails and reports"
      }
    ],
    bestPractices: [
      "Set up impact metrics before generating stories",
      "Keep impact metrics tangible and relatable",
      "Update metrics annually to reflect current program costs"
    ],
    tips: [
      "Generate stories from any contact's profile page",
      "Stories work best for donors with at least one recorded gift"
    ]
  },

  'smart-ask': {
    title: "Smart Ask",
    purpose: "AI-powered donation amount suggestions based on donor history and capacity",
    keyFeatures: [
      {
        icon: "dollar-sign",
        title: "Intelligent Amounts",
        description: "Three-tier suggestions: stretch, target, and accessible amounts"
      },
      {
        icon: "gauge",
        title: "Confidence Scoring",
        description: "See how confident the AI is in each suggestion"
      },
      {
        icon: "sliders",
        title: "Configurable Multipliers",
        description: "Customize the algorithm to match your fundraising strategy"
      },
      {
        icon: "trending-up",
        title: "Conversion Analytics",
        description: "Track which ask amounts lead to successful donations"
      }
    ],
    bestPractices: [
      "Use stretch amounts for major donors with strong engagement",
      "Present accessible amounts when re-engaging lapsed donors",
      "Review analytics monthly to optimize your multipliers"
    ],
    tips: [
      "Suggestions factor in lapse risk - at-risk donors see lower asks",
      "Smart Ask works best with 6+ months of giving history"
    ]
  },

  'grant-writer': {
    title: "AI Grant Writer",
    purpose: "Generate comprehensive grant proposals using AI and your organization's data",
    keyFeatures: [
      {
        icon: "file-text",
        title: "Full Proposal Generation",
        description: "Creates all standard sections including executive summary, need statement, and budget"
      },
      {
        icon: "edit-3",
        title: "Section-by-Section Editing",
        description: "Review and refine each section individually"
      },
      {
        icon: "database",
        title: "Auto-Populated Data",
        description: "Pulls from your organization profile, programs, and financials"
      },
      {
        icon: "download",
        title: "Export Options",
        description: "Download as text or copy to clipboard for your grant portal"
      }
    ],
    bestPractices: [
      "Provide detailed grant opportunity information for better results",
      "Always review and personalize AI-generated content",
      "Save drafts frequently while editing"
    ],
    tips: [
      "Link grants from Grant Tracker to access the AI Writer",
      "The AI uses your organization's voice if you've trained it in Communications"
    ]
  }
}

/**
 * Get guide for a specific page
 */
export function getPageGuide(pageKey: string): PageGuide | null {
  return pageGuides[pageKey] || null
}

/**
 * Get all available page guides
 */
export function getAllPageGuides(): Record<string, PageGuide> {
  return pageGuides
}

/**
 * Check if a page has a guide
 */
export function hasPageGuide(pageKey: string): boolean {
  return pageKey in pageGuides
}
