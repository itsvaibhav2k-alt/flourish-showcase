import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getRoleLabel, type UserRole } from '@/lib/auth/roles'

interface AccessRestrictedProps {
  userRole: UserRole | null
}

/**
 * Access restricted page shown to non-admin users trying to access settings
 */
export function AccessRestricted({ userRole }: AccessRestrictedProps) {
  return (
    <div className="min-h-screen bg-neutral-50/50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-card border-neutral-200">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            {/* Icon */}
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-8 w-8 text-amber-600" />
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
              Access Restricted
            </h1>

            {/* Description */}
            <p className="text-neutral-600 mb-2">
              You need administrator privileges to access organization settings.
            </p>

            {/* Current role info */}
            {userRole && (
              <p className="text-sm text-neutral-500 mb-6">
                Your current role: <span className="font-medium text-neutral-700">{getRoleLabel(userRole)}</span>
              </p>
            )}

            {/* Help text */}
            <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-neutral-600">
                To manage organization settings, email preferences, automation, or voice profile,
                please contact your organization administrator to upgrade your permissions.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link href="/dashboard">
                <Button className="w-full bg-gradient-primary hover:opacity-90 transition-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/contacts">
                <Button variant="outline" className="w-full">
                  View Contacts
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
