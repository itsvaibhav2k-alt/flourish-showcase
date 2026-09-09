'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react'
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
import { detectColumnMapping, applyMapping } from '@/lib/import/csv-parser'
import { parseFile, detectFileFormat, getSupportedExtensions, isSupportedFile, type FileFormat } from '@/lib/import/file-parser'
import { parsePDFAction } from '../actions/parse-pdf'
import { validateContactRows, type ValidationResult } from '@/lib/import/validators'
import { findDuplicates, type DuplicateMatch } from '@/lib/import/duplicate-detector'
import { downloadContactsTemplate, IMPORT_TIPS } from '@/lib/import/csv-template'
import { detectPlatform, getPlatformLabel, type PlatformDetectionResult } from '@/lib/import/platform-parsers'
import { importContacts, getExistingContacts } from '../actions/import-contacts'
import type { CreateContactInput, Contact } from '../schemas/contact.schema'

type Step = 'upload' | 'mapping' | 'validation' | 'duplicates' | 'import'

type DuplicateDecision = {
  [key: number]: 'skip' | 'import'
}

export function ImportWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [validationResults, setValidationResults] = useState<{
    valid: ValidationResult<CreateContactInput>[]
    invalid: ValidationResult<CreateContactInput>[]
  }>({ valid: [], invalid: [] })
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [uniqueContacts, setUniqueContacts] = useState<CreateContactInput[]>([])
  const [duplicateDecisions, setDuplicateDecisions] = useState<DuplicateDecision>({})
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
      setError('Unsupported file format. Please upload a CSV, Excel (.xlsx), vCard (.vcf), or PDF file.')
      return
    }

    setError('')
    setFile(uploadedFile)

    try {
      const format = detectFileFormat(uploadedFile)
      setFileFormat(format)

      let result
      if (format === 'pdf') {
        // PDF requires server-side processing
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
        setError(`Parsing warnings: ${result.errors.join(', ')}`)
      }

      setHeaders(result.headers)
      setRawRows(result.rows)

      // Auto-detect payment platform
      const platform = detectPlatform(result.headers)
      if (platform.platform !== 'generic') {
        setDetectedPlatform(platform)
      }

      // Auto-detect column mapping (platform mapping overrides generic)
      const detectedMapping = detectColumnMapping(result.headers)
      const finalMapping = platform.platform !== 'generic'
        ? { ...detectedMapping, ...platform.suggestedMapping }
        : detectedMapping
      setMapping(finalMapping)

      setCurrentStep('mapping')
    } catch (err) {
      setError('Failed to parse CSV file')
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
        setError('Unsupported file format. Please upload a CSV, Excel (.xlsx), vCard (.vcf), or PDF file.')
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
    if ((!mapping.first_name || !mapping.last_name) && !mapping.full_name) {
      setError('First Name and Last Name (or Full Name) mappings are required')
      return
    }

    setError('')

    // Apply mapping and validate
    const mappedRows = applyMapping(rawRows, mapping)
    const results = validateContactRows(mappedRows, mapping)

    setValidationResults(results)
    setCurrentStep('validation')
  }

  // Step 3: Validation
  const proceedToDuplicateCheck = async () => {
    setError('')

    try {
      // Get existing contacts
      const { data: existingContacts } = await getExistingContacts()

      // Find duplicates
      const validContacts = validationResults.valid.map((v) => v.data!)
      const duplicateResults = await findDuplicates(validContacts, existingContacts as Contact[])

      setDuplicates(duplicateResults.duplicates)
      setUniqueContacts(duplicateResults.unique)

      // Initialize all duplicates as 'skip' by default
      const initialDecisions: DuplicateDecision = {}
      duplicateResults.duplicates.forEach((_, index) => {
        initialDecisions[index] = 'skip'
      })
      setDuplicateDecisions(initialDecisions)

      setCurrentStep('duplicates')
    } catch (err) {
      setError('Failed to check for duplicates')
      console.error(err)
    }
  }

  // Step 4: Duplicate Review
  const handleDuplicateDecision = (index: number, decision: 'skip' | 'import') => {
    setDuplicateDecisions((prev) => ({
      ...prev,
      [index]: decision,
    }))
  }

  const selectAllDuplicates = (decision: 'skip' | 'import') => {
    const allDecisions: DuplicateDecision = {}
    duplicates.forEach((_, index) => {
      allDecisions[index] = decision
    })
    setDuplicateDecisions(allDecisions)
  }

  const proceedToImport = () => {
    setCurrentStep('import')
    performImport()
  }

  // Step 5: Import
  const performImport = async () => {
    setImporting(true)
    setError('')

    try {
      // Combine unique contacts and duplicates marked for import
      const contactsToImport = [
        ...uniqueContacts,
        ...duplicates
          .filter((_, index) => duplicateDecisions[index] === 'import')
          .map((d) => d.newContact),
      ]

      const result = await importContacts(contactsToImport, {
        skipDuplicates: false,
        updateExisting: false,
      })

      if (result.success) {
        setImportSummary(result.summary)
      } else {
        setError(result.error || 'Import failed')
      }
    } catch (err) {
      setError('Failed to import contacts')
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
    setDuplicates([])
    setUniqueContacts([])
    setDuplicateDecisions({})
    setImportSummary(null)
    setError('')
  }

  // Render steps
  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload File</h2>
        <p className="text-neutral-600 mt-2">
          Upload a file containing your contacts. We support CSV, Excel (.xlsx), vCard (.vcf), and PDF files.
        </p>
      </div>

      <Card className="p-4 bg-neutral-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Need a template?</h3>
            <p className="text-sm text-neutral-600 mb-3">
              Download our CSV template with sample data and field descriptions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadContactsTemplate}
            className="ml-4"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </Card>

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
          accept={getSupportedExtensions(true)}
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
              {fileFormat === 'csv' ? 'CSV' : fileFormat === 'xlsx' ? 'Excel' : fileFormat === 'vcf' ? 'vCard' : fileFormat === 'pdf' ? 'PDF' : 'Ready'}
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

      <Card className="p-4 border-neutral-200">
        <h3 className="font-semibold mb-3">Import Tips</h3>
        <ul className="space-y-2 text-sm text-neutral-600">
          {IMPORT_TIPS.map((tip, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )

  const renderMappingStep = () => {
    const requiredFields = ['first_name', 'last_name']
    const optionalFields = [
      'email',
      'phone',
      'street',
      'city',
      'state',
      'zip',
      'tags',
      'notes',
      'is_donor',
      'is_volunteer',
    ]

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
                Columns have been auto-mapped for {getPlatformLabel(detectedPlatform.platform)} format. Review below.
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
          <Button onClick={proceedToDuplicateCheck} disabled={valid.length === 0}>
            Continue to Duplicate Check
          </Button>
        </div>
      </div>
    )
  }

  const renderDuplicatesStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Duplicates</h2>
        <p className="text-neutral-600 mt-2">
          We found {duplicates.length} potential duplicate(s). Choose whether to skip or import each
          one.
        </p>
      </div>

      {duplicates.length > 0 && (
        <>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => selectAllDuplicates('skip')}>
              Skip All
            </Button>
            <Button size="sm" variant="outline" onClick={() => selectAllDuplicates('import')}>
              Import All
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {duplicates.map((duplicate, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary">{duplicate.matchReason}</Badge>
                    </div>
                    <Select
                      value={duplicateDecisions[index]}
                      onValueChange={(v) => handleDuplicateDecision(index, v as 'skip' | 'import')}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="border rounded p-3">
                      <p className="font-semibold mb-2 text-neutral-900">New Contact</p>
                      <p>
                        {duplicate.newContact.first_name} {duplicate.newContact.last_name}
                      </p>
                      {duplicate.newContact.email && <p className="text-neutral-600">{duplicate.newContact.email}</p>}
                    </div>

                    <div className="border rounded p-3 bg-neutral-50">
                      <p className="font-semibold mb-2 text-neutral-900">Existing Contact</p>
                      <p>
                        {duplicate.existingContact.first_name} {duplicate.existingContact.last_name}
                      </p>
                      {duplicate.existingContact.email && (
                        <p className="text-neutral-600">{duplicate.existingContact.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {duplicates.length === 0 && (
        <Card className="p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <p className="mt-4 font-medium">No duplicates found!</p>
          <p className="text-sm text-neutral-600">All contacts are unique.</p>
        </Card>
      )}

      <Card className="p-4 bg-neutral-50">
        <div className="flex items-center justify-between text-sm">
          <span>Unique contacts to import:</span>
          <span className="font-bold">{uniqueContacts.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span>Duplicates to import:</span>
          <span className="font-bold">
            {Object.values(duplicateDecisions).filter((d) => d === 'import').length}
          </span>
        </div>
        <div className="border-t mt-3 pt-3 flex items-center justify-between font-semibold">
          <span>Total to import:</span>
          <span>
            {uniqueContacts.length +
              Object.values(duplicateDecisions).filter((d) => d === 'import').length}
          </span>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('validation')}>
          Back
        </Button>
        <Button onClick={proceedToImport}>Import Contacts</Button>
      </div>
    </div>
  )

  const renderImportStep = () => {
    if (importing) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-neutral-400" />
            <p className="mt-4 font-medium">Importing contacts...</p>
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
              Import More Contacts
            </Button>
            <Button asChild>
              <Link href="/contacts">View Contacts</Link>
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  // Step progress indicator
  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'mapping', label: 'Map Fields', icon: FileText },
    { id: 'validation', label: 'Validate', icon: CheckCircle2 },
    { id: 'duplicates', label: 'Duplicates', icon: AlertCircle },
    { id: 'import', label: 'Import', icon: Loader2 },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex
            const isUpcoming = index > currentStepIndex

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-neutral-900' : isUpcoming ? 'text-neutral-400' : 'text-neutral-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

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
      {currentStep === 'duplicates' && renderDuplicatesStep()}
      {currentStep === 'import' && renderImportStep()}
    </div>
  )
}
