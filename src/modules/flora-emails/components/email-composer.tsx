'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Eye, Send, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecipientSelector } from './recipient-selector'
import { AIGenerationPanel, type GenerationOptions } from './ai-generation-panel'
import type { SearchContact } from '@/modules/contacts/queries/search-contacts'
import type { FloraEmailTemplate } from '../schemas/flora-email.schema'
import type { EmailDraftResult } from '../schemas/flora-email.schema'

interface EmailComposerProps {
  selectedTemplate: FloraEmailTemplate | null
  organizationId: string
  onGenerate: (params: {
    templateType: FloraEmailTemplate
    recipientIds: string[]
    options: GenerationOptions
  }) => Promise<EmailDraftResult[]>
}

export function EmailComposer({
  selectedTemplate,
  organizationId,
  onGenerate,
}: EmailComposerProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<SearchContact[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDrafts, setGeneratedDrafts] = useState<EmailDraftResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerate = async (options: GenerationOptions) => {
    if (!selectedTemplate || selectedRecipients.length === 0) {
      setError('Please select a template and at least one recipient')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const recipientIds = selectedRecipients.map(r => r.id)
      const drafts = await onGenerate({
        templateType: selectedTemplate,
        recipientIds,
        options,
      })

      setGeneratedDrafts(drafts)
      setShowPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate emails')
      console.error('Generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!selectedTemplate) {
    return (
      <Card className="shadow-sm border-neutral-200/60 bg-neutral-50/50">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-neutral-600 font-medium">Select a template to get started</p>
            <p className="text-sm text-neutral-500 mt-1">
              Choose an email template above to begin composing
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Composer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recipients */}
        <Card className="shadow-sm border-neutral-200/60 bg-white">
          <CardHeader className="border-b border-neutral-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-violet-600" />
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <RecipientSelector
              selectedRecipients={selectedRecipients}
              onRecipientsChange={setSelectedRecipients}
            />
          </CardContent>
        </Card>

        {/* Right Column: AI Settings */}
        <AIGenerationPanel
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          disabled={selectedRecipients.length === 0}
        />
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">Generation Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="ml-auto"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Display */}
      <AnimatePresence>
        {generatedDrafts.length > 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="border-green-200 bg-green-50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">
                      {generatedDrafts.length} Email{generatedDrafts.length > 1 ? 's' : ''} Generated
                    </h3>
                    <p className="text-sm text-green-700">
                      Your personalized emails have been created and saved as drafts. Review them in the Communications section.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 hover:bg-green-100"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? 'Hide' : 'Preview'} Drafts
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          // Navigate to review page
                          window.location.href = '/communications/review'
                        }}
                      >
                        Review & Send
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-6 border-t border-green-200"
                    >
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {generatedDrafts.map((draft, index) => {
                          const recipient = selectedRecipients.find(r => r.id === draft.contactId)
                          return (
                            <div
                              key={draft.id}
                              className="p-4 bg-white rounded-lg border border-green-200"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="text-sm font-medium text-neutral-900">
                                    To: {recipient?.first_name} {recipient?.last_name}
                                  </p>
                                  <p className="text-xs text-neutral-500">{recipient?.email}</p>
                                </div>
                                <span className="text-xs text-neutral-500">Draft #{index + 1}</span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-neutral-500">Subject:</p>
                                  <p className="text-sm text-neutral-900 mt-1">{draft.subject}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-neutral-500">Preview:</p>
                                  <p className="text-sm text-neutral-700 mt-1 line-clamp-3">
                                    {draft.body}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
