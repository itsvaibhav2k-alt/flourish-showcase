import Link from 'next/link'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PublicShiftCardProps {
  shift: {
    id: string
    title: string
    description: string | null
    location: string | null
    start_time: string
    end_time: string
    capacity: number | null
    confirmed_signups: number
    available_spots: number | null
    is_full: boolean
  }
  orgSlug: string
}

export function PublicShiftCard({ shift, orgSlug }: PublicShiftCardProps) {
  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Card className="hover:shadow-card-hover transition-smooth">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{shift.title}</CardTitle>
          {shift.is_full ? (
            <Badge className="bg-neutral-100 text-neutral-800">Full</Badge>
          ) : shift.available_spots !== null && shift.available_spots <= 3 ? (
            <Badge className="bg-amber-100 text-amber-800">
              {shift.available_spots} spot{shift.available_spots !== 1 ? 's' : ''} left
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">Open</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <Calendar className="h-4 w-4 text-neutral-500 mt-0.5" />
            <span className="text-neutral-700">{dateStr}</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Clock className="h-4 w-4 text-neutral-500 mt-0.5" />
            <span className="text-neutral-700">
              {startTime} - {endTime}
            </span>
          </div>

          {shift.location && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-neutral-500 mt-0.5" />
              <span className="text-neutral-700">{shift.location}</span>
            </div>
          )}

          <div className="flex items-start gap-3 text-sm">
            <Users className="h-4 w-4 text-neutral-500 mt-0.5" />
            <span className="text-neutral-700">
              {shift.capacity
                ? `${shift.confirmed_signups} / ${shift.capacity} volunteers`
                : `${shift.confirmed_signups} volunteer${shift.confirmed_signups !== 1 ? 's' : ''} signed up`}
            </span>
          </div>
        </div>

        {shift.description && (
          <p className="text-sm text-neutral-600 line-clamp-2">
            {shift.description}
          </p>
        )}

        <Button
          asChild
          className="w-full"
          disabled={shift.is_full}
        >
          <Link href={`/public/shifts/${orgSlug}/${shift.id}`}>
            {shift.is_full ? 'Shift Full' : 'Sign Up'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
