'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Save, DollarSign, Hash, Type, Tag } from 'lucide-react'

interface ProgramMetric {
  id: string
  programName: string
  metricName: string
  value: number
  costPerUnit: number
  icon?: string
}

interface ImpactMetricsInputProps {
  organizationId: string
  initialMetrics?: ProgramMetric[]
  onSave?: (metrics: ProgramMetric[]) => Promise<void>
}

const METRIC_ICONS = [
  { value: 'meals', label: 'Meals' },
  { value: 'families', label: 'Families' },
  { value: 'users', label: 'People' },
  { value: 'books', label: 'Books' },
  { value: 'homes', label: 'Homes' },
  { value: 'medical', label: 'Medical' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'trees', label: 'Trees' },
  { value: 'water', label: 'Water' },
  { value: 'heart', label: 'Hearts' },
]

const TIME_PERIODS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' },
]

/**
 * Form for organizations to enter and manage program impact metrics
 * Used to calculate donor impact stories
 */
export function ImpactMetricsInput({
  organizationId,
  initialMetrics = [],
  onSave,
}: ImpactMetricsInputProps) {
  const [metrics, setMetrics] = useState<ProgramMetric[]>(
    initialMetrics.length > 0 ? initialMetrics : []
  )
  const [timePeriod, setTimePeriod] = useState('90')
  const [isSaving, setIsSaving] = useState(false)

  const addMetric = () => {
    const newMetric: ProgramMetric = {
      id: crypto.randomUUID(),
      programName: '',
      metricName: '',
      value: 0,
      costPerUnit: 0,
      icon: 'heart',
    }
    setMetrics([...metrics, newMetric])
  }

  const removeMetric = (id: string) => {
    setMetrics(metrics.filter((m) => m.id !== id))
  }

  const updateMetric = (id: string, field: keyof ProgramMetric, value: string | number) => {
    setMetrics(
      metrics.map((m) => {
        if (m.id === id) {
          return { ...m, [field]: value }
        }
        return m
      })
    )
  }

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave(metrics)
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = metrics.every(
    (m) => m.programName && m.metricName && m.value > 0 && m.costPerUnit > 0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Impact Metrics</CardTitle>
        <CardDescription>
          Define how donations translate into real-world impact. These metrics will be used to
          generate personalized impact stories for your donors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Period Selector */}
        <div className="space-y-2">
          <Label htmlFor="time-period">Time Period</Label>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger id="time-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-neutral-500">
            Metrics will be calculated based on donations from this time period
          </p>
        </div>

        {/* Metrics List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Impact Metrics</Label>
            <Button onClick={addMetric} size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Metric
            </Button>
          </div>

          {metrics.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
              <p className="text-neutral-600 mb-4">No metrics defined yet</p>
              <Button onClick={addMetric} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Metric
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric, index) => (
                <Card key={metric.id} className="bg-neutral-50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Program Name */}
                      <div className="space-y-2">
                        <Label htmlFor={`program-${metric.id}`} className="text-xs flex items-center gap-1">
                          <Type className="w-3 h-3" />
                          Program Name
                        </Label>
                        <Input
                          id={`program-${metric.id}`}
                          placeholder="Food Bank"
                          value={metric.programName}
                          onChange={(e) => updateMetric(metric.id, 'programName', e.target.value)}
                        />
                      </div>

                      {/* Metric Name */}
                      <div className="space-y-2">
                        <Label htmlFor={`metric-${metric.id}`} className="text-xs flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Metric Name
                        </Label>
                        <Input
                          id={`metric-${metric.id}`}
                          placeholder="Meals Provided"
                          value={metric.metricName}
                          onChange={(e) => updateMetric(metric.id, 'metricName', e.target.value)}
                        />
                      </div>

                      {/* Value */}
                      <div className="space-y-2">
                        <Label htmlFor={`value-${metric.id}`} className="text-xs flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Total Value
                        </Label>
                        <Input
                          id={`value-${metric.id}`}
                          type="number"
                          placeholder="1000"
                          value={metric.value || ''}
                          onChange={(e) =>
                            updateMetric(metric.id, 'value', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>

                      {/* Cost Per Unit */}
                      <div className="space-y-2">
                        <Label htmlFor={`cost-${metric.id}`} className="text-xs flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Cost Per Unit
                        </Label>
                        <Input
                          id={`cost-${metric.id}`}
                          type="number"
                          placeholder="5.00"
                          step="0.01"
                          value={metric.costPerUnit || ''}
                          onChange={(e) =>
                            updateMetric(metric.id, 'costPerUnit', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>

                      {/* Icon */}
                      <div className="space-y-2">
                        <Label htmlFor={`icon-${metric.id}`} className="text-xs">
                          Icon
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={metric.icon}
                            onValueChange={(value) => updateMetric(metric.id, 'icon', value)}
                          >
                            <SelectTrigger id={`icon-${metric.id}`} className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {METRIC_ICONS.map((icon) => (
                                <SelectItem key={icon.value} value={icon.value}>
                                  {icon.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMetric(metric.id)}
                            className="text-neutral-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Example Calculation */}
                    {metric.value > 0 && metric.costPerUnit > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <p className="text-xs text-neutral-600">
                          Example: A ${metric.costPerUnit * 10} donation would provide{' '}
                          <span className="font-semibold">10 {metric.metricName.toLowerCase()}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        {metrics.length > 0 && (
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <Button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className="gap-2"
              variant="primary"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Metrics'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
