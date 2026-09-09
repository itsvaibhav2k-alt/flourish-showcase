'use client'

import * as React from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { NoteTypeBadge, NoteImportanceBadge } from './note-type-badge'
import { togglePinNote } from '../actions/toggle-pin-note'
import { deleteNote } from '../actions/delete-note'
import type { ContactNote } from '../schemas/task.schema'

interface NoteCardProps {
  note: ContactNote
  onEdit?: (note: ContactNote) => void
  linkedGift?: { amount: number; gift_date: string } | null
  linkedShift?: { title: string; shift_date: string } | null
}

export function NoteCard({ note, onEdit, linkedGift, linkedShift }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isPinning, setIsPinning] = React.useState(false)

  const handleTogglePin = async () => {
    setIsPinning(true)
    try {
      await togglePinNote({ noteId: note.id })
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    } finally {
      setIsPinning(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return

    setIsDeleting(true)
    try {
      await deleteNote({ noteId: note.id })
    } catch (error) {
      console.error('Failed to delete note:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get border color based on note type
  const getBorderColor = () => {
    const colors: Record<string, string> = {
      meeting: 'border-l-blue-500',
      phone_call: 'border-l-green-500',
      email: 'border-l-violet-500',
      personal_info: 'border-l-amber-500',
      follow_up: 'border-l-rose-500',
      donation: 'border-l-pink-500',
      volunteer: 'border-l-teal-500',
      general: 'border-l-neutral-400',
    }
    return colors[note.note_type] || colors.general
  }

  return (
    <Card
      className={cn(
        'border-l-4 transition-shadow hover:shadow-md',
        getBorderColor(),
        note.is_pinned && 'bg-amber-50/30 ring-1 ring-amber-200/50'
      )}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {note.is_pinned && (
              <Pin className="h-4 w-4 text-amber-600 fill-amber-600 flex-shrink-0" />
            )}
            <NoteTypeBadge type={note.note_type} />
            <NoteImportanceBadge importance={note.importance} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-600"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Note actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleTogglePin}
                disabled={isPinning}
              >
                <Pin className="mr-2 h-4 w-4" />
                {note.is_pinned ? 'Unpin' : 'Pin to top'}
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(note)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <p className="text-sm text-neutral-900 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Linked entities */}
        {(linkedGift || linkedShift || note.interaction_date) && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
            {note.interaction_date && (
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(note.interaction_date), 'MMM d, yyyy')}
              </span>
            )}
            {linkedGift && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <DollarSign className="h-3.5 w-3.5" />
                ${linkedGift.amount.toLocaleString()} gift
              </span>
            )}
            {linkedShift && (
              <span className="inline-flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                {linkedShift.title}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">
            {note.created_at && formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </span>
          {note.updated_at && note.updated_at !== note.created_at && (
            <span className="text-xs text-neutral-400 italic">
              edited
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
