'use client'

import {
  Heart,
  Users,
  Utensils,
  Home,
  Book,
  Sparkles,
  Gift,
  Star,
  TreePine,
  Droplet,
  Shirt,
  Pill
} from 'lucide-react'

interface ImpactMetric {
  type: string
  value: number
  label: string
  icon?: string
}

interface ImpactBreakdownProps {
  metrics: ImpactMetric[]
  animated?: boolean
}

const iconMap: Record<string, typeof Heart> = {
  heart: Heart,
  users: Users,
  meals: Utensils,
  families: Home,
  homes: Home,
  books: Book,
  sparkles: Sparkles,
  gift: Gift,
  star: Star,
  trees: TreePine,
  water: Droplet,
  clothes: Shirt,
  clothing: Shirt,
  medicine: Pill,
  medical: Pill,
}

const iconColorMap: Record<string, string> = {
  heart: 'text-primary-600 bg-primary-50',
  users: 'text-primary-600 bg-primary-50',
  meals: 'text-primary-600 bg-primary-50',
  families: 'text-primary-600 bg-primary-50',
  homes: 'text-primary-600 bg-primary-50',
  books: 'text-primary-600 bg-primary-50',
  sparkles: 'text-primary-600 bg-primary-50',
  gift: 'text-primary-600 bg-primary-50',
  star: 'text-primary-600 bg-primary-50',
  trees: 'text-primary-600 bg-primary-50',
  water: 'text-primary-600 bg-primary-50',
  clothes: 'text-primary-600 bg-primary-50',
  clothing: 'text-primary-600 bg-primary-50',
  medicine: 'text-primary-600 bg-primary-50',
  medical: 'text-primary-600 bg-primary-50',
}

/**
 * Visual breakdown of impact metrics with icons and animated counters
 * Displays each metric in a beautiful card layout
 */
export function ImpactBreakdown({ metrics, animated = true }: ImpactBreakdownProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <ImpactMetricCard
          key={index}
          metric={metric}
          animated={animated}
          delay={index * 100}
        />
      ))}
    </div>
  )
}

interface ImpactMetricCardProps {
  metric: ImpactMetric
  animated: boolean
  delay: number
}

function ImpactMetricCard({ metric, animated: _animated, delay: _delay }: ImpactMetricCardProps) {
  const IconComponent = metric.icon && iconMap[metric.icon.toLowerCase()]
    ? iconMap[metric.icon.toLowerCase()]
    : Sparkles

  const iconColors = metric.icon && iconColorMap[metric.icon.toLowerCase()]
    ? iconColorMap[metric.icon.toLowerCase()]
    : 'text-primary-600 bg-primary-50'

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div
      className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-xl p-3 ${iconColors}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-3xl font-bold text-neutral-900 mb-1 heading-tight">
            {formatNumber(metric.value)}
          </div>
          <div className="text-sm text-neutral-600 leading-snug">
            {metric.label}
          </div>
        </div>
      </div>
    </div>
  )
}
