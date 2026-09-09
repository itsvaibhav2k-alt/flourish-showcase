'use client'

import { Heart, Megaphone, RefreshCw, Users, Sparkles, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TemplateMetadata } from '../schemas/flora-email.schema'

const ICONS = {
  Heart,
  Megaphone,
  RefreshCw,
  Users,
  Sparkles,
} as const

interface TemplateCardProps {
  template: TemplateMetadata
  isSelected: boolean
  onClick: () => void
}

export function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Heart

  return (
    <Card
      className={`
        relative cursor-pointer transition-colors duration-150
        ${isSelected
          ? 'ring-2 ring-violet-600 bg-violet-50/50'
          : 'shadow-card border-neutral-200/60 bg-white hover:border-neutral-300'
        }
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {isSelected && (
        <div className="absolute top-2.5 right-2.5">
          <div className="h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="space-y-2">
          <div className={`h-9 w-9 rounded-lg bg-neutral-100 flex items-center justify-center`}>
            <Icon className={`h-4.5 w-4.5 ${template.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-900">{template.name}</h3>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
              {template.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
