'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/motion/variants'
import {
  Plus,
  GitBranch,
  Play,
  Pause,
  Users,
  Mail,
  Clock,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FloraBreadcrumb } from '@/modules/flora/components'
import { SequenceBuilder } from './sequence-builder'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'
import { getSequences } from '../queries/get-sequences'
import { getSequenceStats } from '../queries/get-sequence-stats'
import type { Sequence, SequenceStats } from '../schemas/sequence.schema'

// Pre-built sequence templates
const SEQUENCE_TEMPLATES = [
  {
    id: 'new-donor-welcome',
    name: 'New Donor Welcome',
    description: 'Welcome series for first-time donors - 3 emails over 2 weeks',
    trigger: 'First Gift',
    steps: 3,
    duration: '14 days',
    icon: '👋',
    color: 'bg-emerald-500',
  },
  {
    id: 'lapsed-reengagement',
    name: 'Lapsed Donor Re-engagement',
    description: 'Re-engagement series for lapsed donors - 4 emails over 1 month',
    trigger: 'High Lapse Risk',
    steps: 4,
    duration: '30 days',
    icon: '💝',
    color: 'bg-amber-500',
  },
  {
    id: 'volunteer-onboarding',
    name: 'Volunteer Onboarding',
    description: 'Onboarding series for new volunteers - 2 emails over 1 week',
    trigger: 'First Shift Signup',
    steps: 2,
    duration: '7 days',
    icon: '🤝',
    color: 'bg-blue-500',
  },
  {
    id: 'year-end-appeal',
    name: 'Year-End Appeal',
    description: 'Year-end giving campaign - 5 emails over 6 weeks',
    trigger: 'November 1st',
    steps: 5,
    duration: '6 weeks',
    icon: '🎁',
    color: 'bg-purple-500',
  },
]

// Helper to get readable trigger name
function getTriggerLabel(trigger_type: string): string {
  const labels: Record<string, string> = {
    gift: 'First Gift',
    signup: 'New Signup',
    lapse_risk: 'High Lapse Risk',
    manual: 'Manual',
    date: 'Scheduled Date',
    volunteer_signup: 'Volunteer Signup',
    volunteer_completed: 'Volunteer Shift',
  }
  return labels[trigger_type] || trigger_type
}

export function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [stats, setStats] = useState<SequenceStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [sequencesResult, statsResult] = await Promise.all([
          getSequences(),
          getSequenceStats(),
        ])

        if (sequencesResult.success && sequencesResult.sequences) {
          setSequences(sequencesResult.sequences)
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats)
        }
      } catch (error) {
        console.error('Failed to load sequences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate aggregate stats
  const activeSequencesCount = sequences.filter(s => s.is_active).length
  const totalEnrolled = stats.reduce((sum, s) => sum + s.total_enrolled, 0)
  const totalSent = stats.reduce((sum, s) => sum + s.total_sent, 0)
  const avgOpenRate = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.avg_open_rate, 0) / stats.length)
    : null

  // Get stats for a specific sequence
  const getStatsForSequence = (sequenceId: string) => {
    return stats.find(s => s.sequence_id === sequenceId)
  }

  if (showBuilder) {
    return (
      <SequenceBuilder
        templateId={selectedTemplate}
        onClose={() => {
          setShowBuilder(false)
          setSelectedTemplate(null)
        }}
      />
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <FloraBreadcrumb currentPage="Sequences" />

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-violet-500" />
            Email Sequences
          </h2>
          <p className="text-neutral-500 mt-1">
            Automated email journeys powered by AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageGuideTrigger pageKey="sequences" />
          <Button
            onClick={() => setShowBuilder(true)}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-card border-neutral-200/60">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-12" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            {[
              { label: 'Active Sequences', value: String(activeSequencesCount), icon: Play, gradient: 'from-emerald-500 to-emerald-600' },
              { label: 'Contacts Enrolled', value: String(totalEnrolled), icon: Users, gradient: 'from-blue-500 to-blue-600' },
              { label: 'Emails Sent', value: String(totalSent), icon: Mail, gradient: 'from-violet-500 to-violet-600' },
              { label: 'Avg Open Rate', value: avgOpenRate !== null ? `${avgOpenRate}%` : '--', icon: Zap, gradient: 'from-amber-500 to-amber-600' },
            ].map((stat) => (
              <Card key={stat.label} className="shadow-card border-neutral-200/60">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-neutral-900">{stat.value}</p>
                      <p className="text-sm text-neutral-500">{stat.label}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </motion.div>

      {/* Active Sequences */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">Your Sequences</h3>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-card border-neutral-200/60">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-8 mx-auto" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-8 mx-auto" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-10 mx-auto" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                      <Skeleton className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sequences.length === 0 ? (
          <Card className="border-dashed border-2 border-neutral-200 bg-neutral-50/50">
            <CardContent className="py-12 text-center">
              <GitBranch className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">No sequences yet</p>
              <Button
                variant="outline"
                onClick={() => setShowBuilder(true)}
              >
                Create your first sequence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sequences.map((sequence) => {
              const seqStats = getStatsForSequence(sequence.id)
              return (
                <motion.div
                  key={sequence.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            sequence.is_active
                              ? 'bg-emerald-100'
                              : 'bg-neutral-100'
                          }`}>
                            {sequence.is_active ? (
                              <Play className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <Pause className="h-5 w-5 text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-900">
                              {sequence.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTriggerLabel(sequence.trigger_type)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-neutral-900">
                              {seqStats?.total_enrolled ?? 0}
                            </p>
                            <p className="text-xs text-neutral-500">Enrolled</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-neutral-900">
                              {seqStats?.total_sent ?? 0}
                            </p>
                            <p className="text-xs text-neutral-500">Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-emerald-600">
                              {seqStats?.avg_open_rate ? `${seqStats.avg_open_rate}%` : '--'}
                            </p>
                            <p className="text-xs text-neutral-500">Open Rate</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Templates */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h3 className="text-lg font-medium text-neutral-900">Quick Start Templates</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {SEQUENCE_TEMPLATES.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-all shadow-card border-neutral-200/60 overflow-hidden"
                onClick={() => {
                  setSelectedTemplate(template.id)
                  setShowBuilder(true)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl p-2 rounded-lg ${template.color} bg-opacity-10`}>
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900">{template.name}</h4>
                      <p className="text-sm text-neutral-500 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="secondary" className="text-xs">
                          {template.trigger}
                        </Badge>
                        <span className="text-xs text-neutral-400">
                          {template.steps} emails • {template.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
