'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Users, Sparkles, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { searchContacts, type SearchContact } from '@/modules/contacts/queries/search-contacts'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface RecipientSelectorProps {
  selectedRecipients: SearchContact[]
  onRecipientsChange: (recipients: SearchContact[]) => void
  maxRecipients?: number
}

export function RecipientSelector({
  selectedRecipients,
  onRecipientsChange,
  maxRecipients = 50,
}: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchContact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showQuickFilters, setShowQuickFilters] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchContacts(searchQuery)
        // Filter out already selected
        const filtered = results.filter(
          r => !selectedRecipients.some(s => s.id === r.id)
        )
        setSearchResults(filtered)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedRecipients])

  const handleSelectContact = useCallback((contact: SearchContact) => {
    if (selectedRecipients.length >= maxRecipients) {
      return
    }
    onRecipientsChange([...selectedRecipients, contact])
    setSearchQuery('')
    setSearchResults([])
  }, [selectedRecipients, onRecipientsChange, maxRecipients])

  const handleRemoveRecipient = useCallback((contactId: string) => {
    onRecipientsChange(selectedRecipients.filter(r => r.id !== contactId))
  }, [selectedRecipients, onRecipientsChange])

  const quickFilters = [
    { label: 'Recent Donors', value: 'recent-donors', icon: Sparkles },
    { label: 'Lapsed Donors', value: 'lapsed-donors', icon: Users },
    { label: 'First-Time Donors', value: 'first-time', icon: Sparkles },
    { label: 'Active Volunteers', value: 'volunteers', icon: Users },
  ]

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          type="text"
          placeholder="Search contacts by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-20 bg-white border-neutral-200"
          aria-label="Search recipients"
        />
        {/* Quick Filters Button */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Popover open={showQuickFilters} onOpenChange={setShowQuickFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-700 mb-2">Quick Filters</p>
                {quickFilters.map((filter) => {
                  const Icon = filter.icon
                  return (
                    <Button
                      key={filter.value}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        // TODO: Implement filter logic
                        setShowQuickFilters(false)
                      }}
                    >
                      <Icon className="h-3 w-3 mr-2" />
                      {filter.label}
                    </Button>
                  )
                })}
                <p className="text-xs text-neutral-500 mt-2 pt-2 border-t">
                  Quick filters help you select common groups
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="shadow-md border-neutral-200/60">
              <CardContent className="p-2">
                {isSearching ? (
                  <div className="py-6 text-center text-sm text-neutral-500">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-sm text-neutral-500">
                    No contacts found
                  </div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {searchResults.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelectContact(contact)}
                        role="button"
                        tabIndex={0}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {contact.first_name} {contact.last_name}
                            </p>
                            {contact.email && (
                              <p className="text-xs text-neutral-500">{contact.email}</p>
                            )}
                          </div>
                          <span className="inline-flex items-center justify-center h-6 px-2 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-md">
                            Add
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Recipients */}
      {selectedRecipients.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700">
              Selected Recipients ({selectedRecipients.length}/{maxRecipients})
            </p>
            {selectedRecipients.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRecipientsChange([])}
                className="h-7 px-2 text-xs text-neutral-500 hover:text-neutral-700"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedRecipients.map((recipient) => (
              <motion.div
                key={recipient.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Badge
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 gap-1.5 bg-violet-50 text-violet-700 border-violet-200/60 hover:bg-violet-100"
                >
                  <span className="text-xs font-medium">
                    {recipient.first_name} {recipient.last_name}
                  </span>
                  <button
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    className="ml-1 rounded-full p-0.5 hover:bg-violet-200 transition-colors"
                    aria-label={`Remove ${recipient.first_name} ${recipient.last_name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </div>

          {selectedRecipients.length >= maxRecipients && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Maximum number of recipients reached. Remove some to add more.
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
