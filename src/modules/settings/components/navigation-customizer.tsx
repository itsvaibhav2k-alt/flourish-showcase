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
import {
  NavItemConfig,
  NavItemId,
  REQUIRED_NAV_ITEMS,
  NAV_ITEM_METADATA,
  DEFAULT_CUSTOMIZATION_SETTINGS,
} from '../schemas/customization'
import { updateNavigationConfig, resetCustomizationToDefaults } from '../actions/update-customization-settings'
import { toast } from 'sonner'

interface NavigationCustomizerProps {
  initialConfig: NavItemConfig[]
}

interface SortableNavItemProps {
  item: NavItemConfig
  isRequired: boolean
  onToggle: (id: NavItemId, visible: boolean) => void
}

function SortableNavItem({ item, isRequired, onToggle }: SortableNavItemProps) {
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

  const metadata = NAV_ITEM_METADATA[item.id]

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
          {isRequired && (
            <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600">
              Required
            </Badge>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate">{metadata.description}</p>
      </div>

      <Switch
        checked={item.visible}
        onCheckedChange={(checked) => onToggle(item.id, checked)}
        disabled={isRequired}
        aria-label={`Toggle ${metadata.name} visibility`}
      />
    </div>
  )
}

export function NavigationCustomizer({ initialConfig }: NavigationCustomizerProps) {
  const [items, setItems] = useState<NavItemConfig[]>(initialConfig)
  const [isPending, startTransition] = useTransition()
  const [hasChanges, setHasChanges] = useState(false)
  const [activeId, setActiveId] = useState<NavItemId | null>(null)

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
    setActiveId(event.active.id as NavItemId)
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

  const handleToggle = (id: NavItemId, visible: boolean) => {
    setItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, visible } : item
      )
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateNavigationConfig(items)
      if (result.success) {
        toast.success('Navigation updated', {
          description: 'Your sidebar has been customized successfully.',
        })
        setHasChanges(false)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to update navigation.',
        })
      }
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetCustomizationToDefaults('navigation')
      if (result.success) {
        setItems(DEFAULT_CUSTOMIZATION_SETTINGS.navigation)
        toast.success('Navigation reset', {
          description: 'Navigation has been reset to defaults.',
        })
        setHasChanges(false)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to reset navigation.',
        })
      }
    })
  }

  // Sort items by order for display
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  return (
    <Card className="shadow-card border-neutral-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Navigation</CardTitle>
        <CardDescription>
          Customize which pages appear in your sidebar. Drag to reorder, toggle to show/hide.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedItems.map((item) => (
                <SortableNavItem
                  key={item.id}
                  item={item}
                  isRequired={REQUIRED_NAV_ITEMS.includes(item.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-lg border-primary-300">
                <div className="cursor-grabbing p-1 rounded text-primary-500">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">{NAV_ITEM_METADATA[activeId].name}</span>
                    {REQUIRED_NAV_ITEMS.includes(activeId) && (
                      <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{NAV_ITEM_METADATA[activeId].description}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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
