'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createOrganization } from '@/modules/auth/actions/create-organization'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Pre-populate organization name from user metadata (set during signup)
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.organization_name) {
        setOrganizationName(user.user_metadata.organization_name)
      }
    }
    fetchUser()
  }, [])

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await createOrganization(organizationName)

      if (!result.success) {
        setError(result.error || 'Failed to create organization')
        if (result.error?.includes('logged in')) {
          router.push('/login')
        }
        return
      }

      // Set organization cookie
      if (result.organizationId) {
        document.cookie = `organization-id=${result.organizationId}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      }

      // Redirect to contacts page
      router.push('/contacts')
      router.refresh()
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // This feature is coming soon - just show a message for now
    setError('Invite codes are coming soon! Please create a new organization for now.')
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 blob-purple rounded-full blur-3xl opacity-40 animate-blob" />
      <div className="absolute bottom-20 right-10 w-96 h-96 blob-pink rounded-full blur-3xl opacity-30 animate-blob-delay" />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center transition-smooth group-hover:scale-105">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-neutral-900">Flourish</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-card border-neutral-100 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Flourish</CardTitle>
              <CardDescription className="text-neutral-500">
                Set up your organization to start managing your donors and volunteers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Create New
                  </TabsTrigger>
                  <TabsTrigger value="join" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Join Existing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                  <form onSubmit={handleCreateOrganization} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="My Nonprofit Organization"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                        className="h-11"
                        disabled={loading}
                      />
                      <p className="text-xs text-neutral-500">
                        This is how your organization will appear throughout Flourish
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/20 transition-smooth font-medium"
                      disabled={loading || !organizationName.trim()}
                    >
                      {loading ? 'Creating organization...' : 'Create Organization'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="join">
                  <form onSubmit={handleJoinOrganization} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="inviteCode">Invite Code</Label>
                      <Input
                        id="inviteCode"
                        type="text"
                        placeholder="Enter your invite code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="h-11"
                        disabled={loading}
                      />
                      <p className="text-xs text-neutral-500">
                        Ask your organization administrator for an invite code
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-sm text-neutral-600 text-center">
                        <span className="font-medium">Coming Soon</span>
                        <br />
                        <span className="text-xs">
                          Invite codes will be available in a future update. For now, please create a new organization.
                        </span>
                      </p>
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full h-11"
                      disabled={true}
                    >
                      Join Organization
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} Flourish. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
