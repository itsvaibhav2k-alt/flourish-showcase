'use client'

import { motion } from 'framer-motion'
import { Play, Pause, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SequenceCardProps {
  sequence: {
    id: string
    name: string
    status: 'active' | 'paused' | 'draft'
    trigger: string
    steps: number
    enrolledCount: number
    sentCount: number
    openRate: number
  }
  onClick?: () => void
}

export function SequenceCard({ sequence, onClick }: SequenceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                sequence.status === 'active'
                  ? 'bg-emerald-100'
                  : 'bg-gray-100'
              }`}>
                {sequence.status === 'active' ? (
                  <Play className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Pause className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {sequence.name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {sequence.trigger}
                  </span>
                  <span>{sequence.steps} steps</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {sequence.enrolledCount}
                </p>
                <p className="text-xs text-gray-500">Enrolled</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {sequence.sentCount}
                </p>
                <p className="text-xs text-gray-500">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-emerald-600">
                  {sequence.openRate}%
                </p>
                <p className="text-xs text-gray-500">Open Rate</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
