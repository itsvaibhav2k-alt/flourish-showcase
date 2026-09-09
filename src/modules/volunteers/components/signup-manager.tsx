'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { checkInVolunteer, cancelSignup } from '../actions/check-in'

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

interface SignupManagerProps {
  signups: Signup[]
  shiftId: string
  onUpdate?: () => void
}

export function SignupManager({ signups, shiftId, onUpdate }: SignupManagerProps) {
  const [processing, setProcessing] = useState<string | null>(null)

  const confirmedSignups = signups.filter(s => s.status === 'confirmed')
  const waitlistedSignups = signups.filter(s => s.status === 'waitlisted')

  const handleCheckIn = async (signupId: string) => {
    setProcessing(signupId)
    const result = await checkInVolunteer({
      signup_id: signupId,
      checked_in_at: new Date().toISOString(),
    })
    setProcessing(null)

    if (!result.error && onUpdate) {
      onUpdate()
    }
  }

  const handleNoShow = async (signupId: string) => {
    setProcessing(signupId)
    const result = await checkInVolunteer({
      signup_id: signupId,
      no_show: true,
    })
    setProcessing(null)

    if (!result.error && onUpdate) {
      onUpdate()
    }
  }

  const handleCancel = async (signupId: string) => {
    if (!confirm('Are you sure you want to cancel this signup?')) {
      return
    }

    setProcessing(signupId)
    const result = await cancelSignup(signupId)
    setProcessing(null)

    if (!result.error && onUpdate) {
      onUpdate()
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  const renderSignup = (signup: Signup) => {
    const contact = signup.contacts
    const isProcessing = processing === signup.id

    return (
      <div
        key={signup.id}
        className="flex items-center justify-between gap-4 rounded-lg border p-4"
      >
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {getInitials(contact.first_name, contact.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">
              {contact.first_name} {contact.last_name}
            </p>
            <p className="text-sm text-neutral-500">
              {contact.email || contact.phone || 'No contact info'}
            </p>
            {signup.checked_in_at && (
              <div className="mt-1 flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Checked in</span>
                {signup.hours_logged && (
                  <span className="text-neutral-500">
                    ({signup.hours_logged}h)
                  </span>
                )}
              </div>
            )}
            {signup.no_show && (
              <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                <XCircle className="h-3 w-3" />
                <span>No show</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!signup.checked_in_at && !signup.no_show && (
            <>
              <Button
                size="sm"
                onClick={() => handleCheckIn(signup.id)}
                disabled={isProcessing}
              >
                Check In
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleNoShow(signup.id)}
                disabled={isProcessing}
              >
                No Show
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCancel(signup.id)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Confirmed Volunteers ({confirmedSignups.length})
            </CardTitle>
            <Button size="sm" variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Volunteer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {confirmedSignups.length === 0 ? (
            <p className="text-center text-sm text-neutral-500 py-4">
              No confirmed volunteers yet
            </p>
          ) : (
            <div className="space-y-3">
              {confirmedSignups.map(renderSignup)}
            </div>
          )}
        </CardContent>
      </Card>

      {waitlistedSignups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waitlist ({waitlistedSignups.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {waitlistedSignups.map((signup) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-dashed p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(
                          signup.contacts.first_name,
                          signup.contacts.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {signup.contacts.first_name} {signup.contacts.last_name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {signup.contacts.email || signup.contacts.phone}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Waitlisted</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
