'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContactsTable } from '@/modules/contacts/components/contacts-table'
import { Users, UserPlus, Heart, Briefcase, Bookmark } from 'lucide-react'
import type { Contact } from '@/modules/contacts/schemas/contact.schema'
import type { Segment } from '@/modules/segments/schemas/segment.schema'
import { ContactsSegmentBar } from '@/modules/segments/components/contacts-segment-bar'
import { ExportButton } from '@/modules/reports/components/export-button'

interface Stats {
  totalContacts: number
  donorCount: number
  volunteerCount: number
}

interface ContactsPageClientProps {
  contacts: Contact[]
  allTags: string[]
  savedSegments: Segment[]
  stats: Stats
  type: 'all' | 'donors' | 'volunteers'
}

export function ContactsPageClient({
  contacts,
  allTags,
  savedSegments,
  stats,
  type,
}: ContactsPageClientProps) {
  const statsCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'All people',
    },
    {
      title: 'Donors',
      value: stats.donorCount.toLocaleString(),
      icon: Heart,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      subtitle: 'Financial supporters',
    },
    {
      title: 'Volunteers',
      value: stats.volunteerCount.toLocaleString(),
      icon: Briefcase,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      subtitle: 'Active helpers',
    },
  ]
  const segments = [
    { key: 'all', label: 'All Contacts' },
    { key: 'donors', label: 'Donors' },
    { key: 'volunteers', label: 'Volunteers' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Contacts</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Manage your donors, volunteers, and supporters
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton exportType="contacts" variant="outline" />
            <Link href="/contacts/new">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="shadow-sm border-neutral-200/60 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-neutral-400">{stat.subtitle}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Segment Filter Tabs */}
        <div className="flex items-center justify-between border-b border-neutral-200">
          <div className="flex gap-1">
            {segments.map((seg) => (
              <Link
                key={seg.key}
                href={`/contacts?type=${seg.key}`}
                className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
                  type === seg.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {seg.label}
              </Link>
            ))}
          </div>

          {/* Segment Dropdown - Enhanced */}
          <div className="pb-2.5 flex items-center gap-3">
            {savedSegments.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Bookmark className="h-4 w-4 text-primary-500" />
                <span className="font-medium">{savedSegments.length}</span>
                <span className="text-neutral-500">saved segment{savedSegments.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <ContactsSegmentBar segments={savedSegments} />
          </div>
        </div>

        {/* Contacts Table */}
        <div>
          <Card className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-0">
              <Suspense fallback={
                <div className="p-8 text-center text-neutral-500">Loading contacts...</div>
              }>
                {contacts.length > 0 ? (
                  <ContactsTable contacts={contacts} allTags={allTags} />
                ) : (
                  <div className="py-16 text-center">
                    <div className="h-16 w-16 rounded-lg bg-primary-50 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-7 w-7 text-primary-300" />
                    </div>
                    <p className="text-sm font-medium text-neutral-600">No contacts found</p>
                    <p className="text-xs text-neutral-400 mt-1 mb-4">
                      {type === 'all'
                        ? 'Get started by adding your first contact'
                        : 'No contacts match this filter'}
                    </p>
                    <Link href="/contacts/new">
                      <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Add Contact
                      </Button>
                    </Link>
                  </div>
                )}
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
