import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Gift } from '@/modules/donors/queries/get-donor-by-token'

interface GiftHistoryTableProps {
  gifts: Gift[]
}

export function GiftHistoryTable({ gifts }: GiftHistoryTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (gifts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Giving History</CardTitle>
          <CardDescription>Recent donations from the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-neutral-500">
            <p>No gifts recorded in the last 12 months.</p>
            <p className="text-sm mt-2">Thank you for your support!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalGiven = gifts.reduce((sum, gift) => sum + gift.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Giving History</CardTitle>
        <CardDescription>Recent donations from the last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-neutral-50 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">Total Gifts</p>
              <p className="text-2xl font-semibold text-neutral-900">{gifts.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">Total Amount</p>
              <p className="text-2xl font-semibold text-neutral-900">{formatAmount(totalGiven)}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Campaign</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((gift) => (
                  <tr key={gift.id} className="border-b border-neutral-100">
                    <td className="py-3 px-4 text-sm text-neutral-900">
                      {formatDate(gift.gift_date)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                      {formatAmount(gift.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {gift.gift_type || 'Donation'}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {gift.campaign || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
