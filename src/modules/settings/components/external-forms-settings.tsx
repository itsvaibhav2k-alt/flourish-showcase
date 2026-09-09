'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Webhook, Plus, Copy, Trash2, MoreHorizontal, Loader2, Check, ExternalLink, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { createExternalWebhook } from '../actions/create-external-webhook'
import { deleteExternalWebhook, toggleWebhookActive } from '../actions/delete-external-webhook'
import type { ExternalWebhook } from '../queries/get-external-webhooks'

interface ExternalFormsSettingsProps {
  webhooks: ExternalWebhook[]
}

export function ExternalFormsSettings({ webhooks: initialWebhooks }: ExternalFormsSettingsProps) {
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newWebhookName, setNewWebhookName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const formData = new FormData()
    formData.append('name', newWebhookName)

    const result = await createExternalWebhook(formData)

    if (result.success && result.webhookToken) {
      toast.success('Webhook created', { description: 'Your new webhook endpoint is ready' })
      setNewWebhookName('')
      setIsDialogOpen(false)
      // Optimistically add the new webhook
      setWebhooks((prev) => [
        {
          id: crypto.randomUUID(),
          name: newWebhookName,
          webhookToken: result.webhookToken!,
          fieldMapping: {},
          isActive: true,
          submissionCount: 0,
          lastSubmissionAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    } else {
      toast.error('Failed to create webhook', { description: result.message })
    }

    setIsCreating(false)
  }

  const handleDelete = async (webhookId: string) => {
    setDeletingId(webhookId)

    const result = await deleteExternalWebhook(webhookId)

    if (result.success) {
      toast.success('Webhook deleted')
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId))
    } else {
      toast.error('Failed to delete webhook', { description: result.message })
    }

    setDeletingId(null)
  }

  const handleToggleActive = async (webhook: ExternalWebhook) => {
    const result = await toggleWebhookActive(webhook.id, !webhook.isActive)

    if (result.success) {
      toast.success(webhook.isActive ? 'Webhook deactivated' : 'Webhook activated')
      setWebhooks((prev) =>
        prev.map((w) =>
          w.id === webhook.id ? { ...w, isActive: !w.isActive } : w
        )
      )
    } else {
      toast.error('Failed to update webhook', { description: result.message })
    }
  }

  const copyWebhookUrl = (token: string, id: string) => {
    const url = `${baseUrl}/api/webhooks/external-form?token=${token}`
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary-600" />
            External Form Webhooks
          </CardTitle>
          <CardDescription>
            Receive contact submissions from external forms and landing pages
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Webhook Endpoint</DialogTitle>
                <DialogDescription>
                  Create a new webhook to receive form submissions from external sources.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Webhook Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="e.g., Website Contact Form"
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-neutral-500">
                    Choose a descriptive name to identify this webhook
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="bg-primary-600 hover:bg-primary-700">
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
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Last Submission</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell>
                    {webhook.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{webhook.submissionCount.toLocaleString()}</TableCell>
                  <TableCell className="text-neutral-500 text-sm">
                    {formatDate(webhook.lastSubmissionAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyWebhookUrl(webhook.webhookToken, webhook.id)}
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
                            onClick={() => copyWebhookUrl(webhook.webhookToken, webhook.id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(webhook)}>
                            {webhook.isActive ? (
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
          <div className="py-6">
            <div className="text-center text-neutral-500 mb-6">
              <Webhook className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
              <p className="font-medium text-neutral-700">No webhooks configured</p>
              <p className="text-sm">Create a webhook to start receiving form submissions</p>
            </div>

            {/* Getting Started Guide */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
              <h4 className="font-medium text-sm mb-3 text-neutral-800">Getting Started</h4>
              <ol className="text-sm text-neutral-600 space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">1</span>
                  <div>
                    <p className="font-medium text-neutral-700">Create a Webhook</p>
                    <p className="text-xs text-neutral-500">Click &quot;New Webhook&quot; above and give it a descriptive name</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">2</span>
                  <div>
                    <p className="font-medium text-neutral-700">Copy the Webhook URL</p>
                    <p className="text-xs text-neutral-500">Click the copy button to get your unique webhook endpoint</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">3</span>
                  <div>
                    <p className="font-medium text-neutral-700">Connect Your Form</p>
                    <p className="text-xs text-neutral-500">Use Zapier, Make, or direct API calls to send form data to this URL</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-neutral-800">
              <ExternalLink className="h-4 w-4 text-primary-600" />
              How to Connect External Forms
            </h4>
            <div className="text-sm text-neutral-600 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-3 bg-white rounded-lg border border-neutral-200">
                  <p className="font-medium text-neutral-700 mb-1">Zapier</p>
                  <p className="text-xs text-neutral-500">Use &quot;Webhooks by Zapier&quot; action → POST request to your webhook URL</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-neutral-200">
                  <p className="font-medium text-neutral-700 mb-1">Make (Integromat)</p>
                  <p className="text-xs text-neutral-500">Add HTTP module → Make a request → POST to webhook URL</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-neutral-200">
                  <p className="font-medium text-neutral-700 mb-1">Google Forms</p>
                  <p className="text-xs text-neutral-500">Use Google Apps Script or Zapier to forward submissions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="font-medium text-sm mb-2 text-neutral-800">JSON Payload Format</h4>
            <p className="text-xs text-neutral-500 mb-2">
              Send a POST request with Content-Type: application/json
            </p>
            <pre className="bg-white p-3 rounded border border-neutral-200 overflow-x-auto text-xs">
{`{
  "email": "donor@example.com",     // required
  "first_name": "John",             // optional
  "last_name": "Doe",               // optional
  "amount": 100,                    // optional - creates a gift record
  "phone": "555-1234",              // optional
  "notes": "Via website form"       // optional
}`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
