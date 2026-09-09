'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, MoreHorizontal, Mail, Crown, User, Eye, Trash2, Clock, X, Loader2 } from 'lucide-react'
import { inviteTeamMember, removeTeamMember, cancelInvite, updateMemberRole } from '../actions/invite-team-member'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  userId: string
  email: string
  name: string | null
  role: 'admin' | 'member' | 'viewer'
  joinedAt: string
  isCurrentUser: boolean
}

interface PendingInvite {
  email: string
  role: string
  invitedAt: string
}

interface TeamManagementProps {
  members: TeamMember[]
  pendingInvites: PendingInvite[]
  currentUserEmail: string
}

const roleIcons = {
  admin: Crown,
  member: User,
  viewer: Eye,
}

const roleLabels = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

const roleDescriptions = {
  admin: 'Full access to all settings and data',
  member: 'Can manage contacts, donors, and volunteers',
  viewer: 'Read-only access to data',
}

export function TeamManagement({ members, pendingInvites, currentUserEmail }: TeamManagementProps) {
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [cancellingEmail, setCancellingEmail] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('email', inviteEmail)
    formData.append('role', inviteRole)

    const result = await inviteTeamMember(formData)

    if (result.success) {
      toast.success('Invitation sent', { description: result.message })
      setInviteEmail('')
      setIsInviting(false)
    } else {
      toast.error('Failed to invite', { description: result.message })
    }

    setIsSubmitting(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    setRemovingId(memberId)
    const result = await removeTeamMember(memberId)

    if (result.success) {
      toast.success('Member removed', { description: result.message })
    } else {
      toast.error('Failed to remove', { description: result.message })
    }
    setRemovingId(null)
  }

  const handleCancelInvite = async (email: string) => {
    setCancellingEmail(email)
    const result = await cancelInvite(email)

    if (result.success) {
      toast.success('Invitation cancelled', { description: result.message })
    } else {
      toast.error('Failed to cancel', { description: result.message })
    }
    setCancellingEmail(null)
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    const result = await updateMemberRole(memberId, newRole)

    if (result.success) {
      toast.success('Role updated', { description: result.message })
    } else {
      toast.error('Failed to update role', { description: result.message })
    }
  }

  const getInitials = (email: string, name: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Team Members Card */}
      <Card className="shadow-card border-neutral-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage who has access to your organization
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsInviting(!isInviting)}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Form */}
          {isInviting && (
            <form onSubmit={handleInvite} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_150px_auto]">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Send Invite'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsInviting(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                The invited user will need to sign up at flourishnpo.com with this email address to join your organization.
              </p>
            </form>
          )}

          {/* Current Members List */}
          <div className="divide-y divide-neutral-100">
            {members.length > 0 ? (
              members.map((member) => {
                const RoleIcon = roleIcons[member.role]
                return (
                  <div key={member.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {getInitials(member.email, member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-neutral-900">
                            {member.name || member.email}
                            {member.isCurrentUser && (
                              <span className="text-xs text-neutral-500 ml-2">(you)</span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-neutral-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[member.role]}
                      </Badge>
                      {!member.isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                              <Crown className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                              <User className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>
                              <Eye className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600"
                              disabled={removingId === member.id}
                            >
                              {removingId === member.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-neutral-500">
                <Users className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                <p>No team members yet</p>
                <p className="text-sm">Invite your first team member to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites Card */}
      {pendingInvites.length > 0 && (
        <Card className="shadow-card border-neutral-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              These invitations are waiting for users to sign up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-neutral-100">
              {pendingInvites.map((invite) => (
                <div key={invite.email} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{invite.email}</p>
                      <p className="text-sm text-neutral-500">
                        Invited {formatDate(invite.invitedAt)} as {roleLabels[invite.role as keyof typeof roleLabels]}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvite(invite.email)}
                    disabled={cancellingEmail === invite.email}
                    className="text-neutral-500 hover:text-red-600"
                  >
                    {cancellingEmail === invite.email ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="ml-1">Cancel</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions Card */}
      <Card className="shadow-card border-neutral-100">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(roleDescriptions).map(([role, description]) => {
              const Icon = roleIcons[role as keyof typeof roleIcons]
              return (
                <div key={role} className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary-600" />
                    <span className="font-medium text-sm">{roleLabels[role as keyof typeof roleLabels]}</span>
                  </div>
                  <p className="text-xs text-neutral-600">{description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
