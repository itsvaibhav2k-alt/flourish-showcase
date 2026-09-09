import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUserRole } from '@/lib/auth/organization'
import { AccessRestricted } from '../access-restricted'
import { getProgramMetrics, getAvailableTimePeriods } from '@/modules/impact'
import { ProgramMetricsManager } from '@/modules/impact/components/program-metrics-manager'
import { Sparkles, Heart, Target } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ImpactSettingsPage() {
  // Check user role - settings are admin-only
  const userRole = await getCurrentUserRole()

  if (userRole !== 'admin') {
    return <AccessRestricted userRole={userRole} />
  }

  // Fetch program metrics and available time periods
  let metrics: Awaited<ReturnType<typeof getProgramMetrics>> = []
  let timePeriods: string[] = []

  try {
    metrics = await getProgramMetrics()
    timePeriods = await getAvailableTimePeriods()
  } catch (error) {
    console.error('Error fetching impact data:', error)
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      <PageHeader
        title="Impact Settings"
        description="Configure program metrics to create personalized impact stories for your donors"
      />

      {/* Information Card */}
      <Card className="mt-6 border-primary-100 bg-gradient-to-r from-primary-50/50 to-violet-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 mb-2">
                How Impact Stories Work
              </h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Define Metrics:</strong> Add your program outcomes (meals served, families housed, etc.)
                    and the cost per unit. These become the building blocks of impact calculations.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Generate Stories:</strong> Visit any donor&apos;s profile and click &quot;View Impact&quot;
                    to create a personalized story showing exactly how their gifts changed lives.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Share & Inspire:</strong> Each story gets a beautiful, shareable card and unique link
                    that donors can post on social media to inspire others.
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border border-primary-200">
                <p className="text-xs text-neutral-600">
                  <strong>Example:</strong> If a donor gave $500 and you set &quot;meals served&quot; at $5 per meal,
                  their impact story will show they provided 100 meals to families in need.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Metrics Manager */}
      <div className="mt-6">
        <ProgramMetricsManager metrics={metrics} timePeriods={timePeriods} />
      </div>
    </div>
  )
}
