/**
 * Score Definitions
 *
 * Comprehensive explanations for all metrics and scores shown in Flourish.
 * Used in tooltips, help modals, and educational content throughout the app.
 */

export interface ScoreDefinition {
  title: string
  description: string
  calculation?: string
  ranges?: { min: number; max: number; label: string; description?: string }[]
  // Legacy fields for backwards compatibility
  simple?: string
  tip?: string
  detailed?: {
    factors?: { name: string; weight: string; description: string }[]
    ranges?: { min: number; max: number; label: string; color: string }[]
    formula?: string
  }
}

export const scoreDefinitions: Record<string, ScoreDefinition> = {
  lapseRisk: {
    title: "Lapse Risk",
    description: "I track how long it's been since each donor's last gift compared to their usual giving pattern. If they're overdue, I flag them so you can re-engage before they lapse.",
    calculation: "Days since last gift ÷ Average giving interval\n\nDonors are flagged when they exceed their typical giving pattern:\n• Low Risk: Within 1.5x their average gift interval\n• Medium Risk: 1.5-2x their average interval\n• High Risk: More than 2x their average interval",
    ranges: [
      {
        min: 0,
        max: 1.5,
        label: "Low Risk",
        description: "Donor is giving on schedule",
      },
      {
        min: 1.5,
        max: 2.0,
        label: "Medium Risk",
        description: "Donor is overdue for engagement",
      },
      {
        min: 2.0,
        max: Infinity,
        label: "High Risk",
        description: "Donor may lapse without intervention",
      },
    ],
    simple: "I track how long it's been since each donor's last gift compared to their usual giving pattern. If they're overdue, I flag them so you can re-engage before they lapse.",
    tip: "Reach out to medium and high-risk donors with a personalized thank-you or impact update to keep them engaged.",
    detailed: {
      formula: "Days since last gift ÷ Average giving interval",
      ranges: [
        {
          min: 0,
          max: 1.5,
          label: "Low Risk",
          color: "green",
        },
        {
          min: 1.5,
          max: 2.0,
          label: "Medium Risk",
          color: "yellow",
        },
        {
          min: 2.0,
          max: Infinity,
          label: "High Risk",
          color: "red",
        },
      ],
    },
  },

  lifetimeGiving: {
    title: "Lifetime Giving",
    description: "I add up all the gifts a donor has made to your organization to show their total contribution over time.",
    calculation: "Sum of all gift amounts from this donor\n\nThis includes:\n• One-time donations\n• Recurring gifts\n• In-kind contributions (if tracked)\n• Pledge payments\n\nRecognize milestone donors when they cross major thresholds like $1,000, $5,000, or $10,000.",
    simple: "I add up all the gifts a donor has made to your organization to show their total contribution over time.",
    tip: "Recognize milestone donors when they cross major thresholds like $1,000, $5,000, or $10,000.",
    detailed: {
      formula: "Sum of all gift amounts from this donor",
    },
  },

  donorSegments: {
    title: "Donor Segments",
    simple: "I categorize donors based on their giving patterns to help you tailor your outreach and stewardship strategies.",
    tip: "Use segments to create targeted communication campaigns for each donor group.",
    detailed: {
      ranges: [
        {
          min: 1000,
          max: Infinity,
          label: "Major Donor",
          color: "purple",
        },
        {
          min: 0,
          max: Infinity,
          label: "Steady Giver",
          color: "green",
        },
        {
          min: 0,
          max: Infinity,
          label: "Lapsed Donor",
          color: "red",
        },
        {
          min: 0,
          max: Infinity,
          label: "First-Time Donor",
          color: "blue",
        },
      ],
    },
  },

  givingPotentialOverall: {
    title: "Overall Giving Potential",
    description: "I analyze a donor's wealth, connection to your mission, and likelihood to give to predict their overall potential as a supporter.",
    calculation: "Weighted average: (Capacity × 40%) + (Affinity × 30%) + (Propensity × 30%)",
    ranges: [
      {
        min: 80,
        max: 100,
        label: "High Potential",
        description: "Top prospects with strong capacity, affinity, and propensity",
      },
      {
        min: 60,
        max: 79,
        label: "Medium Potential",
        description: "Good prospects worth cultivating",
      },
      {
        min: 40,
        max: 59,
        label: "Moderate Potential",
        description: "Some potential, may need more engagement",
      },
      {
        min: 0,
        max: 39,
        label: "Low Potential",
        description: "Limited potential at this time",
      },
    ],
    simple: "I analyze a donor's wealth, connection to your mission, and likelihood to give to predict their overall potential as a supporter.",
    tip: "Focus major gift efforts on prospects scoring 60 or above—they have the strongest combination of capacity, affinity, and propensity.",
    detailed: {
      formula: "(Capacity × 0.4) + (Affinity × 0.3) + (Propensity × 0.3)",
      factors: [
        {
          name: "Capacity",
          weight: "40%",
          description: "Their financial ability to make a significant gift",
        },
        {
          name: "Affinity",
          weight: "30%",
          description: "Their connection and commitment to your mission",
        },
        {
          name: "Propensity",
          weight: "30%",
          description: "Their likelihood to give based on past behavior",
        },
      ],
      ranges: [
        {
          min: 80,
          max: 100,
          label: "Top Prospect",
          color: "purple",
        },
        {
          min: 60,
          max: 79,
          label: "Strong Prospect",
          color: "blue",
        },
        {
          min: 40,
          max: 59,
          label: "Moderate Prospect",
          color: "green",
        },
        {
          min: 20,
          max: 39,
          label: "Emerging Prospect",
          color: "yellow",
        },
        {
          min: 0,
          max: 19,
          label: "Low Prospect",
          color: "gray",
        },
      ],
    },
  },

  capacityScore: {
    title: "Capacity Score",
    description: "I estimate a donor's financial ability to give based on wealth indicators like real estate holdings, stock ownership, job level, and political donations.",
    calculation: "Weighted formula based on: Real Estate (40%), Stocks (30%), Job Level (20%), Political Donations (10%)",
    ranges: [
      {
        min: 80,
        max: 100,
        label: "Very High Capacity",
        description: "Exceptional wealth indicators suggest major gift potential",
      },
      {
        min: 60,
        max: 79,
        label: "High Capacity",
        description: "Strong financial position for significant giving",
      },
      {
        min: 40,
        max: 59,
        label: "Moderate Capacity",
        description: "Some capacity for mid-level gifts",
      },
      {
        min: 0,
        max: 39,
        label: "Limited Capacity",
        description: "Lower wealth indicators at this time",
      },
    ],
    simple: "I estimate a donor's financial ability to give based on wealth indicators like real estate holdings, stock ownership, job level, and political donations.",
    tip: "High capacity donors may not be giving to their potential—look for those with high capacity but lower affinity or propensity scores.",
    detailed: {
      formula: "(Real Estate × 0.4) + (Stocks × 0.3) + (Job Level × 0.2) + (Political Donations × 0.1)",
      factors: [
        {
          name: "Real Estate Holdings",
          weight: "40%",
          description: "Property ownership and estimated values",
        },
        {
          name: "Stock Ownership",
          weight: "30%",
          description: "Public company holdings and investment patterns",
        },
        {
          name: "Job Level",
          weight: "20%",
          description: "Professional position and industry sector",
        },
        {
          name: "Political Donations",
          weight: "10%",
          description: "Public record of political giving (indicates disposable income)",
        },
      ],
      ranges: [
        {
          min: 80,
          max: 100,
          label: "Very High Capacity",
          color: "purple",
        },
        {
          min: 60,
          max: 79,
          label: "High Capacity",
          color: "blue",
        },
        {
          min: 40,
          max: 59,
          label: "Moderate Capacity",
          color: "green",
        },
        {
          min: 20,
          max: 39,
          label: "Limited Capacity",
          color: "yellow",
        },
        {
          min: 0,
          max: 19,
          label: "Low Capacity",
          color: "gray",
        },
      ],
    },
  },

  affinityScore: {
    title: "Affinity Score",
    description: "I measure how connected a donor is to your mission by looking at their giving relative to capacity, volunteer involvement, email engagement, and event attendance.",
    calculation: "Weighted formula based on: Giving Ratio (40%), Volunteer Hours (30%), Email Engagement (20%), Events (10%)",
    ranges: [
      {
        min: 80,
        max: 100,
        label: "Very High Affinity",
        description: "Deeply connected to your mission with strong engagement",
      },
      {
        min: 60,
        max: 79,
        label: "High Affinity",
        description: "Strong connection and regular engagement",
      },
      {
        min: 40,
        max: 59,
        label: "Moderate Affinity",
        description: "Some connection, could be strengthened",
      },
      {
        min: 0,
        max: 39,
        label: "Low Affinity",
        description: "Limited engagement with your organization",
      },
    ],
    simple: "I measure how connected a donor is to your mission by looking at their giving relative to capacity, volunteer involvement, email engagement, and event attendance.",
    tip: "Donors with high affinity but lower capacity make excellent volunteers, advocates, and peer fundraisers.",
    detailed: {
      formula: "(Giving Ratio × 0.4) + (Volunteer Hours × 0.3) + (Email Engagement × 0.2) + (Events × 0.1)",
      factors: [
        {
          name: "Giving Ratio to Capacity",
          weight: "40%",
          description: "How much they give relative to what they could give",
        },
        {
          name: "Volunteer Hours",
          weight: "30%",
          description: "Time invested in your organization",
        },
        {
          name: "Email Engagement",
          weight: "20%",
          description: "Opens, clicks, and responses to communications",
        },
        {
          name: "Event Attendance",
          weight: "10%",
          description: "Participation in programs and gatherings",
        },
      ],
      ranges: [
        {
          min: 80,
          max: 100,
          label: "Very High Affinity",
          color: "purple",
        },
        {
          min: 60,
          max: 79,
          label: "High Affinity",
          color: "blue",
        },
        {
          min: 40,
          max: 59,
          label: "Moderate Affinity",
          color: "green",
        },
        {
          min: 20,
          max: 39,
          label: "Low Affinity",
          color: "yellow",
        },
        {
          min: 0,
          max: 19,
          label: "Very Low Affinity",
          color: "gray",
        },
      ],
    },
  },

  propensityScore: {
    title: "Propensity Score",
    description: "I analyze a donor's giving patterns—how recently, how often, and whether their gifts are growing—to predict their likelihood of making another gift soon.",
    calculation: "Weighted formula based on: Recency (40%), Frequency (30%), Gift Growth Trend (30%)",
    ranges: [
      {
        min: 80,
        max: 100,
        label: "Very High Propensity",
        description: "Very likely to give again soon with strong patterns",
      },
      {
        min: 60,
        max: 79,
        label: "High Propensity",
        description: "Good likelihood of continued giving",
      },
      {
        min: 40,
        max: 59,
        label: "Moderate Propensity",
        description: "May need some encouragement to give again",
      },
      {
        min: 0,
        max: 39,
        label: "Low Propensity",
        description: "Less likely to give without re-engagement",
      },
    ],
    simple: "I analyze a donor's giving patterns—how recently, how often, and whether their gifts are growing—to predict their likelihood of making another gift soon.",
    tip: "Donors with declining propensity scores may need re-engagement, even if they have high capacity and affinity.",
    detailed: {
      formula: "(Recency × 0.4) + (Frequency × 0.3) + (Gift Growth × 0.3)",
      factors: [
        {
          name: "Recency",
          weight: "40%",
          description: "How recently they made their last gift",
        },
        {
          name: "Frequency",
          weight: "30%",
          description: "How often they give over time",
        },
        {
          name: "Gift Growth Trend",
          weight: "30%",
          description: "Whether their gift sizes are increasing, stable, or declining",
        },
      ],
      ranges: [
        {
          min: 80,
          max: 100,
          label: "Very High Propensity",
          color: "purple",
        },
        {
          min: 60,
          max: 79,
          label: "High Propensity",
          color: "blue",
        },
        {
          min: 40,
          max: 59,
          label: "Moderate Propensity",
          color: "green",
        },
        {
          min: 20,
          max: 39,
          label: "Low Propensity",
          color: "yellow",
        },
        {
          min: 0,
          max: 19,
          label: "Very Low Propensity",
          color: "gray",
        },
      ],
    },
  },

  givingGap: {
    title: "Giving Gap",
    description: "I calculate the difference between what a donor could potentially give (based on their capacity) and what they're currently giving to identify upgrade opportunities.",
    calculation: "Estimated Capacity - Current Annual Giving\n\nThis shows the untapped potential for each donor. A large gap suggests room for a major gift conversation.",
    simple: "I calculate the difference between what a donor could potentially give (based on their capacity) and what they're currently giving to identify upgrade opportunities.",
    tip: "A large giving gap suggests room for a major gift conversation—share impact stories and invite deeper involvement.",
    detailed: {
      formula: "Estimated Capacity - Current Annual Giving",
    },
  },

  readinessScore: {
    title: "Readiness Score",
    description: "I track prospect engagement through your pipeline to determine how ready they are for a major gift solicitation based on touchpoints, responsiveness, and relationship progression.",
    calculation: "This score combines:\n• Move Count (30%): Number of meaningful touchpoints in the past 90 days\n• Recency (25%): How recently you've had contact\n• Stage Duration (20%): Time in current pipeline stage\n• Move Quality (15%): Depth of engagement (meetings > calls > emails)\n• Response Indicators (10%): Positive signals like accepting invitations",
    ranges: [
      {
        min: 80,
        max: 100,
        label: "Ready for Ask",
        description: "This prospect is ready for a solicitation. They've been well-cultivated with sufficient touchpoints and engagement.",
      },
      {
        min: 60,
        max: 79,
        label: "Continue Cultivation",
        description: "Keep building the relationship with regular touchpoints. Not quite ready for the ask yet.",
      },
      {
        min: 40,
        max: 59,
        label: "Increase Engagement",
        description: "More cultivation needed. Schedule additional meetings or calls to deepen the relationship.",
      },
      {
        min: 0,
        max: 39,
        label: "Re-assess Strategy",
        description: "Low engagement. Consider whether this prospect should remain in the pipeline or needs a different approach.",
      },
    ],
    simple: "I track prospect engagement through your pipeline to determine how ready they are for a major gift solicitation based on touchpoints, responsiveness, and relationship progression.",
    tip: "Prospects scoring 80+ are ready for an ask. Those scoring 40-60 need more cultivation before solicitation.",
    detailed: {
      formula: "(Move Count × 0.3) + (Recency × 0.25) + (Stage Duration × 0.2) + (Move Quality × 0.15) + (Response Indicators × 0.1)",
      factors: [
        {
          name: "Move Count",
          weight: "30%",
          description: "Number of meaningful touchpoints in the past 90 days",
        },
        {
          name: "Recency",
          weight: "25%",
          description: "How recently you've had contact",
        },
        {
          name: "Stage Duration",
          weight: "20%",
          description: "Time in current pipeline stage (too long may indicate stalling)",
        },
        {
          name: "Move Quality",
          weight: "15%",
          description: "Depth of engagement (meetings > calls > emails)",
        },
        {
          name: "Response Indicators",
          weight: "10%",
          description: "Positive signals like accepting invitations or asking questions",
        },
      ],
      ranges: [
        {
          min: 80,
          max: 100,
          label: "Ready for Ask",
          color: "green",
        },
        {
          min: 60,
          max: 79,
          label: "Continue Cultivation",
          color: "blue",
        },
        {
          min: 40,
          max: 59,
          label: "Increase Engagement",
          color: "yellow",
        },
        {
          min: 0,
          max: 39,
          label: "Re-assess Strategy",
          color: "red",
        },
      ],
    },
  },

  targetAskAmount: {
    title: "Target Ask Amount",
    description: "I suggest an appropriate ask amount for major gift prospects based on their capacity, past giving, and peer comparisons.",
    calculation: "The target ask amount is calculated as the maximum of:\n• Largest previous gift × 2.5\n• Capacity Score × $100\n• Minimum of $1,000\n\nThis ensures the ask is ambitious but realistic based on the prospect's giving history and estimated capacity.",
    simple: "I suggest an appropriate ask amount for major gift prospects based on their capacity, past giving, and peer comparisons.",
    tip: "Use this as a starting point for your ask strategy, but adjust based on your relationship and recent conversations.",
    detailed: {
      formula: "Max of: (Largest Previous Gift × 2.5), (Capacity Score × $100), or ($1,000 minimum)",
    },
  },

  pipelineStages: {
    title: "Pipeline Stages",
    simple: "I organize major gift prospects into five stages—Identification, Qualification, Cultivation, Solicitation, and Stewardship—to help you manage relationships systematically.",
    tip: "Move prospects through stages deliberately. Most successful asks happen after 6-12 months of cultivation.",
    detailed: {
      ranges: [
        {
          min: 1,
          max: 1,
          label: "Identification",
          color: "gray",
        },
        {
          min: 2,
          max: 2,
          label: "Qualification",
          color: "blue",
        },
        {
          min: 3,
          max: 3,
          label: "Cultivation",
          color: "yellow",
        },
        {
          min: 4,
          max: 4,
          label: "Solicitation",
          color: "orange",
        },
        {
          min: 5,
          max: 5,
          label: "Stewardship",
          color: "green",
        },
      ],
    },
  },

  reliabilityScore: {
    title: "Reliability Score",
    description: "I calculate how dependable a volunteer is by tracking their show-up rate, on-time arrivals, and completion of assigned tasks.",
    calculation: "This score is based on:\n• Shift completion rate (80% weight)\n• On-time arrival bonuses\n• Penalties for no-shows and late cancellations\n\nThe score helps you identify your most reliable volunteers for critical roles.",
    ranges: [
      {
        min: 90,
        max: 100,
        label: "Excellent",
        description: "Highly dependable volunteer who consistently shows up on time and completes all shifts.",
      },
      {
        min: 75,
        max: 89,
        label: "Very Good",
        description: "Reliable volunteer with strong attendance and minimal issues.",
      },
      {
        min: 60,
        max: 74,
        label: "Good",
        description: "Generally reliable with occasional absences or late arrivals.",
      },
      {
        min: 40,
        max: 59,
        label: "Fair",
        description: "Inconsistent attendance. Consider checking in about barriers to participation.",
      },
      {
        min: 0,
        max: 39,
        label: "Needs Improvement",
        description: "Significant reliability concerns. May not be suitable for critical roles.",
      },
    ],
    simple: "I calculate how dependable a volunteer is by tracking their show-up rate, on-time arrivals, and completion of assigned tasks.",
    tip: "Assign critical roles to volunteers scoring 90+. For those below 60, check in about barriers to participation.",
    detailed: {
      formula: "(Completion Rate × 80) + Bonuses (early arrival, going above & beyond) - Penalties (no-shows, late cancellations)",
      factors: [
        {
          name: "Shift Completion Rate",
          weight: "80%",
          description: "Percentage of confirmed shifts they actually attended",
        },
        {
          name: "On-Time Arrivals",
          weight: "10%",
          description: "Bonus for consistently showing up on time",
        },
        {
          name: "No-Show Penalty",
          weight: "-20%",
          description: "Deduction for missing shifts without notice",
        },
        {
          name: "Late Cancellation Penalty",
          weight: "-10%",
          description: "Deduction for canceling within 24 hours",
        },
      ],
      ranges: [
        {
          min: 90,
          max: 100,
          label: "Excellent",
          color: "green",
        },
        {
          min: 75,
          max: 89,
          label: "Very Good",
          color: "blue",
        },
        {
          min: 60,
          max: 74,
          label: "Good",
          color: "yellow",
        },
        {
          min: 40,
          max: 59,
          label: "Fair",
          color: "orange",
        },
        {
          min: 0,
          max: 39,
          label: "Needs Improvement",
          color: "red",
        },
      ],
    },
  },

  shiftFillRate: {
    title: "Shift Fill Rate",
    description: "I track what percentage of available volunteer spots are filled for each shift or event to help you identify staffing gaps.",
    calculation: "Fill Rate = (Confirmed Volunteers ÷ Total Capacity) × 100\n\nThis helps you monitor recruitment progress and identify shifts that need more volunteers.",
    ranges: [
      {
        min: 100,
        max: 100,
        label: "Fully Staffed",
        description: "All volunteer spots are filled. You're ready for the event!",
      },
      {
        min: 75,
        max: 99,
        label: "Well Staffed",
        description: "Most spots filled. Continue monitoring in case of cancellations.",
      },
      {
        min: 50,
        max: 74,
        label: "Under Staffed",
        description: "Recruitment needed. Consider sending reminders to potential volunteers.",
      },
      {
        min: 0,
        max: 49,
        label: "Critically Under Staffed",
        description: "Urgent action needed. Intensify recruitment efforts or consider reducing shift capacity.",
      },
    ],
    simple: "I track what percentage of available volunteer spots are filled for each shift or event to help you identify staffing gaps.",
    tip: "Aim for 100% fill rate at least 48 hours before an event. Under 75% may require additional recruitment.",
    detailed: {
      formula: "(Confirmed Volunteers ÷ Total Capacity) × 100",
      ranges: [
        {
          min: 100,
          max: 100,
          label: "Fully Staffed",
          color: "green",
        },
        {
          min: 75,
          max: 99,
          label: "Well Staffed",
          color: "blue",
        },
        {
          min: 50,
          max: 74,
          label: "Under Staffed",
          color: "yellow",
        },
        {
          min: 0,
          max: 49,
          label: "Critically Under Staffed",
          color: "red",
        },
      ],
    },
  },

  volunteerHours: {
    title: "Volunteer Hours",
    description: "I total up the hours each volunteer has contributed to your organization based on their completed shifts and logged activities.",
    calculation: "Total Hours = Sum of (Shift Duration × Attendance) for all completed shifts\n\nThis tracks the cumulative time commitment each volunteer has made to your organization. Recognizing milestone hours (25, 50, 100, 500) helps show appreciation and encourage continued involvement.",
    simple: "I total up the hours each volunteer has contributed to your organization based on their completed shifts and logged activities.",
    tip: "Recognize volunteers at milestone hours (25, 50, 100, 500) to show appreciation and encourage continued involvement.",
    detailed: {
      formula: "Sum of (Shift Duration × Attendance) for all completed shifts",
    },
  },
}

/**
 * Get a score definition by key
 */
export function getScoreDefinition(key: string): ScoreDefinition | undefined {
  return scoreDefinitions[key]
}

/**
 * Get the range label and color for a score value
 */
export function getScoreRange(
  key: string,
  value: number
): { label: string; color: string } | undefined {
  const definition = scoreDefinitions[key]
  if (!definition?.detailed.ranges) return undefined

  const range = definition.detailed.ranges.find(
    (r) => value >= r.min && value <= r.max
  )

  return range ? { label: range.label, color: range.color } : undefined
}

/**
 * Format a score value for display
 */
export function formatScore(key: string, value: number): string {
  // Percentages
  if (key.includes("Score") || key.includes("Rate")) {
    return `${Math.round(value)}`
  }

  // Currency
  if (key.includes("Giving") || key.includes("Amount") || key.includes("Gap")) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Hours
  if (key.includes("Hours")) {
    return `${value.toLocaleString()} hrs`
  }

  // Default
  return value.toLocaleString()
}
