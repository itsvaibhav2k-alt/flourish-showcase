import { Mail, GitBranch, BarChart3, DollarSign, FileText, Sparkles, Phone } from 'lucide-react'
import { getCopilotActions } from '@/modules/copilot/queries/get-copilot-actions'
import { FloraActionsWidget } from './flora-actions-widget'
import { FloraFeatureCard } from '@/modules/flora/components/flora-feature-card'
import { AskFloraInput } from '@/modules/flora/components/ask-flora-input'

export const dynamic = 'force-dynamic'

export default async function FloraPage() {
  // Fetch copilot actions
  let actions: Awaited<ReturnType<typeof getCopilotActions>> = []
  try {
    actions = await getCopilotActions()
  } catch (err) {
    console.error('Error fetching copilot actions:', err)
  }

  return (
    <div className="space-y-6">
      {/* Ask Flora Input */}
      <div>
        <AskFloraInput />
      </div>

      {/* Flora's Suggestions */}
      <div>
        <FloraActionsWidget initialActions={actions} />
      </div>

      {/* AI Tools Section */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900">AI Tools</h2>

        {/* Communications Category */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Communications</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FloraFeatureCard
              href="/flora/compose"
              icon={<Mail className="h-5 w-5" />}
              title="Compose"
              description="Generate personalized AI emails"
              compact
            />

            <FloraFeatureCard
              href="/flora/sequences"
              icon={<GitBranch className="h-5 w-5" />}
              title="Sequences"
              description="Automated email drip campaigns"
              compact
            />

            <FloraFeatureCard
              href="/flora/impact-stories"
              icon={<Sparkles className="h-5 w-5" />}
              title="Impact Stories"
              description="Personalized donor impact narratives"
              compact
            />
          </div>
        </div>

        {/* Fundraising Category */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Fundraising</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FloraFeatureCard
              href="/flora/smart-ask"
              icon={<DollarSign className="h-5 w-5" />}
              title="Smart Ask"
              description="Calculate optimal ask amounts"
              compact
            />

            <FloraFeatureCard
              href="/flora/grants"
              icon={<FileText className="h-5 w-5" />}
              title="Grant Writer"
              description="AI grant proposal writing"
              compact
            />

            <FloraFeatureCard
              href="/flora/insights"
              icon={<BarChart3 className="h-5 w-5" />}
              title="Insights"
              description="AI-powered analytics & tiles"
              compact
            />
          </div>
        </div>

        {/* Voice Category */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Voice</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FloraFeatureCard
              href="/flora/voice-config"
              icon={<Phone className="h-5 w-5" />}
              title="Voice Config"
              description="Customize Flora's calling behavior"
              compact
            />
          </div>
        </div>

      </section>
    </div>
  )
}
