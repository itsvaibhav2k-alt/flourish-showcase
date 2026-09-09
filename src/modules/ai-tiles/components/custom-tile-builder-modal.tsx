'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Sparkles, Database, Clock, Edit3 } from 'lucide-react'
import { createCustomTile, updateCustomTile } from '@/lib/ai-tiles/actions'
import type { DataSource, CustomAITile } from '@/lib/ai-tiles/registry'
import { cn } from '@/lib/utils'

interface CustomTileBuilderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTile?: CustomAITile | null
  onSave?: (tile: CustomAITile) => void
}

const dataSourceOptions: { value: DataSource; label: string; description: string }[] = [
  { value: 'donors', label: 'Donors', description: 'Donor profiles and giving history' },
  { value: 'gifts', label: 'Gifts', description: 'Individual gift transactions' },
  { value: 'volunteers', label: 'Volunteers', description: 'Volunteer profiles and activity' },
  { value: 'shifts', label: 'Shifts', description: 'Volunteer shift schedules' },
  { value: 'contacts', label: 'Contacts', description: 'All contact records' },
  { value: 'communications', label: 'Communications', description: 'Email history and drafts' },
  { value: 'tasks', label: 'Tasks', description: 'Task assignments and completion' },
]

const scheduleOptions: { value: 'daily' | 'weekly' | 'manual'; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Refresh every morning at 6 AM' },
  { value: 'weekly', label: 'Weekly', description: 'Refresh every Monday morning' },
  { value: 'manual', label: 'Manual', description: 'Only refresh when requested' },
]

