import { cn } from '@/lib/utils'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'
import type { LapseRisk } from '../services/lapse-risk-calculator'

interface LapseRiskBadgeProps {
  risk: LapseRisk
  className?: string
  showInfoButton?: boolean
}

/**
 * Badge component for displaying lapse risk with dot indicator
 * Styled to match Linear/Stripe dashboard patterns
 */
export function LapseRiskBadge({ risk, className, showInfoButton = false }: LapseRiskBadgeProps) {
  const configs: Record<LapseRisk, { dot: string; bg: string; text: string; label: string }> = {
    low: {
      dot: 'bg-green-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
      label: 'Low Risk',
    },
    medium: {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      label: 'Medium Risk',
    },
    high: {
      dot: 'bg-rose-500',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      label: 'High Risk',
    },
    unknown: {
      dot: 'bg-neutral-400',
      bg: 'bg-neutral-50',
      text: 'text-neutral-600',
      label: 'Unknown',
    },
  }

  const config = configs[risk]

  return (
    <div className="flex items-center gap-1">
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bg,
        config.text,
        className
      )}>
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
        {config.label}
      </span>
      {showInfoButton && (
        <ScoreInfoButton
          scoreKey="lapseRisk"
          size="sm"
          scoreDefinitions={scoreDefinitions}
        />
      )}
    </div>
  )
}
