import * as React from 'react'

interface PageHeaderProps {
  title: React.ReactNode
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-page-title text-neutral-900">
          {title}
        </h1>
        {description && (
          <p className="text-body-small text-neutral-500">
            {description}
          </p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}
