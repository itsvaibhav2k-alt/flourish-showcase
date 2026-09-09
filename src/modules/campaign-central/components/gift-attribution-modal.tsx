'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Loader2, LinkIcon, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getAvailableGiftsForCampaign } from '../queries'
import { bulkLinkGiftsToCampaign } from '../actions'

interface GiftAttributionModalProps {
  campaignId: string
  campaignName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function GiftAttributionModal({
  campaignId,
  campaignName,
  open,
  onOpenChange,
  onSuccess,
}: GiftAttributionModalProps) {
  const [gifts, setGifts] = useState<
    Array<{
      id: string
      amount: number
      giftDate: string
      donorName: string
      donorId: string
      alreadyLinked: boolean
    }>
  >([])
  const [selectedGiftIds, setSelectedGiftIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      loadGifts()
      setSelectedGiftIds(new Set())
    }
  }, [open, campaignId])

  const loadGifts = async () => {
    try {
      setIsLoading(true)
      const data = await getAvailableGiftsForCampaign(campaignId, { limit: 100 })
      setGifts(data)
    } catch (error) {
      console.error('Error loading gifts:', error)
      toast.error('Failed to load gifts')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleToggleGift = (giftId: string, alreadyLinked: boolean) => {
    if (alreadyLinked) return // Can't select already linked gifts

    const newSelected = new Set(selectedGiftIds)
    if (newSelected.has(giftId)) {
      newSelected.delete(giftId)
    } else {
      newSelected.add(giftId)
    }
    setSelectedGiftIds(newSelected)
  }

  const handleSelectAll = () => {
    const unlinkedGifts = filteredGifts.filter((g) => !g.alreadyLinked)
    if (selectedGiftIds.size === unlinkedGifts.length) {
      setSelectedGiftIds(new Set())
    } else {
      setSelectedGiftIds(new Set(unlinkedGifts.map((g) => g.id)))
    }
  }

  const handleLinkGifts = async () => {
    if (selectedGiftIds.size === 0) {
      toast.error('Please select at least one gift to link')
      return
    }

    startTransition(async () => {
      const result = await bulkLinkGiftsToCampaign(campaignId, Array.from(selectedGiftIds))
      if (result.success) {
        toast.success('Gifts linked successfully', {
          description: `${result.data?.linked || 0} gifts have been linked to ${campaignName}`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error('Error linking gifts', {
          description: result.error,
        })
      }
    })
  }

  // Filter gifts by search query
  const filteredGifts = gifts.filter((gift) => {
    const query = searchQuery.toLowerCase()
    return (
      gift.donorName.toLowerCase().includes(query) ||
      gift.amount.toString().includes(query) ||
      formatDate(gift.giftDate).toLowerCase().includes(query)
    )
  })

  const unlinkedCount = filteredGifts.filter((g) => !g.alreadyLinked).length
  const allSelected = unlinkedCount > 0 && selectedGiftIds.size === unlinkedCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-emerald-600" />
            Link Gifts to Campaign
          </DialogTitle>
          <DialogDescription>
            Select gifts to attribute to <span className="font-semibold">{campaignName}</span>.
            Already linked gifts are disabled.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by donor name, amount, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Gift List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredGifts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">
                {searchQuery
                  ? 'No gifts match your search'
                  : 'No gifts available in the campaign date range'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={unlinkedCount === 0}
                      aria-label="Select all gifts"
                    />
                  </TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGifts.map((gift) => (
                  <TableRow
                    key={gift.id}
                    className={cn(
                      gift.alreadyLinked && 'opacity-50 bg-neutral-50',
                      !gift.alreadyLinked && 'cursor-pointer hover:bg-neutral-50'
                    )}
                    onClick={() => handleToggleGift(gift.id, gift.alreadyLinked)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={gift.alreadyLinked || selectedGiftIds.has(gift.id)}
                        disabled={gift.alreadyLinked}
                        onCheckedChange={() => handleToggleGift(gift.id, gift.alreadyLinked)}
                        aria-label={`Select gift from ${gift.donorName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{gift.donorName}</TableCell>
                    <TableCell>{formatCurrency(gift.amount)}</TableCell>
                    <TableCell className="text-neutral-600">
                      {formatDate(gift.giftDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {gift.alreadyLinked && (
                        <div className="flex items-center justify-end gap-1 text-xs text-emerald-600">
                          <Check className="h-3 w-3" />
                          <span>Linked</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-neutral-600">
            {selectedGiftIds.size > 0 ? (
              <span>
                <span className="font-semibold text-neutral-900">{selectedGiftIds.size}</span>{' '}
                {selectedGiftIds.size === 1 ? 'gift' : 'gifts'} selected
              </span>
            ) : (
              <span>No gifts selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkGifts}
              disabled={isPending || selectedGiftIds.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link {selectedGiftIds.size > 0 ? selectedGiftIds.size : ''} Gift
                  {selectedGiftIds.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
