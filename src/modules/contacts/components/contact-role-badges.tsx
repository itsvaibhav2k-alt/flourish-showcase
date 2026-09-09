import * as React from 'react'
import { Badge } from '@/components/ui/badge'

interface ContactRoleBadgesProps {
  isDonor?: boolean
  isVolunteer?: boolean
  totalGiven?: number
}

export function ContactRoleBadges({
  isDonor = false,
  isVolunteer = false,
  totalGiven = 0,
}: ContactRoleBadgesProps) {
  const isMajorDonor = (totalGiven || 0) >= 1000

  // Don't render anything if there are no roles
  if (!isDonor && !isVolunteer) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isMajorDonor && (
        <Badge variant="warning">Major Donor</Badge>
      )}
      {isDonor && !isMajorDonor && (
        <Badge variant="success">Donor</Badge>
      )}
      {isVolunteer && (
        <Badge variant="info">Volunteer</Badge>
      )}
    </div>
  )
}
