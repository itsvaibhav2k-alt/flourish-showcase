import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicDonationFormBySlug } from '@/modules/donors/queries/get-public-donation-forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DonationFormWrapper } from '@/modules/donors/components/donation-form-wrapper'
import { ArrowLeft, Heart, Shield, Lock } from 'lucide-react'

interface DonationFormPageProps {
  params: Promise<{
    orgSlug: string
    formSlug: string
  }>
}

export default async function DonationFormPage({ params }: DonationFormPageProps) {
  const { orgSlug, formSlug } = await params
  const data = await getPublicDonationFormBySlug(orgSlug, formSlug)

  if (!data) {
    notFound()
  }

  const { organization, form } = data

  // Get Stripe publishable key
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!stripePublishableKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-rose-900 font-medium">Configuration Error</p>
            <p className="text-sm text-rose-700 mt-1">
              Stripe is not properly configured. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const suggestedAmounts = (form.suggested_amounts as number[]) || []

  return (
    <div className="space-y-6 animate-appear">
      {/* Back link */}
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/donate/${orgSlug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to donation forms
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary mb-2">
          <Heart className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 heading-tight">
          {organization.name}
        </h1>
        <p className="text-lg text-neutral-600">{form.name}</p>
        {form.description && (
          <p className="text-neutral-600 max-w-2xl mx-auto">{form.description}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
        {/* Main form - takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="shadow-md-soft">
            <CardHeader>
              <CardTitle>Make Your Donation</CardTitle>
              <CardDescription>
                Your secure donation helps support our mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DonationFormWrapper
                organizationId={organization.id}
                organizationName={organization.name}
                orgSlug={orgSlug}
                formId={form.id}
                formName={form.name}
                suggestedAmounts={suggestedAmounts}
                defaultAmount={form.default_amount || undefined}
                allowCustomAmount={form.allow_custom_amount}
                allowRecurring={form.allow_recurring}
                stripePublishableKey={stripePublishableKey}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Trust indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secure Donation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Encrypted</p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Protected</p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Processed securely through Stripe
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Tax Deductible</p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Instant receipt sent to your email
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thank you message preview */}
          {form.thank_you_message && (
            <Card className="bg-gradient-to-br from-primary-50 to-teal-50 border-primary-100">
              <CardHeader>
                <CardTitle className="text-lg">Our Appreciation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {form.thank_you_message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Impact statement */}
          <Card className="bg-gradient-cta border-primary-100">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/80 mb-2">
                  <Heart className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-neutral-900">Making a Difference</h3>
                <p className="text-sm text-neutral-600">
                  Every donation, no matter the size, helps us continue our important work in the community.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
