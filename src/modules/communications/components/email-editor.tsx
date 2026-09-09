'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { EmailDraft } from '../schemas/email.schema'

type EmailEditorProps = {
  draft: EmailDraft
  onSave: (subject: string, body: string) => void
  onCancel: () => void
  isSaving?: boolean
}

export function EmailEditor({ draft, onSave, onCancel, isSaving }: EmailEditorProps) {
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)

  const handleSave = () => {
    onSave(subject, body)
  }

  const hasChanges = subject !== draft.subject || body !== draft.body

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edit Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body..."
            rows={12}
            disabled={isSaving}
            className="font-mono text-sm"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
