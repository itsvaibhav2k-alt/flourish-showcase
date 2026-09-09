'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { checkInVolunteer } from '../actions/check-in'

interface Signup {
  id: string
  status: string
  checked_in_at: string | null
  no_show: boolean | null
  hours_logged: number | null
  contacts: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  }
}

interface CheckInInterfaceProps {
  signups: Signup[]
  shiftStartTime: string
  shiftEndTime: string
  onUpdate?: () => void
}

export function CheckInInterface({
  signups,
  shiftStartTime,
  shiftEndTime,
  onUpdate,
}: CheckInInterfaceProps) {
  const [selectedSignup, setSelectedSignup] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [customHours, setCustomHours] = useState('')
  const [processing, setProcessing] = useState(false)

  const confirmedSignups = signups.filter(s => s.status === 'confirmed')
  const pendingSignups = confirmedSignups.filter(
    s => !s.checked_in_at && !s.no_show
  )

  // Calculate default hours
  const shiftStart = new Date(shiftStartTime)
  const shiftEnd = new Date(shiftEndTime)
  const defaultHours =
    Math.round(((shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)) * 100) / 100

  const handleCheckIn = async (signupId: string, isNoShow: boolean = false) => {
    setProcessing(true)

    const hoursToLog = customHours ? parseFloat(customHours) : defaultHours

    const result = await checkInVolunteer({
      signup_id: signupId,
      checked_in_at: isNoShow ? undefined : new Date().toISOString(),
      hours_logged: isNoShow ? undefined : hoursToLog,
      no_show: isNoShow,
    })

    setProcessing(false)

    if (!result.error) {
      setSelectedSignup(null)
      setNotes('')
      setCustomHours('')
      if (onUpdate) {
        onUpdate()
      }
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  const selected = confirmedSignups.find(s => s.id === selectedSignup)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-In ({pendingSignups.length} pending)</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingSignups.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-neutral-500">All volunteers checked in!</p>
          </div>
        ) : selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {getInitials(selected.contacts.first_name, selected.contacts.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  {selected.contacts.first_name} {selected.contacts.last_name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {selected.contacts.email || selected.contacts.phone}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Hours (optional)</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                placeholder={`Default: ${defaultHours}h`}
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this volunteer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleCheckIn(selected.id, false)}
                disabled={processing}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Check In
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCheckIn(selected.id, true)}
                disabled={processing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Mark No Show
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSelectedSignup(null)
                setNotes('')
                setCustomHours('')
              }}
              disabled={processing}
            >
              Back to List
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingSignups.map((signup) => (
              <button
                key={signup.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-neutral-50 transition-colors text-left"
                onClick={() => setSelectedSignup(signup.id)}
              >
                <Avatar>
                  <AvatarFallback>
                    {getInitials(
                      signup.contacts.first_name,
                      signup.contacts.last_name
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {signup.contacts.first_name} {signup.contacts.last_name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {signup.contacts.email || signup.contacts.phone}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {confirmedSignups.some(s => s.checked_in_at || s.no_show) && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3 text-neutral-500">
              Completed ({confirmedSignups.filter(s => s.checked_in_at || s.no_show).length})
            </h4>
            <div className="space-y-2">
              {confirmedSignups
                .filter(s => s.checked_in_at || s.no_show)
                .map((signup) => (
                  <div
                    key={signup.id}
                    className="flex items-center gap-3 p-2 rounded text-sm"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(
                          signup.contacts.first_name,
                          signup.contacts.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {signup.contacts.first_name} {signup.contacts.last_name}
                      </p>
                    </div>
                    {signup.checked_in_at ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">
                          {signup.hours_logged}h
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">No show</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
