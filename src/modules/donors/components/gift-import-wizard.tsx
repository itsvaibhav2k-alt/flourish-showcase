'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseFile, detectFileFormat, getSupportedExtensions, isSupportedFile, type FileFormat } from '@/lib/import/file-parser'
import { parsePDFAction } from '@/modules/contacts/actions/parse-pdf'
import { detectColumnMapping, applyMapping } from '@/lib/import/csv-parser'
import { validateGiftRows, type ValidationResult } from '@/lib/import/validators'
import { detectPlatform, getPlatformLabel, type PlatformDetectionResult } from '@/lib/import/platform-parsers'
import { importGifts, validateGiftContacts, type GiftImportData } from '../actions/import-gifts'

type Step = 'upload' | 'mapping' | 'validation' | 'contact-check' | 'import'

export function GiftImportWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [validationResults, setValidationResults] = useState<{
    valid: ValidationResult<GiftImportData>[]
    invalid: ValidationResult<GiftImportData>[]
  }>({ valid: [], invalid: [] })
  const [contactValidation, setContactValidation] = useState<{
    found: string[]
    missing: string[]
  }>({ found: [], missing: [] })
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformDetectionResult | null>(null)
  const [fileFormat, setFileFormat] = useState<FileFormat>('csv')
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<number>(0)

  // Step 1: File Upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    if (!isSupportedFile(uploadedFile)) {
      setError('Unsupported file format. Please upload a CSV, Excel (.xlsx), or PDF file.')
      return
    }

    setError('')
    setFile(uploadedFile)

    try {
      const format = detectFileFormat(uploadedFile)
      setFileFormat(format)

      let result
      if (format === 'pdf') {
        const formData = new FormData()
        formData.append('file', uploadedFile)
        result = await parsePDFAction(formData)
      } else {
        const parseResult = await parseFile(uploadedFile)
        result = parseResult
        if ('sheetNames' in parseResult && parseResult.sheetNames && parseResult.sheetNames.length > 1) {
          setSheetNames(parseResult.sheetNames)
        }
      }

      if (result.errors.length > 0) {
        setError(`File parsing warnings: ${result.errors.join(', ')}`)
      }

      setHeaders(result.headers)
      setRawRows(result.rows)

      // Auto-detect payment platform
      const platform = detectPlatform(result.headers)
      if (platform.platform !== 'generic') {
        setDetectedPlatform(platform)
      }

      // Auto-detect column mapping with platform overrides
      const detectedMapping = detectColumnMapping(result.headers)
      const finalMapping = platform.platform !== 'generic'
        ? { ...detectedMapping, ...platform.suggestedMapping }
        : detectedMapping
      setMapping(finalMapping)

      setCurrentStep('mapping')
    } catch (err) {
      setError('Failed to parse file')
      console.error(err)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault()
      const droppedFile = event.dataTransfer.files[0]

      if (!droppedFile || !isSupportedFile(droppedFile)) {
        setError('Unsupported file format. Please upload a CSV, Excel (.xlsx), or PDF file.')
        return
      }

      const fakeEvent = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      handleFileUpload(fakeEvent)
    },
    [handleFileUpload]
  )

  // Step 2: Column Mapping
  const handleMappingChange = (field: string, column: string) => {
    setMapping((prev) => {
      const next = { ...prev }
      if (column === '__none__') {
        delete next[field]
      } else {
        next[field] = column
      }
      return next
    })
  }

  const proceedToValidation = () => {
    if (!mapping.email || !mapping.amount || !mapping.gift_date) {
      setError('Email, Amount, and Gift Date mappings are required')
      return
    }

    setError('')

    // Apply mapping and validate
    const mappedRows = applyMapping(rawRows, mapping)
    const results = validateGiftRows(mappedRows, mapping)

    setValidationResults(results)
    setCurrentStep('validation')
  }

  // Step 3: Validation
  const proceedToContactCheck = async () => {
    setError('')

    try {
      // Extract all email addresses from valid gifts
      const emails = validationResults.valid
        .map((v) => v.data?.contact_email)
        .filter((email): email is string => !!email)

      // Validate that contacts exist
      const result = await validateGiftContacts(emails)

      if (!result.success) {
        setError(result.error || 'Failed to validate contacts')
        return
      }

      setContactValidation(result.data)
      setCurrentStep('contact-check')
    } catch (err) {
      setError('Failed to validate contacts')
      console.error(err)
    }
  }

  // Step 4: Contact Check
  const proceedToImport = () => {
    if (contactValidation.missing.length > 0) {
      setError(
        `Cannot import: ${contactValidation.missing.length} contact(s) not found. Please import those contacts first.`
      )
      return
    }

    setCurrentStep('import')
    performImport()
  }

  // Step 5: Import
  const performImport = async () => {
    setImporting(true)
    setError('')

    try {
      // Filter out gifts for missing contacts
      const giftsToImport = validationResults.valid
        .map((v) => v.data!)
        .filter((gift) => contactValidation.found.includes(gift.contact_email || ''))

      const result = await importGifts(giftsToImport)

      if (result.success) {
        setImportSummary(result.summary)
      } else {
        setError(result.error || 'Import failed')
      }
    } catch (err) {
      setError('Failed to import gifts')
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  const resetWizard = () => {
    setCurrentStep('upload')
    setFile(null)
    setHeaders([])
    setRawRows([])
    setMapping({})
    setValidationResults({ valid: [], invalid: [] })
    setContactValidation({ found: [], missing: [] })
    setImportSummary(null)
    setError('')
    setFileFormat('csv')
    setSheetNames([])
    setSelectedSheet(0)
  }

  // Render steps
  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload File</h2>
        <p className="text-neutral-600 mt-2">
          Upload a file containing gift records. We support CSV, Excel (.xlsx), and PDF files.
          Make sure your file includes email addresses to match with existing contacts.
        </p>
      </div>

      <div
        className="border-2 border-dashed border-neutral-200 rounded-lg p-12 text-center hover:border-neutral-300 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-neutral-400" />
        <p className="mt-4 text-sm font-medium">Drag and drop your file here</p>
        <p className="mt-1 text-sm text-neutral-500">or click to browse</p>
        <input
          id="file-upload"
          type="file"
          accept={getSupportedExtensions(false)}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {file && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-neutral-400" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-neutral-500">{rawRows.length} rows</p>
              </div>
            </div>
            <Badge variant="secondary">
              {fileFormat === 'csv' ? 'CSV' : fileFormat === 'xlsx' ? 'Excel' : fileFormat === 'pdf' ? 'PDF' : 'Ready'}
            </Badge>
          </div>

          {rawRows.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Preview (first 5 rows):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {headers.slice(0, 5).map((header) => (
                        <th key={header} className="text-left p-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b">
                        {headers.slice(0, 5).map((header) => (
                          <td key={header} className="p-2">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {sheetNames.length > 1 && (
        <Card className="p-4">
          <Label htmlFor="sheet-select" className="font-semibold mb-2 block">
            Select Sheet
          </Label>
          <p className="text-sm text-neutral-600 mb-3">
            This workbook has {sheetNames.length} sheets. Select which one to import.
          </p>
          <Select
            value={String(selectedSheet)}
            onValueChange={async (v) => {
              const sheetIdx = parseInt(v)
              setSelectedSheet(sheetIdx)
              if (file) {
                const parseResult = await parseFile(file, { sheetIndex: sheetIdx })
                setHeaders(parseResult.headers)
                setRawRows(parseResult.rows)
                const detectedMapping = detectColumnMapping(parseResult.headers)
                setMapping(detectedMapping)
              }
            }}
          >
            <SelectTrigger id="sheet-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sheetNames.map((name, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}
    </div>
  )

  const renderMappingStep = () => {
    const requiredFields = ['email', 'amount', 'gift_date']
    const optionalFields = ['gift_type', 'campaign', 'payment_method', 'notes']

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Map Columns</h2>
          <p className="text-neutral-600 mt-2">
            We&apos;ve auto-detected the column mappings. Review and adjust as needed.
          </p>
        </div>

        {detectedPlatform && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <FileText className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-blue-900">
                Detected {getPlatformLabel(detectedPlatform.platform)} export
              </p>
              <p className="text-sm text-blue-700">
                Columns have been auto-mapped for {getPlatformLabel(detectedPlatform.platform)} donations. Only completed transactions will be imported.
              </p>
            </div>
          </div>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Required Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredFields.map((field) => (
                  <div key={field}>
                    <Label htmlFor={field} className="capitalize">
                      {field.replace('_', ' ')} *
                    </Label>
                    <Select value={mapping[field] || '__none__'} onValueChange={(v) => handleMappingChange(field, v)}>
                      <SelectTrigger id={field} className="mt-1">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Not mapped --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Optional Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optionalFields.map((field) => (
                  <div key={field}>
                    <Label htmlFor={field} className="capitalize">
                      {field.replace('_', ' ')}
                    </Label>
                    <Select value={mapping[field] || '__none__'} onValueChange={(v) => handleMappingChange(field, v)}>
                      <SelectTrigger id={field} className="mt-1">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Not mapped --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('upload')}>
            Back
          </Button>
          <Button onClick={proceedToValidation}>Continue to Validation</Button>
        </div>
      </div>
    )
  }

  const renderValidationStep = () => {
    const { valid, invalid } = validationResults

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Validation Results</h2>
          <p className="text-neutral-600 mt-2">
            Review the validation results. Invalid rows will be skipped during import.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{valid.length}</p>
                <p className="text-sm text-neutral-600">Valid rows</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{invalid.length}</p>
                <p className="text-sm text-neutral-600">Invalid rows</p>
              </div>
            </div>
          </Card>
        </div>

        {invalid.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Validation Errors</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invalid.map((result, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Row {result.rowNumber}:</p>
                    <ul className="list-disc list-inside text-red-700">
                      {result.errors.map((error, j) => (
                        <li key={j}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
            Back
          </Button>
          <Button onClick={proceedToContactCheck} disabled={valid.length === 0}>
            Continue to Contact Check
          </Button>
        </div>
      </div>
    )
  }

  const renderContactCheckStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Contact Validation</h2>
        <p className="text-neutral-600 mt-2">
          Verifying that all contacts exist in your database before importing gifts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{contactValidation.found.length}</p>
              <p className="text-sm text-neutral-600">Contacts found</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{contactValidation.missing.length}</p>
              <p className="text-sm text-neutral-600">Contacts missing</p>
            </div>
          </div>
        </Card>
      </div>

      {contactValidation.missing.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Missing Contacts</h3>
              <p className="text-sm text-red-700 mb-3">
                The following email addresses were not found in your contacts. Please import these
                contacts first before importing their gifts.
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {contactValidation.missing.map((email) => (
                  <div key={email} className="text-sm font-mono bg-white px-2 py-1 rounded">
                    {email}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {contactValidation.missing.length === 0 && (
        <Card className="p-6 text-center bg-green-50 border-green-200">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <p className="mt-4 font-medium text-green-900">All contacts verified!</p>
          <p className="text-sm text-green-700">All gift records can be imported.</p>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('validation')}>
          Back
        </Button>
        <Button onClick={proceedToImport} disabled={contactValidation.missing.length > 0}>
          Import Gifts
        </Button>
      </div>
    </div>
  )

  const renderImportStep = () => {
    if (importing) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-neutral-400" />
            <p className="mt-4 font-medium">Importing gifts...</p>
            <p className="text-sm text-neutral-600">This may take a moment for large imports.</p>
          </div>
        </div>
      )
    }

    if (importSummary) {
      const successRate = (importSummary.imported / importSummary.total) * 100

      return (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold mt-4">Import Complete!</h2>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-medium">{Math.round(successRate)}%</span>
                </div>
                <Progress value={successRate} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{importSummary.total}</p>
                  <p className="text-sm text-neutral-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{importSummary.imported}</p>
                  <p className="text-sm text-neutral-600">Imported</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-400">{importSummary.skipped}</p>
                  <p className="text-sm text-neutral-600">Skipped</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{importSummary.failed}</p>
                  <p className="text-sm text-neutral-600">Failed</p>
                </div>
              </div>
            </div>
          </Card>

          {importSummary.errors.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Errors</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importSummary.errors.map((error: any, i: number) => (
                  <div key={i} className="text-sm p-2 bg-red-50 rounded">
                    <p className="font-medium">Row {error.row}:</p>
                    <p className="text-red-700">{error.error}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={resetWizard}>
              Import More Gifts
            </Button>
            <Button asChild>
              <Link href="/donors">View Donors</Link>
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'mapping' && renderMappingStep()}
      {currentStep === 'validation' && renderValidationStep()}
      {currentStep === 'contact-check' && renderContactCheckStep()}
      {currentStep === 'import' && renderImportStep()}
    </div>
  )
}
