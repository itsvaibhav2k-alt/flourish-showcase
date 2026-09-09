'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Mail, Gift, UserPlus, FileText } from 'lucide-react'
import type { TeamMemberStatsNew } from '../queries'

interface ActivityLeaderboardProps {
  members: TeamMemberStatsNew[]
  dateRange: '7d' | '30d' | '90d' | 'all'
}

export function ActivityLeaderboard({ members, dateRange }: ActivityLeaderboardProps) {
  // Sort members by total activities
  const sortedMembers = [...members].sort((a, b) => b.total_activities - a.total_activities)

  const getMedalColor = (index: number) => {
    return 'text-neutral-600 bg-neutral-100'
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ')
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-neutral-600" />
          Team Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedMembers.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-8">
            No activity data available
          </p>
        ) : (
          <div className="space-y-3">
            {sortedMembers.slice(0, 10).map((member, index) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {/* Rank */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${getMedalColor(index)}`}
                >
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || member.email}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-violet-700">
                        {getInitials(member.full_name, member.email)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {member.full_name || member.email}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.emails_sent}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      {member.gifts_recorded}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      {member.contacts_added}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {member.notes_added}
                    </span>
                  </div>
                </div>

                {/* Total Activities */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-neutral-900">
                    {member.total_activities}
                  </p>
                  <p className="text-xs text-neutral-500">activities</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
