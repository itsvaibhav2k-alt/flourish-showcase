'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { Pencil, X, Save, RotateCcw, Loader2, GripVertical, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
import type { DashboardTileConfig, DashboardTileId } from '@/modules/settings/schemas/customization'
import { DASHBOARD_TILE_METADATA, DEFAULT_CUSTOMIZATION_SETTINGS } from '@/modules/settings/schemas/customization'
import { updateDashboardTilesConfig, resetCustomizationToDefaults } from '@/modules/settings/actions/update-customization-settings'

interface CustomizeDashboardButtonProps {
  initialTiles: DashboardTileConfig[]
  isAdmin: boolean
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
  const categoryColors = {
    stat: 'bg-primary-50 text-primary-700',
    action: 'bg-teal-50 text-teal-700',
    widget: 'bg-violet-50 text-violet-700',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border bg-white transition-all',
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
        <GripVertical className="h-3 w-3" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-900 truncate">{metadata.name}</span>
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', categoryColors[metadata.category])}>
            {metadata.category}
          </Badge>
        </div>
      </div>

      <Switch
        checked={item.visible}
        onCheckedChange={(checked) => onToggle(item.id, checked)}
        className="scale-75"
        aria-label={`Toggle ${metadata.name} visibility`}
      />
    </div>
  )
}

function DragOverlayItem({ id }: { id: DashboardTileId }) {
  const metadata = DASHBOARD_TILE_METADATA[id]

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-white shadow-lg border-primary-300">
      <div className="cursor-grabbing p-1 rounded text-primary-500">
        <GripVertical className="h-3 w-3" />
      </div>
      <span className="text-sm font-medium text-neutral-900">{metadata.name}</span>
    </div>
  )
}

export function CustomizeDashboardButton({ initialTiles, isAdmin }: CustomizeDashboardButtonProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<DashboardTileConfig[]>(initialTiles)
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

  // Reset state when sheet opens
  React.useEffect(() => {
    if (open) {
      setItems(initialTiles)
      setHasChanges(false)
    }
  }, [open, initialTiles])

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
        setOpen(false)
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
        setOpen(false)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to reset dashboard.',
        })
      }
    })
  }

  // Sort items by order for display
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  // Group by category
  const stats = sortedItems.filter((item) => item.id.startsWith('stat-'))
  const actions = sortedItems.filter((item) => item.id.startsWith('action-'))
  const widgets = sortedItems.filter((item) => item.id.startsWith('widget-'))

  if (!isAdmin) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="shadow-sm"
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Customize
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[480px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Customize Dashboard</SheetTitle>
          <SheetDescription>
            Drag to reorder widgets, toggle to show or hide them.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Stats Section */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Stats Cards</h4>
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
                <div className="space-y-1.5">
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
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Quick Actions</h4>
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
                <div className="space-y-1.5">
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
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Widgets</h4>
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
                <div className="space-y-1.5">
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
        </div>

        <SheetFooter className="border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          {hasChanges && (
            <p className="text-xs text-amber-600 text-center w-full mt-2">
              You have unsaved changes
            </p>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
