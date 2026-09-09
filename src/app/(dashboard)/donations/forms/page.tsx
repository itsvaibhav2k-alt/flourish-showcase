import Link from 'next/link'
export const dynamic = 'force-dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDonationForms } from '@/modules/donations/queries/get-donation-forms'
import { FileText, Plus, ExternalLink, Copy, Edit, TrendingUp, DollarSign } from 'lucide-react'

/**
 * Donation forms management page
 * List all donation forms with stats
 */
export default async function DonationFormsPage() {
  const forms = await getDonationForms().catch(() => [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Donation Forms</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Create and manage public donation forms
            </p>
          </div>
          <Link href="/donations/forms/new">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </Link>
        </div>

        {/* Forms Grid */}
        {forms.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {forms.map((form) => {
              const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donate/${form.slug}`

              return (
                <Card key={form.id} className="shadow-card border-neutral-200/60 bg-white hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">{form.name}</h3>
                          <Badge variant={form.is_active ? 'default' : 'outline'} className={form.is_active ? 'bg-green-100 text-green-700 border-green-200' : ''}>
                            {form.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {form.description && (
                          <p className="text-sm text-neutral-500 line-clamp-2">{form.description}</p>
                        )}
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 ml-4">
                        <FileText className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <p className="text-xs font-medium text-neutral-500 uppercase">Total Raised</p>
                        </div>
                        <p className="text-xl font-bold text-neutral-900">
                          {formatCurrency(0)}
                        </p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-primary-600" />
                          <p className="text-xs font-medium text-neutral-500 uppercase">Donations</p>
                        </div>
                        <p className="text-xl font-bold text-neutral-900">0</p>
                      </div>
                    </div>

                    {/* Public URL */}
                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                      <p className="text-xs font-medium text-neutral-500 mb-1">Public URL</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-primary-600 flex-1 truncate">{publicUrl}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(publicUrl)}
                          className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/donations/forms/${form.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Form
                        </Button>
                      </Link>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-primary-300" />
              </div>
              <p className="text-sm font-medium text-neutral-600">No donation forms yet</p>
              <p className="text-xs text-neutral-400 mt-1 mb-4">
                Create your first donation form to start accepting online contributions
              </p>
              <Link href="/donations/forms/new">
                <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create First Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
