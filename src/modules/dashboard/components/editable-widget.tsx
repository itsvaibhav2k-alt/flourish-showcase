'use client'

import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardEditMode } from './dashboard-edit-mode'
import type { DashboardTileId } from '@/modules/settings/schemas/customization'

interface EditableWidgetProps {
  id: DashboardTileId
  children: React.ReactNode
  className?: string
}

export function EditableWidget({ id, children, className }: EditableWidgetProps) {
  const { isEditMode, tiles, toggleTileVisibility } = useDashboardEditMode()
  const tile = tiles.find(t => t.id === id)
  const isVisible = tile?.visible ?? true

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isEditMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // In edit mode, show all widgets (even hidden ones) with visual indicators
  if (isEditMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative group',
          isDragging && 'z-50',
          !isVisible && 'opacity-50',
          className
        )}
      >
        {/* Edit Mode Overlay */}
        <div
          className={cn(
            'absolute inset-0 z-10 rounded-lg border-2 border-dashed transition-all cursor-move',
            isDragging
              ? 'border-primary-500 bg-primary-50/50'
              : isVisible
                ? 'border-transparent group-hover:border-primary-300 group-hover:bg-primary-50/30'
                : 'border-neutral-300 bg-neutral-100/50'
          )}
          {...attributes}
          {...listeners}
        >
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 p-1.5 rounded bg-white shadow-sm border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-neutral-400" />
          </div>

          {/* Visibility Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleTileVisibility(id)
            }}
            className="absolute top-2 right-2 p-1.5 rounded bg-white shadow-sm border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
          >
            {isVisible ? (
              <Eye className="h-4 w-4 text-primary-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-neutral-400" />
            )}
          </button>

          {/* Hidden Indicator */}
          {!isVisible && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1.5 rounded-full bg-neutral-800/80 text-white text-xs font-medium">
                Hidden
              </span>
            </div>
          )}
        </div>

        {/* Original Widget Content */}
        {children}
      </div>
    )
  }

  // Normal mode: just render children if visible
  if (!isVisible) {
    return null
  }

  return (
    <div className={className}>
      {children}
    </div>
  )
}

// A simpler version for stats cards that need a different layout
interface EditableStatCardProps {
  id: DashboardTileId
  children: React.ReactNode
  className?: string
}

export function EditableStatCard({ id, children, className }: EditableStatCardProps) {
  const { isEditMode, tiles, toggleTileVisibility } = useDashboardEditMode()
  const tile = tiles.find(t => t.id === id)
  const isVisible = tile?.visible ?? true

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isEditMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isEditMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative group',
          isDragging && 'z-50',
          !isVisible && 'opacity-50',
          className
        )}
      >
        <div
          className={cn(
            'absolute inset-0 z-10 rounded-xl border-2 border-dashed transition-all cursor-move',
            isDragging
              ? 'border-primary-500 bg-primary-50/50'
              : isVisible
                ? 'border-transparent group-hover:border-primary-300'
                : 'border-neutral-300 bg-neutral-100/50'
          )}
          {...attributes}
          {...listeners}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleTileVisibility(id)
            }}
            className="absolute top-1 right-1 p-1 rounded bg-white/90 shadow-sm border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
          >
            {isVisible ? (
              <Eye className="h-3 w-3 text-primary-600" />
            ) : (
              <EyeOff className="h-3 w-3 text-neutral-400" />
            )}
          </button>

          {!isVisible && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-2 py-1 rounded-full bg-neutral-800/80 text-white text-[10px] font-medium">
                Hidden
              </span>
            </div>
          )}
        </div>
        {children}
      </div>
    )
  }

  if (!isVisible) {
    return null
  }

  return <div className={className}>{children}</div>
}
