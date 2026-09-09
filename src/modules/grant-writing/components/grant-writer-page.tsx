'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FloraBreadcrumb } from '@/modules/flora/components'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'
import { GrantForm } from './grant-form'
import { SectionEditor } from './section-editor'
import { generateProposal } from '../actions/generate-proposal'
import { saveProposal } from '../actions/save-proposal'
import { updateProposalSection } from '../actions/save-proposal'
import { exportProposalAsText } from '../actions/save-proposal'
import { containerVariants, itemVariants } from '@/lib/motion/variants'
import type { GrantOpportunityInput, ProposalSections } from '../schemas/proposal.schema'
import { SECTION_METADATA } from '../schemas/proposal.schema'
import {
  FileText,
  Download,
  Copy,
  CheckCheck,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'

interface GrantWriterPageProps {
  grantId: string
  grantDetails: {
    funder_name: string
    grant_name: string | null
    amount_requested: number | null
  }
  existingProposal?: {
    id: string
    sections: ProposalSections
  } | null
}

export function GrantWriterPage({
  grantId,
  grantDetails,
  existingProposal,
}: GrantWriterPageProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<'form' | 'editor'>(
    existingProposal ? 'editor' : 'form'
  )
  const [proposal, setProposal] = useState<ProposalSections | null>(
    existingProposal?.sections || null
  )
  const [proposalId, setProposalId] = useState<string | null>(
    existingProposal?.id || null
  )
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [updatingSection, setUpdatingSection] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleGenerateProposal = async (opportunityData: GrantOpportunityInput) => {
    setError(null)
    setIsGenerating(true)

    try {
      const result = await generateProposal({
        grantId,
        opportunity: opportunityData,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate proposal')
      }

      setProposal(result.data.sections)
      setProposalId(result.data.proposalId)
      setStep('editor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateSection = async (
    sectionName: keyof ProposalSections,
    content: string
  ) => {
    if (!proposalId || !proposal) return

    setUpdatingSection(sectionName)
    setError(null)

    try {
      const result = await updateProposalSection(proposalId, sectionName, content)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update section')
      }

      // Update local state
      const wordCount = content.split(/\s+/).length
      setProposal(prev => ({
        ...prev!,
        [sectionName]: { content, wordCount },
      }))

      setSavedStatus('saved')
      setTimeout(() => setSavedStatus('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section')
    } finally {
      setUpdatingSection(null)
    }
  }

  const handleRegenerateSection = async (sectionName: keyof ProposalSections) => {
    // TODO: Implement section regeneration
    setRegeneratingSection(sectionName)
    setError('Section regeneration coming soon!')
    setTimeout(() => {
      setRegeneratingSection(null)
      setError(null)
    }, 2000)
  }

  const handleSaveProposal = async (status: 'draft' | 'final' = 'draft') => {
    if (!proposal) return

    setSavedStatus('saving')
    setError(null)

    try {
      const result = await saveProposal({
        grantId,
        sections: proposal,
        status,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to save proposal')
      }

      setSavedStatus('saved')
      setTimeout(() => setSavedStatus('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save proposal')
      setSavedStatus('idle')
    }
  }

  const handleExport = async () => {
    if (!proposalId) return

    try {
      const text = await exportProposalAsText(proposalId)
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `grant-proposal-${grantDetails.funder_name.replace(/\s+/g, '-').toLowerCase()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export proposal')
    }
  }

  const handleCopyAll = async () => {
    if (!proposalId) return

    try {
      const text = await exportProposalAsText(proposalId)
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy proposal')
    }
  }

  const totalWords = proposal
    ? Object.values(proposal).reduce((sum, section) => sum + section.wordCount, 0)
    : 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-6"
    >
      <FloraBreadcrumb currentPage="Grant Writer" />

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Grant Tracker
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">AI Grant Writer</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {grantDetails.funder_name}
            {grantDetails.grant_name && ` - ${grantDetails.grant_name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageGuideTrigger pageKey="grant-writer" />
          {proposal && (
            <>
              <Badge variant="secondary" className="text-sm">
                {totalWords.toLocaleString()} words total
              </Badge>
              {savedStatus === 'saved' && (
                <Badge variant="default" className="text-sm bg-green-600">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Step 1: Grant Opportunity Form */}
      {step === 'form' && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-semibold">Grant Opportunity Details</h2>
              </div>
              <p className="text-neutral-500 text-sm">
                Provide details about this grant opportunity. The AI will use this information
                along with your organization's data to generate a compelling proposal.
              </p>
            </div>

            <GrantForm
              onSubmit={handleGenerateProposal}
              initialData={{
                funderName: grantDetails.funder_name,
                grantName: grantDetails.grant_name || undefined,
                amountRequested: grantDetails.amount_requested || undefined,
              }}
              isLoading={isGenerating}
            />
          </Card>
        </motion.div>
      )}

      {/* Step 2: Proposal Editor */}
      {step === 'editor' && proposal && (
        <>
          {/* Action Bar */}
          <motion.div variants={itemVariants}>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep('form')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Edit Opportunity
                  </Button>
                  <div className="h-6 w-px bg-neutral-200" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAll}
                  >
                    {copied ? (
                      <CheckCheck className="h-4 w-4 mr-1 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    Copy All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveProposal('draft')}
                    disabled={savedStatus === 'saving'}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {savedStatus === 'saving' ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveProposal('final')}
                    disabled={savedStatus === 'saving'}
                  >
                    Mark as Final
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Section Editors */}
          <motion.div variants={itemVariants} className="space-y-6">
            {(Object.keys(SECTION_METADATA) as Array<keyof ProposalSections>).map(
              sectionName => (
                <SectionEditor
                  key={sectionName}
                  sectionName={sectionName}
                  section={proposal[sectionName]}
                  onUpdate={content => handleUpdateSection(sectionName, content)}
                  onRegenerate={() => handleRegenerateSection(sectionName)}
                  isRegenerating={regeneratingSection === sectionName}
                  isUpdating={updatingSection === sectionName}
                />
              )
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
