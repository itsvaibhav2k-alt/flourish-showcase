'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Settings, ChevronRight, Loader2 } from 'lucide-react'
import { ADDON_PAGE_TEMPLATES, type AddonPageId } from '@/lib/addon-pages/registry'
import { enableAddonPage, disableAddonPage } from '@/lib/addon-pages/actions'
import { cn } from '@/lib/utils'

interface AddonSettingsPanelProps {
  enabledPages: AddonPageId[]
  isAdmin: boolean
}

const categoryLabels = {
  communication: 'Communication',
  analytics: 'Analytics',
  management: 'Management',
} as const

const categoryColors = {
  communication: 'bg-violet-50 text-violet-700 border-violet-200',
  analytics: 'bg-teal-50 text-teal-700 border-teal-200',
  management: 'bg-amber-50 text-amber-700 border-amber-200',
} as const

export function AddonSettingsPanel({ enabledPages, isAdmin }: AddonSettingsPanelProps) {
  const [enabled, setEnabled] = useState<Set<AddonPageId>>(new Set(enabledPages))
  const [isPending, startTransition] = useTransition()
  const [pendingPageId, setPendingPageId] = useState<AddonPageId | null>(null)

  const handleToggle = async (pageId: AddonPageId, checked: boolean) => {
    if (!isAdmin) {
      toast.error('Permission denied', {
        description: 'Only administrators can manage add-on pages.',
      })
      return
    }

    setPendingPageId(pageId)

    // Optimistically update UI
    const newEnabled = new Set(enabled)
    if (checked) {
      newEnabled.add(pageId)
    } else {
      newEnabled.delete(pageId)
    }
    setEnabled(newEnabled)

    startTransition(async () => {
      const result = checked
        ? await enableAddonPage(pageId)
        : await disableAddonPage(pageId)

      if (result.success) {
        toast.success(
          checked ? 'Add-on enabled' : 'Add-on disabled',
          {
            description: `${ADDON_PAGE_TEMPLATES[pageId].name} has been ${checked ? 'enabled' : 'disabled'}.`,
          }
        )
      } else {
        // Revert optimistic update on error
        setEnabled(new Set(enabledPages))
        toast.error('Error', {
          description: result.error || 'Failed to update add-on page.',
        })
      }

      setPendingPageId(null)
    })
  }

  // Group pages by category
  const pagesByCategory = Object.values(ADDON_PAGE_TEMPLATES).reduce(
    (acc, page) => {
      if (!acc[page.category]) {
        acc[page.category] = []
      }
      acc[page.category].push(page)
      return acc
    },
    {} as Record<string, typeof ADDON_PAGE_TEMPLATES[AddonPageId][]>
  )

  return (
    <Card className="shadow-card border-neutral-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">
          Add-on Pages
        </CardTitle>
        <CardDescription>
          Enable or disable optional pages that extend Flourish with specialized features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(pagesByCategory).map(([category, pages], categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            <h4 className="text-sm font-medium text-neutral-700 mb-3">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {pages.map((page, pageIndex) => {
                const isEnabled = enabled.has(page.id)
                const isLoading = isPending && pendingPageId === page.id
                const Icon = page.icon

                return (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (categoryIndex * 0.1) + (pageIndex * 0.05) }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  >
                    <Card
                      className={cn(
                        'relative overflow-hidden transition-all duration-200 border',
                        isEnabled
                          ? 'border-primary-200 bg-gradient-to-br from-primary-50/50 to-white shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <motion.div
                            className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                              isEnabled
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-neutral-100 text-neutral-600'
                            )}
                            animate={isEnabled ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Icon className="h-5 w-5" />
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-sm text-neutral-900">
                                {page.name}
                              </h5>
                              <Badge
                                variant="secondary"
                                className={cn('text-xs', categoryColors[page.category])}
                              >
                                {categoryLabels[page.category]}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                              {page.description}
                            </p>

                            {page.requiredTables && page.requiredTables.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                                <span className="font-medium">Data:</span>
                                <span className="truncate">
                                  {page.requiredTables.slice(0, 2).join(', ')}
                                  {page.requiredTables.length > 2 && ` +${page.requiredTables.length - 2}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                          <div className="flex items-center gap-2">
                            <AnimatePresence mode="wait">
                              {isLoading ? (
                                <motion.div
                                  key="loader"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                >
                                  <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="switch"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                >
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => handleToggle(page.id, checked)}
                                    disabled={!isAdmin || isLoading}
                                    aria-label={`Toggle ${page.name}`}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <span className="text-xs font-medium text-neutral-700">
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>

                          {isEnabled && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ delay: 0.1 }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                disabled={!isAdmin}
                              >
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                Configure
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}

        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <p className="text-xs text-amber-800">
              Only administrators can manage add-on pages. Contact your organization admin to enable or disable features.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
