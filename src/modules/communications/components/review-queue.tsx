'use client'

import { useState, useEffect } from 'react'
import { DraftCard } from './draft-card'
import { EmailPreview } from './email-preview'
import { EmailEditor } from './email-editor'
import type { EmailDraft } from '../schemas/email.schema'
import { approveDraft, rejectDraft, updateDraft, regenerateDraft } from '../actions/update-draft'
import { CheckCircle2, XCircle, RefreshCw, ChevronRight, ChevronLeft, Sparkles, Send, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type ReviewQueueProps = {
  initialDrafts: EmailDraft[]
  contactsMap?: Record<string, { name: string; email: string }>
}

export function ReviewQueue({ initialDrafts, contactsMap = {} }: ReviewQueueProps) {
  const router = useRouter()
  const [drafts, setDrafts] = useState(initialDrafts)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | 'regenerate' | null>(null)

  const selectedDraft = drafts[selectedIndex]
  const contact = selectedDraft?.contact_id ? contactsMap[selectedDraft.contact_id] : undefined

  const handleApprove = async () => {
    if (!selectedDraft || isLoading) return

    setIsLoading(true)
    setLoadingAction('approve')

    try {
      const result = await approveDraft(selectedDraft.id)

      if (result.success) {
        if (result.emailSent) {
          toast.success('Email approved and sent!')
        } else if (result.error) {
          toast.warning(`Approved but: ${result.error}`)
        } else {
          toast.success('Email approved!')
        }
        // Remove from list and move to next
        const newDrafts = drafts.filter((_, i) => i !== selectedIndex)
        setDrafts(newDrafts)
        if (selectedIndex >= newDrafts.length) {
          setSelectedIndex(Math.max(0, newDrafts.length - 1))
        }
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve email')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Approve error:', error)
    }

    setIsLoading(false)
    setLoadingAction(null)
  }

  const handleReject = async () => {
    if (!selectedDraft || isLoading) return

    setIsLoading(true)
    setLoadingAction('reject')

    try {
      const result = await rejectDraft(selectedDraft.id)

      if (result.success) {
        toast.success('Email rejected')
        // Remove from list and move to next
        const newDrafts = drafts.filter((_, i) => i !== selectedIndex)
        setDrafts(newDrafts)
        if (selectedIndex >= newDrafts.length) {
          setSelectedIndex(Math.max(0, newDrafts.length - 1))
        }
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reject email')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Reject error:', error)
    }

    setIsLoading(false)
    setLoadingAction(null)
  }

  const handleRegenerate = async () => {
    if (!selectedDraft || isLoading) return

    setIsLoading(true)
    setLoadingAction('regenerate')

    try {
      const result = await regenerateDraft(selectedDraft.id)

      if (result.success) {
        toast.success('Email regenerated!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to regenerate email')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Regenerate error:', error)
    }

    setIsLoading(false)
    setLoadingAction(null)
  }

  const handleSave = async (subject: string, body: string) => {
    if (!selectedDraft || isLoading) return

    setIsLoading(true)
    const result = await updateDraft(selectedDraft.id, subject, body)

    if (result.success) {
      setIsEditMode(false)
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleNext = () => {
    if (selectedIndex < drafts.length - 1) {
      setSelectedIndex(selectedIndex + 1)
      setIsEditMode(false)
    }
  }

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
      setIsEditMode(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when in edit mode or typing in input
      if (isEditMode || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault()
          handleApprove()
          break
        case 'r':
          e.preventDefault()
          handleReject()
          break
        case 'n':
          e.preventDefault()
          handleNext()
          break
        case 'e':
          e.preventDefault()
          setIsEditMode(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedDraft, isEditMode, handleApprove, handleReject, handleNext])

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 bg-emerald-100 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">All caught up!</h3>
        <p className="text-sm text-neutral-500">No pending emails to review.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left sidebar - Draft list */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="bg-neutral-50 rounded-xl p-4 sticky top-4">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Queue ({drafts.length})
          </h3>
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {drafts.map((draft, index) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                recipientName={draft.contact_id ? contactsMap[draft.contact_id]?.name : undefined}
                selected={index === selectedIndex}
                onClick={() => {
                  setSelectedIndex(index)
                  setIsEditMode(false)
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right content - Preview/Editor */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        {/* Top bar with navigation and actions */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-neutral-200 px-4 py-3">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={selectedIndex === 0}
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-neutral-600 min-w-[60px] text-center">
              {selectedIndex + 1} / {drafts.length}
            </span>
            <button
              onClick={handleNext}
              disabled={selectedIndex === drafts.length - 1}
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Actions */}
          {!isEditMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingAction === 'regenerate' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Regenerate
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingAction === 'reject' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-violet-600 text-white hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingAction === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Approve & Send
              </button>
            </div>
          )}
        </div>

        {/* Preview or Editor */}
        {isEditMode ? (
          <EmailEditor
            draft={selectedDraft}
            onSave={handleSave}
            onCancel={() => setIsEditMode(false)}
            isSaving={isLoading}
          />
        ) : (
          <EmailPreview
            draft={selectedDraft}
            recipientName={contact?.name}
            recipientEmail={contact?.email}
            isEditMode={isEditMode}
            onToggleEdit={() => setIsEditMode(true)}
          />
        )}

        {/* Keyboard shortcuts hint */}
        {!isEditMode && (
          <div className="flex items-center justify-center gap-4 py-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono">A</kbd>
              Approve
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono">R</kbd>
              Reject
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono">N</kbd>
              Next
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono">E</kbd>
              Edit
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
