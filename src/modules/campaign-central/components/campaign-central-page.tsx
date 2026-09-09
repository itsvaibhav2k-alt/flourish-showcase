'use client'

import { useState, useEffect, useTransition } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getCampaigns, getCampaignStats, type CampaignWithStats } from '../queries'
import { deleteCampaign, updateCampaignStatus } from '../actions'
import { CampaignCard } from './campaign-card'
import { CampaignFormModal } from './campaign-form-modal'
import { CampaignStats } from './campaign-stats'
import { CampaignDetailView } from './campaign-detail-view'
import type { CampaignStatus } from '../schemas/campaign.schema'

interface CampaignCentralPageProps {
  organizationId: string
}

export function CampaignCentralPage({ organizationId }: CampaignCentralPageProps) {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalGoal: 0,
    totalRaised: 0,
    totalDonors: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithStats | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignWithStats | null>(null)
  const [viewingCampaign, setViewingCampaign] = useState<CampaignWithStats | null>(null)

  const loadData = async () => {
    try {
      const [campaignsData, statsData] = await Promise.all([getCampaigns(), getCampaignStats()])
      setCampaigns(campaignsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (campaign: CampaignWithStats, newStatus: CampaignStatus) => {
    startTransition(async () => {
      const result = await updateCampaignStatus(campaign.id, newStatus)
      if (result.success) {
        toast.success('Status updated', {
          description: `${campaign.name} is now ${newStatus}`,
        })
        loadData()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  const handleDelete = async () => {
    if (!deletingCampaign) return

    startTransition(async () => {
      const result = await deleteCampaign(deletingCampaign.id)
      if (result.success) {
        toast.success('Campaign deleted', {
          description: `${deletingCampaign.name} has been removed`,
        })
        setDeletingCampaign(null)
        loadData()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  const handleViewDetails = (campaign: CampaignWithStats) => {
    setViewingCampaign(campaign)
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // If viewing a campaign detail, show detail view
  if (viewingCampaign) {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <CampaignDetailView
            campaign={viewingCampaign}
            onBack={() => {
              setViewingCampaign(null)
              loadData()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Campaign Central</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Manage fundraising campaigns, track goals, and link donations
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div>
          <CampaignStats stats={stats} />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2 text-neutral-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-9 w-9"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-9 w-9"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Campaign Grid/List */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <Card className="shadow-card border-neutral-200/60 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <FolderOpen className="h-7 w-7 text-emerald-300" />
                </div>
                <p className="text-sm font-medium text-neutral-600">
                  {campaigns.length === 0 ? 'No campaigns yet' : 'No matching campaigns'}
                </p>
                <p className="text-xs text-neutral-400 mt-1 mb-4 text-center max-w-md">
                  {campaigns.length === 0
                    ? 'Create your first campaign to start tracking fundraising goals and linking donations.'
                    : 'Try adjusting your search or filter to find what you\'re looking for.'}
                </p>
                {campaigns.length === 0 && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              )}
            >
              <AnimatePresence mode="popLayout">
                {filteredCampaigns.map((campaign, index) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    index={index}
                    onEdit={setEditingCampaign}
                    onDelete={setDeletingCampaign}
                    onStatusChange={handleStatusChange}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CampaignFormModal
        open={showCreateModal || !!editingCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false)
            setEditingCampaign(null)
          }
        }}
        campaign={editingCampaign}
        onSuccess={loadData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCampaign} onOpenChange={() => setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingCampaign?.name}&quot;? This action
              cannot be undone. All linked donations will be unlinked but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Campaign'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
