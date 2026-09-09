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
import { Calendar, DollarSign, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { createGrant, updateGrant } from '../actions'
import type { CreateGrantInput } from '../schemas/grant.schema'
import type { GrantWithMeta } from '../queries'

interface GrantFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grant?: GrantWithMeta | null
  onSuccess?: () => void
}

export function GrantFormModal({
  open,
  onOpenChange,
  grant,
  onSuccess,
}: GrantFormModalProps) {
  const isEditing = !!grant
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState<{
    funderName: string
    grantName: string
    amountRequested: string
    deadline: string
    notes: string
  }>({
    funderName: grant?.funderName || '',
    grantName: grant?.grantName || '',
    amountRequested: grant?.amountRequested?.toString() || '',
    deadline: grant?.deadline || '',
    notes: grant?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.funderName.trim()) {
      toast.error('Funder name is required')
      return
    }

    startTransition(async () => {
      const input: CreateGrantInput = {
        funderName: formData.funderName.trim(),
        grantName: formData.grantName.trim() || undefined,
        amountRequested: formData.amountRequested ? parseFloat(formData.amountRequested) : undefined,
        deadline: formData.deadline || undefined,
        notes: formData.notes.trim() || undefined,
      }

      const result = isEditing
        ? await updateGrant({ id: grant.id, ...input })
        : await createGrant(input)

      if (result.success) {
        toast.success(isEditing ? 'Grant updated' : 'Grant created', {
          description: isEditing
            ? 'Your grant application has been updated.'
            : 'Your new grant application is ready!',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <span>{isEditing ? 'Edit Grant Application' : 'New Grant Application'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your grant application details.'
              : 'Track a new grant opportunity and its progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Funder Name */}
          <div className="space-y-2">
            <Label htmlFor="funderName">Funder / Foundation *</Label>
            <Input
              id="funderName"
              value={formData.funderName}
              onChange={(e) => setFormData({ ...formData, funderName: e.target.value })}
              placeholder="Gates Foundation"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Grant Name */}
          <div className="space-y-2">
            <Label htmlFor="grantName">Grant Name / Program</Label>
            <Input
              id="grantName"
              value={formData.grantName}
              onChange={(e) => setFormData({ ...formData, grantName: e.target.value })}
              placeholder="Community Development Grant 2025"
            />
          </div>

          {/* Amount & Deadline Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountRequested">Amount Requested</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="amountRequested"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.amountRequested}
                  onChange={(e) => setFormData({ ...formData, amountRequested: e.target.value })}
                  placeholder="50000"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Grant requirements, contact info, or other notes..."
              className="resize-none h-24"
            />
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
              disabled={isPending || !formData.funderName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Grant' : 'Create Grant'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
