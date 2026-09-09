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
import { Code2, Copy, Check, ExternalLink, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface EmbedCodeGeneratorProps {
  publicSlug: string | null
}

type ViewType = 'calendar' | 'list'
type Theme = 'light' | 'dark' | 'auto'

export function EmbedCodeGenerator({ publicSlug }: EmbedCodeGeneratorProps) {
  const [viewType, setViewType] = useState<ViewType>('calendar')
  const [theme, setTheme] = useState<Theme>('light')
  const [accentColor, setAccentColor] = useState('#0d9488')
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  if (!publicSlug) {
    return (
      <Card className="shadow-card border-neutral-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary-600" />
            Embed Widget
          </CardTitle>
          <CardDescription>
            Embed your volunteer calendar on your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-neutral-500">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
            <p className="font-medium text-neutral-700">Public calendar not configured</p>
            <p className="text-sm mt-1 mb-4">
              Follow these steps to enable the embed widget:
            </p>
          </div>

          {/* Setup Instructions */}
          <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
            <h4 className="font-medium text-sm mb-3 text-neutral-800">Setup Instructions</h4>
            <ol className="text-sm text-neutral-600 space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">1</span>
                <div>
                  <p className="font-medium text-neutral-700">Go to Organization Settings</p>
                  <p className="text-xs text-neutral-500">Click the &quot;Organization&quot; tab at the top of this page</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">2</span>
                <div>
                  <p className="font-medium text-neutral-700">Set a Public Slug</p>
                  <p className="text-xs text-neutral-500">Enter a URL-friendly name like &quot;my-organization&quot; (lowercase, hyphens allowed)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">3</span>
                <div>
                  <p className="font-medium text-neutral-700">Save Changes</p>
                  <p className="text-xs text-neutral-500">Click &quot;Save Changes&quot; and return to this tab</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">4</span>
                <div>
                  <p className="font-medium text-neutral-700">Copy the Embed Code</p>
                  <p className="text-xs text-neutral-500">Customize the appearance and paste the code into your website</p>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    )
  }

  const calendarUrl = `${baseUrl}/embed/calendar/${publicSlug}?view=${viewType === 'calendar' ? 'month' : 'week'}&theme=${theme}&accent=${encodeURIComponent(accentColor.replace('#', ''))}`

  const embedCode = `<iframe
  src="${calendarUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  title="Volunteer Calendar"
></iframe>`

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success('Embed code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(calendarUrl)
    toast.success('Calendar URL copied to clipboard')
  }

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary-600" />
          Embed Widget
        </CardTitle>
        <CardDescription>
          Embed your volunteer calendar on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Options */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="view-type">View Type</Label>
            <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
              <SelectTrigger id="view-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar">Calendar View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent-color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#0d9488"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Calendar URL */}
        <div className="space-y-2">
          <Label>Calendar URL</Label>
          <div className="flex gap-2">
            <Input
              value={calendarUrl}
              readOnly
              className="font-mono text-sm bg-neutral-50"
            />
            <Button variant="outline" size="icon" onClick={copyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-2">
          <Label>Embed Code</Label>
          <div className="relative">
            <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
              {embedCode}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={copyEmbedCode}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            Paste this code into your website HTML to display the volunteer calendar
          </p>
        </div>

        {/* Preview Link */}
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Calendar
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
