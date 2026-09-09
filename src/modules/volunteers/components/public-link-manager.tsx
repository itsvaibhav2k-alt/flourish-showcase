'use client'

import { useState } from 'react'
import { Copy, Check, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PublicLinkManagerProps {
  isPublic: boolean
  publicUrl: string | null
}

export function PublicLinkManager({ isPublic, publicUrl }: PublicLinkManagerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isPublic || !publicUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Globe className="h-4 w-4" />
          <span>Public signup is disabled for this shift</span>
        </div>
        <p className="text-xs text-neutral-500">
          Enable public signup when editing this shift to allow volunteers to sign up via a public link
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-green-700">
        <Globe className="h-4 w-4" />
        <span>Public signup enabled</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="public-url" className="text-xs">
          Public Signup Link
        </Label>
        <div className="flex gap-2">
          <Input
            id="public-url"
            value={publicUrl}
            readOnly
            className="text-sm font-mono"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-neutral-500">
          Share this link with volunteers to allow them to sign up directly
        </p>
      </div>
    </div>
  )
}
