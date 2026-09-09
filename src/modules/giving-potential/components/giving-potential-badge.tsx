import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Gem, TrendingUp, Minus } from 'lucide-react'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'

interface GivingPotentialBadgeProps {
  score: number
  className?: string
  showIcon?: boolean
}

/**
 * Badge component for displaying giving potential score
 * - Green (80+): High potential
 * - Yellow (50-79): Medium potential
 * - Gray (<50): Low potential
 */
export function GivingPotentialBadge({
  score,
  className,
  showIcon = true
}: GivingPotentialBadgeProps) {
  const getVariant = (score: number) => {
    if (score >= 80) {
      return {
        className: 'bg-green-100 text-green-800 border-green-200',
        label: 'High Potential',
        icon: Gem,
      }
    } else if (score >= 50) {
      return {
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        label: 'Medium Potential',
        icon: TrendingUp,
      }
    } else {
      return {
        className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        label: 'Low Potential',
        icon: Minus,
      }
    }
  }

  const variant = getVariant(score)
  const Icon = variant.icon

  return (
    <div className="flex items-center gap-1">
      <Badge className={cn('border font-medium gap-1', variant.className, className)}>
        {showIcon && <Icon className="h-3 w-3" />}
        {variant.label}
      </Badge>
      <ScoreInfoButton
        scoreKey="givingPotentialOverall"
        value={score}
        size="sm"
        scoreDefinitions={scoreDefinitions}
      />
    </div>
  )
}
