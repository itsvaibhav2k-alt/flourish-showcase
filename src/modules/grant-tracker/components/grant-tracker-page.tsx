'use client'

import { useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/layouts/page-header'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Sparkles,
  Loader2,
  FolderOpen,
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getGrantApplications, getGrantStats, type GrantWithMeta } from '../queries'
import { deleteGrant, submitGrant, approveGrant, declineGrant } from '../actions'
import { GrantCard } from './grant-card'
import { GrantFormModal } from './grant-form-modal'

interface GrantTrackerPageProps {
  organizationId: string
}

export function GrantTrackerPage({ organizationId }: GrantTrackerPageProps) {
  const [grants, setGrants] = useState<GrantWithMeta[]>([])
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
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGrant, setEditingGrant] = useState<GrantWithMeta | null>(null)
  const [deletingGrant, setDeletingGrant] = useState<GrantWithMeta | null>(null)
  const [approvingGrant, setApprovingGrant] = useState<GrantWithMeta | null>(null)
  const [approvalAmount, setApprovalAmount] = useState('')
  const [reportingDueDate, setReportingDueDate] = useState('')

  const loadData = async () => {
    try {
      const [grantsData, statsData] = await Promise.all([
        getGrantApplications(),
        getGrantStats(),
      ])
      setGrants(grantsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading grants:', error)
      toast.error('Failed to load grants')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (grant: GrantWithMeta) => {
    startTransition(async () => {
      const result = await submitGrant(grant.id)
      if (result.success) {
        toast.success('Grant submitted', {
          description: `${grant.funderName} has been marked as submitted`,
        })
        loadData()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  const handleApprove = async () => {
    if (!approvingGrant) return

    const amount = parseFloat(approvalAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    startTransition(async () => {
      const result = await approveGrant(
        approvingGrant.id,
        amount,
        reportingDueDate || undefined
      )
      if (result.success) {
        toast.success('Grant approved', {
          description: `${approvingGrant.funderName} has been marked as approved`,
        })
        setApprovingGrant(null)
        setApprovalAmount('')
        setReportingDueDate('')
        loadData()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  const handleDecline = async (grant: GrantWithMeta) => {
    startTransition(async () => {
      const result = await declineGrant(grant.id)
      if (result.success) {
        toast.success('Grant declined', {
          description: `${grant.funderName} has been marked as declined`,
        })
        loadData()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  const handleDelete = async () => {
    if (!deletingGrant) return

    startTransition(async () => {
      const result = await deleteGrant(deletingGrant.id)
      if (result.success) {
        toast.success('Grant deleted', {
          description: `${deletingGrant.funderName} has been removed`,
        })
        setDeletingGrant(null)
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

  // Filter grants
  const filteredGrants = grants.filter((grant) => {
    const matchesSearch =
      grant.funderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grant.grantName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || grant.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>Grant Tracker</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Add-on</span>
                    </div>
                  </div>
                </div>
              </div>
            }
            description="Track grant applications, deadlines, and reporting requirements"
            actions={
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Grant
              </Button>
            }
          />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            {
              label: 'Total Applications',
              value: stats.total,
              subLabel: `${stats.pending} pending`,
              icon: FileText,
              color: 'amber',
            },
            {
              label: 'Total Requested',
              value: formatCurrency(stats.totalRequested),
              subLabel: 'across all grants',
              icon: DollarSign,
              color: 'blue',
            },
            {
              label: 'Total Awarded',
              value: formatCurrency(stats.totalAwarded),
              subLabel: `${stats.approved} approved`,
              icon: TrendingUp,
              color: 'emerald',
            },
            {
              label: 'Upcoming Deadlines',
              value: stats.upcomingDeadlines,
              subLabel: 'in next 2 weeks',
              icon: Clock,
              color: 'purple',
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <Card className="relative overflow-hidden border-neutral-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">{item.label}</p>
                      <p className="text-2xl font-bold text-neutral-900">{item.value}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{item.subLabel}</p>
                    </div>
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        item.color === 'amber' && 'bg-amber-100 text-amber-600',
                        item.color === 'blue' && 'bg-blue-100 text-blue-600',
                        item.color === 'emerald' && 'bg-emerald-100 text-emerald-600',
                        item.color === 'purple' && 'bg-purple-100 text-purple-600'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        >
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search grants..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="reporting">Reporting</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Grant List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredGrants.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {grants.length === 0 ? 'No grants yet' : 'No matching grants'}
                </h3>
                <p className="text-sm text-neutral-600 text-center max-w-md mb-6">
                  {grants.length === 0
                    ? 'Start tracking grant opportunities by adding your first grant application.'
                    : 'Try adjusting your search or filter to find what you\'re looking for.'}
                </p>
                {grants.length === 0 && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Grant
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredGrants.map((grant, index) => (
                  <GrantCard
                    key={grant.id}
                    grant={grant}
                    index={index}
                    onEdit={setEditingGrant}
                    onDelete={setDeletingGrant}
                    onSubmit={handleSubmit}
                    onApprove={setApprovingGrant}
                    onDecline={handleDecline}
                    onViewDetails={setEditingGrant}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <GrantFormModal
        open={showCreateModal || !!editingGrant}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false)
            setEditingGrant(null)
          }
        }}
        grant={editingGrant}
        onSuccess={loadData}
      />

      {/* Approval Modal */}
      <Dialog open={!!approvingGrant} onOpenChange={() => setApprovingGrant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Grant</DialogTitle>
            <DialogDescription>
              Enter the awarded amount for &quot;{approvingGrant?.funderName}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approvalAmount">Amount Awarded *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="approvalAmount"
                  type="number"
                  min="0"
                  step="100"
                  value={approvalAmount}
                  onChange={(e) => setApprovalAmount(e.target.value)}
                  placeholder={approvingGrant?.amountRequested?.toString() || '50000'}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportingDue">First Report Due</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <Input
                  id="reportingDue"
                  type="date"
                  value={reportingDueDate}
                  onChange={(e) => setReportingDueDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingGrant(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isPending || !approvalAmount}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve Grant'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGrant} onOpenChange={() => setDeletingGrant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grant Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the grant from &quot;{deletingGrant?.funderName}&quot;?
              This action cannot be undone.
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
                'Delete Grant'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
