'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, RotateCcw, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  DashboardTileConfig,
  DashboardTileId,
  DASHBOARD_TILE_METADATA,
  DEFAULT_CUSTOMIZATION_SETTINGS,
} from '../schemas/customization'
import { updateDashboardTilesConfig, resetCustomizationToDefaults } from '../actions/update-customization-settings'

interface DashboardCustomizerProps {
  initialConfig: DashboardTileConfig[]
}

interface SortableTileItemProps {
  item: DashboardTileConfig
  onToggle: (id: DashboardTileId, visible: boolean) => void
}

function SortableTileItem({ item, onToggle }: SortableTileItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const metadata = DASHBOARD_TILE_METADATA[item.id]
  const categoryColors: Record<string, string> = {
    stat: 'bg-primary-50 text-primary-700',
    action: 'bg-teal-50 text-teal-700',
    widget: 'bg-violet-50 text-violet-700',
    'ai-insight': 'bg-amber-50 text-amber-700',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-white transition-all',
        isDragging ? 'shadow-lg border-primary-300 z-50' : 'border-neutral-200 hover:border-neutral-300',
        !item.visible && 'opacity-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{metadata.name}</span>
          <Badge variant="secondary" className={cn('text-xs', categoryColors[metadata.category])}>
            {metadata.category}
          </Badge>
        </div>
        <p className="text-xs text-neutral-500 truncate">{metadata.description}</p>
      </div>

      <Switch
        checked={item.visible}
        onCheckedChange={(checked) => onToggle(item.id, checked)}
        aria-label={`Toggle ${metadata.name} visibility`}
      />
    </div>
  )
}

function DragOverlayItem({ id }: { id: DashboardTileId }) {
  const metadata = DASHBOARD_TILE_METADATA[id]
  const categoryColors: Record<string, string> = {
    stat: 'bg-primary-50 text-primary-700',
    action: 'bg-teal-50 text-teal-700',
    widget: 'bg-violet-50 text-violet-700',
    'ai-insight': 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-lg border-primary-300">
      <div className="cursor-grabbing p-1 rounded text-primary-500">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{metadata.name}</span>
          <Badge variant="secondary" className={cn('text-xs', categoryColors[metadata.category])}>
            {metadata.category}
          </Badge>
        </div>
        <p className="text-xs text-neutral-500 truncate">{metadata.description}</p>
      </div>
    </div>
  )
}

export function DashboardCustomizer({ initialConfig }: DashboardCustomizerProps) {
  const [items, setItems] = useState<DashboardTileConfig[]>(initialConfig)
  const [isPending, startTransition] = useTransition()
  const [hasChanges, setHasChanges] = useState(false)
  const [activeId, setActiveId] = useState<DashboardTileId | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as DashboardTileId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }))

        return newItems
      })
      setHasChanges(true)
    }
  }

  const handleToggle = (id: DashboardTileId, visible: boolean) => {
    setItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, visible } : item
      )
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateDashboardTilesConfig(items)
      if (result.success) {
        toast.success('Dashboard updated', {
          description: 'Your dashboard has been customized successfully.',
        })
        setHasChanges(false)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to update dashboard.',
        })
      }
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetCustomizationToDefaults('dashboard')
      if (result.success) {
        setItems(DEFAULT_CUSTOMIZATION_SETTINGS.dashboard.tiles)
        toast.success('Dashboard reset', {
          description: 'Dashboard has been reset to defaults.',
        })
        setHasChanges(false)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to reset dashboard.',
        })
      }
    })
  }

  // Sort items by order for display
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  // Group by category for better UX
  const stats = sortedItems.filter((item) => item.id.startsWith('stat-'))
  const actions = sortedItems.filter((item) => item.id.startsWith('action-'))
  const widgets = sortedItems.filter((item) => item.id.startsWith('widget-'))
  const aiInsights = sortedItems.filter((item) => item.id.startsWith('ai-'))

  return (
    <Card className="shadow-card border-neutral-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Dashboard Widgets</CardTitle>
        <CardDescription>
          Customize which widgets appear on your dashboard. Drag to reorder, toggle to show/hide.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Section */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Stats Cards</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stats.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {stats.map((item) => (
                  <SortableTileItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId && stats.some(s => s.id === activeId) ? (
                <DragOverlayItem id={activeId} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Quick Actions Section */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Quick Actions</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={actions.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {actions.map((item) => (
                  <SortableTileItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId && actions.some(a => a.id === activeId) ? (
                <DragOverlayItem id={activeId} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Widgets Section */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Widgets</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {widgets.map((item) => (
                  <SortableTileItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId && widgets.some(w => w.id === activeId) ? (
                <DragOverlayItem id={activeId} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* AI Insights Section */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">AI Insights</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={aiInsights.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {aiInsights.map((item) => (
                  <SortableTileItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId && aiInsights.some(a => a.id === activeId) ? (
                <DragOverlayItem id={activeId} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {hasChanges && (
          <p className="text-xs text-amber-600 text-center">
            You have unsaved changes
          </p>
        )}
      </CardContent>
    </Card>
  )
}
