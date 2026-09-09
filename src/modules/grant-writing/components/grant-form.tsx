'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { GrantOpportunityInput } from '../schemas/proposal.schema'

interface GrantFormProps {
  onSubmit: (data: GrantOpportunityInput) => void
  onCancel?: () => void
  initialData?: Partial<GrantOpportunityInput>
  isLoading?: boolean
}

export function GrantForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading,
}: GrantFormProps) {
  const [formData, setFormData] = useState<GrantOpportunityInput>({
    funderName: initialData?.funderName || '',
    grantName: initialData?.grantName || '',
    amountRequested: initialData?.amountRequested,
    deadline: initialData?.deadline || '',
    focusAreas: initialData?.focusAreas || [],
    requirements: initialData?.requirements || '',
    additionalNotes: initialData?.additionalNotes || '',
  })

  const [focusAreaInput, setFocusAreaInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAddFocusArea = () => {
    if (focusAreaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, focusAreaInput.trim()],
      }))
      setFocusAreaInput('')
    }
  }

  const handleRemoveFocusArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    const newErrors: Record<string, string> = {}

    if (!formData.funderName.trim()) {
      newErrors.funderName = 'Funder name is required'
    }

    if (formData.focusAreas.length === 0) {
      newErrors.focusAreas = 'At least one focus area is required'
    }

    if (!formData.requirements.trim() || formData.requirements.length < 10) {
      newErrors.requirements = 'Requirements must be at least 10 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Funder Name */}
      <div className="space-y-2">
        <Label htmlFor="funderName" className="text-sm font-medium">
          Funder Name <span className="text-red-600">*</span>
        </Label>
        <Input
          id="funderName"
          value={formData.funderName}
          onChange={e => setFormData(prev => ({ ...prev, funderName: e.target.value }))}
          placeholder="e.g., XYZ Foundation"
          className={errors.funderName ? 'border-red-600' : ''}
          disabled={isLoading}
        />
        {errors.funderName && (
          <p className="text-sm text-red-600">{errors.funderName}</p>
        )}
      </div>

      {/* Grant Name */}
      <div className="space-y-2">
        <Label htmlFor="grantName" className="text-sm font-medium">
          Grant Program Name
        </Label>
        <Input
          id="grantName"
          value={formData.grantName}
          onChange={e => setFormData(prev => ({ ...prev, grantName: e.target.value }))}
          placeholder="e.g., Community Impact Grant 2025"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Amount Requested */}
        <div className="space-y-2">
          <Label htmlFor="amountRequested" className="text-sm font-medium">
            Amount Requested
          </Label>
          <Input
            id="amountRequested"
            type="number"
            value={formData.amountRequested || ''}
            onChange={e => setFormData(prev => ({
              ...prev,
              amountRequested: e.target.value ? parseFloat(e.target.value) : undefined,
            }))}
            placeholder="50000"
            min="0"
            step="1000"
            disabled={isLoading}
          />
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label htmlFor="deadline" className="text-sm font-medium">
            Application Deadline
          </Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Focus Areas */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Focus Areas <span className="text-red-600">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            value={focusAreaInput}
            onChange={e => setFocusAreaInput(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddFocusArea()
              }
            }}
            placeholder="e.g., Education, Youth Development"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddFocusArea}
            disabled={!focusAreaInput.trim() || isLoading}
          >
            Add
          </Button>
        </div>
        {formData.focusAreas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.focusAreas.map((area, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary-50 text-primary-700 border border-primary-200"
              >
                {area}
                <button
                  type="button"
                  onClick={() => handleRemoveFocusArea(index)}
                  className="ml-1 hover:text-primary-900"
                  disabled={isLoading}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.focusAreas && (
          <p className="text-sm text-red-600">{errors.focusAreas}</p>
        )}
      </div>

      {/* Requirements */}
      <div className="space-y-2">
        <Label htmlFor="requirements" className="text-sm font-medium">
          Grant Requirements <span className="text-red-600">*</span>
        </Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={e => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
          placeholder="Paste the grant requirements, guidelines, or RFP text here. Include any specific sections they want, word limits, eligibility criteria, etc."
          rows={6}
          className={errors.requirements ? 'border-red-600' : ''}
          disabled={isLoading}
        />
        {errors.requirements && (
          <p className="text-sm text-red-600">{errors.requirements}</p>
        )}
        <p className="text-sm text-neutral-500">
          Provide as much detail as possible to help the AI generate a targeted proposal.
        </p>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes" className="text-sm font-medium">
          Additional Notes
        </Label>
        <Textarea
          id="additionalNotes"
          value={formData.additionalNotes}
          onChange={e => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
          placeholder="Any additional context, special instructions, or key points to emphasize in the proposal..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Generating...' : 'Generate Proposal'}
        </Button>
      </div>
    </form>
  )
}
