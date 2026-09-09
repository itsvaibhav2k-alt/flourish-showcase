'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Webhook, Key, Mail, Send } from 'lucide-react'

interface AutomationUsageStatsProps {
  stats: {
    totalWebhookCalls: number
    totalApiCalls: number
    emailsGenerated: number
    emailsSent: number
  }
}

export function AutomationUsageStats({ stats }: AutomationUsageStatsProps) {
  const statCards = [
    {
      label: 'Webhook Calls',
      value: stats.totalWebhookCalls.toLocaleString(),
      icon: Webhook,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'API Calls',
      value: stats.totalApiCalls.toLocaleString(),
      icon: Key,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Emails Generated',
      value: stats.emailsGenerated.toLocaleString(),
      icon: Mail,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Emails Sent',
      value: stats.emailsSent.toLocaleString(),
      icon: Send,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="shadow-sm border-neutral-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
