'use client'

import { useState, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Wand2,
  Loader2,
  Plus,
  X,
  Mail,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  Send,
  AlertCircle,
  PenLine,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { RecipientSelector } from './recipient-selector'
import type { SearchContact } from '@/modules/contacts/queries/search-contacts'
import { enhanceEmail, saveEnhancedDraft } from '../actions/enhance-email'
import { sendFloraEmails } from '../actions'
import type { EnhancementMode } from '@/lib/ai/prompts/enhance-email'

interface CustomEmailBuilderProps {
  organizationId: string
  onGenerate: (params: CustomEmailGenerateParams) => Promise<GeneratedDraft[]>
}

export interface CustomEmailGenerateParams {
  recipientIds: string[]
  customParams: {
    topic: string
    keyPoints?: string[]
    tone?: 'warm' | 'professional' | 'casual' | 'formal' | 'spiritual' | 'urgent'
    callToAction?: string
    subjectHint?: string
  }
}

export interface GeneratedDraft {
  id: string
  contactId: string
  subject: string
  body: string
  status: string
  contactName?: string
}

const TONE_OPTIONS = [
  {
    value: 'warm',
    label: 'Warm & Heartfelt',
    description: 'Friendly, personal, and appreciative',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and business-appropriate',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and conversational',
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Traditional and structured',
  },
  {
    value: 'spiritual',
    label: 'Spiritual',
    description: 'Faith-based and inspirational',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Time-sensitive and compelling',
  },
] as const

const ENHANCEMENT_MODES = [
  {
    value: 'polish' as EnhancementMode,
    label: 'Polish',
    description: 'Fix grammar and improve flow',
  },
  {
    value: 'expand' as EnhancementMode,
    label: 'Expand',
    description: 'Add depth and detail',
  },
  {
    value: 'personalize' as EnhancementMode,
    label: 'Personalize',
    description: 'Add recipient-specific content',
  },
] as const

export function CustomEmailBuilder({
  organizationId,
  onGenerate,
}: CustomEmailBuilderProps) {
  // Mode: 'generate' = AI creates from topic, 'write' = user writes and AI enhances
  const [mode, setMode] = useState<'generate' | 'write'>('generate')

  // Form state for "generate" mode
  const [topic, setTopic] = useState('')
  const [keyPoints, setKeyPoints] = useState<string[]>([''])
  const [tone, setTone] = useState<CustomEmailGenerateParams['customParams']['tone']>('warm')
  const [callToAction, setCallToAction] = useState('')
  const [subjectHint, setSubjectHint] = useState('')

  // Form state for "write" mode
  const [userSubject, setUserSubject] = useState('')
  const [userBody, setUserBody] = useState('')
  const [enhancementMode, setEnhancementMode] = useState<EnhancementMode>('polish')
  const [enhancedSubject, setEnhancedSubject] = useState('')
  const [enhancedBody, setEnhancedBody] = useState('')
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false)

  // Shared state
  const [selectedRecipients, setSelectedRecipients] = useState<SearchContact[]>([])

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedDraft[]>([])
  const [previewDraft, setPreviewDraft] = useState<GeneratedDraft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Key points management
  const addKeyPoint = useCallback(() => {
    if (keyPoints.length < 10) {
      setKeyPoints([...keyPoints, ''])
    }
  }, [keyPoints])

  const removeKeyPoint = useCallback((index: number) => {
    if (keyPoints.length > 1) {
      setKeyPoints(keyPoints.filter((_, i) => i !== index))
    }
  }, [keyPoints])

  const updateKeyPoint = useCallback((index: number, value: string) => {
    const newKeyPoints = [...keyPoints]
    newKeyPoints[index] = value
    setKeyPoints(newKeyPoints)
  }, [keyPoints])

  // Validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!topic.trim()) {
      newErrors.topic = 'Topic is required'
    } else if (topic.trim().length < 10) {
      newErrors.topic = 'Please provide a more detailed topic (at least 10 characters)'
    }

    if (selectedRecipients.length === 0) {
      newErrors.recipients = 'Please select at least one recipient'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [topic, selectedRecipients])

  // Generate emails
  const handleGenerate = useCallback(() => {
    if (!validateForm()) {
      toast.error('Please fix the errors before generating')
      return
    }

    const filteredKeyPoints = keyPoints.filter((kp) => kp.trim().length > 0)

    startTransition(async () => {
      try {
        const drafts = await onGenerate({
          recipientIds: selectedRecipients.map((r) => r.id),
          customParams: {
            topic: topic.trim(),
            keyPoints: filteredKeyPoints.length > 0 ? filteredKeyPoints : undefined,
            tone,
            callToAction: callToAction.trim() || undefined,
            subjectHint: subjectHint.trim() || undefined,
          },
        })

        // Add contact names to drafts
        const draftsWithNames = drafts.map((draft) => ({
          ...draft,
          contactName: selectedRecipients.find((r) => r.id === draft.contactId)
            ? `${selectedRecipients.find((r) => r.id === draft.contactId)?.first_name} ${selectedRecipients.find((r) => r.id === draft.contactId)?.last_name}`
            : 'Unknown',
        }))

        setGeneratedDrafts(draftsWithNames)

        if (draftsWithNames.length > 0) {
          setPreviewDraft(draftsWithNames[0])
        }

        toast.success(`Generated ${draftsWithNames.length} email${draftsWithNames.length > 1 ? 's' : ''}`)
      } catch (error) {
        console.error('Generation error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to generate emails'
        )
      }
    })
  }, [
    validateForm,
    topic,
    keyPoints,
    tone,
    callToAction,
    subjectHint,
    selectedRecipients,
    onGenerate,
  ])

  // Reset form
  const handleReset = useCallback(() => {
    // Generate mode
    setTopic('')
    setKeyPoints([''])
    setTone('warm')
    setCallToAction('')
    setSubjectHint('')
    // Write mode
    setUserSubject('')
    setUserBody('')
    setEnhancementMode('polish')
    setEnhancedSubject('')
    setEnhancedBody('')
    setShowEnhancedPreview(false)
    // Shared
    setSelectedRecipients([])
    setGeneratedDrafts([])
    setPreviewDraft(null)
    setErrors({})
    setShowAdvanced(false)
  }, [])

  // Enhance user-written email
  const handleEnhance = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!userSubject.trim()) {
      newErrors.userSubject = 'Subject is required'
    }
    if (!userBody.trim()) {
      newErrors.userBody = 'Email body is required'
    }
    if (selectedRecipients.length === 0) {
      newErrors.recipients = 'Please select at least one recipient'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors before enhancing')
      return
    }

    startTransition(async () => {
      try {
        // For now, enhance for the first recipient (multi-recipient support can be added later)
        const contactId = selectedRecipients[0].id

        const result = await enhanceEmail({
          organizationId,
          contactId,
          userSubject: userSubject.trim(),
          userBody: userBody.trim(),
          enhancementMode,
        })

        if (!result.success || !result.subject || !result.body) {
          toast.error(result.error || 'Failed to enhance email')
          return
        }

        setEnhancedSubject(result.subject)
        setEnhancedBody(result.body)
        setShowEnhancedPreview(true)

        toast.success('Email enhanced successfully!')
      } catch (error) {
        console.error('Enhancement error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to enhance email'
        )
      }
    })
  }, [userSubject, userBody, selectedRecipients, enhancementMode, organizationId])

  // Save enhanced email as draft
  const handleSaveEnhancedDraft = useCallback(() => {
    if (!enhancedSubject || !enhancedBody || selectedRecipients.length === 0) {
      return
    }

    startTransition(async () => {
      try {
        const drafts: GeneratedDraft[] = []

        for (const recipient of selectedRecipients) {
          const result = await saveEnhancedDraft({
            organizationId,
            contactId: recipient.id,
            subject: enhancedSubject,
            body: enhancedBody,
          })

          if (result.success && result.draftId) {
            drafts.push({
              id: result.draftId,
              contactId: recipient.id,
              subject: enhancedSubject,
              body: enhancedBody,
              status: 'draft',
              contactName: `${recipient.first_name} ${recipient.last_name}`,
            })
          }
        }

        if (drafts.length > 0) {
          setGeneratedDrafts(drafts)
          setPreviewDraft(drafts[0])
          toast.success(`Saved ${drafts.length} draft${drafts.length > 1 ? 's' : ''}`)
        }
      } catch (error) {
        console.error('Save draft error:', error)
        toast.error('Failed to save draft')
      }
    })
  }, [enhancedSubject, enhancedBody, selectedRecipients, organizationId])

  // Send enhanced email immediately
  const handleSendEmail = useCallback(() => {
    // Use form values if enhanced preview isn't showing, otherwise use enhanced values
    const subjectToSend = showEnhancedPreview ? enhancedSubject : userSubject
    const bodyToSend = showEnhancedPreview ? enhancedBody : userBody

    if (!subjectToSend?.trim() || !bodyToSend?.trim() || selectedRecipients.length === 0) {
      toast.error('Please fill in subject and body, and select at least one recipient')
      return
    }

    startTransition(async () => {
      try {
        const draftIds: string[] = []

        // Save as drafts first
        for (const recipient of selectedRecipients) {
          const result = await saveEnhancedDraft({
            organizationId,
            contactId: recipient.id,
            subject: subjectToSend,
            body: bodyToSend,
          })

          if (result.success && result.draftId) {
            draftIds.push(result.draftId)
          }
        }

        if (draftIds.length === 0) {
          toast.error('Failed to prepare emails for sending')
          return
        }

        // Send the drafts
        const sendResult = await sendFloraEmails(draftIds)

        if (sendResult.success) {
          toast.success(`${sendResult.sentCount} email${sendResult.sentCount !== 1 ? 's' : ''} sent successfully!`)
          // Reset form
          handleReset()
        } else {
          toast.error(sendResult.error || 'Failed to send emails')
        }
      } catch (error) {
        console.error('Send email error:', error)
        toast.error('Failed to send emails')
      }
    })
  }, [showEnhancedPreview, enhancedSubject, enhancedBody, userSubject, userBody, selectedRecipients, organizationId, handleReset])

  return (
    <div className="space-y-6">
      {/* Main Builder Card */}
      <Card className="shadow-sm border-violet-200/60 bg-gradient-to-br from-white to-violet-50/30">
        <CardHeader className="border-b border-violet-100/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Edit3 className="h-4 w-4 text-white" />
            </div>
            Custom Email Builder
            <Badge variant="secondary" className="ml-2 bg-violet-50 text-violet-700 border-violet-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-neutral-700">
              How would you like to create your email?
            </Label>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'generate' | 'write')}>
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger
                  value="generate"
                  className="flex items-center gap-2 data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900"
                >
                  <Wand2 className="h-4 w-4" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger
                  value="write"
                  className="flex items-center gap-2 data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900"
                >
                  <PenLine className="h-4 w-4" />
                  Write Your Own
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-neutral-500">
              {mode === 'generate'
                ? 'Describe what you want and AI will write the full email for you.'
                : 'Write your email and AI will enhance it with personalization and polish.'}
            </p>
          </div>

          {/* Generate Mode */}
          {mode === 'generate' && (
            <>
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium text-neutral-700">
              Email Topic/Purpose <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="topic"
              placeholder="Describe the purpose of this email. For example: 'Invite supporters to our annual gala and share highlights of what we've accomplished this year'"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value)
                if (errors.topic) {
                  setErrors((prev) => ({ ...prev, topic: '' }))
                }
              }}
              rows={3}
              className={`bg-white border-neutral-200 resize-none ${
                errors.topic ? 'border-red-300 focus:ring-red-500' : ''
              }`}
              disabled={isPending}
            />
            {errors.topic && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.topic}
              </p>
            )}
            <p className="text-xs text-neutral-500">
              Be specific about what you want to communicate. The AI will personalize each email based on recipient history.
            </p>
          </div>

          {/* Key Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-neutral-700">
                Key Points to Include
                <span className="text-neutral-400 font-normal ml-1">(optional)</span>
              </Label>
              <span className="text-xs text-neutral-500">
                {keyPoints.filter((kp) => kp.trim()).length}/10 points
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {keyPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs text-neutral-400 w-5 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={`Key point ${index + 1}...`}
                      value={point}
                      onChange={(e) => updateKeyPoint(index, e.target.value)}
                      className="bg-white border-neutral-200 flex-1"
                      disabled={isPending}
                    />
                    {keyPoints.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-neutral-400 hover:text-red-500"
                        onClick={() => removeKeyPoint(index)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {keyPoints.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKeyPoint}
                disabled={isPending}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Key Point
              </Button>
            )}
            <p className="text-xs text-neutral-500">
              The AI will incorporate each point naturally into the email body.
            </p>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <Label htmlFor="tone" className="text-sm font-medium text-neutral-700">
              Email Tone
            </Label>
            <Select
              value={tone}
              onValueChange={(value) =>
                setTone(value as CustomEmailGenerateParams['customParams']['tone'])
              }
              disabled={isPending}
            >
              <SelectTrigger id="tone" className="bg-white border-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-neutral-500">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500">
              Choose the tone that best fits your message. Defaults to your organization's voice.
            </p>
          </div>

          {/* Advanced Options Toggle */}
          <div className="pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              disabled={isPending}
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Advanced Options
            </button>
          </div>

          {/* Advanced Options */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Call to Action */}
                <div className="space-y-2">
                  <Label
                    htmlFor="cta"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Call-to-Action
                    <span className="text-neutral-400 font-normal ml-1">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="cta"
                    placeholder="e.g., 'RSVP by December 1st' or 'Donate today to double your impact'"
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    className="bg-white border-neutral-200"
                    disabled={isPending}
                  />
                  <p className="text-xs text-neutral-500">
                    A specific action you want recipients to take.
                  </p>
                </div>

                {/* Subject Line Hint */}
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Subject Line Hint
                    <span className="text-neutral-400 font-normal ml-1">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="e.g., 'You're invited to something special'"
                    value={subjectHint}
                    onChange={(e) => setSubjectHint(e.target.value)}
                    className="bg-white border-neutral-200"
                    disabled={isPending}
                  />
                  <p className="text-xs text-neutral-500">
                    Provide direction for the subject line. The AI will refine it.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recipient Selector */}
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <Label className="text-sm font-medium text-neutral-700">
              Recipients <span className="text-red-500">*</span>
            </Label>
            {errors.recipients && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.recipients}
              </p>
            )}
            <RecipientSelector
              selectedRecipients={selectedRecipients}
              onRecipientsChange={(recipients) => {
                setSelectedRecipients(recipients)
                if (errors.recipients) {
                  setErrors((prev) => ({ ...prev, recipients: '' }))
                }
              }}
              maxRecipients={50}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={isPending}
              className="text-neutral-600"
            >
              Reset
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isPending || !topic.trim() || selectedRecipients.length === 0}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating {selectedRecipients.length} Email
                  {selectedRecipients.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate {selectedRecipients.length > 0 ? selectedRecipients.length : ''} Email
                  {selectedRecipients.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>

          {/* AI Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-3 bg-violet-50/50 rounded-lg border border-violet-200/50"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-violet-700 space-y-1">
                <p className="font-medium">Powered by Claude AI</p>
                <p className="text-violet-600">
                  Each email will be personalized based on the recipient's history,
                  giving patterns, and relationship with your organization.
                </p>
              </div>
            </div>
          </motion.div>
            </>
          )}

          {/* Write Mode */}
          {mode === 'write' && (
            <>
              {/* Subject Input */}
              <div className="space-y-2">
                <Label htmlFor="userSubject" className="text-sm font-medium text-neutral-700">
                  Subject Line <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="userSubject"
                  placeholder="Enter your email subject line..."
                  value={userSubject}
                  onChange={(e) => {
                    setUserSubject(e.target.value)
                    if (errors.userSubject) {
                      setErrors((prev) => ({ ...prev, userSubject: '' }))
                    }
                  }}
                  className={`bg-white border-neutral-200 ${
                    errors.userSubject ? 'border-red-300 focus:ring-red-500' : ''
                  }`}
                  disabled={isPending}
                />
                {errors.userSubject && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.userSubject}
                  </p>
                )}
              </div>

              {/* Body Input */}
              <div className="space-y-2">
                <Label htmlFor="userBody" className="text-sm font-medium text-neutral-700">
                  Email Body <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="userBody"
                  placeholder="Write your email here. Don't worry about perfection - AI will help polish it!"
                  value={userBody}
                  onChange={(e) => {
                    setUserBody(e.target.value)
                    if (errors.userBody) {
                      setErrors((prev) => ({ ...prev, userBody: '' }))
                    }
                  }}
                  rows={10}
                  className={`bg-white border-neutral-200 resize-none ${
                    errors.userBody ? 'border-red-300 focus:ring-red-500' : ''
                  }`}
                  disabled={isPending}
                />
                {errors.userBody && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.userBody}
                  </p>
                )}
                <p className="text-xs text-neutral-500">
                  Write naturally - AI will enhance your email while keeping your voice.
                </p>
              </div>

              {/* Enhancement Mode */}
              <div className="space-y-2">
                <Label htmlFor="enhancementMode" className="text-sm font-medium text-neutral-700">
                  Enhancement Mode
                </Label>
                <Select
                  value={enhancementMode}
                  onValueChange={(value) => setEnhancementMode(value as EnhancementMode)}
                  disabled={isPending}
                >
                  <SelectTrigger id="enhancementMode" className="bg-white border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENHANCEMENT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{mode.label}</span>
                          <span className="text-xs text-neutral-500">
                            {mode.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500">
                  Choose how much AI should modify your email.
                </p>
              </div>

              {/* Recipient Selector */}
              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <Label className="text-sm font-medium text-neutral-700">
                  Recipients <span className="text-red-500">*</span>
                </Label>
                {errors.recipients && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.recipients}
                  </p>
                )}
                <RecipientSelector
                  selectedRecipients={selectedRecipients}
                  onRecipientsChange={(recipients) => {
                    setSelectedRecipients(recipients)
                    if (errors.recipients) {
                      setErrors((prev) => ({ ...prev, recipients: '' }))
                    }
                  }}
                  maxRecipients={50}
                />
              </div>

              {/* Action Buttons for Write Mode */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={isPending}
                  className="text-neutral-600"
                >
                  Reset
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEnhance}
                    disabled={isPending || !userSubject.trim() || !userBody.trim() || selectedRecipients.length === 0}
                    variant="outline"
                    className="border-violet-300 text-violet-700 hover:bg-violet-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    disabled={isPending || !userSubject.trim() || !userBody.trim() || selectedRecipients.length === 0}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                    size="lg"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Preview */}
              <AnimatePresence>
                {showEnhancedPreview && enhancedSubject && enhancedBody && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-green-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-green-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Enhanced Email Preview
                        </h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUserSubject(enhancedSubject)
                              setUserBody(enhancedBody)
                              setShowEnhancedPreview(false)
                              toast.success('Changes applied to editor')
                            }}
                            className="text-xs"
                          >
                            Edit More
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSaveEnhancedDraft}
                            disabled={isPending}
                            className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                          >
                            Save as Draft
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSendEmail}
                            disabled={isPending}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send Now
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <div className="mb-3">
                        <p className="text-xs font-medium text-neutral-500 mb-1">Subject:</p>
                        <p className="text-sm font-medium text-neutral-900">{enhancedSubject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500 mb-1">Body:</p>
                        <p className="text-sm text-neutral-700 whitespace-pre-wrap">{enhancedBody}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Info for Write Mode */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-3 bg-violet-50/50 rounded-lg border border-violet-200/50"
              >
                <div className="flex items-start gap-2">
                  <PenLine className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-violet-700 space-y-1">
                    <p className="font-medium">Write Your Own + AI Enhancement</p>
                    <p className="text-violet-600">
                      Write your email naturally and AI will polish, expand, or personalize it
                      while maintaining your authentic voice.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Generated Drafts Preview */}
      <AnimatePresence>
        {generatedDrafts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm border-green-200/60 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="border-b border-green-100/50">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  Generated Emails
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-green-50 text-green-700 border-green-200"
                  >
                    {generatedDrafts.length} Ready
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Draft List */}
                  <div className="lg:col-span-1 space-y-2">
                    <p className="text-sm font-medium text-neutral-700 mb-3">
                      Click to preview:
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {generatedDrafts.map((draft) => (
                        <button
                          key={draft.id}
                          onClick={() => setPreviewDraft(draft)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            previewDraft?.id === draft.id
                              ? 'border-green-300 bg-green-50 ring-2 ring-green-200'
                              : 'border-neutral-200 bg-white hover:border-green-200 hover:bg-green-50/50'
                          }`}
                        >
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {draft.contactName}
                          </p>
                          <p className="text-xs text-neutral-500 truncate mt-1">
                            {draft.subject}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview Panel */}
                  <div className="lg:col-span-2">
                    {previewDraft ? (
                      <div className="border border-neutral-200 rounded-lg bg-white">
                        <div className="p-4 border-b border-neutral-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-neutral-500">To:</p>
                              <p className="text-sm font-medium text-neutral-900">
                                {previewDraft.contactName}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200"
                            >
                              Draft
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-neutral-500">Subject:</p>
                            <p className="text-sm font-semibold text-neutral-900">
                              {previewDraft.subject}
                            </p>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                            {previewDraft.body}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-neutral-200 rounded-lg p-8 text-center">
                        <Eye className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">
                          Select an email to preview
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-green-100 flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={handleReset}>
                    Create New Batch
                  </Button>
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Review & Send All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
