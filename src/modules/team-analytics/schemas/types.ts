// Types for team analytics

export interface TeamMemberStats {
  userId: string
  email: string
  name: string | null
  role: 'admin' | 'member' | 'viewer'
  emailsDrafted: number
  emailsSent: number
  contactsAdded: number
  giftsRecorded: number
  copilotActionsCompleted: number
  lastActive: string | null
}

export interface TeamOverviewStats {
  totalMembers: number
  totalEmailsSent: number
  totalContactsAdded: number
  totalGiftsRecorded: number
  activeThisWeek: number
}
