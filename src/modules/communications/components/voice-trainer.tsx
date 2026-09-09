'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Trash2, Sparkles, FileText, CheckCircle2 } from 'lucide-react'

type VoiceSample = {
  id: string
  content: string
  source: string
  created_at: string
}

type VoiceTrainerProps = {
  samples?: VoiceSample[]
  voiceSummary?: string
  hasVoiceProfile?: boolean
  onAddSample?: (content: string, source: string) => Promise<void>
  onRemoveSample?: (id: string) => Promise<void>
  onTrainVoice?: () => Promise<void>
}

export function VoiceTrainer({
  samples = [],
  voiceSummary,
  hasVoiceProfile = false,
  onAddSample,
  onRemoveSample,
  onTrainVoice,
}: VoiceTrainerProps) {
  // Determine if a voice profile exists (either from prop or voiceSummary)
  const profileExists = hasVoiceProfile || !!voiceSummary
  const [newSample, setNewSample] = useState('')
  const [sampleSource, setSampleSource] = useState('')
  const [tonePreference, setTonePreference] = useState('balanced')
  const [isAdding, setIsAdding] = useState(false)
  const [isTraining, setIsTraining] = useState(false)

  const handleAddSample = async () => {
    if (!newSample.trim() || !onAddSample) return

    setIsAdding(true)
    try {
      await onAddSample(newSample, sampleSource || 'Manual entry')
      setNewSample('')
      setSampleSource('')
    } catch (error) {
      console.error('Error adding sample:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveSample = async (id: string) => {
    if (!onRemoveSample) return
    await onRemoveSample(id)
  }

  const handleTrainVoice = async () => {
    if (!onTrainVoice) return

    setIsTraining(true)
    try {
      await onTrainVoice()
    } catch (error) {
      console.error('Error training voice:', error)
    } finally {
      setIsTraining(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onAddSample) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      if (content) {
        setIsAdding(true)
        try {
          await onAddSample(content, file.name)
        } catch (error) {
          console.error('Error uploading file:', error)
        } finally {
          setIsAdding(false)
        }
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset file input
  }

  return (
    <div className="space-y-6">
      {/* Voice Profile Status Indicator */}
      <Card className={profileExists ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {profileExists ? (
              <>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Voice Profile Active</p>
                  <p className="text-sm text-green-700">
                    AI emails will use your organization&apos;s trained voice style
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">No Voice Profile</p>
                  <p className="text-sm text-amber-700">
                    Add sample emails to train your organization&apos;s unique voice
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Voice Profile */}
      {voiceSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Current Voice Profile
            </CardTitle>
            <CardDescription>
              This is how the AI understands your organization's communication style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-sm text-neutral-700">{voiceSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tone Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Tone Preference</CardTitle>
          <CardDescription>
            Choose the overall tone for AI-generated communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Preferred Communication Tone</Label>
            <Select value={tonePreference} onValueChange={setTonePreference}>
              <SelectTrigger id="tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Formal & Professional</span>
                    <span className="text-xs text-neutral-500">Traditional, respectful, corporate tone</span>
                  </div>
                </SelectItem>
                <SelectItem value="balanced">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Balanced & Friendly</span>
                    <span className="text-xs text-neutral-500">Professional yet warm and approachable</span>
                  </div>
                </SelectItem>
                <SelectItem value="casual">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Casual & Conversational</span>
                    <span className="text-xs text-neutral-500">Relaxed, personal, and authentic</span>
                  </div>
                </SelectItem>
                <SelectItem value="enthusiastic">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Enthusiastic & Energetic</span>
                    <span className="text-xs text-neutral-500">Upbeat, passionate, and inspiring</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500">
              This tone will be combined with your voice samples to generate emails that match your organization's style.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add New Sample */}
      <Card>
        <CardHeader>
          <CardTitle>Add Voice Sample</CardTitle>
          <CardDescription>
            Paste example emails or upload text files that represent your organization's voice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              placeholder="e.g., Newsletter 2024-01"
              value={sampleSource}
              onChange={(e) => setSampleSource(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sample">Email Content</Label>
            <Textarea
              id="sample"
              placeholder="Paste an example email that represents your organization's voice..."
              value={newSample}
              onChange={(e) => setNewSample(e.target.value)}
              rows={8}
              disabled={isAdding}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddSample}
              disabled={!newSample.trim() || isAdding}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isAdding ? 'Adding...' : 'Add Sample'}
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isAdding}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.eml"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Samples */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voice Samples ({samples.length})</CardTitle>
              <CardDescription>
                Training samples used to learn your organization's voice
              </CardDescription>
            </div>
            {samples.length > 0 && (
              <Button
                onClick={handleTrainVoice}
                disabled={isTraining || samples.length < 3}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isTraining ? 'Training...' : profileExists ? 'Retrain Voice' : 'Train Voice'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {samples.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p>No voice samples yet.</p>
              <p className="text-sm mt-1">Add at least 3 samples to train your voice profile.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {samples.map((sample) => (
                <Card key={sample.id} className="bg-neutral-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{sample.source}</Badge>
                          <span className="text-xs text-neutral-500">
                            {new Date(sample.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-700 line-clamp-3">
                          {sample.content}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSample(sample.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {samples.length > 0 && samples.length < 3 && (
            <p className="text-sm text-amber-600 mt-4">
              Add {3 - samples.length} more sample{3 - samples.length > 1 ? 's' : ''} to enable voice training.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tips for Good Samples</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-neutral-700 space-y-2 list-disc list-inside">
            <li>Include emails that were well-received by recipients</li>
            <li>Add variety: thank you notes, updates, event invitations</li>
            <li>Use complete emails, not fragments</li>
            <li>Include 5-10 samples for best results</li>
            <li>Update samples periodically as your voice evolves</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