export function CustomTileBuilderModal({ open, onOpenChange, editingTile, onSave }: CustomTileBuilderModalProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [dataSources, setDataSources] = useState<DataSource[]>(['donors'])
  const [refreshSchedule, setRefreshSchedule] = useState<'daily' | 'weekly' | 'manual'>('daily')

  const isEditing = !!editingTile

  // Populate form when editing
  useEffect(() => {
    if (editingTile) {
      setName(editingTile.name)
      setDescription(editingTile.description)
      setPrompt(editingTile.prompt)
      setDataSources(editingTile.dataSources)
      setRefreshSchedule(editingTile.refreshSchedule)
    } else {
      // Reset form when not editing
      setName('')
      setDescription('')
      setPrompt('')
      setDataSources(['donors'])
      setRefreshSchedule('daily')
    }
  }, [editingTile])

  const handleDataSourceToggle = (source: DataSource) => {
    setDataSources((prev) => {
      if (prev.includes(source)) {
        return prev.filter((s) => s !== source)
      } else {
        return [...prev, source]
      }
    })
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Validation error', {
        description: 'Please enter a name for your custom tile.',
      })
      return
    }

    if (!description.trim()) {
      toast.error('Validation error', {
        description: 'Please enter a description for your custom tile.',
      })
      return
    }

    if (!prompt.trim()) {
      toast.error('Validation error', {
        description: 'Please enter a prompt that tells the AI what insights to generate.',
      })
      return
    }

    if (prompt.length < 10) {
      toast.error('Validation error', {
        description: 'The prompt must be at least 10 characters long.',
      })
      return
    }

    if (prompt.length > 500) {
      toast.error('Validation error', {
        description: 'The prompt must be no more than 500 characters.',
      })
      return
    }

    if (dataSources.length === 0) {
      toast.error('Validation error', {
        description: 'Please select at least one data source.',
      })
      return
    }

    startTransition(async () => {
      if (isEditing && editingTile) {
        // Update existing tile
        const result = await updateCustomTile(editingTile.id, {
          name,
          description,
          prompt,
          refreshSchedule,
          dataSources,
        })

        if (result.success) {
          toast.success('Custom tile updated', {
            description: `${name} has been updated successfully.`,
          })
          // Call onSave with updated tile data
          if (onSave) {
            onSave({
              ...editingTile,
              name,
              description,
              prompt,
              refreshSchedule,
              dataSources,
              updatedAt: new Date().toISOString(),
            })
          }
          onOpenChange(false)
        } else {
          toast.error('Error', {
            description: result.error || 'Failed to update custom tile.',
          })
        }
      } else {
        // Create new tile
        const result = await createCustomTile({
          name,
          description,
          prompt,
          refreshSchedule,
          dataSources,
        })

        if (result.success) {
          toast.success('Custom tile created', {
            description: `${name} has been created successfully.`,
          })
          // Reset form
          setName('')
          setDescription('')
          setPrompt('')
          setDataSources(['donors'])
          setRefreshSchedule('daily')
          onOpenChange(false)
        } else {
          toast.error('Error', {
            description: result.error || 'Failed to create custom tile.',
          })
        }
      }
    })
  }

  const characterCount = prompt.length
  const isOverLimit = characterCount > 500

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              {isEditing ? (
                <Edit3 className="h-4 w-4 text-white" />
              ) : (
                <Sparkles className="h-4 w-4 text-white" />
              )}
            </div>
            {isEditing ? 'Edit Custom AI Tile' : 'Create Custom AI Tile'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your custom AI-powered insight tile. Changes will take effect on the next refresh.'
              : 'Define a custom AI-powered insight tile with your own prompt and data sources. The AI will generate insights based on your specified criteria.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-2"
          >
            <Label htmlFor="tile-name">
              Tile Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="tile-name"
              placeholder="e.g., Major Donor Engagement Opportunities"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={isPending}
            />
            <p className="text-xs text-neutral-500">
              A short, descriptive name for your tile ({name.length}/50 characters)
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="tile-description">
              Description <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="tile-description"
              placeholder="What kind of insights will this tile provide?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              disabled={isPending}
            />
            <p className="text-xs text-neutral-500">
              A brief explanation of what this tile shows ({description.length}/100 characters)
            </p>
          </motion.div>

          {/* Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <Label htmlFor="tile-prompt">
              AI Prompt <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="tile-prompt"
              placeholder="Analyze donor data to identify top 10 major donor prospects who haven't given in 6+ months but have high lifetime value. For each, suggest a personalized outreach approach based on their giving history and engagement patterns."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              maxLength={500}
              disabled={isPending}
              className={cn(
                isOverLimit && 'border-rose-300 focus-visible:ring-rose-500'
              )}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Tell the AI what insights to generate from your data
              </p>
              <span
                className={cn(
                  'text-xs font-medium',
                  isOverLimit ? 'text-rose-600' : 'text-neutral-500'
                )}
              >
                {characterCount}/500
              </span>
            </div>
          </motion.div>

          {/* Data Sources */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <Label className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Sources <span className="text-rose-500">*</span>
            </Label>
            <p className="text-xs text-neutral-500">
              Select which data the AI can access to generate insights
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {dataSourceOptions.map((option, index) => {
                const isSelected = dataSources.includes(option.value)
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleDataSourceToggle(option.value)}
                    disabled={isPending}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (index * 0.03) }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-primary-900' : 'text-neutral-900'
                        )}>
                          {option.label}
                        </p>
                        <p className={cn(
                          'text-xs',
                          isSelected ? 'text-primary-700' : 'text-neutral-500'
                        )}>
                          {option.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          isSelected
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-neutral-300'
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-2 w-2 rounded-full bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
            {dataSources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <span className="text-xs text-neutral-600 font-medium">Selected:</span>
                {dataSources.map((source) => (
                  <Badge
                    key={source}
                    variant="secondary"
                    className="text-xs bg-primary-100 text-primary-700"
                  >
                    {dataSourceOptions.find((o) => o.value === source)?.label}
                  </Badge>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Refresh Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Refresh Schedule
            </Label>
            <p className="text-xs text-neutral-500">
              How often should the AI regenerate insights for this tile?
            </p>
            <div className="grid gap-2">
              {scheduleOptions.map((option, index) => {
                const isSelected = refreshSchedule === option.value
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => setRefreshSchedule(option.value)}
                    disabled={isPending}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + (index * 0.05) }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      isSelected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-teal-900' : 'text-neutral-900'
                        )}>
                          {option.label}
                        </p>
                        <p className={cn(
                          'text-xs',
                          isSelected ? 'text-teal-700' : 'text-neutral-500'
                        )}>
                          {option.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          isSelected
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-neutral-300'
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-2 w-2 rounded-full bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || isOverLimit}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditing ? (
                  <Edit3 className="h-4 w-4 mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Save Changes' : 'Create Tile'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
