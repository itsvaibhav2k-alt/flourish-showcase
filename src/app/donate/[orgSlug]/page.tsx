import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicDonationForms } from '@/modules/donors/queries/get-public-donation-forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ArrowRight, DollarSign, Shield } from 'lucide-react'

interface DonationFormsPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function DonationFormsPage({ params }: DonationFormsPageProps) {
  const { orgSlug } = await params
  const data = await getPublicDonationForms(orgSlug)

  if (!data) {
    notFound()
  }

  const { organization, forms } = data

  return (
    <div className="space-y-8 animate-appear">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-2">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-neutral-900 heading-tight">
          {organization.name}
        </h1>
        <p className="text-xl text-neutral-600">
          Your generosity helps us make a lasting impact in our community
        </p>
      </div>

      {/* Forms section */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
            Ways to Give
          </h2>
          <p className="text-neutral-600">
            Choose a donation option that best fits your giving goals
          </p>
        </div>

        {forms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
                <Heart className="h-8 w-8 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No Donation Forms Available
                </h3>
                <p className="text-neutral-600 max-w-md mx-auto">
                  This organization hasn't set up donation forms yet. Please contact them directly to learn about giving opportunities.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {forms.map((form) => {
              const suggestedAmounts = (form.suggested_amounts as number[]) || []
              const minAmount = suggestedAmounts.length > 0
                ? Math.min(...suggestedAmounts)
                : form.default_amount || 0

              return (
                <Card
                  key={form.id}
                  className="group hover:shadow-card-hover transition-smooth hover:border-primary-200 card-interactive"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{form.name}</CardTitle>
                        {form.description && (
                          <CardDescription className="text-sm">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                      {form.allow_recurring && (
                        <Badge variant="secondary" className="ml-2">
                          Recurring Available
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Suggested amounts preview */}
                    {suggestedAmounts.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          Starting at ${minAmount}
                          {form.allow_custom_amount && ' or custom amount'}
                        </span>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      asChild
                      variant="primary"
                      className="w-full group-hover:scale-[1.02] transition-smooth"
                      size="lg"
                    >
                      <Link href={`/donate/${orgSlug}/${form.slug}`}>
                        {form.button_text || 'Donate'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-100 p-8">
          <div className="grid gap-6 sm:grid-cols-3 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 mb-2">
                <Shield className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Secure</h3>
              <p className="text-sm text-neutral-600">
                Your payment information is encrypted and secure
              </p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 mb-2">
                <Heart className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Tax Deductible</h3>
              <p className="text-sm text-neutral-600">
                Receive an instant receipt for your tax records
              </p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 mb-2">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Direct Impact</h3>
              <p className="text-sm text-neutral-600">
                100% of your donation goes to support our mission
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact section */}
      <div className="max-w-4xl mx-auto text-center pt-8">
        <div className="bg-gradient-cta rounded-xl p-8">
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Questions About Giving?
          </h3>
          <p className="text-neutral-600 mb-4">
            We're here to help! Contact {organization.name} directly for more information about donation options or to discuss larger gifts.
          </p>
        </div>
      </div>
    </div>
  )
}
