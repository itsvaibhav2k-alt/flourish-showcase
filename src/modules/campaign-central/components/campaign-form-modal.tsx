'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar, DollarSign, Loader2, Target } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createCampaign, updateCampaign } from '../actions'
import {
  CAMPAIGN_TYPE_METADATA,
  type CampaignType,
  type CreateCampaignInput,
} from '../schemas/campaign.schema'
import type { CampaignWithStats } from '../queries'

interface CampaignFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: CampaignWithStats | null
  onSuccess?: () => void
}

export function CampaignFormModal({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: CampaignFormModalProps) {
  const isEditing = !!campaign
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState<{
    name: string
    description: string
    campaignType: CampaignType
    goalAmount: string
    startDate: string
    endDate: string
  }>({
    name: campaign?.name || '',
    description: campaign?.description || '',
    campaignType: campaign?.campaignType || 'fundraising',
    goalAmount: campaign?.goalAmount?.toString() || '',
    startDate: campaign?.startDate || '',
    endDate: campaign?.endDate || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Campaign name is required')
      return
    }

    startTransition(async () => {
      const input: CreateCampaignInput = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        campaignType: formData.campaignType,
        goalAmount: formData.goalAmount ? parseFloat(formData.goalAmount) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      }

      const result = isEditing
        ? await updateCampaign({ id: campaign.id, ...input })
        : await createCampaign(input)

      if (result.success) {
        toast.success(isEditing ? 'Campaign updated' : 'Campaign created', {
          description: isEditing
            ? 'Your campaign has been updated successfully.'
            : 'Your new campaign is ready to go!',
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error('Error', {
          description: result.error || 'Something went wrong',
        })
      }
    })
  }

  const resetForm = () => {
    setFormData({
      name: campaign?.name || '',
      description: campaign?.description || '',
      campaignType: campaign?.campaignType || 'fundraising',
      goalAmount: campaign?.goalAmount?.toString() || '',
      startDate: campaign?.startDate || '',
      endDate: campaign?.endDate || '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <span>{isEditing ? 'Edit Campaign' : 'Create New Campaign'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your campaign details below.'
              : 'Set up a new fundraising campaign to track donations and progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Year-End Giving Campaign"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief description of your campaign goals..."
              className="resize-none h-20"
            />
          </div>

          {/* Campaign Type */}
          <div className="space-y-3">
            <Label>Campaign Type</Label>
            <RadioGroup
              value={formData.campaignType}
              onValueChange={(value: string) =>
                setFormData({ ...formData, campaignType: value as CampaignType })
              }
              className="grid grid-cols-2 gap-3"
            >
              {(Object.entries(CAMPAIGN_TYPE_METADATA) as [CampaignType, typeof CAMPAIGN_TYPE_METADATA[CampaignType]][]).map(([type, meta]) => (
                <Label
                  key={type}
                  htmlFor={type}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    formData.campaignType === type
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <RadioGroupItem value={type} id={type} className="mt-0.5" />
                  <div>
                    <span className="font-medium text-sm">{meta.label}</span>
                    <p className="text-xs text-neutral-500 mt-0.5">{meta.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Goal Amount */}
          <div className="space-y-2">
            <Label htmlFor="goalAmount">Fundraising Goal</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                id="goalAmount"
                type="number"
                min="0"
                step="100"
                value={formData.goalAmount}
                onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                placeholder="10000"
                className="pl-9"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="pl-9"
                  min={formData.startDate}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Campaign' : 'Create Campaign'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
