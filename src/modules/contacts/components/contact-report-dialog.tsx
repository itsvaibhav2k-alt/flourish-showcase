'use client'

import * as React from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { generateContactReport } from '../actions/generate-contact-report'
import { DEFAULT_REPORT_SECTIONS, type ReportSection } from '../types/report.types'

interface ContactReportDialogProps {
  contactId: string
  contactName: string
}

export function ContactReportDialog({ contactId, contactName }: ContactReportDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [sections, setSections] = React.useState<ReportSection[]>(DEFAULT_REPORT_SECTIONS)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const toggleSection = (id: string) => {
    // Don't allow toggling the summary section off
    if (id === 'summary') return

    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateContactReport(contactId, {
        sections,
        includeEmptySections: false,
      })

      if (result.success && result.pdf && result.filename) {
        // Convert number array back to Uint8Array
        const pdfBytes = new Uint8Array(result.pdf)

        // Create blob and trigger download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setOpen(false)
      } else {
        setError(result.error || 'Failed to generate report')
      }
    } catch (err) {
      console.error('Error generating report:', err)
      setError('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Contact Report</DialogTitle>
          <DialogDescription>
            Generate a PDF report for {contactName}. Select the sections to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="flex items-start space-x-3">
                <Checkbox
                  id={section.id}
                  checked={section.enabled}
                  onCheckedChange={() => toggleSection(section.id)}
                  disabled={section.id === 'summary'} // Summary always included
                />
                <div className="grid gap-0.5 leading-none">
                  <Label
                    htmlFor={section.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {section.label}
                    {section.id === 'summary' && (
                      <span className="ml-2 text-xs text-neutral-400">(Always included)</span>
                    )}
                  </Label>
                  {section.description && (
                    <p className="text-xs text-neutral-500">{section.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
