'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Mail,
  Clock,
  Sparkles,
  Save,
  Play,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { saveSequence } from '../actions'
import type { TriggerType, TemplateType } from '../schemas/sequence.schema'

interface SequenceStep {
  id: string
  dbId?: string // Database ID for existing steps (undefined for new steps)
  name: string
  delayDays: number
  delayHours: number
  templateType: TemplateType
  subjectTemplate: string
  customInstructions: string
  isExpanded: boolean
}

interface SequenceBuilderProps {
  sequenceId?: string | null // Existing sequence ID for editing
  templateId?: string | null // Template ID to copy from
  onClose: () => void
  onSaved?: (sequenceId: string) => void
}

const TRIGGER_TYPES = [
  { value: 'gift', label: 'Gift Received', description: 'When a donor makes a gift' },
  { value: 'signup', label: 'Volunteer Signup', description: 'When someone signs up for a shift' },
  { value: 'lapse_risk', label: 'Lapse Risk', description: 'When a donor becomes at-risk' },
  { value: 'manual', label: 'Manual Enrollment', description: 'Manually add contacts' },
  { value: 'date', label: 'Scheduled Date', description: 'Start on a specific date' },
]

const EMAIL_TEMPLATES = [
  { value: 'thank_you', label: 'Thank You' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'appeal', label: 'Appeal/Ask' },
  { value: 'reengagement', label: 'Re-engagement' },
  { value: 'custom', label: 'Custom' },
]

const DEFAULT_STEPS: SequenceStep[] = [
  {
    id: '1',
    name: 'Welcome Email',
    delayDays: 0,
    delayHours: 0,
    templateType: 'welcome',
    subjectTemplate: 'Welcome to {{organization_name}}!',
    customInstructions: 'Write a warm welcome email introducing the organization and its mission.',
    isExpanded: true,
  },
]

export function SequenceBuilder({ sequenceId, templateId, onClose, onSaved }: SequenceBuilderProps) {
  const [name, setName] = useState(templateId ? 'New Sequence' : '')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('gift')
  const [steps, setSteps] = useState<SequenceStep[]>(DEFAULT_STEPS)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const addStep = () => {
    const newStep: SequenceStep = {
      id: Date.now().toString(),
      name: `Step ${steps.length + 1}`,
      delayDays: 3,
      delayHours: 0,
      templateType: 'follow_up',
      subjectTemplate: '',
      customInstructions: '',
      isExpanded: true,
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id))
  }

  const updateStep = (id: string, updates: Partial<SequenceStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const toggleStepExpanded = (id: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s))
  }

  const handleSave = async () => {
    // Validate before saving
    if (!name.trim()) {
      toast.error('Please enter a sequence name')
      return
    }

    if (steps.length === 0) {
      toast.error('Please add at least one step')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await saveSequence({
        id: sequenceId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        trigger_type: triggerType,
        trigger_config: {},
        is_active: false,
        steps: steps.map((step) => ({
          id: step.dbId, // Use database ID if editing existing step
          name: step.name,
          delay_days: step.delayDays,
          delay_hours: step.delayHours,
          template_type: step.templateType,
          subject_template: step.subjectTemplate || undefined,
          custom_instructions: step.customInstructions || undefined,
          conditions: {},
        })),
      })

      if (result.success && result.sequenceId) {
        toast.success(
          sequenceId ? 'Sequence updated successfully' : 'Sequence created successfully'
        )
        onSaved?.(result.sequenceId)
        onClose()
      } else {
        setSaveError(result.error || 'Failed to save sequence')
        toast.error(result.error || 'Failed to save sequence')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSaveError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {templateId ? 'Create from Template' : 'Create Sequence'}
            </h2>
            <p className="text-sm text-gray-500">
              Build an automated email journey
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Sequence
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                Sequence Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., New Donor Welcome Series"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this sequence for?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div>
                          <div className="font-medium">{trigger.label}</div>
                          <div className="text-xs text-gray-500">{trigger.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Sequence Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{step.name}</p>
                      <p className="text-xs text-gray-500">
                        {index === 0 ? 'Immediately' : `After ${step.delayDays}d ${step.delayHours}h`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Steps */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Email Steps ({steps.length})
            </h3>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>

          <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-3">
            <AnimatePresence>
              {steps.map((step, index) => (
                <Reorder.Item key={step.id} value={step}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="border-gray-200">
                      <Collapsible open={step.isExpanded}>
                        <CollapsibleTrigger asChild>
                          <CardHeader
                            className="cursor-pointer hover:bg-gray-50 transition-colors py-3"
                            onClick={() => toggleStepExpanded(step.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 text-sm font-medium flex items-center justify-center">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {step.name}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {EMAIL_TEMPLATES.find(t => t.value === step.templateType)?.label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {index === 0 ? 'Immediately' : `${step.delayDays} days, ${step.delayHours} hours after previous`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {steps.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeStep(step.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {step.isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Step Name</Label>
                                <Input
                                  value={step.name}
                                  onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                  placeholder="e.g., Welcome Email"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email Template</Label>
                                <Select
                                  value={step.templateType}
                                  onValueChange={(v) => updateStep(step.id, { templateType: v as TemplateType })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EMAIL_TEMPLATES.map(t => (
                                      <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {index > 0 && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Delay (Days)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={step.delayDays}
                                    onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Delay (Hours)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={step.delayHours}
                                    onChange={(e) => updateStep(step.id, { delayHours: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Subject Line Template</Label>
                              <Input
                                value={step.subjectTemplate}
                                onChange={(e) => updateStep(step.id, { subjectTemplate: e.target.value })}
                                placeholder="e.g., Thank you, {{first_name}}!"
                              />
                              <p className="text-xs text-gray-500">
                                Use {'{{first_name}}'}, {'{{organization_name}}'}, etc.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Sparkles className="h-3 w-3 text-violet-500" />
                                AI Instructions
                              </Label>
                              <Textarea
                                value={step.customInstructions}
                                onChange={(e) => updateStep(step.id, { customInstructions: e.target.value })}
                                placeholder="Tell Flora how to write this email..."
                                rows={3}
                              />
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={addStep}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Step
          </Button>
        </div>
      </div>
    </div>
  )
}
