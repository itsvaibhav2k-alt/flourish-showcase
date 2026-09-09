import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, TrendingUp } from 'lucide-react'

interface Gift {
  id: string
  amount: number
  gift_date: string
  gift_type: 'one_time' | 'recurring' | 'pledge' | 'in_kind' | 'one-time' | 'in-kind' | string | null
  campaign?: string | null
  payment_method?: string | null
}

interface GivingHistoryProps {
  gifts: Gift[]
}

/**
 * Component showing gift history for a contact
 * Displays list of gifts with totals and averages
 */
export function GivingHistory({ gifts }: GivingHistoryProps) {
  // Calculate statistics
  const totalGiven = gifts.reduce((sum, gift) => sum + gift.amount, 0)
  const averageGift = gifts.length > 0 ? totalGiven / gifts.length : 0
  const firstGift = gifts.length > 0 ? gifts[0] : null
  const lastGift = gifts.length > 0 ? gifts[gifts.length - 1] : null

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  // Gift type colors
  const giftTypeColors: Record<string, string> = {
    one_time: 'bg-blue-100 text-blue-800',
    'one-time': 'bg-blue-100 text-blue-800',
    recurring: 'bg-green-100 text-green-800',
    pledge: 'bg-primary-100 text-primary-800',
    in_kind: 'bg-orange-100 text-orange-800',
    'in-kind': 'bg-orange-100 text-orange-800',
  }

  if (gifts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Giving History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-neutral-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <p>No gifts recorded yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giving History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-neutral-500">Total Given</p>
            <p className="text-2xl font-bold text-neutral-900">
              {formatCurrency(totalGiven)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-500">Average Gift</p>
            <p className="text-2xl font-bold text-neutral-900">
              {formatCurrency(averageGift)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-500">Total Gifts</p>
            <p className="text-2xl font-bold text-neutral-900">{gifts.length}</p>
          </div>
        </div>

        {/* First and Last Gift Dates */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-neutral-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-700">First Gift</p>
              <p className="text-sm text-neutral-500">
                {firstGift ? formatDate(firstGift.gift_date) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-neutral-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-700">Last Gift</p>
              <p className="text-sm text-neutral-500">
                {lastGift ? formatDate(lastGift.gift_date) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Gift List */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-neutral-900">Gift History</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900">
                      {formatCurrency(gift.amount)}
                    </p>
                    {gift.gift_type && (
                      <Badge className={giftTypeColors[gift.gift_type] || 'bg-gray-100 text-gray-800'}>
                        {gift.gift_type.replace('_', ' ').replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">
                    {formatDate(gift.gift_date)}
                  </p>
                  {gift.campaign && (
                    <p className="text-xs text-neutral-400">
                      Campaign: {gift.campaign}
                    </p>
                  )}
                </div>
                {gift.payment_method && (
                  <p className="text-sm text-neutral-500">{gift.payment_method}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
