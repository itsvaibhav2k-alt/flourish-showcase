'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

export interface TileConfig {
  id: string
  component: React.ReactNode
  gridSpan?: 'single' | 'double' // single = 1 col, double = 2 cols on desktop
}

interface TileGridProps {
  tiles: TileConfig[]
  onReorder?: (tiles: TileConfig[]) => void
  isDraggable?: boolean
  className?: string
}

/**
 * Sortable Tile Wrapper
 *
 * Wraps each tile to make it draggable using @dnd-kit
 */
function SortableTile({
  tile,
  isDraggable,
}: {
  tile: TileConfig
  isDraggable: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        tile.gridSpan === 'double' && 'md:col-span-2',
        isDragging && 'z-50 opacity-50'
      )}
    >
      {/* Drag handle - only visible in edit mode */}
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-white border border-neutral-200 rounded-full p-1.5 shadow-md cursor-grab active:cursor-grabbing hover:bg-neutral-50 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5 text-neutral-400" />
        </div>
      )}

      {/* Tile content */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          layout: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
          scale: { duration: 0.2 },
        }}
        className={cn(
          'h-full',
          isDraggable && 'mt-4' // Add top margin when drag handles are visible
        )}
      >
        {tile.component}
      </motion.div>
    </div>
  )
}

/**
 * AI Tile Grid
 *
 * Responsive grid container for AI tiles with:
 * - Responsive layout (1 col mobile, 2-3 cols desktop)
 * - Drag-drop reordering using @dnd-kit
 * - Framer Motion layout animations
 * - Staggered entrance animations
 */
export function TileGrid({
  tiles: initialTiles,
  onReorder,
  isDraggable = false,
  className,
}: TileGridProps) {
  const [tiles, setTiles] = useState(initialTiles)

  // Configure sensors for drag interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newOrder = arrayMove(items, oldIndex, newIndex)

        // Notify parent of reorder
        if (onReorder) {
          onReorder(newOrder)
        }

        return newOrder
      })
    }
  }

  // Stagger animation for initial render
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tiles.map(t => t.id)} strategy={rectSortingStrategy}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            // Base grid layout
            'grid gap-5',
            // Responsive columns: 1 on mobile, 2 on tablet, 3 on desktop
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            // Auto rows for consistent height
            'auto-rows-fr',
            className
          )}
        >
          <AnimatePresence mode="popLayout">
            {tiles.map((tile) => (
              <SortableTile
                key={tile.id}
                tile={tile}
                isDraggable={isDraggable}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </SortableContext>
    </DndContext>
  )
}

/**
 * Simplified Tile Grid (No Drag-Drop)
 *
 * For use cases where reordering is not needed.
 * Still includes Framer Motion animations.
 */
export function SimpleTileGrid({
  tiles,
  className,
}: {
  tiles: TileConfig[]
  className?: string
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {tiles.map((tile) => (
        <motion.div
          key={tile.id}
          variants={itemVariants}
          className={cn(
            tile.gridSpan === 'double' && 'md:col-span-2'
          )}
        >
          {tile.component}
        </motion.div>
      ))}
    </motion.div>
  )
}
