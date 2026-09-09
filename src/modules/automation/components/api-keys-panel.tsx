'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Key,
  Plus,
  Copy,
  Trash2,
  MoreHorizontal,
  Loader2,
  Check,
  Power,
  PowerOff,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { createApiKey } from '../actions/create-api-key'
import { deleteApiKey, toggleApiKeyActive } from '../actions/manage-api-key'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  permissions: string[]
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  usage_count: number
  rate_limit_per_minute: number
  created_at: string
}

interface ApiKeysPanelProps {
  apiKeys: ApiKey[]
}

const PERMISSIONS = [
  { value: 'read', label: 'Read', description: 'View contacts, drafts, sequences' },
  { value: 'write', label: 'Write', description: 'Create/send emails, enroll in sequences' },
  { value: 'admin', label: 'Admin', description: 'Manage webhooks, API keys, settings' },
]

export function ApiKeysPanel({ apiKeys: initialApiKeys }: ApiKeysPanelProps) {
  const [apiKeys, setApiKeys] = useState(initialApiKeys)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newKeyShown, setNewKeyShown] = useState<string | null>(null)
  const [newKey, setNewKey] = useState({
    name: '',
    permissions: ['read', 'write'] as string[],
    rate_limit_per_minute: 100,
    expires_in_days: 0, // 0 = never
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const result = await createApiKey(newKey)

    if (result.success && result.data) {
      // Show the key immediately - it can only be seen once
      setNewKeyShown(result.data.key)
      setNewKey({ name: '', permissions: ['read', 'write'], rate_limit_per_minute: 100, expires_in_days: 0 })

      // Add to list (without the actual key, just prefix)
      setApiKeys((prev) => [result.data!.apiKey, ...prev])

      toast.success('API key created', {
        description: 'Copy the key now - it cannot be retrieved later',
        duration: 10000,
      })
    } else {
      toast.error('Failed to create API key', { description: result.error })
    }

    setIsCreating(false)
  }

  const handleDelete = async (keyId: string) => {
    setDeletingId(keyId)

    const result = await deleteApiKey(keyId)

    if (result.success) {
      toast.success('API key deleted')
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId))
    } else {
      toast.error('Failed to delete API key', { description: result.error })
    }

    setDeletingId(null)
  }

  const handleToggleActive = async (key: ApiKey) => {
    const result = await toggleApiKeyActive(key.id, !key.is_active)

    if (result.success) {
      toast.success(key.is_active ? 'API key deactivated' : 'API key activated')
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === key.id ? { ...k, is_active: !k.is_active } : k
        )
      )
    } else {
      toast.error('Failed to update API key', { description: result.error })
    }
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

  const togglePermission = (permission: string) => {
    setNewKey((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            API Keys
          </CardTitle>
          <CardDescription>
            Secure authentication for REST API access
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setNewKeyShown(null)
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            {newKeyShown ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    API Key Created
                  </DialogTitle>
                  <DialogDescription>
                    Copy this key now. It will not be shown again.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        Store this key securely. You will not be able to see it again after closing this dialog.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      value={newKeyShown}
                      readOnly
                      className="pr-10 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(newKeyShown)
                        toast.success('Key copied to clipboard')
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setIsDialogOpen(false); setNewKeyShown(null); }}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    API keys provide secure access to the REST API endpoints.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Production Integration"
                      value={newKey.name}
                      onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {PERMISSIONS.map((perm) => (
                        <div key={perm.value} className="flex items-start space-x-3">
                          <Checkbox
                            id={`perm-${perm.value}`}
                            checked={newKey.permissions.includes(perm.value)}
                            onCheckedChange={() => togglePermission(perm.value)}
                          />
                          <div className="grid gap-1">
                            <Label
                              htmlFor={`perm-${perm.value}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {perm.label}
                            </Label>
                            <p className="text-xs text-neutral-500">{perm.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Rate Limit (calls/minute)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      min={1}
                      max={1000}
                      value={newKey.rate_limit_per_minute}
                      onChange={(e) => setNewKey({ ...newKey, rate_limit_per_minute: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires">Expires (days, 0 = never)</Label>
                    <Input
                      id="expires"
                      type="number"
                      min={0}
                      max={365}
                      value={newKey.expires_in_days}
                      onChange={(e) => setNewKey({ ...newKey, expires_in_days: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || newKey.permissions.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {apiKeys.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-neutral-100 rounded text-xs">
                      {apiKey.key_prefix}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {apiKey.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {apiKey.is_active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{apiKey.usage_count.toLocaleString()}</TableCell>
                  <TableCell className="text-neutral-500 text-sm">
                    {formatDate(apiKey.last_used_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleActive(apiKey)}>
                          {apiKey.is_active ? (
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
                          onClick={() => handleDelete(apiKey.id)}
                          className="text-red-600"
                          disabled={deletingId === apiKey.id}
                        >
                          {deletingId === apiKey.id ? (
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
            <Key className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <h3 className="font-medium text-neutral-700 mb-1">No API keys</h3>
            <p className="text-sm text-neutral-500 mb-4">Create an API key to access the REST API</p>
          </div>
        )}

        {/* API Documentation */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-blue-800">
            <Shield className="h-4 w-4" />
            REST API Endpoints
          </h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white text-xs">POST</Badge>
              <code className="text-xs text-blue-700">/api/v1/emails/generate</code>
              <span className="text-xs text-neutral-500">- Generate email drafts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white text-xs">POST</Badge>
              <code className="text-xs text-blue-700">/api/v1/emails/send</code>
              <span className="text-xs text-neutral-500">- Send emails</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white text-xs">POST</Badge>
              <code className="text-xs text-blue-700">/api/v1/sequences/enroll</code>
              <span className="text-xs text-neutral-500">- Enroll in sequences</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white text-xs">GET</Badge>
              <code className="text-xs text-blue-700">/api/v1/sequences/enroll</code>
              <span className="text-xs text-neutral-500">- List sequences</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-600">
            Include API key in header: <code className="bg-white px-1 rounded">X-API-Key: flr_your_key</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
