'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Wand2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface AIGenerationPanelProps {
  onGenerate: (options: GenerationOptions) => void
  isGenerating: boolean
  disabled?: boolean
}

export interface GenerationOptions {
  tone: 'warm' | 'professional' | 'casual' | 'formal' | 'spiritual'
  includeCallToAction: boolean
  customInstructions: string
}

export function AIGenerationPanel({
  onGenerate,
  isGenerating,
  disabled = false,
}: AIGenerationPanelProps) {
  const [tone, setTone] = useState<GenerationOptions['tone']>('warm')
  const [includeCallToAction, setIncludeCallToAction] = useState(false)
  const [customInstructions, setCustomInstructions] = useState('')

  const handleGenerate = () => {
    onGenerate({
      tone,
      includeCallToAction,
      customInstructions,
    })
  }

  const toneOptions = [
    { value: 'warm', label: 'Warm & Heartfelt', description: 'Friendly and appreciative' },
    { value: 'professional', label: 'Professional', description: 'Polished and formal' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
    { value: 'formal', label: 'Formal', description: 'Traditional and respectful' },
    { value: 'spiritual', label: 'Spiritual', description: 'Faith-based and inspirational' },
  ] as const

  return (
    <Card className="shadow-sm border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
      <CardHeader className="border-b border-violet-100/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          AI Generation Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Tone Selector */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="text-sm font-medium text-neutral-700">
            Email Tone
          </Label>
          <Select value={tone} onValueChange={(value) => setTone(value as GenerationOptions['tone'])}>
            <SelectTrigger
              id="tone"
              className="bg-white border-neutral-200"
              disabled={disabled || isGenerating}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-neutral-500">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-500">
            Choose the tone that matches your organization's voice
          </p>
        </div>

        {/* Call to Action Toggle */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200">
          <div className="space-y-0.5">
            <Label htmlFor="cta" className="text-sm font-medium text-neutral-700">
              Include Call-to-Action
            </Label>
            <p className="text-xs text-neutral-500">
              Add a gentle invitation for next steps
            </p>
          </div>
          <Switch
            id="cta"
            checked={includeCallToAction}
            onCheckedChange={setIncludeCallToAction}
            disabled={disabled || isGenerating}
          />
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-sm font-medium text-neutral-700">
            Custom Instructions (Optional)
          </Label>
          <Textarea
            id="instructions"
            placeholder="Add any specific details or requests for the AI to include in the emails..."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={3}
            className="bg-white border-neutral-200 resize-none"
            disabled={disabled || isGenerating}
          />
          <p className="text-xs text-neutral-500">
            Example: "Mention our upcoming gala on December 15th"
          </p>
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-violet-100/50">
          <Button
            onClick={handleGenerate}
            disabled={disabled || isGenerating}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Emails
              </>
            )}
          </Button>

          {/* AI Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-3 bg-violet-50/50 rounded-lg border border-violet-200/50"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-violet-700 space-y-1">
                <p className="font-medium">Powered by Claude AI</p>
                <p className="text-violet-600">
                  Each email will be personalized based on the recipient's history, engagement, and relationship with your organization.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
