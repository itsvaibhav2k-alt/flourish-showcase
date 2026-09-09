'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface ProgressThermometerProps {
  current: number
  goal: number
  height?: number
  className?: string
}

export function ProgressThermometer({
  current,
  goal,
  className,
}: ProgressThermometerProps) {
  const percentage = Math.min(100, (current / goal) * 100)
  const isOverGoal = current > goal

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-1">
        <div className="text-3xl font-semibold text-neutral-900">
          {percentage.toFixed(0)}%
        </div>
        <div className="text-sm text-neutral-600">
          <span className="font-semibold text-emerald-600">
            {formatCurrency(current)}
          </span>
          {' of '}
          <span className="font-medium">{formatCurrency(goal)}</span>
        </div>
      </div>

      <Progress value={percentage} className="h-3" />

      {isOverGoal && (
        <p className="text-xs font-medium text-emerald-600 text-center">
          Goal exceeded!
        </p>
      )}
    </div>
  )
}
