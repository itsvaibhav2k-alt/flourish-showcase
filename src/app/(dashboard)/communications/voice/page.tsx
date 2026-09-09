import { VoiceTrainer } from '@/modules/communications/components/voice-trainer'
export const dynamic = 'force-dynamic'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getVoiceSamples, getVoiceSummary } from '@/modules/communications/queries/get-voice-samples'
import { addVoiceSample, removeVoiceSample } from '@/modules/communications/actions/manage-voice-samples'
import { trainVoice } from '@/modules/communications/actions/train-voice'
import { redirect } from 'next/navigation'

export default async function VoiceTrainingPage() {
  const samples = await getVoiceSamples()
  const voiceSummary = await getVoiceSummary()

  async function handleAddSample(content: string, source: string) {
    'use server'
    const result = await addVoiceSample(content, source)
    if (!result.success && result.error) {
      throw new Error(result.error)
    }
  }

  async function handleRemoveSample(id: string) {
    'use server'
    const result = await removeVoiceSample(id)
    if (!result.success && result.error) {
      throw new Error(result.error)
    }
  }

  async function handleTrainVoice() {
    'use server'
    const result = await trainVoice()
    if (!result.success && result.error) {
      throw new Error(result.error)
    }
    // Redirect to refresh the page and show the updated voice profile
    redirect('/communications/voice')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/communications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Voice Training</h1>
          <p className="text-neutral-600 mt-1">
            Train the AI to write emails in your organization&apos;s unique voice
          </p>
        </div>
      </div>

      {/* Voice Trainer */}
      <VoiceTrainer
        samples={samples}
        voiceSummary={voiceSummary?.voiceSummary || undefined}
        onAddSample={handleAddSample}
        onRemoveSample={handleRemoveSample}
        onTrainVoice={handleTrainVoice}
      />
    </div>
  )
}
