'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImpactStoryCard } from './impact-story-card'
import { ImpactBreakdown } from './impact-breakdown'
import { ShareableCard } from './shareable-card'
import { ImpactMetricsInput } from './impact-metrics-input'
import { GenerateStoryButton } from './generate-story-button'

/**
 * Demo page showcasing all Impact Story components
 * Useful for testing and demonstrating functionality
 */
export function ImpactStoryDemo() {
  const [metrics] = useState([
    {
      type: 'meals',
      value: 235,
      label: 'Meals Provided',
      icon: 'meals',
    },
    {
      type: 'families',
      value: 12,
      label: 'Families Housed',
      icon: 'families',
    },
    {
      type: 'children',
      value: 47,
      label: 'Children Helped',
      icon: 'users',
    },
    {
      type: 'books',
      value: 128,
      label: 'Books Distributed',
      icon: 'books',
    },
    {
      type: 'medical',
      value: 89,
      label: 'Medical Visits',
      icon: 'medical',
    },
    {
      type: 'clothing',
      value: 156,
      label: 'Clothing Items',
      icon: 'clothing',
    },
  ])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Impact Stories Components
        </h1>
        <p className="text-lg text-neutral-600">
          Beautiful, emotional components for showing donor impact
        </p>
      </div>

      <Tabs defaultValue="story" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="story">Impact Story</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="shareable">Shareable</TabsTrigger>
          <TabsTrigger value="metrics">Metrics Input</TabsTrigger>
          <TabsTrigger value="button">Generate Button</TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impact Story Card</CardTitle>
              <CardDescription>
                Full impact story with headline, narrative, metrics, and sharing options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImpactStoryCard
                donorName="Sarah Johnson"
                headline="Sarah, You Changed 47 Lives"
                narrative="Your incredible generosity has created a ripple effect of hope throughout our community. Because of your support, families who were struggling now have access to nutritious meals, safe shelter, and educational opportunities. Every dollar you gave became a lifeline for someone in need."
                metrics={metrics.slice(0, 3)}
                totalDonation={5000}
                organizationName="Hope Foundation"
                onShare={(platform) => {
                  console.log(`Shared on ${platform}`)
                  alert(`Shared on ${platform}!`)
                }}
                onDownload={() => {
                  console.log('Download triggered')
                  alert('Download feature would trigger here!')
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impact Breakdown</CardTitle>
              <CardDescription>
                Grid of impact metrics with animated counters and icons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImpactBreakdown metrics={metrics} animated={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shareable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shareable Social Card</CardTitle>
              <CardDescription>
                Optimized for social media sharing (1200x630px Open Graph size)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-neutral-100 p-4 rounded-lg overflow-auto">
                <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                  <ShareableCard
                    donorName="Sarah"
                    headline="You Changed 47 Lives"
                    keyMetrics={metrics.slice(0, 3)}
                    organizationName="Hope Foundation"
                    callToAction="Join us in making a difference"
                  />
                </div>
              </div>
              <p className="text-sm text-neutral-500 mt-4">
                Scaled to 50% for display. Actual size is 1200x630px.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metrics Input Form</CardTitle>
              <CardDescription>
                Admin form for defining program metrics that power impact calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImpactMetricsInput
                organizationId="demo-org"
                initialMetrics={[
                  {
                    id: '1',
                    programName: 'Food Bank',
                    metricName: 'Meals Provided',
                    value: 10000,
                    costPerUnit: 5.0,
                    icon: 'meals',
                  },
                  {
                    id: '2',
                    programName: 'Housing Support',
                    metricName: 'Families Housed',
                    value: 250,
                    costPerUnit: 400.0,
                    icon: 'families',
                  },
                ]}
                onSave={async (metrics) => {
                  console.log('Saving metrics:', metrics)
                  alert(`Saved ${metrics.length} metrics!`)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="button" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Story Button</CardTitle>
              <CardDescription>
                Button that triggers AI story generation and displays results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <GenerateStoryButton
                  donorId="demo-donor-1"
                  donorName="Sarah Johnson"
                  totalDonation={5000}
                  organizationName="Hope Foundation"
                  variant="primary"
                  size="default"
                />

                <GenerateStoryButton
                  donorId="demo-donor-2"
                  donorName="John Smith"
                  totalDonation={2500}
                  organizationName="Hope Foundation"
                  variant="outline"
                  size="sm"
                />

                <GenerateStoryButton
                  donorId="demo-donor-3"
                  donorName="Emily Chen"
                  totalDonation={10000}
                  organizationName="Hope Foundation"
                  variant="ghost"
                  size="lg"
                />
              </div>

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600">
                  <strong>Note:</strong> In demo mode, this button will show mock data after a 2-second delay.
                  In production, pass an <code>onGenerate</code> function that calls your AI service.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
          <CardDescription>
            How to use these components in your donor pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-neutral-900 text-neutral-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`// In your donor detail page
import { GenerateStoryButton } from '@/modules/impact/components'

<GenerateStoryButton
  donorId={donor.id}
  donorName={donor.name}
  totalDonation={donor.lifetimeGiving}
  organizationName="Hope Foundation"
  onGenerate={generateImpactStory}
  variant="primary"
/>`}</pre>
          </div>

          <div className="bg-neutral-900 text-neutral-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`// In your settings page
import { ImpactMetricsInput } from '@/modules/impact/components'

<ImpactMetricsInput
  organizationId={org.id}
  initialMetrics={org.programMetrics}
  onSave={saveProgramMetrics}
/>`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
