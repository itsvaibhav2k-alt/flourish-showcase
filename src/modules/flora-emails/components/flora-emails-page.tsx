'use client'

import { useState, useTransition } from 'react'
import { Mail } from 'lucide-react'
import { FloraBreadcrumb } from '@/modules/flora/components'
import { TemplateCard } from './template-card'
import { EmailComposer } from './email-composer'
import { CustomEmailBuilder, type CustomEmailGenerateParams } from './custom-email-builder'
import { RecentDrafts } from './recent-drafts'
import { TEMPLATE_METADATA, type FloraEmailTemplate } from '../schemas/flora-email.schema'
import type { FloraEmailDraft } from '../queries'
import { generateFloraEmail, generateCustomEmail } from '../actions'
import type { GenerationOptions } from './ai-generation-panel'
import { toast } from 'sonner'

interface FloraEmailsPageProps {
  organizationId: string
  initialDrafts?: FloraEmailDraft[]
}

export function FloraEmailsPage({ organizationId, initialDrafts = [] }: FloraEmailsPageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FloraEmailTemplate | null>(null)
  const [recentDrafts, setRecentDrafts] = useState<FloraEmailDraft[]>(initialDrafts)
  const [isPending, startTransition] = useTransition()

  const templates = Object.values(TEMPLATE_METADATA)

  const handleGenerate = async (params: {
    templateType: FloraEmailTemplate
    recipientIds: string[]
    options: GenerationOptions
  }) => {
    return new Promise<any[]>((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await generateFloraEmail({
            organizationId,
            templateType: params.templateType,
            recipientIds: params.recipientIds,
            options: params.options,
          })

          if (!result.success || !result.drafts) {
            toast.error('Generation Failed', {
              description: result.error || 'Failed to generate emails',
            })
            reject(new Error(result.error || 'Failed to generate emails'))
            return
          }

          toast.success('Emails Generated', {
            description: `Successfully created ${result.drafts.length} personalized ${result.failedCount ? `email${result.drafts.length > 1 ? 's' : ''} (${result.failedCount} failed)` : `email${result.drafts.length > 1 ? 's' : ''}`}`,
          })

          resolve(result.drafts)
        } catch (error) {
          console.error('Generation error:', error)
          toast.error('Error', {
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
          })
          reject(error)
        }
      })
    })
  }

  // Handler for custom email generation (uses CustomEmailBuilder)
  const handleCustomGenerate = async (params: CustomEmailGenerateParams) => {
    return new Promise<any[]>((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await generateCustomEmail({
            organizationId,
            recipientIds: params.recipientIds,
            customParams: params.customParams,
          })

          if (!result.success || !result.drafts) {
            toast.error('Generation Failed', {
              description: result.error || 'Failed to generate custom emails',
            })
            reject(new Error(result.error || 'Failed to generate custom emails'))
            return
          }

          toast.success('Custom Emails Generated', {
            description: `Successfully created ${result.drafts.length} personalized email${result.drafts.length > 1 ? 's' : ''}`,
          })

          resolve(result.drafts)
        } catch (error) {
          console.error('Custom generation error:', error)
          toast.error('Error', {
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
          })
          reject(error)
        }
      })
    })
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        <FloraBreadcrumb currentPage="Emails" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-violet-600" />
              <h1 className="text-2xl font-semibold text-neutral-900">Compose Email</h1>
            </div>
            <p className="text-neutral-500 text-sm mt-1">
              Generate personalized, AI-powered emails for donors and volunteers
            </p>
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Choose Email Type</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select a template to get started
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onClick={() => setSelectedTemplate(template.id)}
              />
            ))}
          </div>
        </div>

        {/* Email Composer - Use CustomEmailBuilder for custom template */}
        <div>
          {selectedTemplate === 'custom' ? (
            <CustomEmailBuilder
              organizationId={organizationId}
              onGenerate={handleCustomGenerate}
            />
          ) : (
            <EmailComposer
              selectedTemplate={selectedTemplate}
              organizationId={organizationId}
              onGenerate={handleGenerate}
            />
          )}
        </div>

        {/* Recent Drafts */}
        {recentDrafts.length > 0 && (
          <div>
            <RecentDrafts drafts={recentDrafts} />
          </div>
        )}
      </div>
    </div>
  )
}
