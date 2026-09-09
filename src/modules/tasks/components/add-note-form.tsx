'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createNote } from '../actions/create-note'
import { updateNote } from '../actions/update-note'
import type { ContactNote, NoteType, NoteImportance } from '../schemas/task.schema'

interface AddNoteFormProps {
  contactId: string
  onSuccess?: () => void
  editingNote?: ContactNote | null
}

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'personal_info', label: 'Personal Info' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'donation', label: 'Donation' },
  { value: 'volunteer', label: 'Volunteer' },
]

const IMPORTANCE_LEVELS: { value: NoteImportance; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function AddNoteForm({ contactId, onSuccess, editingNote }: AddNoteFormProps) {
  const [content, setContent] = React.useState(editingNote?.content || '')
  const [noteType, setNoteType] = React.useState<NoteType>(editingNote?.note_type || 'general')
  const [importance, setImportance] = React.useState<NoteImportance>(editingNote?.importance || 'normal')
  const [isPinned, setIsPinned] = React.useState(editingNote?.is_pinned || false)
  const [tags, setTags] = React.useState<string[]>(editingNote?.tags || [])
  const [tagInput, setTagInput] = React.useState('')
  const [interactionDate, setInteractionDate] = React.useState(editingNote?.interaction_date || '')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const isEditing = !!editingNote

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (isEditing) {
        const result = await updateNote({
          noteId: editingNote.id,
          content,
          noteType,
          importance,
          isPinned,
          tags,
          interactionDate: interactionDate || null,
        })

        if (result.success) {
          router.refresh()
          onSuccess?.()
        } else {
          setError(result.error)
        }
      } else {
        const result = await createNote({
          contactId,
          content,
          noteType,
          importance,
          isPinned,
          tags,
          interactionDate: interactionDate || null,
        })

        if (result.success) {
          setContent('')
          setNoteType('general')
          setImportance('normal')
          setIsPinned(false)
          setTags([])
          setInteractionDate('')
          router.refresh()
          onSuccess?.()
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type and Importance Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="note-type">Note Type</Label>
          <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="importance">Importance</Label>
          <Select value={importance} onValueChange={(value) => setImportance(value as NoteImportance)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select importance" />
            </SelectTrigger>
            <SelectContent>
              {IMPORTANCE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Interaction Date */}
      <div>
        <Label htmlFor="interaction-date">Interaction Date (optional)</Label>
        <Input
          id="interaction-date"
          type="date"
          value={interactionDate}
          onChange={(e) => setInteractionDate(e.target.value)}
          className="mt-1.5"
        />
      </div>

      {/* Content */}
      <div>
        <Label htmlFor="note-content">Note</Label>
        <Textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note about this contact..."
          className="mt-1.5 min-h-[120px]"
          required
        />
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="mt-1.5 space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag..."
              className="flex-1"
              maxLength={50}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-neutral-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-neutral-500">
            {tags.length}/10 tags
          </p>
        </div>
      </div>

      {/* Pin checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="pin-note"
          checked={isPinned}
          onCheckedChange={(checked) => setIsPinned(checked === true)}
        />
        <Label htmlFor="pin-note" className="text-sm font-normal">
          Pin this note to the top
        </Label>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Note')}
        </Button>
      </div>
    </form>
  )
}
