'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Something went wrong</h2>
          <p className="text-neutral-600 mb-6 max-w-md">
            We encountered an unexpected error. Your data is safe - please try refreshing the page.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
