'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Heart, Mail, UserPlus, ArrowRight, X, Check } from 'lucide-react'
import Link from 'next/link'
import type { CopilotActionWithContact } from '../queries/get-copilot-actions'

interface CopilotWidgetProps {
  actions: CopilotActionWithContact[]
}

export function CopilotWidget({ actions }: CopilotWidgetProps) {
  const getActionIcon = (actionType: CopilotActionWithContact['action_type']) => {
    const icons = {
      reach_out: Mail,
      send_ask: Heart,
      re_engage: UserPlus,
      thank: Heart,
      follow_up: Mail,
    }
    return icons[actionType] || Mail
  }

  const getActionColor = (actionType: CopilotActionWithContact['action_type']) => {
    const colors = {
      reach_out: 'bg-primary-50 text-primary-600',
      send_ask: 'bg-rose-50 text-rose-600',
      re_engage: 'bg-amber-50 text-amber-600',
      thank: 'bg-green-50 text-green-600',
      follow_up: 'bg-violet-50 text-violet-600',
    }
    return colors[actionType] || 'bg-neutral-50 text-neutral-600'
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">High Priority</Badge>
    } else if (priority >= 5) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Medium</Badge>
    } else {
      return <Badge variant="outline" className="bg-neutral-100 text-neutral-600">Low</Badge>
    }
  }

  if (actions.length === 0) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-gradient-to-br from-primary-50/50 to-violet-50/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg">AI Copilot</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white/80 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-primary-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">All Caught Up!</p>
            <p className="text-xs text-neutral-500 mt-1">
              No urgent actions right now. Keep up the great work!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-gradient-to-br from-primary-50/50 to-violet-50/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Copilot</CardTitle>
              <p className="text-xs text-neutral-500 mt-0.5">Smart action suggestions</p>
            </div>
          </div>
          {actions.length > 0 && (
            <Badge className="bg-primary-100 text-primary-700 border-primary-200">
              {actions.length} {actions.length === 1 ? 'suggestion' : 'suggestions'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.slice(0, 3).map((action) => {
          const Icon = getActionIcon(action.action_type)
          const colorClass = getActionColor(action.action_type)
          const contactName = action.contact
            ? `${action.contact.first_name || ''} ${action.contact.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown'

          return (
            <Link
              key={action.id}
              href={`/contacts/${action.contact_id}`}
              className="block group"
            >
              <div className="p-4 bg-white rounded-lg border border-neutral-200/60 hover:shadow-md hover:border-neutral-300/60 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-neutral-900 line-clamp-1">
                        {action.title}
                      </p>
                      {getPriorityBadge(action.priority)}
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-2 mb-2">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-500">
                        <span className="font-medium">{contactName}</span>
                      </p>
                      <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {actions.length > 3 && (
          <div className="pt-2">
            <Link href="/contacts">
              <Button variant="outline" className="w-full bg-white hover:bg-neutral-50">
                View All {actions.length} Suggestions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
