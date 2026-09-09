'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Clock,
  Plus,
  Trash2,
  MoreHorizontal,
  Loader2,
  Power,
  PowerOff,
  Play,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { createScheduledEmail } from '../actions/create-scheduled-email'
import { deleteScheduledEmail, toggleScheduledEmailActive, triggerScheduledEmail } from '../actions/manage-scheduled-email'

interface ScheduledEmail {
  id: string
  name: string
  description: string | null
  email_type: string
  recipient_filter: Record<string, unknown>
  schedule_type: string
  cron_expression: string | null
  next_run_at: string | null
  last_run_at: string | null
  last_run_result: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

interface ScheduledEmailsPanelProps {
  scheduledEmails: ScheduledEmail[]
}

const EMAIL_TYPES = [
  { value: 'thank_you', label: 'Thank You' },
  { value: 'reengagement', label: 'Re-engagement' },
  { value: 'custom', label: 'Custom Appeal' },
  { value: 'volunteer_reminder', label: 'Volunteer Reminder' },
]

const SCHEDULE_TYPES = [
  { value: 'once', label: 'Once', description: 'Run one time at scheduled date' },
  { value: 'daily', label: 'Daily', description: 'Run every day' },
  { value: 'weekly', label: 'Weekly', description: 'Run every week' },
  { value: 'monthly', label: 'Monthly', description: 'Run every month' },
]

export function ScheduledEmailsPanel({ scheduledEmails: initialScheduledEmails }: ScheduledEmailsPanelProps) {
  const [scheduledEmails, setScheduledEmails] = useState(initialScheduledEmails)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    email_type: 'thank_you',
    schedule_type: 'daily',
    next_run_at: '',
    recipient_filter: {
      is_donor: true,
      limit: 50,
    },
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const result = await createScheduledEmail(newSchedule)

    if (result.success && result.data) {
      toast.success('Scheduled email created')
      setNewSchedule({
        name: '',
        description: '',
        email_type: 'thank_you',
        schedule_type: 'daily',
        next_run_at: '',
        recipient_filter: { is_donor: true, limit: 50 },
      })
      setIsDialogOpen(false)
      setScheduledEmails((prev) => [result.data!, ...prev])
    } else {
      toast.error('Failed to create scheduled email', { description: result.error })
    }

    setIsCreating(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)

    const result = await deleteScheduledEmail(id)

    if (result.success) {
      toast.success('Scheduled email deleted')
      setScheduledEmails((prev) => prev.filter((s) => s.id !== id))
    } else {
      toast.error('Failed to delete', { description: result.error })
    }

    setDeletingId(null)
  }

  const handleToggleActive = async (schedule: ScheduledEmail) => {
    const result = await toggleScheduledEmailActive(schedule.id, !schedule.is_active)

    if (result.success) {
      toast.success(schedule.is_active ? 'Schedule paused' : 'Schedule activated')
      setScheduledEmails((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, is_active: !s.is_active } : s
        )
      )
    } else {
      toast.error('Failed to update', { description: result.error })
    }
  }

  const handleTrigger = async (schedule: ScheduledEmail) => {
    setTriggeringId(schedule.id)

    const result = await triggerScheduledEmail(schedule.id)

    if (result.success) {
      toast.success('Scheduled email triggered', {
        description: 'Email generation started in background',
      })
    } else {
      toast.error('Failed to trigger', { description: result.error })
    }

    setTriggeringId(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getScheduleLabel = (type: string) => {
    return SCHEDULE_TYPES.find((t) => t.value === type)?.label || type
  }

  const getEmailTypeLabel = (type: string) => {
    return EMAIL_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Scheduled Emails
          </CardTitle>
          <CardDescription>
            Automate recurring email campaigns and batch communications
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Scheduled Email</DialogTitle>
                <DialogDescription>
                  Set up automated email generation on a recurring schedule.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-name">Name</Label>
                  <Input
                    id="schedule-name"
                    placeholder="e.g., Weekly Thank You Batch"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-description">Description (optional)</Label>
                  <Textarea
                    id="schedule-description"
                    placeholder="Describe what this schedule does"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Type</Label>
                  <Select
                    value={newSchedule.email_type}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, email_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Select
                    value={newSchedule.schedule_type}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, schedule_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-neutral-500">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next-run">First Run Date</Label>
                  <Input
                    id="next-run"
                    type="datetime-local"
                    value={newSchedule.next_run_at}
                    onChange={(e) => setNewSchedule({ ...newSchedule, next_run_at: e.target.value })}
                    required
                  />
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-600 font-medium mb-1">Recipient Filter</p>
                  <p className="text-xs text-neutral-500">
                    Currently configured to target donors (max 50 per run).
                    Advanced filters coming soon.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="bg-amber-600 hover:bg-amber-700">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Schedule'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {scheduledEmails.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledEmails.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{schedule.name}</p>
                      {schedule.description && (
                        <p className="text-xs text-neutral-500 truncate max-w-[180px]">{schedule.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getEmailTypeLabel(schedule.email_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {getScheduleLabel(schedule.schedule_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(schedule.next_run_at)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {formatDate(schedule.last_run_at)}
                    {schedule.last_run_result && (
                      <span className="block text-xs">
                        {(schedule.last_run_result as { drafts_generated?: number }).drafts_generated || 0} generated
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {schedule.is_active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
                        Paused
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleTrigger(schedule)}
                          disabled={triggeringId === schedule.id}
                        >
                          {triggeringId === schedule.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Run Now
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(schedule)}>
                          {schedule.is_active ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600"
                          disabled={deletingId === schedule.id}
                        >
                          {deletingId === schedule.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <h3 className="font-medium text-neutral-700 mb-1">No scheduled emails</h3>
            <p className="text-sm text-neutral-500 mb-4">Set up automated email campaigns</p>
          </div>
        )}

        {/* Use Cases */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-amber-800">
            <Clock className="h-4 w-4" />
            Use Cases
          </h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-medium">Weekly:</span>
              <span className="text-neutral-600">Thank-you batch for all donations in the past week</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-medium">Monthly:</span>
              <span className="text-neutral-600">Re-engagement emails for lapsing donors</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-medium">Daily:</span>
              <span className="text-neutral-600">Volunteer shift reminders</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
