'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Gift, UserPlus, FileText, TrendingUp } from 'lucide-react'
import type { TeamMemberStatsNew } from '../queries'

interface MemberStatsGridProps {
  members: TeamMemberStatsNew[]
}

export function MemberStatsGrid({ members }: MemberStatsGridProps) {
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ')
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary-100 text-primary-700'
      case 'member':
        return 'bg-blue-100 text-blue-700'
      case 'viewer':
        return 'bg-neutral-100 text-neutral-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card
          key={member.user_id}
          className="shadow-card border-neutral-200/60 bg-white hover:shadow-lg transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name || member.email}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-violet-700">
                      {getInitials(member.full_name, member.email)}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold text-neutral-900 truncate">
                  {member.full_name || member.email.split('@')[0]}
                </CardTitle>
                <p className="text-xs text-neutral-500 truncate mt-0.5">
                  {member.email}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(member.role)}`}
                >
                  {member.role}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Total Activities */}
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <span className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Total Activities
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {member.total_activities}
                </span>
              </div>

              {/* Activity Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-purple-50/50 rounded">
                  <span className="text-xs text-neutral-600 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-purple-600" />
                    Emails
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {member.emails_sent}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-amber-50/50 rounded">
                  <span className="text-xs text-neutral-600 flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5 text-amber-600" />
                    Gifts
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {member.gifts_recorded}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50/50 rounded">
                  <span className="text-xs text-neutral-600 flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                    Contacts
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {member.contacts_added}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50/50 rounded">
                  <span className="text-xs text-neutral-600 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-green-600" />
                    Notes
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {member.notes_added}
                  </span>
                </div>
              </div>

              {/* Gift Amount if available */}
              {member.gift_amount > 0 && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-xs font-medium text-green-700">
                    Total Gift Amount
                  </span>
                  <span className="text-sm font-bold text-green-900">
                    ${member.gift_amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
