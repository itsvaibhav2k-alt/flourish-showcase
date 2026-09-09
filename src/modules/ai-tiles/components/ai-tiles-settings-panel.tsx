'use client'

import { useState, useTransition, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, RefreshCw, Loader2, Database, Clock, Trash2, Edit3 } from 'lucide-react'
import { AI_TILE_DEFINITIONS, type BuiltInTileId, type CustomAITile } from '@/lib/ai-tiles/registry'
import { enableAITile, disableAITile, updateCustomTile, deleteCustomTile } from '@/lib/ai-tiles/actions'
import { CustomTileBuilderModal } from './custom-tile-builder-modal'
import { cn } from '@/lib/utils'

interface AITilesSettingsPanelProps {
  enabledTiles: BuiltInTileId[]
  customTiles: CustomAITile[]
  isAdmin: boolean
}

const scheduleLabels = {
  daily: 'Refreshes Daily',
  weekly: 'Refreshes Weekly',
  manual: 'Manual Refresh',
} as const

const dataSourceLabels = {
  donors: 'Donors',
  volunteers: 'Volunteers',
  gifts: 'Gifts',
  contacts: 'Contacts',
  communications: 'Communications',
  tasks: 'Tasks',
  shifts: 'Shifts',
} as const

export function AITilesSettingsPanel({
  enabledTiles,
  customTiles: initialCustomTiles,
  isAdmin,
}: AITilesSettingsPanelProps) {
  const [enabled, setEnabled] = useState<Set<BuiltInTileId>>(new Set(enabledTiles))
  const [customTiles, setCustomTiles] = useState<CustomAITile[]>(initialCustomTiles)
  const [isPending, startTransition] = useTransition()
  const [pendingTileId, setPendingTileId] = useState<BuiltInTileId | null>(null)
  const [pendingCustomTileId, setPendingCustomTileId] = useState<string | null>(null)
  const [showCustomTileBuilder, setShowCustomTileBuilder] = useState(false)
  const [editingTile, setEditingTile] = useState<CustomAITile | null>(null)
  const [deletingTile, setDeletingTile] = useState<CustomAITile | null>(null)

  // Handle custom tile toggle
  const handleCustomTileToggle = useCallback(async (tile: CustomAITile, checked: boolean) => {
    if (!isAdmin) {
      toast.error('Permission denied', {
        description: 'Only administrators can manage AI tiles.',
      })
      return
    }

    setPendingCustomTileId(tile.id)

    // Optimistically update UI
    setCustomTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, enabled: checked } : t))
    )

    startTransition(async () => {
      const result = await updateCustomTile(tile.id, { enabled: checked })

      if (result.success) {
        toast.success(
          checked ? 'Custom tile enabled' : 'Custom tile disabled',
          {
            description: `${tile.name} has been ${checked ? 'enabled' : 'disabled'}.`,
          }
        )
      } else {
        // Revert optimistic update on error
        setCustomTiles(prev =>
          prev.map(t => (t.id === tile.id ? { ...t, enabled: !checked } : t))
        )
        toast.error('Error', {
          description: result.error || 'Failed to update custom tile.',
        })
      }

      setPendingCustomTileId(null)
    })
  }, [isAdmin])

  // Handle custom tile delete
  const handleDeleteTile = useCallback(async () => {
    if (!deletingTile || !isAdmin) return

    setPendingCustomTileId(deletingTile.id)

    startTransition(async () => {
      const result = await deleteCustomTile(deletingTile.id)

      if (result.success) {
        setCustomTiles(prev => prev.filter(t => t.id !== deletingTile.id))
        toast.success('Custom tile deleted', {
          description: `${deletingTile.name} has been deleted.`,
        })
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to delete custom tile.',
        })
      }

      setPendingCustomTileId(null)
      setDeletingTile(null)
    })
  }, [deletingTile, isAdmin])

  // Handle edit tile
  const handleEditTile = useCallback((tile: CustomAITile) => {
    setEditingTile(tile)
    setShowCustomTileBuilder(true)
  }, [])

  // Handle modal close
  const handleModalClose = useCallback((open: boolean) => {
    setShowCustomTileBuilder(open)
    if (!open) {
      setEditingTile(null)
    }
  }, [])

  // Handle tile save (after edit)
  const handleTileSave = useCallback((updatedTile: CustomAITile) => {
    setCustomTiles(prev =>
      prev.map(t => (t.id === updatedTile.id ? updatedTile : t))
    )
  }, [])

  const handleToggle = async (tileId: BuiltInTileId, checked: boolean) => {
    if (!isAdmin) {
      toast.error('Permission denied', {
        description: 'Only administrators can manage AI tiles.',
      })
      return
    }

    setPendingTileId(tileId)

    // Optimistically update UI
    const newEnabled = new Set(enabled)
    if (checked) {
      newEnabled.add(tileId)
    } else {
      newEnabled.delete(tileId)
    }
    setEnabled(newEnabled)

    startTransition(async () => {
      const result = checked
        ? await enableAITile(tileId)
        : await disableAITile(tileId)

      if (result.success) {
        toast.success(
          checked ? 'AI tile enabled' : 'AI tile disabled',
          {
            description: `${AI_TILE_DEFINITIONS[tileId].name} has been ${checked ? 'enabled' : 'disabled'}.`,
          }
        )
      } else {
        // Revert optimistic update on error
        setEnabled(new Set(enabledTiles))
        toast.error('Error', {
          description: result.error || 'Failed to update AI tile.',
        })
      }

      setPendingTileId(null)
    })
  }

  return (
    <>
      <CustomTileBuilderModal
        open={showCustomTileBuilder}
        onOpenChange={handleModalClose}
        editingTile={editingTile}
        onSave={handleTileSave}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTile} onOpenChange={(open) => !open && setDeletingTile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Tile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingTile?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTile}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
      {/* Built-in AI Tiles */}
      <Card className="shadow-card border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Built-in AI Tiles
          </CardTitle>
          <CardDescription>
            AI-powered insights that appear on your dashboard. Data is automatically refreshed on schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.values(AI_TILE_DEFINITIONS).map((tile) => {
            const isEnabled = enabled.has(tile.id)
            const isLoading = isPending && pendingTileId === tile.id
            const Icon = tile.icon

            return (
              <div key={tile.id}>
                <Card
                  className={cn(
                    'relative overflow-hidden transition-all duration-200 border',
                    isEnabled
                      ? 'border-primary-200 bg-primary-50 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                          isEnabled
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-neutral-100 text-neutral-600'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-sm text-neutral-900">
                            {tile.name}
                          </h5>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {scheduleLabels[tile.refreshSchedule]}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                          {tile.description}
                        </p>

                        <div className="flex items-center gap-1 flex-wrap text-xs text-neutral-500">
                          <Database className="h-3 w-3" />
                          <span className="font-medium">Data sources:</span>
                          <div className="flex gap-1 flex-wrap">
                            {tile.dataSources.map((source) => (
                              <Badge
                                key={source}
                                variant="secondary"
                                className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0"
                              >
                                {dataSourceLabels[source]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                          {isLoading ? (
                              <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
                          ) : (
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => handleToggle(tile.id, checked)}
                                disabled={!isAdmin || isLoading}
                                aria-label={`Toggle ${tile.name}`}
                              />
                          )}
                        <span className="text-xs font-medium text-neutral-700">
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      {isEnabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                            disabled={!isAdmin}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            Refresh Now
                          </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Custom AI Tiles */}
      <Card className="shadow-card border-neutral-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Custom AI Tiles
              </CardTitle>
              <CardDescription>
                Create your own AI-powered insights with custom prompts and data sources.
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setShowCustomTileBuilder(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Tile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {customTiles.length === 0 ? (
            <div
              className="text-center py-12"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-violet-600" />
              </div>
              <h4 className="font-semibold text-neutral-900 mb-1">No custom tiles yet</h4>
              <p className="text-sm text-neutral-600 mb-4 max-w-md mx-auto">
                Create custom AI tiles with your own prompts to get tailored insights for your organization.
              </p>
              {isAdmin && (
                <Button
                  onClick={() => setShowCustomTileBuilder(true)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Tile
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {customTiles.map((tile, index) => (
                <div
                  key={tile.id}
                >
                  <Card
                    className={cn(
                      'border transition-all duration-200',
                      tile.enabled
                        ? 'border-primary-200 bg-primary-50 shadow-sm'
                        : 'border-neutral-200 bg-white opacity-60'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm',
                            tile.enabled
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-neutral-100 text-neutral-600'
                          )}
                        >
                          {tile.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-sm text-neutral-900">
                              {tile.name}
                            </h5>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-violet-50 text-violet-700 border-violet-200"
                            >
                              Custom
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {scheduleLabels[tile.refreshSchedule]}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-600 leading-relaxed mb-2 line-clamp-2">
                            {tile.description}
                          </p>

                          <div className="flex items-center gap-1 flex-wrap text-xs text-neutral-500">
                            <Database className="h-3 w-3" />
                            <span className="font-medium">Data sources:</span>
                            <div className="flex gap-1 flex-wrap">
                              {tile.dataSources.map((source) => (
                                <Badge
                                  key={source}
                                  variant="secondary"
                                  className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0"
                                >
                                  {dataSourceLabels[source]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                        <div className="flex items-center gap-2">
                            {pendingCustomTileId === tile.id ? (
                                <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
                            ) : (
                                <Switch
                                  checked={tile.enabled}
                                  onCheckedChange={(checked) => handleCustomTileToggle(tile, checked)}
                                  disabled={!isAdmin || pendingCustomTileId === tile.id}
                                  aria-label={`Toggle ${tile.name}`}
                                />
                            )}
                          <span className="text-xs font-medium text-neutral-700">
                            {tile.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                              onClick={() => handleEditTile(tile)}
                              disabled={pendingCustomTileId === tile.id}
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setDeletingTile(tile)}
                              disabled={pendingCustomTileId === tile.id}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isAdmin && (
        <div
          className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <p className="text-xs text-amber-800">
            Only administrators can manage AI tiles. Contact your organization admin to enable or configure AI-powered insights.
          </p>
        </div>
      )}
    </div>
    </>
  )
}
