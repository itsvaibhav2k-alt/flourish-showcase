'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { createProgramMetric, updateProgramMetric, deleteProgramMetric } from '../actions/manage-program-metrics'
import { useRouter } from 'next/navigation'
import type { ProgramMetricData } from '../queries/get-program-metrics'

interface ProgramMetricsManagerProps {
  metrics: ProgramMetricData[]
  timePeriods: string[]
}

export function ProgramMetricsManager({ metrics, timePeriods }: ProgramMetricsManagerProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<ProgramMetricData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    programName: '',
    metricName: '',
    metricValue: '',
    costPerUnit: '',
    timePeriod: new Date().getFullYear().toString(),
    description: '',
    icon: '',
  })

  const handleOpenDialog = (metric?: ProgramMetricData) => {
    if (metric) {
      setEditingMetric(metric)
      setFormData({
        programName: metric.program_name,
        metricName: metric.metric_name,
        metricValue: metric.metric_value.toString(),
        costPerUnit: metric.cost_per_unit.toString(),
        timePeriod: metric.time_period,
        description: metric.description || '',
        icon: metric.icon || '',
      })
    } else {
      setEditingMetric(null)
      setFormData({
        programName: '',
        metricName: '',
        metricValue: '',
        costPerUnit: '',
        timePeriod: new Date().getFullYear().toString(),
        description: '',
        icon: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        programName: formData.programName,
        metricName: formData.metricName,
        metricValue: parseInt(formData.metricValue),
        costPerUnit: parseFloat(formData.costPerUnit),
        timePeriod: formData.timePeriod,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
      }

      let result
      if (editingMetric) {
        result = await updateProgramMetric({ ...data, id: editingMetric.id })
      } else {
        result = await createProgramMetric(data)
      }

      if (result.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        alert(result.error || 'Failed to save metric')
      }
    } catch (error) {
      console.error('Error saving metric:', error)
      alert('Failed to save metric')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) {
      return
    }

    const result = await deleteProgramMetric(id)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to delete metric')
    }
  }

  // Group metrics by program
  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.program_name]) {
      acc[metric.program_name] = []
    }
    acc[metric.program_name].push(metric)
    return acc
  }, {} as Record<string, ProgramMetricData[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Program Metrics</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Define your program outcomes and costs to calculate donor impact
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMetric ? 'Edit Metric' : 'Add Program Metric'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="programName">Program Name</Label>
                <Input
                  id="programName"
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                  placeholder="e.g., Food Bank, Housing Program"
                  required
                />
              </div>

              <div>
                <Label htmlFor="metricName">Metric Name</Label>
                <Input
                  id="metricName"
                  value={formData.metricName}
                  onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
                  placeholder="e.g., meals served, families housed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metricValue">Total Value</Label>
                  <Input
                    id="metricValue"
                    type="number"
                    min="0"
                    value={formData.metricValue}
                    onChange={(e) => setFormData({ ...formData, metricValue: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="costPerUnit">Cost Per Unit ($)</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    placeholder="5.00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timePeriod">Time Period</Label>
                <Input
                  id="timePeriod"
                  value={formData.timePeriod}
                  onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value })}
                  placeholder="2024, Q4 2024, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon (emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🍽️, 🏠, 📚"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this metric"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingMetric ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groupedMetrics).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              No metrics yet
            </h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
              Add program metrics to start calculating personalized impact stories for your donors
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Metric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedMetrics).map(([programName, programMetrics]) => (
            <Card key={programName}>
              <CardHeader>
                <CardTitle className="text-lg">{programName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {programMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {metric.icon && (
                          <span className="text-2xl">{metric.icon}</span>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{metric.metric_name}</div>
                          <div className="text-sm text-neutral-600">
                            {metric.metric_value.toLocaleString()} total • ${metric.cost_per_unit} per unit • {metric.time_period}
                          </div>
                          {metric.description && (
                            <div className="text-xs text-neutral-500 mt-1">
                              {metric.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(metric)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(metric.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
