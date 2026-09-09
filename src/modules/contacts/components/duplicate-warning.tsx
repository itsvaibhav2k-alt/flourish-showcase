'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, Eye, GitMerge, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DuplicateMatch } from '../actions/check-duplicates'

interface DuplicateWarningProps {
  matches: DuplicateMatch[]
  onMerge?: (contactId: string) => void
  onDismiss: () => void
}

export function DuplicateWarning({ matches, onMerge, onDismiss }: DuplicateWarningProps) {
  if (matches.length === 0) return null

  const topMatch = matches[0]
  const hasMultiple = matches.length > 1

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-amber-800">
                Potential duplicate{hasMultiple ? 's' : ''} found
              </h4>
              <p className="text-sm text-amber-700 mt-0.5">
                {hasMultiple
                  ? `${matches.length} contacts may already exist with similar information.`
                  : 'A contact may already exist with similar information.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-amber-600 hover:text-amber-800 hover:bg-amber-100 -mt-1 -mr-1"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss warning</span>
            </Button>
          </div>

          {/* Match List */}
          <div className="mt-3 space-y-2">
            {matches.slice(0, 3).map((match) => (
              <div
                key={match.contact.id}
                className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 truncate">
                      {match.contact.first_name} {match.contact.last_name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs bg-amber-50 text-amber-700 border-amber-200 shrink-0"
                    >
                      {match.matchReason}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {match.contact.email || 'No email'}
                    {match.contact.phone && ` · ${match.contact.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs hover:bg-primary-50 hover:text-primary-600"
                    asChild
                  >
                    <Link href={`/contacts/${match.contact.id}`} target="_blank">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Link>
                  </Button>
                  {onMerge && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs hover:bg-violet-50 hover:text-violet-600"
                      onClick={() => onMerge(match.contact.id)}
                    >
                      <GitMerge className="h-3.5 w-3.5 mr-1" />
                      Merge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {matches.length > 3 && (
            <p className="text-xs text-amber-600 mt-2">
              +{matches.length - 3} more potential {matches.length - 3 === 1 ? 'match' : 'matches'}
            </p>
          )}

          {/* Action hint */}
          <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            You can still create this contact if it&apos;s not a duplicate
          </p>
        </div>
      </div>
    </div>
  )
}
