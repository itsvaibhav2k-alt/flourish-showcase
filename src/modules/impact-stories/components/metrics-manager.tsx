/**
 * Metrics Manager Component
 *
 * CRUD UI for managing impact metrics
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { createMetric, updateMetric, deleteMetric } from '../actions'
import type { ImpactMetric } from '../schemas'

interface MetricsManagerProps {
  organizationId: string
  metrics: ImpactMetric[]
}

export function MetricsManager({ organizationId, metrics }: MetricsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<ImpactMetric | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Impact Metrics</h2>
          <p className="text-sm text-neutral-600">
            Define how donor contributions translate into real-world impact
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Metric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <MetricForm
              organizationId={organizationId}
              onSuccess={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {metrics.length === 0 ? (
        <Card className="shadow-card border-neutral-200/60">
          <CardContent className="py-12">
            <div className="text-center">
              <DollarSign className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No metrics yet</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Create your first impact metric to start generating personalized donor
                stories
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Metric
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.id} className="shadow-card border-neutral-200/60">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{metric.metric_name}</CardTitle>
                    {metric.description && (
                      <CardDescription className="mt-1">
                        {metric.description}
                      </CardDescription>
                    )}
                  </div>
                  {!metric.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Cost per unit:</span>
                    <span className="font-medium">
                      ${Number(metric.cost_per_unit).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Unit label:</span>
                    <span className="font-medium">{metric.unit_label}</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <MetricForm
                          organizationId={organizationId}
                          metric={metric}
                          onSuccess={() => {}}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (
                          window.confirm(
                            'Are you sure you want to delete this metric? This action cannot be undone.'
                          )
                        ) {
                          const result = await deleteMetric(metric.id!)
                          if (!result.success) {
                            toast.error(result.error || 'Failed to delete metric')
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface MetricFormProps {
  organizationId: string
  metric?: ImpactMetric
  onSuccess: () => void
}

function MetricForm({ organizationId, metric, onSuccess }: MetricFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      metric_name: formData.get('metric_name') as string,
      description: formData.get('description') as string,
      cost_per_unit: parseFloat(formData.get('cost_per_unit') as string),
      unit_label: formData.get('unit_label') as string,
      unit_label_plural: formData.get('unit_label_plural') as string,
      icon: formData.get('icon') as string,
      is_active: formData.get('is_active') === 'on',
      display_order: parseInt(formData.get('display_order') as string) || 0,
    }

    const result = metric
      ? await updateMetric(metric.id!, data)
      : await createMetric(organizationId, data)

    setIsSubmitting(false)

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || 'An error occurred')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{metric ? 'Edit Metric' : 'Create New Metric'}</DialogTitle>
        <DialogDescription>
          Define how donor contributions translate into measurable impact
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="metric_name">Metric Name</Label>
          <Input
            id="metric_name"
            name="metric_name"
            placeholder="e.g., meals_served"
            defaultValue={metric?.metric_name}
            required
          />
          <p className="text-xs text-neutral-500 mt-1">
            Internal identifier (use underscores, no spaces)
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            placeholder="Brief description of this metric"
            defaultValue={metric?.description || ''}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
            <Input
              id="cost_per_unit"
              name="cost_per_unit"
              type="number"
              step="0.01"
              min="0"
              placeholder="2.50"
              defaultValue={metric?.cost_per_unit}
              required
            />
          </div>
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              name="display_order"
              type="number"
              min="0"
              placeholder="0"
              defaultValue={metric?.display_order || 0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unit_label">Unit Label (singular)</Label>
            <Input
              id="unit_label"
              name="unit_label"
              placeholder="meal"
              defaultValue={metric?.unit_label}
              required
            />
          </div>
          <div>
            <Label htmlFor="unit_label_plural">Unit Label (plural)</Label>
            <Input
              id="unit_label_plural"
              name="unit_label_plural"
              placeholder="meals"
              defaultValue={metric?.unit_label_plural || ''}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="icon">Icon Name (optional)</Label>
          <Input
            id="icon"
            name="icon"
            placeholder="utensils"
            defaultValue={metric?.icon || ''}
          />
          <p className="text-xs text-neutral-500 mt-1">Lucide icon name</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            className="rounded"
            defaultChecked={metric?.is_active ?? true}
          />
          <Label htmlFor="is_active" className="font-normal">
            Active (include in impact calculations)
          </Label>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : metric ? 'Update Metric' : 'Create Metric'}
          </Button>
        </div>
      </form>
    </>
  )
}
