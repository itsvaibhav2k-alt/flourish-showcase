'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText,
  Plus,
  Search,
  Loader2,
  Building2,
  LayoutGrid,
  Columns,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  Clock,
  FolderOpen,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { getGrantApplications, getGrantStats, getFundersWithGrants } from '../queries'
import { deleteGrant, deleteFunder } from '../actions'
import type { GrantWithMeta } from '../queries'
import type { Funder } from '../schemas/funder.schema'

// Import components
import { GrantCard } from './grant-card'
import { GrantFormModal } from './grant-form-modal'
import { ApplicationPipeline } from './application-pipeline'
import { DeadlineCalendar } from './deadline-calendar'
import { FunderList } from './funder-list'
import { FunderFormModal } from './funder-form-modal'

interface GrantTrackerEnhancedPageProps {
  organizationId: string
}

export function GrantTrackerEnhancedPage({ organizationId }: GrantTrackerEnhancedPageProps) {
  const [grants, setGrants] = useState<GrantWithMeta[]>([])
  const [funders, setFunders] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    totalRequested: 0,
    totalAwarded: 0,
    upcomingDeadlines: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pipeline')

  const [showCreateGrantModal, setShowCreateGrantModal] = useState(false)
  const [showCreateFunderModal, setShowCreateFunderModal] = useState(false)
  const [editingGrant, setEditingGrant] = useState<GrantWithMeta | null>(null)
  const [editingFunder, setEditingFunder] = useState<Funder | null>(null)
  const [deletingGrant, setDeletingGrant] = useState<GrantWithMeta | null>(null)
  const [deletingFunder, setDeletingFunder] = useState<Funder | null>(null)

  const loadData = async () => {
    try {
      const [grantsData, statsData, fundersData] = await Promise.all([
        getGrantApplications(),
        getGrantStats(),
        getFundersWithGrants(),
      ])
      setGrants(grantsData)
      setStats(statsData)
      setFunders(fundersData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteGrant = async () => {
    if (!deletingGrant) return

    startTransition(async () => {
      const result = await deleteGrant(deletingGrant.id)
      if (result.success) {
        toast.success('Grant deleted')
        setDeletingGrant(null)
        loadData()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  const handleDeleteFunder = async () => {
    if (!deletingFunder) return

    startTransition(async () => {
      const result = await deleteFunder(deletingFunder.id)
      if (result.success) {
        toast.success('Funder deleted')
        setDeletingFunder(null)
        loadData()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount.toFixed(0)}`
  }

  // Filter grants based on search
  const filteredGrants = grants.filter((grant) => {
    const matchesSearch =
      grant.funderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grant.grantName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesSearch
  })

  // Filter funders based on search
  const filteredFunders = funders.filter((funder) => {
    return funder.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const statsCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      subLabel: `${stats.pending} pending`,
      icon: FileText,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Total Requested',
      value: formatCurrency(stats.totalRequested),
      subLabel: 'across all grants',
      icon: DollarSign,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Awarded',
      value: formatCurrency(stats.totalAwarded),
      subLabel: `${stats.approved} approved`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Upcoming Deadlines',
      value: stats.upcomingDeadlines,
      subLabel: 'in next 2 weeks',
      icon: Clock,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Grant Tracker</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Track grant applications, funders, deadlines, and funding pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/flora/grants">
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Grant Writer
              </Button>
            </Link>
            <Button
              onClick={() => setShowCreateFunderModal(true)}
              variant="outline"
            >
              <Building2 className="h-4 w-4 mr-2" />
              New Funder
            </Button>
            <Button
              onClick={() => setShowCreateGrantModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Grant
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="shadow-card border-neutral-200/60 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-neutral-900">{stat.value}</p>
                      <p className="text-xs text-neutral-400">{stat.subLabel}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search grants and funders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <div>
          <Tabs id="grant-tracker-tabs" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="pipeline" className="flex items-center gap-2">
                <Columns className="h-4 w-4" />
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Deadlines
              </TabsTrigger>
              <TabsTrigger value="grants" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                All Grants
              </TabsTrigger>
              <TabsTrigger value="funders" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Funders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : (
                <ApplicationPipeline grants={filteredGrants} onGrantClick={setEditingGrant} />
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : (
                <DeadlineCalendar grants={filteredGrants} onGrantClick={setEditingGrant} />
              )}
            </TabsContent>

            <TabsContent value="grants" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : filteredGrants.length === 0 ? (
                <Card className="shadow-card border-neutral-200/60 bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                      <FolderOpen className="h-8 w-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {grants.length === 0 ? 'No grants yet' : 'No matching grants'}
                    </h3>
                    <p className="text-xs text-neutral-400 text-center max-w-md mb-6">
                      {grants.length === 0
                        ? 'Start tracking grant opportunities by adding your first grant application.'
                        : 'Try adjusting your search to find what you are looking for.'}
                    </p>
                    {grants.length === 0 && (
                      <Button
                        onClick={() => setShowCreateGrantModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Grant
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGrants.map((grant, index) => (
                    <GrantCard
                      key={grant.id}
                      grant={grant}
                      index={index}
                      onEdit={setEditingGrant}
                      onDelete={setDeletingGrant}
                      onSubmit={() => {}}
                      onApprove={() => {}}
                      onDecline={() => {}}
                      onViewDetails={setEditingGrant}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="funders" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : filteredFunders.length === 0 ? (
                <Card className="shadow-card border-neutral-200/60 bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                      <Building2 className="h-8 w-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {funders.length === 0 ? 'No funders yet' : 'No matching funders'}
                    </h3>
                    <p className="text-xs text-neutral-400 text-center max-w-md mb-6">
                      {funders.length === 0
                        ? 'Build your funder database to track relationships and grant history.'
                        : 'Try adjusting your search to find what you are looking for.'}
                    </p>
                    {funders.length === 0 && (
                      <Button
                        onClick={() => setShowCreateFunderModal(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Funder
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <FunderList
                  funders={filteredFunders}
                  onEdit={setEditingFunder}
                  onDelete={setDeletingFunder}
                  onView={setEditingFunder}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Grant Form Modal */}
      <GrantFormModal
        open={showCreateGrantModal || !!editingGrant}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateGrantModal(false)
            setEditingGrant(null)
          }
        }}
        grant={editingGrant}
        onSuccess={loadData}
      />

      {/* Funder Form Modal */}
      <FunderFormModal
        open={showCreateFunderModal || !!editingFunder}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateFunderModal(false)
            setEditingFunder(null)
          }
        }}
        funder={editingFunder}
        onSuccess={loadData}
      />

      {/* Delete Grant Confirmation */}
      <AlertDialog open={!!deletingGrant} onOpenChange={() => setDeletingGrant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grant Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the grant from {deletingGrant?.funderName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGrant}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Grant'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Funder Confirmation */}
      <AlertDialog open={!!deletingFunder} onOpenChange={() => setDeletingFunder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Funder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingFunder?.name}?
              This will not delete associated grant applications, but will remove the funder relationship.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFunder}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Funder'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
