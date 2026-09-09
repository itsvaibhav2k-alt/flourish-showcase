'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CampaignWithStats } from '../queries'
import { getCampaignGifts } from '../queries'
import { ProgressThermometer } from './progress-thermometer'
import { GiftAttributionModal } from './gift-attribution-modal'
import {
  CAMPAIGN_TYPE_METADATA,
  CAMPAIGN_STATUS_METADATA,
} from '../schemas/campaign.schema'

interface CampaignDetailViewProps {
  campaign: CampaignWithStats
  onBack: () => void
}

export function CampaignDetailView({ campaign, onBack }: CampaignDetailViewProps) {
  const [gifts, setGifts] = useState<
    Array<{
      id: string
      amount: number
      giftDate: string
      donorName: string
      donorId: string
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAttributionModal, setShowAttributionModal] = useState(false)

  const typeMetadata = CAMPAIGN_TYPE_METADATA[campaign.campaignType]
  const statusMetadata = CAMPAIGN_STATUS_METADATA[campaign.status]

  const loadGifts = async () => {
    try {
      setIsLoading(true)
      const data = await getCampaignGifts(campaign.id)
      setGifts(data)
    } catch (error) {
      console.error('Error loading gifts:', error)
      toast.error('Failed to load campaign gifts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGifts()
  }, [campaign.id])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const totalGifts = gifts.reduce((sum, gift) => sum + gift.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs font-medium',
                  typeMetadata.color === 'emerald' && 'bg-emerald-50 text-emerald-700',
                  typeMetadata.color === 'blue' && 'bg-blue-50 text-blue-700',
                  typeMetadata.color === 'purple' && 'bg-purple-50 text-purple-700',
                  typeMetadata.color === 'amber' && 'bg-amber-50 text-amber-700',
                  typeMetadata.color === 'rose' && 'bg-rose-50 text-rose-700'
                )}
              >
                {typeMetadata.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  statusMetadata.color === 'emerald' &&
                    'border-emerald-200 text-emerald-700 bg-emerald-50',
                  statusMetadata.color === 'amber' &&
                    'border-amber-200 text-amber-700 bg-amber-50',
                  statusMetadata.color === 'blue' && 'border-blue-200 text-blue-700 bg-blue-50',
                  statusMetadata.color === 'rose' && 'border-rose-200 text-rose-700 bg-rose-50',
                  statusMetadata.color === 'neutral' &&
                    'border-neutral-200 text-neutral-600 bg-neutral-50'
                )}
              >
                {statusMetadata.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-neutral-600 mt-1">{campaign.description}</p>
            )}
          </div>
        </div>
        <Button
          onClick={() => setShowAttributionModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Link Gifts
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Thermometer */}
        {campaign.goalAmount && campaign.goalAmount > 0 && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                Campaign Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressThermometer
                current={campaign.raisedAmount}
                goal={campaign.goalAmount}
                height={200}
              />
            </CardContent>
          </Card>
        )}

        {/* Campaign Stats */}
        <Card className={campaign.goalAmount ? 'md:col-span-2' : 'md:col-span-3'}>
          <CardHeader>
            <CardTitle className="text-base">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Raised</span>
                </div>
                <p className="text-2xl font-semibold text-neutral-900">
                  {formatCurrency(campaign.raisedAmount)}
                </p>
              </div>
              {campaign.goalAmount && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Goal</span>
                  </div>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatCurrency(campaign.goalAmount)}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                  <Users className="h-4 w-4" />
                  <span>Donors</span>
                </div>
                <p className="text-2xl font-semibold text-neutral-900">{campaign.donorCount}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Duration</span>
                </div>
                <p className="text-sm font-medium text-neutral-700">
                  {formatDate(campaign.startDate)}
                  {campaign.endDate && (
                    <>
                      <br />to {formatDate(campaign.endDate)}
                    </>
                  )}
                </p>
              </div>
            </div>

            {campaign.daysRemaining !== null && (
              <div className="pt-4 border-t">
                <p
                  className={cn(
                    'text-sm font-medium',
                    campaign.isOverdue ? 'text-amber-600' : 'text-neutral-700'
                  )}
                >
                  {campaign.isOverdue
                    ? `Campaign ended ${Math.abs(campaign.daysRemaining)} days ago`
                    : `${campaign.daysRemaining} days remaining`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Donor List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Campaign Gifts ({gifts.length})</span>
            {!isLoading && (
              <span className="text-sm font-normal text-neutral-600">
                Total: {formatCurrency(totalGifts)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No gifts linked to this campaign yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowAttributionModal(true)}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Link Gifts
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell>
                      <Link
                        href={`/contacts/${gift.donorId}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                      >
                        {gift.donorName}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(gift.amount)}
                    </TableCell>
                    <TableCell className="text-neutral-600">
                      {formatDate(gift.giftDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/donors/${gift.donorId}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gift Attribution Modal */}
      <GiftAttributionModal
        campaignId={campaign.id}
        campaignName={campaign.name}
        open={showAttributionModal}
        onOpenChange={setShowAttributionModal}
        onSuccess={loadGifts}
      />
    </div>
  )
}
