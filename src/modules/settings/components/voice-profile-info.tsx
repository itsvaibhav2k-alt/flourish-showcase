'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Sparkles } from 'lucide-react'

interface VoiceProfileInfoProps {
  samplesCount: number
  voiceSummary: string | null
}

export function VoiceProfileInfo({ samplesCount, voiceSummary }: VoiceProfileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Profile</CardTitle>
        <CardDescription>
          Your organization&apos;s unique communication style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Training Samples</Label>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold">{samplesCount}</div>
            <span className="text-sm text-neutral-600">
              samples added
            </span>
          </div>
          {samplesCount < 3 && (
            <p className="text-sm text-amber-600">
              Add at least 3 sample emails to train your voice profile
            </p>
          )}
        </div>

        {voiceSummary && (
          <div className="space-y-2">
            <Label>Current Voice Profile</Label>
            <div className="p-4 bg-neutral-50 rounded-md border">
              <p className="text-sm text-neutral-700">{voiceSummary}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <a href="/communications/voice">Manage Samples</a>
          </Button>
          {samplesCount >= 3 && (
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Train Voice
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
