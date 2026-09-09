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
  Webhook,
  Plus,
  Copy,
  Trash2,
  MoreHorizontal,
  Loader2,
  Check,
  Power,
  PowerOff,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { createAutomationWebhook } from '../actions/create-automation-webhook'
import { deleteAutomationWebhook, toggleAutomationWebhookActive } from '../actions/manage-automation-webhook'

interface AutomationWebhook {
  id: string
  name: string
  description: string | null
  webhook_token: string
  webhook_type: string
  config: Record<string, unknown>
  is_active: boolean
  rate_limit_per_minute: number
  last_used_at: string | null
  usage_count: number
  created_at: string
  updated_at: string
}

interface AutomationWebhooksPanelProps {
  webhooks: AutomationWebhook[]
}

const WEBHOOK_TYPES = [
  { value: 'send_email', label: 'Send Email', description: 'Generate and send an email' },
  { value: 'enroll_sequence', label: 'Enroll in Sequence', description: 'Enroll contact in an email sequence' },
  { value: 'generate_custom_email', label: 'Generate Email Draft', description: 'Generate an email draft without sending' },
  { value: 'create_contact', label: 'Create Contact', description: 'Create a new contact' },
  { value: 'update_contact', label: 'Update Contact', description: 'Update existing contact data' },
]

export function AutomationWebhooksPanel({ webhooks: initialWebhooks }: AutomationWebhooksPanelProps) {
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    description: '',
    webhook_type: 'send_email',
    rate_limit_per_minute: 60,
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const result = await createAutomationWebhook(newWebhook)

    if (result.success && result.data) {
      toast.success('Webhook created', { description: 'Your automation webhook is ready' })
      setNewWebhook({ name: '', description: '', webhook_type: 'send_email', rate_limit_per_minute: 60 })
      setIsDialogOpen(false)

      // Show the webhook URL in a toast with copy option
      const webhookUrl = `${baseUrl}/api/webhooks/automation?token=${result.data.webhook_token}`
      toast.info('Webhook URL copied to clipboard', {
        description: 'Save this URL - the token cannot be retrieved later',
        duration: 10000,
      })
      navigator.clipboard.writeText(webhookUrl)

      // Add the new webhook to the list
      setWebhooks((prev) => [result.data!, ...prev])
    } else {
      toast.error('Failed to create webhook', { description: result.error })
    }

    setIsCreating(false)
  }

  const handleDelete = async (webhookId: string) => {
    setDeletingId(webhookId)

    const result = await deleteAutomationWebhook(webhookId)

    if (result.success) {
      toast.success('Webhook deleted')
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId))
    } else {
      toast.error('Failed to delete webhook', { description: result.error })
    }

    setDeletingId(null)
  }

  const handleToggleActive = async (webhook: AutomationWebhook) => {
    const result = await toggleAutomationWebhookActive(webhook.id, !webhook.is_active)

    if (result.success) {
      toast.success(webhook.is_active ? 'Webhook deactivated' : 'Webhook activated')
      setWebhooks((prev) =>
        prev.map((w) =>
          w.id === webhook.id ? { ...w, is_active: !w.is_active } : w
        )
      )
    } else {
      toast.error('Failed to update webhook', { description: result.error })
    }
  }

  const copyWebhookUrl = (token: string, id: string) => {
    const url = `${baseUrl}/api/webhooks/automation?token=${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Webhook URL copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeLabel = (type: string) => {
    return WEBHOOK_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Webhook className="h-5 w-5 text-violet-600" />
            Automation Webhooks
          </CardTitle>
          <CardDescription>
            Create webhooks for Zapier, n8n, Make, and other automation platforms
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Automation Webhook</DialogTitle>
                <DialogDescription>
                  Create a webhook endpoint for external automation tools.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="e.g., Zapier Thank You Emails"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-description">Description (optional)</Label>
                  <Textarea
                    id="webhook-description"
                    placeholder="What will this webhook be used for?"
                    value={newWebhook.description}
                    onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-type">Action Type</Label>
                  <Select
                    value={newWebhook.webhook_type}
                    onValueChange={(value) => setNewWebhook({ ...newWebhook, webhook_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBHOOK_TYPES.map((type) => (
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
                  <Label htmlFor="rate-limit">Rate Limit (calls/minute)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    min={1}
                    max={1000}
                    value={newWebhook.rate_limit_per_minute}
                    onChange={(e) => setNewWebhook({ ...newWebhook, rate_limit_per_minute: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="bg-violet-600 hover:bg-violet-700">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Webhook'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {webhooks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{webhook.name}</p>
                      {webhook.description && (
                        <p className="text-xs text-neutral-500 truncate max-w-[200px]">{webhook.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(webhook.webhook_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {webhook.is_active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{webhook.usage_count.toLocaleString()}</TableCell>
                  <TableCell className="text-neutral-500 text-sm">
                    {formatDate(webhook.last_used_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyWebhookUrl(webhook.webhook_token, webhook.id)}
                      >
                        {copiedId === webhook.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => copyWebhookUrl(webhook.webhook_token, webhook.id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(webhook)}>
                            {webhook.is_active ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(webhook.id)}
                            className="text-red-600"
                            disabled={deletingId === webhook.id}
                          >
                            {deletingId === webhook.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center">
            <Webhook className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <h3 className="font-medium text-neutral-700 mb-1">No webhooks configured</h3>
            <p className="text-sm text-neutral-500 mb-4">Create a webhook to connect automation tools</p>
          </div>
        )}

        {/* Integration Examples */}
        <div className="mt-6 p-4 bg-violet-50 rounded-lg border border-violet-200">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-violet-800">
            <Zap className="h-4 w-4" />
            Integration Examples
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 bg-white rounded-lg border border-violet-100">
              <p className="font-medium text-neutral-700 mb-1">Zapier</p>
              <p className="text-xs text-neutral-500">Trigger: New donation in Stripe &rarr; Action: Send thank-you via Flourish</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-violet-100">
              <p className="font-medium text-neutral-700 mb-1">n8n</p>
              <p className="text-xs text-neutral-500">Trigger: Form submission &rarr; Action: Create contact and enroll in sequence</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-violet-100">
              <p className="font-medium text-neutral-700 mb-1">Make</p>
              <p className="text-xs text-neutral-500">Trigger: New volunteer signup &rarr; Action: Send confirmation email</p>
            </div>
          </div>
        </div>

        {/* JSON Payload Examples */}
        <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h4 className="font-medium text-sm mb-2 text-neutral-800">Example Payload for send_email</h4>
          <pre className="bg-white p-3 rounded border border-neutral-200 overflow-x-auto text-xs">
{`{
  "contact_email": "donor@example.com",
  "email_type": "thank_you",        // or: reengagement, custom
  "gift_id": "uuid-optional"        // for personalization
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
