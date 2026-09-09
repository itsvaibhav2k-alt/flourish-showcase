'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Search, User, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createTask } from '@/modules/tasks/actions/create-task'
import { searchContacts, type SearchContact } from '@/modules/contacts/queries/search-contacts'

interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: Date
}

export function NewTaskDialog({
  open,
  onOpenChange,
  defaultDate,
}: NewTaskDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [dueDate, setDueDate] = React.useState<Date | undefined>(defaultDate)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Contact search state
  const [contactSearch, setContactSearch] = React.useState('')
  const [contacts, setContacts] = React.useState<SearchContact[]>([])
  const [selectedContact, setSelectedContact] = React.useState<SearchContact | null>(null)
  const [isSearching, setIsSearching] = React.useState(false)
  const [showContactResults, setShowContactResults] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const contactSearchRef = React.useRef<HTMLDivElement>(null)

  const router = useRouter()

  // Update dueDate when defaultDate changes
  React.useEffect(() => {
    if (defaultDate) {
      setDueDate(defaultDate)
    }
  }, [defaultDate])

  // Debounced contact search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (contactSearch.trim().length === 0) {
      setContacts([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchContacts(contactSearch)
        setContacts(results)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [contactSearch])

  // Close contact results when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactSearchRef.current && !contactSearchRef.current.contains(event.target as Node)) {
        setShowContactResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate(defaultDate)
    setContactSearch('')
    setContacts([])
    setSelectedContact(null)
    setError(null)
    setShowContactResults(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSelectContact = (contact: SearchContact) => {
    setSelectedContact(contact)
    setContactSearch(`${contact.first_name} ${contact.last_name}`)
    setShowContactResults(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedContact) {
      setError('Please select a contact')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createTask({
        contactId: selectedContact.id,
        title,
        description: description || undefined,
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      })

      if (result.success) {
        router.refresh()
        handleClose()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-teal-600" />
            New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Contact Search */}
          <div ref={contactSearchRef} className="relative">
            <Label htmlFor="contact-search">Contact</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                id="contact-search"
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value)
                  setSelectedContact(null)
                  setShowContactResults(true)
                }}
                onFocus={() => setShowContactResults(true)}
                placeholder="Search for a contact..."
                className="pl-9"
              />
            </div>

            {/* Contact Search Results */}
            {showContactResults && (contactSearch.length > 0 || contacts.length > 0) && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {isSearching && (
                  <div className="px-3 py-2 text-sm text-neutral-500">Searching...</div>
                )}
                {!isSearching && contacts.length === 0 && contactSearch.length > 0 && (
                  <div className="px-3 py-2 text-sm text-neutral-500">No contacts found</div>
                )}
                {!isSearching && contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className="w-full px-3 py-2 text-left hover:bg-neutral-100 flex items-center gap-2 transition-colors"
                  >
                    <User className="h-4 w-4 text-neutral-400" />
                    <div>
                      <div className="text-sm font-medium">
                        {contact.first_name} {contact.last_name}
                      </div>
                      {contact.email && (
                        <div className="text-xs text-neutral-500">{contact.email}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Task Title */}
          <div>
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="mt-1.5"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="task-description">Description (Optional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          {/* Due Date */}
          <div>
            <Label>Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal mt-1.5',
                    !dueDate && 'text-neutral-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !selectedContact}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
