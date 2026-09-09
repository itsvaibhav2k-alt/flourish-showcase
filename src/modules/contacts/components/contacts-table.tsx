'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Eye, Trash2, Gift, Mail, Users, Search, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Contact } from '../schemas/contact.schema'
import { getContactFullName } from '../utils/contact-helpers'
import { deleteContact } from '../actions/delete-contact'
import { ContactRoleBadges } from './contact-role-badges'
import { BulkActionToolbar } from './bulk-action-toolbar'
import { EmptyState } from '@/components/common/empty-state'

interface ContactsTableProps {
  contacts: Contact[]
  allTags?: string[]
}

export function ContactsTable({ contacts, allTags = [] }: ContactsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Clear selection when search changes
  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [debouncedSearch])

  // Filter contacts based on search
  const filteredContacts = React.useMemo(() => {
    if (!debouncedSearch.trim()) {
      return contacts
    }

    const query = debouncedSearch.toLowerCase()
    return contacts.filter((contact) => {
      const fullName = getContactFullName(contact).toLowerCase()
      const email = contact.email?.toLowerCase() || ''

      return (
        fullName.includes(query) ||
        contact.first_name?.toLowerCase().includes(query) ||
        contact.last_name?.toLowerCase().includes(query) ||
        email.includes(query)
      )
    })
  }, [contacts, debouncedSearch])

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return
    }

    setDeletingId(contactId)
    try {
      const result = await deleteContact(contactId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete contact')
      }
    } catch {
      alert('An error occurred while deleting the contact')
    } finally {
      setDeletingId(null)
    }
  }

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const isAllSelected = filteredContacts.length > 0 && selectedIds.size === filteredContacts.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredContacts.length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-md border border-neutral-200 bg-white">
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to get started"
          action={{
            label: "Add Contact",
            href: "/contacts/new"
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        allTags={allTags}
        onClearSelection={clearSelection}
        onActionComplete={() => {
          clearSelection()
          router.refresh()
        }}
      />

      <div className="rounded-md border border-neutral-200">
        {/* Search Bar */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search contacts by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-white"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          {debouncedSearch && (
            <p className="text-xs text-neutral-500 mt-2">
              Found {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

      {/* Table */}
      {filteredContacts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = isIndeterminate
                    }
                  }}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all contacts"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map(contact => (
            <TableRow
              key={contact.id}
              className={`group ${selectedIds.has(contact.id) ? 'bg-primary-50/50' : ''}`}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(contact.id)}
                  onCheckedChange={() => toggleSelectOne(contact.id)}
                  aria-label={`Select ${getContactFullName(contact)}`}
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/contacts/${contact.id}`}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {getContactFullName(contact)}
                </Link>
              </TableCell>
              <TableCell>
                <ContactRoleBadges
                  isDonor={contact.is_donor || false}
                  isVolunteer={contact.is_volunteer || false}
                  totalGiven={contact.lifetime_giving || 0}
                />
              </TableCell>
              <TableCell className="text-neutral-600">
                {contact.email || '-'}
              </TableCell>
              <TableCell>
                {contact.tags && contact.tags.length > 0 ? (
                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                    {contact.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {contact.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{contact.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-neutral-600">
                {formatDate(contact.updated_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 justify-end">
                  {/* Hover Actions - Enhanced */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 mr-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary-50 hover:text-primary-600"
                      asChild
                      title="View profile"
                    >
                      <Link href={`/contacts/${contact.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View profile</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600"
                      asChild
                      title="Log gift"
                    >
                      <Link href={`/donors?contact=${contact.id}&action=log-gift`}>
                        <Gift className="h-4 w-4" />
                        <span className="sr-only">Log gift</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                      asChild
                      title="Send email"
                    >
                      <Link href={`/communications?contact=${contact.id}`}>
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Send email</span>
                      </Link>
                    </Button>
                  </div>
                  {/* Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={deletingId === contact.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/contacts/${contact.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/contacts/${contact.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/donors?contact=${contact.id}&action=log-gift`}>
                          <Gift className="mr-2 h-4 w-4" />
                          Log Gift
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/communications?contact=${contact.id}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      ) : (
        <div className="py-16 text-center">
          <div className="h-16 w-16 rounded-lg bg-neutral-50 flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-neutral-300" />
          </div>
          <p className="text-sm font-medium text-neutral-600">No contacts found</p>
          <p className="text-xs text-neutral-400 mt-1 mb-4">
            No contacts match your search for &quot;{debouncedSearch}&quot;
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="text-primary-600 border-primary-200 hover:bg-primary-50"
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear Search
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
