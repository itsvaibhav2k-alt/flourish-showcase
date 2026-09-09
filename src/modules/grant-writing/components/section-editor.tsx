'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Pencil, Check, X, RefreshCw, Copy, CheckCheck } from 'lucide-react'
import type { ProposalSection } from '../schemas/proposal.schema'
import { SECTION_METADATA } from '../schemas/proposal.schema'

interface SectionEditorProps {
  sectionName: keyof typeof SECTION_METADATA
  section: ProposalSection
  onUpdate: (content: string) => void
  onRegenerate: () => void
  isRegenerating?: boolean
  isUpdating?: boolean
}

export function SectionEditor({
  sectionName,
  section,
  onUpdate,
  onRegenerate,
  isRegenerating,
  isUpdating,
}: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(section.content)
  const [copied, setCopied] = useState(false)

  const metadata = SECTION_METADATA[sectionName]

  const handleSave = () => {
    onUpdate(editedContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(section.content)
    setIsEditing(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(section.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = section.wordCount

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-neutral-900">
              {metadata.label}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {wordCount} words
            </Badge>
            <Badge variant="outline" className="text-xs text-neutral-600">
              Target: {metadata.wordRange}
            </Badge>
          </div>
          <p className="text-sm text-neutral-600">{metadata.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={isEditing}
          >
            {copied ? (
              <CheckCheck className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isRegenerating || isUpdating}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating || isUpdating}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedContent}
            onChange={e => setEditedContent(e.target.value)}
            rows={12}
            className="font-mono text-sm"
            disabled={isUpdating}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              {editedContent.split(/\s+/).length} words
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
              >
                <Check className="h-4 w-4 mr-1" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
            {section.content}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {isRegenerating && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Regenerating this section with AI...</span>
          </div>
        </div>
      )}
    </Card>
  )
}
