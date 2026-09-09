'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sparkles, Loader2, Eye, Plus, ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { previewCustomTile, saveCustomTile } from '../actions'

export interface CustomAITile {
  id?: string
  name: string
  prompt: string
  dataSources: string[]
  refreshSchedule: string
}

interface CustomTileBuilderProps {
  onTileCreated?: () => void
  existingTile?: CustomAITile
}

const EXAMPLE_PROMPTS = [
  'What are our top 3 fundraising opportunities this month?',
  'Which volunteers are most likely to become major donors?',
  'Summarize donor retention trends over the past year',
  'What percentage of our donors are at risk of lapsing?',
  'Identify our most engaged volunteer segment',
]

const DATA_SOURCES = [
  { id: 'donors', label: 'Donors', description: 'Giving history and donor profiles' },
  { id: 'volunteers', label: 'Volunteers', description: 'Shift history and engagement' },
  { id: 'gifts', label: 'Gifts', description: 'Transaction data and campaigns' },
  { id: 'contacts', label: 'Contacts', description: 'Contact information and tags' },
  { id: 'communications', label: 'Communications', description: 'Email drafts and history' },
]

const REFRESH_SCHEDULES = [
  { id: 'daily', label: 'Daily', description: 'Refresh every day at midnight' },
  { id: 'weekly', label: 'Weekly', description: 'Refresh every Monday' },
  { id: 'manual', label: 'Manual', description: 'Only refresh when requested' },
]

