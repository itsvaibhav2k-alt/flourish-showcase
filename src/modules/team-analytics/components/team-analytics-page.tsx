'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Users,
  Mail,
  UserPlus,
  DollarSign,
  Activity,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getTeamMemberStats,
  getTeamOverviewStats,
  type TeamMemberStats,
  type TeamOverviewStats,
} from '../queries'
import { toast } from 'sonner'

interface TeamAnalyticsPageProps {
  organizationId: string
}

export function TeamAnalyticsPage({ organizationId }: TeamAnalyticsPageProps) {
  const [memberStats, setMemberStats] = useState<TeamMemberStats[]>([])
  const [overviewStats, setOverviewStats] = useState<TeamOverviewStats>({
    totalMembers: 0,
    totalEmailsSent: 0,
    totalContactsAdded: 0,
    totalGiftsRecorded: 0,
    activeThisWeek: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [members, overview] = await Promise.all([
          getTeamMemberStats(),
          getTeamOverviewStats(),
        ])
        setMemberStats(members)
        setOverviewStats(overview)
      } catch (error) {
        console.error('Error loading team analytics:', error)
        toast.error('Failed to load team analytics')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ').filter(Boolean)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'member':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-200'
    }
  }

  const topPerformer = memberStats[0]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>Team Analytics</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200">
                      <Sparkles className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-700">Add-on</span>
                    </div>
                  </div>
                </div>
              </div>
            }
            description="Performance metrics and activity insights for your team"
          />
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4"
            >
              {[
                {
                  label: 'Team Members',
                  value: overviewStats.totalMembers,
                  icon: Users,
                  color: 'teal',
                },
                {
                  label: 'Active This Week',
                  value: overviewStats.activeThisWeek,
                  icon: Activity,
                  color: 'emerald',
                },
                {
                  label: 'Emails Sent',
                  value: overviewStats.totalEmailsSent,
                  icon: Mail,
                  color: 'blue',
                },
                {
                  label: 'Contacts Added',
                  value: overviewStats.totalContactsAdded,
                  subLabel: 'this month',
                  icon: UserPlus,
                  color: 'purple',
                },
                {
                  label: 'Gifts Recorded',
                  value: overviewStats.totalGiftsRecorded,
                  subLabel: 'this month',
                  icon: DollarSign,
                  color: 'amber',
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Card className="border-neutral-200 hover:border-neutral-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-neutral-500">{stat.label}</p>
                          <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
                          {stat.subLabel && (
                            <p className="text-xs text-neutral-400">{stat.subLabel}</p>
                          )}
                        </div>
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center',
                            stat.color === 'teal' && 'bg-teal-100 text-teal-600',
                            stat.color === 'emerald' && 'bg-emerald-100 text-emerald-600',
                            stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                            stat.color === 'purple' && 'bg-purple-100 text-purple-600',
                            stat.color === 'amber' && 'bg-amber-100 text-amber-600'
                          )}
                        >
                          <stat.icon className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Top Performer Highlight */}
            {topPerformer && topPerformer.emailsSent > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Award className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-neutral-900">Top Performer</h3>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            Most Emails Sent
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600">
                          <span className="font-medium">{topPerformer.name || topPerformer.email}</span>
                          {' '}has sent {topPerformer.emailsSent} emails
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-amber-600">{topPerformer.emailsSent}</p>
                        <p className="text-xs text-neutral-500">emails sent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Team Members Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="border-neutral-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-neutral-500" />
                    Team Performance
                  </CardTitle>
                  <CardDescription>
                    Individual performance metrics for each team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {memberStats.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        No team members found
                      </div>
                    ) : (
                      memberStats.map((member, index) => (
                        <motion.div
                          key={member.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                          className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm">
                              {getInitials(member.name, member.email)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-neutral-900 truncate">
                                {member.name || member.email}
                              </p>
                              <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                                {member.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="font-semibold text-neutral-900">{member.emailsSent}</p>
                              <p className="text-xs text-neutral-500">Sent</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-neutral-900">{member.emailsDrafted}</p>
                              <p className="text-xs text-neutral-500">Drafted</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-neutral-900">
                                {member.copilotActionsCompleted}
                              </p>
                              <p className="text-xs text-neutral-500">Actions</p>
                            </div>
                            <div className="text-center min-w-[80px]">
                              <div className="flex items-center justify-center gap-1 text-neutral-500">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">{formatTimeAgo(member.lastActive)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <Card className="border-neutral-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Quick Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">
                        {Math.round((overviewStats.activeThisWeek / Math.max(overviewStats.totalMembers, 1)) * 100)}%
                        team engagement
                      </p>
                      <p className="text-xs text-emerald-700">Active members this week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {Math.round(overviewStats.totalEmailsSent / Math.max(overviewStats.totalMembers, 1))} emails
                        per member
                      </p>
                      <p className="text-xs text-blue-700">Average communication rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Copilot Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {memberStats
                      .filter((m) => m.copilotActionsCompleted > 0)
                      .slice(0, 3)
                      .map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-2 rounded-lg bg-purple-50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-purple-500 text-white text-xs">
                                {getInitials(member.name, member.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-purple-900">
                              {member.name || member.email.split('@')[0]}
                            </span>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700">
                            {member.copilotActionsCompleted} actions
                          </Badge>
                        </div>
                      ))}
                    {memberStats.filter((m) => m.copilotActionsCompleted > 0).length === 0 && (
                      <div className="text-center py-4 text-neutral-500 text-sm">
                        No copilot actions completed yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
