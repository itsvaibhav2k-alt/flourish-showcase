'use client'

import * as React from 'react'
import { Plus, StickyNote, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddNoteForm } from './add-note-form'
import { NoteCard } from './note-card'
import { NotesFilterBar } from './notes-filter-bar'
import type { ContactNote, NoteType } from '../schemas/task.schema'

interface NotesListProps {
  notes: ContactNote[]
  contactId: string
}

export function NotesList({ notes, contactId }: NotesListProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingNote, setEditingNote] = React.useState<ContactNote | null>(null)
  const [selectedType, setSelectedType] = React.useState<NoteType | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter((note) => note.is_pinned)
  const unpinnedNotes = notes.filter((note) => !note.is_pinned)

  // Apply filters
  const filterNotes = (notesList: ContactNote[]) => {
    return notesList.filter((note) => {
      // Type filter
      if (selectedType !== 'all' && note.note_type !== selectedType) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesContent = note.content.toLowerCase().includes(query)
        const matchesTags = note.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        )
        if (!matchesContent && !matchesTags) {
          return false
        }
      }

      return true
    })
  }

  const filteredPinnedNotes = filterNotes(pinnedNotes)
  const filteredUnpinnedNotes = filterNotes(unpinnedNotes)
  const totalFilteredCount = filteredPinnedNotes.length + filteredUnpinnedNotes.length

  const handleEditNote = (note: ContactNote) => {
    setEditingNote(note)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingNote(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Notes</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleDialogClose()
          else setIsDialogOpen(true)
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
              <DialogDescription>
                {editingNote
                  ? 'Update this note about the contact.'
                  : 'Add a new note about this contact.'}
              </DialogDescription>
            </DialogHeader>
            <AddNoteForm
              contactId={contactId}
              onSuccess={handleDialogClose}
              editingNote={editingNote}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      {notes.length > 0 && (
        <NotesFilterBar
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Empty State */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <StickyNote className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">No notes yet</p>
            <p className="text-xs text-neutral-400 mt-1">
              Add notes to track interactions and important details
            </p>
          </CardContent>
        </Card>
      ) : totalFilteredCount === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-neutral-500">No notes match your filters</p>
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedType('all')
                setSearchQuery('')
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Pinned Notes Section */}
          {filteredPinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                <Pin className="h-3.5 w-3.5 fill-amber-600" />
                <span>Pinned ({filteredPinnedNotes.length})</span>
              </div>
              <div className="space-y-3">
                {filteredPinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Divider between pinned and unpinned */}
          {filteredPinnedNotes.length > 0 && filteredUnpinnedNotes.length > 0 && (
            <div className="border-t border-neutral-200 my-4" />
          )}

          {/* Regular Notes */}
          {filteredUnpinnedNotes.length > 0 && (
            <div className="space-y-3">
              {filteredPinnedNotes.length > 0 && (
                <div className="text-xs font-medium text-neutral-500">
                  Other Notes ({filteredUnpinnedNotes.length})
                </div>
              )}
              {filteredUnpinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
