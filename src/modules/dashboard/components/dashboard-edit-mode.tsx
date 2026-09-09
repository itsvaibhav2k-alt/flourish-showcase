'use client'

import * as React from 'react'
import { createContext, useContext, useState, useTransition } from 'react'
import { Pencil, X, Save, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { DashboardTileConfig, DashboardTileId } from '@/modules/settings/schemas/customization'
import { updateDashboardTilesConfig, resetCustomizationToDefaults } from '@/modules/settings/actions/update-customization-settings'
import { DEFAULT_CUSTOMIZATION_SETTINGS } from '@/modules/settings/schemas/customization'

interface DashboardEditModeContextValue {
  isEditMode: boolean
  setIsEditMode: (value: boolean) => void
  tiles: DashboardTileConfig[]
  setTiles: React.Dispatch<React.SetStateAction<DashboardTileConfig[]>>
  hasChanges: boolean
  setHasChanges: (value: boolean) => void
  toggleTileVisibility: (id: DashboardTileId) => void
  reorderTiles: (activeId: string, overId: string) => void
}

const DashboardEditModeContext = createContext<DashboardEditModeContextValue | null>(null)

export function useDashboardEditMode() {
  const context = useContext(DashboardEditModeContext)
  if (!context) {
    throw new Error('useDashboardEditMode must be used within DashboardEditModeProvider')
  }
  return context
}

interface DashboardEditModeProviderProps {
  children: React.ReactNode
  initialTiles: DashboardTileConfig[]
  isAdmin: boolean
}

export function DashboardEditModeProvider({
  children,
  initialTiles,
  isAdmin
}: DashboardEditModeProviderProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [tiles, setTiles] = useState<DashboardTileConfig[]>(initialTiles)
  const [originalTiles, setOriginalTiles] = useState<DashboardTileConfig[]>(initialTiles)
  const [hasChanges, setHasChanges] = useState(false)
  const [isPending, startTransition] = useTransition()

  const toggleTileVisibility = (id: DashboardTileId) => {
    setTiles(prev => prev.map(tile =>
      tile.id === id ? { ...tile, visible: !tile.visible } : tile
    ))
    setHasChanges(true)
  }

  const reorderTiles = (activeId: string, overId: string) => {
    setTiles(prev => {
      const oldIndex = prev.findIndex(t => t.id === activeId)
      const newIndex = prev.findIndex(t => t.id === overId)

      if (oldIndex === -1 || newIndex === -1) return prev

      const newTiles = [...prev]
      const [removed] = newTiles.splice(oldIndex, 1)
      newTiles.splice(newIndex, 0, removed)

      // Update order values
      return newTiles.map((tile, index) => ({
        ...tile,
        order: index
      }))
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateDashboardTilesConfig(tiles)
      if (result.success) {
        toast.success('Dashboard saved', {
          description: 'Your dashboard layout has been updated.',
        })
        setOriginalTiles(tiles)
        setHasChanges(false)
        setIsEditMode(false)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to save dashboard.',
        })
      }
    })
  }

  const handleCancel = () => {
    setTiles(originalTiles)
    setHasChanges(false)
    setIsEditMode(false)
  }

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetCustomizationToDefaults('dashboard')
      if (result.success) {
        const defaultTiles = DEFAULT_CUSTOMIZATION_SETTINGS.dashboard.tiles
        setTiles(defaultTiles)
        setOriginalTiles(defaultTiles)
        toast.success('Dashboard reset', {
          description: 'Dashboard has been reset to defaults.',
        })
        setHasChanges(false)
        setIsEditMode(false)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to reset dashboard.',
        })
      }
    })
  }

  const contextValue: DashboardEditModeContextValue = {
    isEditMode,
    setIsEditMode,
    tiles,
    setTiles,
    hasChanges,
    setHasChanges,
    toggleTileVisibility,
    reorderTiles,
  }

  return (
    <DashboardEditModeContext.Provider value={contextValue}>
      {children}

      {/* Floating Edit Button (Admin only) */}
      {isAdmin && !isEditMode && (
        <Button
          onClick={() => setIsEditMode(true)}
          className="fixed bottom-6 right-6 z-50 shadow-lg bg-primary-600 hover:bg-primary-700 text-white rounded-full h-12 px-5"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Customize
        </Button>
      )}

      {/* Edit Mode Toolbar */}
      {isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-900">
                Edit Mode
              </span>
              <span className="text-xs text-neutral-500">
                Click widgets to toggle visibility, drag to reorder
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
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
          </div>
          {hasChanges && (
            <div className="bg-amber-50 text-amber-800 text-xs text-center py-1 border-t border-amber-200">
              You have unsaved changes
            </div>
          )}
        </div>
      )}
    </DashboardEditModeContext.Provider>
  )
}
