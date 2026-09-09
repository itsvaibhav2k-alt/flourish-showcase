'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EmailDraftWithContact } from '../schemas/email.schema'
import { getEmailTypeLabel, getEmailTypeBadgeVariant } from '../schemas/email.schema'
import { formatDateTime } from '@/lib/utils/date'
import { Mail, User, Calendar, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type EmailHistoryProps = {
  sentEmails: EmailDraftWithContact[]
}

export function EmailHistory({ sentEmails }: EmailHistoryProps) {
  const [selectedEmail, setSelectedEmail] = useState<EmailDraftWithContact | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const filteredEmails = sentEmails.filter((email) => {
    if (filterType === 'all') return true
    return email.email_type === filterType
  })

  const emailTypes = Array.from(new Set(sentEmails.map((e) => e.email_type)))

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-neutral-700">Filter by type:</label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {emailTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getEmailTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-neutral-600">
          {filteredEmails.length} emails
        </span>
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {filteredEmails.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <p>No sent emails found.</p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            // Use joined contact data from the query
            const contactName = email.contacts
              ? `${email.contacts.first_name} ${email.contacts.last_name}`
              : 'Unknown Recipient'
            const contactEmail = email.contacts?.email

            return (
              <Card key={email.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-neutral-500 shrink-0" />
                        <span className="font-medium truncate">
                          {contactName}
                        </span>
                        <Badge variant={getEmailTypeBadgeVariant(email.email_type)}>
                          {getEmailTypeLabel(email.email_type)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-neutral-900 mb-1 truncate">
                        {email.subject}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        {contactEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{contactEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span suppressHydrationWarning>{formatDateTime(email.sent_at || email.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmail(email)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* View Email Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sent Email</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700">To</label>
                <p className="text-sm text-neutral-900 mt-1">
                  {selectedEmail.contacts
                    ? `${selectedEmail.contacts.first_name} ${selectedEmail.contacts.last_name}`
                    : 'Unknown Recipient'}
                  {selectedEmail.contacts?.email && (
                    <span className="text-neutral-500 ml-2">
                      ({selectedEmail.contacts.email})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Type</label>
                <p className="text-sm text-neutral-900 mt-1">
                  {getEmailTypeLabel(selectedEmail.email_type)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Sent</label>
                <p className="text-sm text-neutral-900 mt-1" suppressHydrationWarning>
                  {formatDateTime(selectedEmail.sent_at || selectedEmail.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Subject</label>
                <p className="text-sm text-neutral-900 mt-1 font-medium">
                  {selectedEmail.subject}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Message</label>
                <div className="mt-2 p-4 bg-neutral-50 rounded-md border border-neutral-200">
                  <div className="prose prose-sm max-w-none">
                    {selectedEmail.body.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
