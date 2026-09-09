import * as React from 'react'
import Link from 'next/link'
import { Mail, Phone, Edit, MoreHorizontal, Heart, Clock, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Contact } from '../schemas/contact.schema'
import { getContactFullName, getContactInitials } from '../utils/contact-helpers'

interface ContactCardProps {
  contact: Contact
  showActions?: boolean
  donationCount?: number
  totalDonated?: number
  volunteerHours?: number
}

/**
 * Get avatar gradient based on contact roles
 */
function getAvatarBg(isDonor: boolean, isVolunteer: boolean): string {
  if (isDonor && isVolunteer) return 'bg-neutral-800'
  if (isDonor) return 'bg-rose-100 text-rose-700'
  if (isVolunteer) return 'bg-violet-100 text-violet-700'
  return 'bg-neutral-100 text-neutral-600'
}

/**
 * Contact Card - Stripe-inspired design
 * Features: gradient avatar, status dot badges, clean metadata grid, action buttons
 */
export function ContactCard({
  contact,
  showActions = true,
  donationCount = 0,
  totalDonated = 0,
  volunteerHours = 0,
}: ContactCardProps) {
  const fullName = getContactFullName(contact)
  const initials = getContactInitials(contact)
  const isDonor = contact.is_donor || false
  const isVolunteer = contact.is_volunteer || false
  const isMajorDonor = (contact.lifetime_giving || 0) >= 1000

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-neutral-200/60 overflow-hidden">
      <CardContent className="p-0">
        {/* Header Section with Avatar and Actions */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Avatar with gradient fallback */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`h-11 w-11 rounded-lg ${getAvatarBg(isDonor, isVolunteer)} flex items-center justify-center text-sm font-semibold shrink-0`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-neutral-900 truncate">
                  {fullName}
                </h3>
                {/* Status badges with dot indicators */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {isDonor && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Donor
                    </span>
                  )}
                  {isVolunteer && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      Volunteer
                    </span>
                  )}
                  {isMajorDonor && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Major
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons in header */}
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-neutral-600"
                  asChild
                >
                  <Link href={`/contacts/${contact.id}/edit`}>
                    <Edit className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-neutral-600"
                  asChild
                >
                  <Link href={`/contacts/${contact.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Grid - Key-value pairs */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {contact.email && (
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-neutral-700 hover:text-neutral-900 truncate transition-colors"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-neutral-700 hover:text-neutral-900 transition-colors"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500">
                  +{contact.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {(isDonor || isVolunteer) && (
          <div className="border-t border-neutral-100 bg-neutral-50/50">
            <div className="px-4 py-3 flex items-center justify-between gap-4">
              {isDonor && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 leading-none">Gifts</p>
                      <p className="text-sm font-semibold text-neutral-900 mt-0.5">{donationCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center">
                      <span className="text-xs font-semibold text-green-600">$</span>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 leading-none">Total</p>
                      <p className="text-sm font-semibold text-neutral-900 mt-0.5">${totalDonated.toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}
              {isVolunteer && (
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 leading-none">Hours</p>
                    <p className="text-sm font-semibold text-neutral-900 mt-0.5">{volunteerHours}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
