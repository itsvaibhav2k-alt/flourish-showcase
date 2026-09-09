'use client'

import { motion } from 'framer-motion'
import { AITileCard } from './ai-tile-card'
import { FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export interface CustomInsightData {
  key: string
  label: string
  value: string | number
  type: 'text' | 'number' | 'currency' | 'percentage'
  highlight?: boolean
}

export interface CustomInsight {
  title: string
  icon?: LucideIcon
  summary: string
  insights: string[]
  data?: CustomInsightData[]
  actionUrl?: string
  actionLabel?: string
}

interface CustomTileProps {
  data: CustomInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}

/**
 * Custom AI Tile
 *
 * Flexible tile for displaying custom AI-generated content.
 * Supports:
 * - Custom summary text
 * - List of insights
 * - Dynamic data display with various types
 * - Optional action button
 */
export function CustomTile({ data, isLoading, onRefresh, lastUpdated }: CustomTileProps) {
  const formatValue = (value: string | number, type: CustomInsightData['type']) => {
    if (typeof value === 'number') {
      switch (type) {
        case 'currency':
          return `$${value.toLocaleString()}`
        case 'percentage':
          return `${value}%`
        case 'number':
          return value.toLocaleString()
        default:
          return value
      }
    }
    return value
  }

  const IconComponent = data?.icon || FileText

  return (
    <AITileCard
      title={data?.title || 'Custom Insight'}
      icon={<IconComponent />}
      isLoading={isLoading}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
    >
      {data ? (
        <div className="space-y-4">
          {/* Summary Section */}
          {data.summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3 rounded-lg bg-primary-50 border border-primary-100"
            >
              <p className="text-sm text-neutral-900 leading-relaxed">{data.summary}</p>
            </motion.div>
          )}

          {/* Data Grid */}
          {data.data && data.data.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {data.data.map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={cn(
                    'p-2.5 rounded-lg border',
                    item.highlight
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-neutral-50 border-neutral-200'
                  )}
                >
                  <p className="text-xs text-neutral-600 mb-0.5">{item.label}</p>
                  <p
                    className={cn(
                      'text-lg font-bold',
                      item.highlight ? 'text-primary-700' : 'text-neutral-900'
                    )}
                  >
                    {formatValue(item.value, item.type)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Insights List */}
          {data.insights && data.insights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 mb-2">Key Insights</h4>
              <div className="space-y-2">
                {data.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 transition-colors"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-700 leading-relaxed flex-1">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {data.actionUrl && data.actionLabel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link href={data.actionUrl}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <span className="text-sm font-semibold">{data.actionLabel}</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* Empty state for minimal data */}
          {!data.summary && (!data.insights || data.insights.length === 0) && (!data.data || data.data.length === 0) && (
            <div className="py-6 text-center">
              <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600 mb-1">No Insights Yet</p>
              <p className="text-xs text-neutral-400 max-w-[200px] mx-auto">
                Click refresh to generate custom insights
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">No Data Yet</p>
          <p className="text-xs text-neutral-400 max-w-[200px] mx-auto">
            Click refresh to generate insights for this tile
          </p>
        </div>
      )}
    </AITileCard>
  )
}
