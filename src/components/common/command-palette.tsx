'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search,
  User,
  DollarSign,
  Calendar,
  History,
  HandHeart,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useCommandPalette } from '@/providers/command-palette-provider'
import { globalSearch, type SearchResult } from '@/lib/search/global-search'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  url: string
  keywords: string[]
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-contact',
    label: 'Create Contact',
    icon: <User className="h-4 w-4" />,
    url: '/contacts/new',
    keywords: ['create', 'new', 'contact', 'person', 'add'],
  },
  {
    id: 'log-gift',
    label: 'Log Gift',
    icon: <DollarSign className="h-4 w-4" />,
    url: '/donors?action=log-gift',
    keywords: ['log', 'gift', 'donation', 'donate', 'add', 'new'],
  },
  {
    id: 'create-shift',
    label: 'Create Shift',
    icon: <Calendar className="h-4 w-4" />,
    url: '/volunteers/shifts/new',
    keywords: ['create', 'new', 'shift', 'volunteer', 'event', 'add'],
  },
]

const RECENT_ITEMS_KEY = 'flourish-command-palette-recent'
const MAX_RECENT_ITEMS = 5

export function CommandPalette() {
  const router = useRouter()
  const { isOpen, close } = useCommandPalette()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{
    contacts: SearchResult[]
    donors: SearchResult[]
    volunteers: SearchResult[]
    shifts: SearchResult[]
  }>({
    contacts: [],
    donors: [],
    volunteers: [],
    shifts: [],
  })
  const [recentItems, setRecentItems] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Load recent items from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(RECENT_ITEMS_KEY)
        if (stored) {
          setRecentItems(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Failed to load recent items:', error)
      }
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (search.trim().length === 0) {
      setSearchResults({ contacts: [], donors: [], volunteers: [], shifts: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await globalSearch(search)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search])

  const addToRecent = useCallback((item: SearchResult) => {
    setRecentItems((prev) => {
      // Remove if already exists
      const filtered = prev.filter((i) => i.id !== item.id || i.type !== item.type)
      // Add to front
      const updated = [item, ...filtered].slice(0, MAX_RECENT_ITEMS)
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save recent items:', error)
      }
      return updated
    })
  }, [])

  const handleSelect = useCallback(
    (url: string, item?: SearchResult) => {
      if (item) {
        addToRecent(item)
      }
      close()
      router.push(url)
      setSearch('')
    },
    [router, close, addToRecent]
  )

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
      setSearch('')
    }
  }

  // Filter quick actions based on search
  const filteredActions = search
    ? QUICK_ACTIONS.filter((action) =>
        action.keywords.some((keyword) =>
          keyword.toLowerCase().includes(search.toLowerCase())
        ) || action.label.toLowerCase().includes(search.toLowerCase())
      )
    : QUICK_ACTIONS

  const hasSearchResults =
    searchResults.contacts.length > 0 ||
    searchResults.donors.length > 0 ||
    searchResults.volunteers.length > 0 ||
    searchResults.shifts.length > 0

  const showRecent = !search && recentItems.length > 0
  const showNoResults = search && !isLoading && !hasSearchResults && filteredActions.length === 0

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 max-w-2xl overflow-hidden">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          shouldFilter={false}
        >
          <div className="flex items-center border-b border-neutral-200 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search contacts, donors, volunteers, shifts..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
            {isLoading && (
              <div className="py-6 text-center text-sm text-neutral-500">
                Searching...
              </div>
            )}

            {showNoResults && (
              <div className="py-6 text-center text-sm text-neutral-500">
                No results found
              </div>
            )}

            {!isLoading && (
              <>
                {/* Quick Actions */}
                {filteredActions.length > 0 && (
                  <Command.Group heading="Quick Actions">
                    {filteredActions.map((action) => (
                      <Command.Item
                        key={action.id}
                        value={action.id}
                        onSelect={() => handleSelect(action.url)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
                          {action.icon}
                        </div>
                        <span>{action.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Recent Items */}
                {showRecent && (
                  <Command.Group heading="Recent">
                    {recentItems.map((item) => (
                      <Command.Item
                        key={`${item.type}-${item.id}`}
                        value={`recent-${item.type}-${item.id}`}
                        onSelect={() => handleSelect(item.url, item)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <History className="mr-2 h-4 w-4 text-neutral-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs text-neutral-500">{item.subtitle}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Search Results - Contacts */}
                {searchResults.contacts.length > 0 && (
                  <Command.Group heading="Contacts">
                    {searchResults.contacts.map((contact) => (
                      <Command.Item
                        key={`contact-${contact.id}`}
                        value={`contact-${contact.id}-${contact.title}`}
                        onSelect={() => handleSelect(contact.url, contact)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <User className="mr-2 h-4 w-4 text-neutral-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">{contact.title}</span>
                          <span className="text-xs text-neutral-500">{contact.subtitle}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Search Results - Donors */}
                {searchResults.donors.length > 0 && (
                  <Command.Group heading="Donors">
                    {searchResults.donors.map((donor) => (
                      <Command.Item
                        key={`donor-${donor.id}`}
                        value={`donor-${donor.id}-${donor.title}`}
                        onSelect={() => handleSelect(donor.url, donor)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <DollarSign className="mr-2 h-4 w-4 text-neutral-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">{donor.title}</span>
                          <span className="text-xs text-neutral-500">{donor.subtitle}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Search Results - Volunteers */}
                {searchResults.volunteers.length > 0 && (
                  <Command.Group heading="Volunteers">
                    {searchResults.volunteers.map((volunteer) => (
                      <Command.Item
                        key={`volunteer-${volunteer.id}`}
                        value={`volunteer-${volunteer.id}-${volunteer.title}`}
                        onSelect={() => handleSelect(volunteer.url, volunteer)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <HandHeart className="mr-2 h-4 w-4 text-neutral-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">{volunteer.title}</span>
                          <span className="text-xs text-neutral-500">{volunteer.subtitle}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Search Results - Shifts */}
                {searchResults.shifts.length > 0 && (
                  <Command.Group heading="Shifts">
                    {searchResults.shifts.map((shift) => (
                      <Command.Item
                        key={`shift-${shift.id}`}
                        value={`shift-${shift.id}-${shift.title}`}
                        onSelect={() => handleSelect(shift.url, shift)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-neutral-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">{shift.title}</span>
                          <span className="text-xs text-neutral-500">{shift.subtitle}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>

          <div className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
              <span className="text-xs">↑↓</span>
            </kbd>{' '}
            to navigate
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
              <span className="text-xs">↵</span>
            </kbd>{' '}
            to select
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
              <span className="text-xs">esc</span>
            </kbd>{' '}
            to close
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
