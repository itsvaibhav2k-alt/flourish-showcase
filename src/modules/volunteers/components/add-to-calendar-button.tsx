'use client'

import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddToCalendarButtonProps {
  shiftId: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

/**
 * Button component that triggers download of an ICS file for a single shift
 * When clicked, downloads an ICS calendar file that can be imported into
 * any calendar application (Google Calendar, Apple Calendar, Outlook, etc.)
 */
export function AddToCalendarButton({
  shiftId,
  className,
  variant = 'outline',
  size = 'default',
}: AddToCalendarButtonProps) {
  const handleAddToCalendar = () => {
    // Open the ICS endpoint in a new window to trigger download
    const url = `/api/calendar/shift/${shiftId}`
    window.open(url, '_blank')
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCalendar}
      className={className}
    >
      <Calendar className="mr-2 h-4 w-4" />
      Add to Calendar
    </Button>
  )
}
