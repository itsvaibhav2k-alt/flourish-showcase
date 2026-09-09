'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Mic, CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceStatusCardProps {
  hasProfile: boolean
  samplesCount: number
  voiceSummary: string | null
  trainedAt: string | null
  floraTooltip: {
    title: string
    content: string
    tip?: string
  }
}

export function VoiceStatusCard({
  hasProfile,
  samplesCount,
  voiceSummary,
  trainedAt,
  floraTooltip,
}: VoiceStatusCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const needsMoreSamples = samplesCount < 3
  const canTrain = samplesCount >= 3 && !hasProfile

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
            <Mic className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold tracking-tight">
                Voice Profile
              </CardTitle>
              {hasProfile ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Trained
                </Badge>
              ) : needsMoreSamples ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Needs Samples
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  Ready to Train
                </Badge>
              )}
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                    aria-label="Learn more about voice profile"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="w-80 p-0 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-primary-50 to-violet-50 px-4 py-3 border-b border-primary-100">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/flora-explaining.png"
                        alt="Flora mascot"
                        width={40}
                        height={60}
                        className="object-contain"
                      />
                      <p className="font-medium text-primary-900 text-sm">Flora says...</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-medium text-neutral-900 text-sm mb-1">
                        {floraTooltip.title}
                      </h4>
                      <p className="text-sm text-neutral-600">
                        {floraTooltip.content}
                      </p>
                    </div>
                    {floraTooltip.tip && (
                      <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                        <p className="text-xs text-amber-800">
                          <span className="font-medium">Pro tip:</span> {floraTooltip.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <CardDescription className="text-neutral-500 mt-1">
              Train AI to match your organization&apos;s unique writing style
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Training Samples Count */}
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <div>
            <p className="text-sm font-medium text-neutral-900">Training Samples</p>
            <p className="text-xs text-neutral-500">
              {needsMoreSamples
                ? `Add ${3 - samplesCount} more sample${3 - samplesCount !== 1 ? 's' : ''} to train`
                : 'Sufficient samples for training'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-900">{samplesCount}</p>
            <p className="text-xs text-neutral-500">samples</p>
          </div>
        </div>

        {/* Voice Summary */}
        {voiceSummary && (
          <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
            <p className="text-xs font-medium text-violet-700 mb-1">Current Voice Profile</p>
            <p className="text-sm text-violet-900">{voiceSummary}</p>
            {trainedAt && (
              <p className="text-xs text-violet-600 mt-2">
                Last trained: {new Date(trainedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            variant={hasProfile ? 'outline' : 'default'}
            size="sm"
            asChild
          >
            <Link href="/communications/voice" className="flex items-center gap-2">
              {hasProfile ? 'Manage Voice' : canTrain ? 'Train Voice' : 'Add Samples'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
