'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Tag,
  Trash2,
  Download,
  X,
  ChevronDown,
  Plus,
  Minus,
  Loader2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { bulkAddTags, bulkRemoveTags, bulkDeleteContacts } from '../actions/bulk-actions'
import { exportContacts } from '../actions/export-contacts'
import { DEFAULT_EXPORT_FIELDS, type ExportField } from '../types/bulk-actions'

interface BulkActionToolbarProps {
  selectedCount: number
  selectedIds: string[]
  allTags: string[]
  onClearSelection: () => void
  onActionComplete: () => void
}

type DialogType = 'addTags' | 'removeTags' | 'export' | 'delete' | null

export function BulkActionToolbar({
  selectedCount,
  selectedIds,
  allTags,
  onClearSelection,
  onActionComplete,
}: BulkActionToolbarProps) {
  const router = useRouter()
  const [activeDialog, setActiveDialog] = React.useState<DialogType>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [newTag, setNewTag] = React.useState('')
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [exportFields, setExportFields] = React.useState<ExportField[]>(DEFAULT_EXPORT_FIELDS)

  const handleAddTags = async () => {
    const tagsToAdd = [...selectedTags]
    if (newTag.trim()) {
      tagsToAdd.push(newTag.trim())
    }

    if (tagsToAdd.length === 0) return

    setIsLoading(true)
    try {
      const result = await bulkAddTags(selectedIds, tagsToAdd)
      if (result.success) {
        setActiveDialog(null)
        setSelectedTags([])
        setNewTag('')
        onActionComplete()
        router.refresh()
      } else {
        alert(result.error || 'Failed to add tags')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveTags = async () => {
    if (selectedTags.length === 0) return

    setIsLoading(true)
    try {
      const result = await bulkRemoveTags(selectedIds, selectedTags)
      if (result.success) {
        setActiveDialog(null)
        setSelectedTags([])
        onActionComplete()
        router.refresh()
      } else {
        alert(result.error || 'Failed to remove tags')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await bulkDeleteContacts(selectedIds)
      if (result.success) {
        setActiveDialog(null)
        onClearSelection()
        onActionComplete()
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete contacts')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    const selectedFieldKeys = exportFields.filter(f => f.selected).map(f => f.key)

    if (selectedFieldKeys.length === 0) {
      alert('Please select at least one field to export')
      return
    }

    setIsLoading(true)
    try {
      const result = await exportContacts(selectedIds, selectedFieldKeys)
      if (result.success && result.csv && result.filename) {
        // Create and trigger download
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setActiveDialog(null)
      } else {
        alert(result.error || 'Failed to export contacts')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExportField = (key: string) => {
    setExportFields(fields =>
      fields.map(f => (f.key === key ? { ...f, selected: !f.selected } : f))
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  if (selectedCount === 0) return null

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-primary-200 bg-primary-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-3">
          <span className="flex h-8 items-center rounded-md bg-primary-100 px-3 text-sm font-medium text-primary-700">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-100"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Tag Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                Tags
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveDialog('addTags')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog('removeTags')}>
                <Minus className="h-4 w-4 mr-2" />
                Remove Tags
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setActiveDialog('export')}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => setActiveDialog('delete')}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Add Tags Dialog */}
      <Dialog open={activeDialog === 'addTags'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags to {selectedCount} Contacts</DialogTitle>
            <DialogDescription>
              Select existing tags or create new ones to add to the selected contacts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* New tag input */}
            <div className="flex gap-2">
              <Input
                placeholder="Create new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    if (!selectedTags.includes(newTag.trim())) {
                      setSelectedTags([...selectedTags, newTag.trim()])
                    }
                    setNewTag('')
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
                    setSelectedTags([...selectedTags, newTag.trim()])
                    setNewTag('')
                  }
                }}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Existing tags */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-700">Existing Tags</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected tags preview */}
            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-700">Tags to Add</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                    >
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:text-primary-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTags}
              disabled={isLoading || (selectedTags.length === 0 && !newTag.trim())}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Tags Dialog */}
      <Dialog open={activeDialog === 'removeTags'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tags from {selectedCount} Contacts</DialogTitle>
            <DialogDescription>
              Select the tags you want to remove from the selected contacts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">
                No tags found in your organization.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveTags}
              disabled={isLoading || selectedTags.length === 0}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={activeDialog === 'export'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {selectedCount} Contacts</DialogTitle>
            <DialogDescription>
              Select the fields you want to include in the CSV export.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 max-h-64 overflow-y-auto">
            {exportFields.map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={field.selected}
                  onCheckedChange={() => toggleExportField(field.key)}
                />
                <span className="text-sm text-neutral-700">{field.label}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading || !exportFields.some(f => f.selected)}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={activeDialog === 'delete'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Contacts?</DialogTitle>
            <DialogDescription>
              This action will archive the selected contacts. They can be recovered later if needed.
              Any associated gifts and activities will be preserved.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
