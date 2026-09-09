'use client'

import { Badge } from '@/components/ui/badge'

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'testing'

interface StripeConnectionStatusProps {
  status: ConnectionStatus
  mode?: 'test' | 'live'
}

export function StripeConnectionStatus({ status, mode }: StripeConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Connected',
          variant: 'success' as const,
        }
      case 'disconnected':
        return {
          label: 'Not Connected',
          variant: 'secondary' as const,
        }
      case 'error':
        return {
          label: 'Connection Error',
          variant: 'destructive' as const,
        }
      case 'testing':
        return {
          label: 'Testing...',
          variant: 'warning' as const,
        }
      default:
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
        }
    }
  }

  const { label, variant } = getStatusConfig()

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>{label}</Badge>
      {mode && status === 'connected' && (
        <Badge variant={mode === 'live' ? 'default' : 'outline'}>
          {mode === 'live' ? 'Live Mode' : 'Test Mode'}
        </Badge>
      )}
    </div>
  )
}
