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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createFunder, updateFunder } from '../actions/manage-funders'
import type { CreateFunderInput, FunderType, RelationshipStatus } from '../schemas/funder.schema'
import type { Funder } from '../schemas/funder.schema'

interface FunderFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funder?: Funder | null
  onSuccess?: () => void
}

export function FunderFormModal({
  open,
  onOpenChange,
  funder,
  onSuccess,
}: FunderFormModalProps) {
  const isEditing = !!funder
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState<{
    name: string
    type: FunderType | ''
    website: string
    contactName: string
    contactEmail: string
    contactPhone: string
    notes: string
    averageGrantSize: string
    relationshipStatus: RelationshipStatus
  }>({
    name: funder?.name || '',
    type: funder?.type || '',
    website: funder?.website || '',
    contactName: funder?.contactName || '',
    contactEmail: funder?.contactEmail || '',
    contactPhone: funder?.contactPhone || '',
    notes: funder?.notes || '',
    averageGrantSize: funder?.averageGrantSize?.toString() || '',
    relationshipStatus: funder?.relationshipStatus || 'prospect',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Funder name is required')
      return
    }

    startTransition(async () => {
      const input: CreateFunderInput = {
        name: formData.name.trim(),
        type: formData.type ? (formData.type as FunderType) : undefined,
        website: formData.website.trim() || undefined,
        contactName: formData.contactName.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        averageGrantSize: formData.averageGrantSize
          ? parseFloat(formData.averageGrantSize)
          : undefined,
        relationshipStatus: formData.relationshipStatus,
      }

      const result = isEditing
        ? await updateFunder({ id: funder.id, ...input })
        : await createFunder(input)

      if (result.success) {
        toast.success(isEditing ? 'Funder updated' : 'Funder created', {
          description: isEditing
            ? 'Your funder has been updated.'
            : 'Your new funder has been added!',
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <span>{isEditing ? 'Edit Funder' : 'New Funder'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the funder details.'
              : 'Add a new grant funder to your database.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Funder Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Funder Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Gates Foundation"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Type & Relationship Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as FunderType | '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationshipStatus">Relationship</Label>
              <Select
                value={formData.relationshipStatus}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    relationshipStatus: value as RelationshipStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="past">Past Funder</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Website & Average Grant Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageGrantSize">Avg Grant Size</Label>
              <Input
                id="averageGrantSize"
                type="number"
                min="0"
                step="1000"
                value={formData.averageGrantSize}
                onChange={(e) =>
                  setFormData({ ...formData, averageGrantSize: e.target.value })
                }
                placeholder="50000"
              />
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Contact Information</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="Jane Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    placeholder="jane@example.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
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
              placeholder="Focus areas, application tips, relationship history..."
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
              disabled={isPending || !formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Funder' : 'Create Funder'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