export function CustomTileBuilder({ onTileCreated, existingTile }: CustomTileBuilderProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'configure' | 'preview'>('configure')
  const [isPending, startTransition] = useTransition()
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null)

  // Form state
  const [name, setName] = useState(existingTile?.name || '')
  const [prompt, setPrompt] = useState(existingTile?.prompt || '')
  const [dataSources, setDataSources] = useState<string[]>(existingTile?.dataSources || ['donors'])
  const [refreshSchedule, setRefreshSchedule] = useState(existingTile?.refreshSchedule || 'daily')

  // Character limits
  const MAX_NAME_LENGTH = 50
  const MAX_PROMPT_LENGTH = 500

  const handleClose = () => {
    setOpen(false)
    // Reset state after animation
    setTimeout(() => {
      setStep('configure')
      setName(existingTile?.name || '')
      setPrompt(existingTile?.prompt || '')
      setDataSources(existingTile?.dataSources || ['donors'])
      setRefreshSchedule(existingTile?.refreshSchedule || 'daily')
      setPreviewData(null)
    }, 200)
  }

  const handlePreview = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (dataSources.length === 0) {
      toast.error('Please select at least one data source')
      return
    }

    setIsPreviewLoading(true)
    setStep('preview')

    try {
      const result = await previewCustomTile(prompt, dataSources)

      if (result.success && result.data) {
        setPreviewData(result.data)
      } else {
        toast.error(result.error || 'Failed to generate preview')
        setStep('configure')
      }
    } catch {
      toast.error('Failed to generate preview')
      setStep('configure')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleRegenerate = async () => {
    setIsPreviewLoading(true)
    setPreviewData(null)

    try {
      const result = await previewCustomTile(prompt, dataSources)

      if (result.success && result.data) {
        setPreviewData(result.data)
      } else {
        toast.error(result.error || 'Failed to regenerate preview')
      }
    } catch {
      toast.error('Failed to regenerate preview')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a tile name')
      setStep('configure')
      return
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      setStep('configure')
      return
    }

    startTransition(async () => {
      try {
        const result = await saveCustomTile({
          id: existingTile?.id,
          name: name.trim(),
          prompt: prompt.trim(),
          dataSources,
          refreshSchedule,
        })

        if (result.success) {
          toast.success(
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{existingTile ? 'Tile updated!' : 'Tile created!'}</span>
            </div>
          )
          handleClose()
          onTileCreated?.()
        } else {
          toast.error(result.error || 'Failed to save tile')
        }
      } catch {
        toast.error('Failed to save tile')
      }
    })
  }

  const toggleDataSource = (sourceId: string) => {
    setDataSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const applyExamplePrompt = (example: string) => {
    setPrompt(example)
  }

  const isValid = name.trim() && prompt.trim() && dataSources.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Custom Tile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" />
            {existingTile ? 'Edit' : 'Create'} Custom AI Tile
          </DialogTitle>
          <DialogDescription>
            Ask Claude anything about your organization&apos;s data
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'configure' ? (
            <ConfigureStep
              key="configure"
              name={name}
              setName={setName}
              prompt={prompt}
              setPrompt={setPrompt}
              dataSources={dataSources}
              toggleDataSource={toggleDataSource}
              refreshSchedule={refreshSchedule}
              setRefreshSchedule={setRefreshSchedule}
              maxNameLength={MAX_NAME_LENGTH}
              maxPromptLength={MAX_PROMPT_LENGTH}
              applyExamplePrompt={applyExamplePrompt}
            />
          ) : (
            <PreviewStep
              key="preview"
              isLoading={isPreviewLoading}
              data={previewData}
              onRegenerate={handleRegenerate}
            />
          )}
        </AnimatePresence>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step === 'preview' && (
              <Button
                variant="ghost"
                onClick={() => setStep('configure')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === 'configure' ? (
              <Button
                onClick={handlePreview}
                disabled={!isValid}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isPending || !isValid}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Tile
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ConfigureStepProps {
  name: string
  setName: (name: string) => void
  prompt: string
  setPrompt: (prompt: string) => void
  dataSources: string[]
  toggleDataSource: (sourceId: string) => void
  refreshSchedule: string
  setRefreshSchedule: (schedule: string) => void
  maxNameLength: number
  maxPromptLength: number
  applyExamplePrompt: (example: string) => void
}

function ConfigureStep({
  name,
  setName,
  prompt,
  setPrompt,
  dataSources,
  toggleDataSource,
  refreshSchedule,
  setRefreshSchedule,
  maxNameLength,
  maxPromptLength,
  applyExamplePrompt,
}: ConfigureStepProps) {
  const nameRemaining = maxNameLength - name.length
  const promptRemaining = maxPromptLength - prompt.length

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Tile Name */}
      <div className="space-y-2">
        <Label htmlFor="tile-name">Tile Name</Label>
        <Input
          id="tile-name"
          placeholder="e.g., Top Fundraising Opportunities"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, maxNameLength))}
          maxLength={maxNameLength}
        />
        <p className={`text-xs ${nameRemaining < 10 ? 'text-red-500' : 'text-neutral-500'}`}>
          {nameRemaining} characters remaining
        </p>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt">What would you like to know?</Label>
        <Textarea
          id="prompt"
          placeholder="Enter your question for Claude..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, maxPromptLength))}
          maxLength={maxPromptLength}
          rows={4}
          className="resize-none"
        />
        <p className={`text-xs ${promptRemaining < 50 ? 'text-red-500' : 'text-neutral-500'}`}>
          {promptRemaining} characters remaining
        </p>
      </div>

      {/* Example Prompts */}
      <div className="space-y-2">
        <Label className="text-xs text-neutral-600">Example prompts:</Label>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => applyExamplePrompt(example)}
              className="text-xs px-2.5 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div className="space-y-3">
        <Label>Data Sources</Label>
        <div className="space-y-2">
          {DATA_SOURCES.map((source) => (
            <div key={source.id} className="flex items-start space-x-3">
              <Checkbox
                id={source.id}
                checked={dataSources.includes(source.id)}
                onCheckedChange={() => toggleDataSource(source.id)}
              />
              <div className="grid gap-0.5 leading-none">
                <label
                  htmlFor={source.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {source.label}
                </label>
                <p className="text-xs text-neutral-500">{source.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Schedule */}
      <div className="space-y-3">
        <Label>Refresh Schedule</Label>
        <RadioGroup value={refreshSchedule} onValueChange={setRefreshSchedule}>
          {REFRESH_SCHEDULES.map((schedule) => (
            <div key={schedule.id} className="flex items-start space-x-3">
              <RadioGroupItem value={schedule.id} id={schedule.id} />
              <div className="grid gap-0.5 leading-none">
                <label
                  htmlFor={schedule.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {schedule.label}
                </label>
                <p className="text-xs text-neutral-500">{schedule.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    </motion.div>
  )
}

interface PreviewStepProps {
  isLoading: boolean
  data: Record<string, unknown> | null
  onRegenerate: () => void
}

function PreviewStep({ isLoading, data, onRegenerate }: PreviewStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 min-h-[200px]">
        {isLoading ? (
          <PreviewSkeleton />
        ) : data ? (
          <div className="space-y-3">
            {/* Render preview data */}
            {typeof data === 'string' ? (
              <div className="text-sm text-neutral-700 whitespace-pre-wrap">{data}</div>
            ) : (
              <div className="space-y-2">
                {data.title && (
                  <h4 className="font-semibold text-neutral-900">{data.title}</h4>
                )}
                {data.content && (
                  <div className="text-sm text-neutral-700 whitespace-pre-wrap">
                    {data.content}
                  </div>
                )}
                {data.metrics && Array.isArray(data.metrics) && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {data.metrics.map((metric: { value: string; label: string }, idx: number) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-neutral-200">
                        <div className="text-2xl font-bold text-primary-600">{metric.value}</div>
                        <div className="text-xs text-neutral-600 mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-500">
            No preview available
          </div>
        )}
      </div>

      {!isLoading && data && (
        <Button
          variant="outline"
          onClick={onRegenerate}
          className="w-full gap-2"
          size="sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Regenerate
        </Button>
      )}
    </motion.div>
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
      <div className="h-4 bg-neutral-200 rounded w-full"></div>
      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
      <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="h-20 bg-neutral-200 rounded"></div>
        <div className="h-20 bg-neutral-200 rounded"></div>
      </div>
    </div>
  )
}
