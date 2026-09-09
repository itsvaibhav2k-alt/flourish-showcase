'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  GitMerge,
  Loader2,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Gift,
  Calendar,
  FileText,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getMergePreview,
  mergeContacts,
  type MergePreview,
  type MergeFieldPreview,
} from '../actions/merge-contacts'
import type { Contact } from '../schemas/contact.schema'

interface ContactMergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceContact: Contact
  targetContact: Contact
}

export function ContactMergeDialog({
  open,
  onOpenChange,
  sourceContact,
  targetContact,
}: ContactMergeDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMerging, setIsMerging] = React.useState(false)
  const [preview, setPreview] = React.useState<MergePreview | null>(null)
  const [fieldSelections, setFieldSelections] = React.useState<Record<string, 'source' | 'target'>>({})
  const [error, setError] = React.useState<string | null>(null)

  // Load merge preview when dialog opens
  React.useEffect(() => {
    if (open && sourceContact && targetContact) {
      loadPreview()
    }
  }, [open, sourceContact?.id, targetContact?.id])

  const loadPreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getMergePreview(sourceContact.id, targetContact.id)
      if (result.success && result.preview) {
        setPreview(result.preview)
        // Initialize field selections from preview defaults
        const selections: Record<string, 'source' | 'target'> = {}
        for (const field of result.preview.fields) {
          selections[field.field] = field.selectedSource
        }
        setFieldSelections(selections)
      } else {
        setError(result.error || 'Failed to load merge preview')
      }
    } catch (err) {
      setError('Failed to load merge preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMerge = async () => {
    if (!preview) return

    setIsMerging(true)
    setError(null)

    try {
      // Build field overrides based on selections
      const overrides: Record<string, unknown> = {}
      for (const field of preview.fields) {
        const source = fieldSelections[field.field] || field.selectedSource
        const value = source === 'source' ? field.sourceValue : field.targetValue
        if (value !== undefined && value !== null) {
          overrides[field.field] = value
        }
      }

      const result = await mergeContacts(sourceContact.id, targetContact.id, overrides)

      if (result.success && result.mergedContactId) {
        onOpenChange(false)
        router.push(`/contacts/${result.mergedContactId}`)
        router.refresh()
      } else {
        setError(result.error || 'Failed to merge contacts')
      }
    } catch (err) {
      setError('Failed to merge contacts')
    } finally {
      setIsMerging(false)
    }
  }

  const formatAddress = (address: Contact['address']) => {
    if (!address) return null
    const parts = [address.street, address.city, address.state, address.zip].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  const formatFieldValue = (field: MergeFieldPreview) => {
    if (field.field === 'address') {
      const value = field.sourceValue || field.targetValue
      return formatAddress(value as Contact['address']) || '(empty)'
    }
    return (field.sourceValue || field.targetValue) as string || '(empty)'
  }

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        return User
      case 'email':
        return Mail
      case 'phone':
        return Phone
      case 'address':
        return MapPin
      default:
        return FileText
    }
  }

  const totalRecords = preview
    ? preview.relatedRecords.gifts +
      preview.relatedRecords.activities +
      preview.relatedRecords.shiftSignups +
      preview.relatedRecords.emailDrafts +
      preview.relatedRecords.notes +
      preview.relatedRecords.tasks
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary-600" />
            Merge Contacts
          </DialogTitle>
          <DialogDescription>
            Merge &quot;{sourceContact.first_name} {sourceContact.last_name}&quot; into &quot;{targetContact.first_name} {targetContact.last_name}&quot;.
            Choose which values to keep for each field.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Loading merge preview...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={loadPreview} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : preview ? (
          <div className="space-y-6 py-4">
            {/* Merge Direction Indicator */}
            <div className="flex items-center justify-center gap-4 p-4 bg-neutral-50 rounded-lg">
              <div className="text-center">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {sourceContact.first_name} {sourceContact.last_name}
                </p>
                <p className="text-xs text-neutral-500">Will be archived</p>
              </div>
              <ArrowRight className="h-5 w-5 text-neutral-400" />
              <div className="text-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {targetContact.first_name} {targetContact.last_name}
                </p>
                <p className="text-xs text-neutral-500">Primary contact</p>
              </div>
            </div>

            {/* Field Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-neutral-700">Choose values to keep:</h4>

              {preview.fields.map((field) => {
                const Icon = getFieldIcon(field.field)
                const hasConflict =
                  field.sourceValue &&
                  field.targetValue &&
                  JSON.stringify(field.sourceValue) !== JSON.stringify(field.targetValue)

                return (
                  <div
                    key={field.field}
                    className={`p-4 rounded-lg border ${
                      hasConflict ? 'border-amber-200 bg-amber-50/50' : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-neutral-500" />
                      <Label className="text-sm font-medium text-neutral-700">
                        {field.label}
                      </Label>
                      {hasConflict && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          Conflict
                        </span>
                      )}
                    </div>

                    <RadioGroup
                      value={fieldSelections[field.field] || field.selectedSource}
                      onValueChange={(value) =>
                        setFieldSelections((prev) => ({
                          ...prev,
                          [field.field]: value as 'source' | 'target',
                        }))
                      }
                      className="grid grid-cols-2 gap-3"
                    >
                      {/* Source option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          fieldSelections[field.field] === 'source'
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <RadioGroupItem value="source" className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-500 mb-1">Source</p>
                          <p className="text-sm text-neutral-900 truncate">
                            {field.field === 'address'
                              ? formatAddress(field.sourceValue as Contact['address']) || '(empty)'
                              : (field.sourceValue as string) || '(empty)'}
                          </p>
                        </div>
                      </label>

                      {/* Target option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          fieldSelections[field.field] === 'target'
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <RadioGroupItem value="target" className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-500 mb-1">Target (keep)</p>
                          <p className="text-sm text-neutral-900 truncate">
                            {field.field === 'address'
                              ? formatAddress(field.targetValue as Contact['address']) || '(empty)'
                              : (field.targetValue as string) || '(empty)'}
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>
                )
              })}
            </div>

            {/* Related Records Summary */}
            {totalRecords > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  Records to be transferred:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {preview.relatedRecords.gifts > 0 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <Gift className="h-4 w-4" />
                      <span>{preview.relatedRecords.gifts} gifts</span>
                    </div>
                  )}
                  {preview.relatedRecords.activities > 0 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <Calendar className="h-4 w-4" />
                      <span>{preview.relatedRecords.activities} activities</span>
                    </div>
                  )}
                  {preview.relatedRecords.shiftSignups > 0 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckSquare className="h-4 w-4" />
                      <span>{preview.relatedRecords.shiftSignups} shift signups</span>
                    </div>
                  )}
                  {preview.relatedRecords.emailDrafts > 0 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <Mail className="h-4 w-4" />
                      <span>{preview.relatedRecords.emailDrafts} emails</span>
                    </div>
                  )}
                  {preview.relatedRecords.notes > 0 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <FileText className="h-4 w-4" />
                      <span>{preview.relatedRecords.notes} notes</span>
                    </div>
                  )}
                  {preview.relatedRecords.tasks > 0 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckSquare className="h-4 w-4" />
                      <span>{preview.relatedRecords.tasks} tasks</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">This action cannot be undone.</p>
                <p className="mt-1">
                  The source contact will be archived and all their records will be moved to the
                  target contact. Tags will be combined from both contacts.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMerging}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isLoading || isMerging || !preview}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isMerging && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <GitMerge className="h-4 w-4 mr-2" />
            Merge Contacts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
