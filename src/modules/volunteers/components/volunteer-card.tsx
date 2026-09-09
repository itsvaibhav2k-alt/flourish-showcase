import Link from 'next/link'
import { Clock, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getReliabilityLabel, getReliabilityColor } from '../services/reliability-scorer'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'

interface VolunteerCardProps {
  volunteer: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    total_hours?: number
    total_shifts?: number
    reliability_score?: number
  }
}

export function VolunteerCard({ volunteer }: VolunteerCardProps) {
  const initials = `${volunteer.first_name[0] || ''}${volunteer.last_name[0] || ''}`.toUpperCase()
  const reliabilityScore = volunteer.reliability_score || 50
  const reliabilityLabel = getReliabilityLabel(reliabilityScore)
  const reliabilityColorClass = getReliabilityColor(reliabilityScore)

  return (
    <Link href={`/volunteers/${volunteer.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">
                {volunteer.first_name} {volunteer.last_name}
              </h3>
              <p className="text-sm text-neutral-500 truncate">
                {volunteer.email || volunteer.phone || 'No contact info'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-neutral-500">Total Hours</p>
                  <ScoreInfoButton
                    scoreKey="volunteerHours"
                    value={volunteer.total_hours || 0}
                    size="sm"
                    scoreDefinitions={scoreDefinitions}
                  />
                </div>
                <p className="font-medium">{volunteer.total_hours || 0}h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Shifts</p>
                <p className="font-medium">{volunteer.total_shifts || 0}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3 text-neutral-400" />
              <span className="text-neutral-500">Reliability</span>
              <ScoreInfoButton
                scoreKey="reliabilityScore"
                value={reliabilityScore}
                size="sm"
                scoreDefinitions={scoreDefinitions}
              />
            </div>
            <Badge variant="secondary" className={reliabilityColorClass}>
              {reliabilityLabel} ({reliabilityScore})
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
