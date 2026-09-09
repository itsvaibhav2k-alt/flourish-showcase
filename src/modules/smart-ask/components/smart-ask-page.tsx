'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { FloraBreadcrumb } from '@/modules/flora/components'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'
import { Search, Settings, TrendingUp, Save, Loader2 } from 'lucide-react'
import { AmountPreview } from './amount-preview'
import { AskAnalytics } from './ask-analytics'
import { calculateSmartAskAction } from '../actions/calculate-smart-ask'
import { saveSmartAskConfig } from '../actions/save-config'
import { containerVariants, itemVariants } from '@/lib/motion/variants'
import type { SmartAskConfig } from '../schemas/smart-ask.schema'
import type { SmartAskResult } from '@/lib/ai/smart-ask/calculate-amounts'
import type { SmartAskAnalytics } from '../queries/get-smart-ask-analytics'
import { toast } from 'sonner'

interface SmartAskPageProps {
  initialConfig: SmartAskConfig | null
  analytics: SmartAskAnalytics
}

/**
 * Main Smart Ask page component
 * Allows configuration, preview calculations, and analytics viewing
 */
export function SmartAskPage({ initialConfig, analytics }: SmartAskPageProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'config' | 'analytics'>('preview')
  const [contactId, setContactId] = useState('')
  const [previewResult, setPreviewResult] = useState<SmartAskResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Config state
  const [config, setConfig] = useState({
    stretch_multiplier: initialConfig?.stretch_multiplier ?? 1.5,
    target_multiplier: initialConfig?.target_multiplier ?? 1.2,
    accessible_multiplier: initialConfig?.accessible_multiplier ?? 1.0,
    capacity_weight: initialConfig?.capacity_weight ?? 0.3,
    high_risk_reduction: initialConfig?.high_risk_reduction ?? 0.2,
    medium_risk_reduction: initialConfig?.medium_risk_reduction ?? 0.1,
    min_confidence_score: initialConfig?.min_confidence_score ?? 0.6,
    enabled: initialConfig?.enabled ?? true,
  })

  const handleCalculate = async () => {
    if (!contactId) {
      toast.error('Please enter a contact ID to calculate Smart Ask amounts')
      return
    }

    setIsCalculating(true)
    try {
      const result = await calculateSmartAskAction({ contact_id: contactId })

      if (result.success) {
        setPreviewResult(result.data)
        toast.success('Suggested amounts have been calculated successfully')
      } else {
        toast.error(result.error || 'Calculation failed')
      }
    } catch (error) {
      toast.error('Failed to calculate Smart Ask amounts')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const result = await saveSmartAskConfig(config)

      if (result.success) {
        toast.success('Smart Ask settings have been updated successfully')
      } else {
        toast.error(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 py-6 max-w-7xl mx-auto space-y-6"
      >
        <FloraBreadcrumb currentPage="Smart Ask" />

        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Smart Ask</h1>
            <p className="text-neutral-500 text-sm mt-1">
              AI-powered donation amount suggestions based on donor history and capacity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PageGuideTrigger pageKey="smart-ask" />
            <Badge
              className={
                config.enabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-neutral-100 text-neutral-800'
              }
            >
              {config.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Preview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </div>
          </button>
        </motion.div>

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="shadow-card border-neutral-200/60">
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Calculate Smart Ask for Donor
                </h3>
                <p className="text-sm text-neutral-500">
                  Enter a contact ID to preview suggested donation amounts
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="contact-id" className="text-sm font-medium text-neutral-700">
                      Contact ID
                    </Label>
                    <Input
                      id="contact-id"
                      placeholder="Enter contact UUID"
                      value={contactId}
                      onChange={(e) => setContactId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleCalculate}
                      disabled={isCalculating || !contactId}
                      variant="primary"
                    >
                      {isCalculating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Calculate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {previewResult && <AmountPreview result={previewResult} />}
          </motion.div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="shadow-card border-neutral-200/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Smart Ask Settings
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Configure default multipliers and adjustments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enabled" className="text-sm font-medium text-neutral-700">
                      Enabled
                    </Label>
                    <Switch
                      id="enabled"
                      checked={config.enabled}
                      onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Multipliers */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                    Suggestion Multipliers
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="stretch" className="text-sm text-neutral-700">
                        Stretch Multiplier
                      </Label>
                      <Input
                        id="stretch"
                        type="number"
                        step="0.1"
                        min="1"
                        max="3"
                        value={config.stretch_multiplier}
                        onChange={(e) =>
                          setConfig({ ...config, stretch_multiplier: parseFloat(e.target.value) })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Default: 1.5x (50% increase)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="target" className="text-sm text-neutral-700">
                        Target Multiplier
                      </Label>
                      <Input
                        id="target"
                        type="number"
                        step="0.1"
                        min="1"
                        max="2"
                        value={config.target_multiplier}
                        onChange={(e) =>
                          setConfig({ ...config, target_multiplier: parseFloat(e.target.value) })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Default: 1.2x (20% increase)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="accessible" className="text-sm text-neutral-700">
                        Accessible Multiplier
                      </Label>
                      <Input
                        id="accessible"
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="1.5"
                        value={config.accessible_multiplier}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            accessible_multiplier: parseFloat(e.target.value),
                          })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Default: 1.0x (same as base)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Capacity Weight */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                    Capacity Adjustment
                  </h4>
                  <div className="max-w-md">
                    <Label htmlFor="capacity-weight" className="text-sm text-neutral-700">
                      Capacity Weight (0-1)
                    </Label>
                    <Input
                      id="capacity-weight"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={config.capacity_weight}
                      onChange={(e) =>
                        setConfig({ ...config, capacity_weight: parseFloat(e.target.value) })
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      How much to factor in capacity scores from giving potential (default: 0.3)
                    </p>
                  </div>
                </div>

                {/* Risk Adjustments */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                    Lapse Risk Adjustments
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
                    <div>
                      <Label htmlFor="high-risk" className="text-sm text-neutral-700">
                        High Risk Reduction
                      </Label>
                      <Input
                        id="high-risk"
                        type="number"
                        step="0.05"
                        min="0"
                        max="0.5"
                        value={config.high_risk_reduction}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            high_risk_reduction: parseFloat(e.target.value),
                          })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Reduce asks by this percentage for high-risk donors (default: 0.2 = 20%)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="medium-risk" className="text-sm text-neutral-700">
                        Medium Risk Reduction
                      </Label>
                      <Input
                        id="medium-risk"
                        type="number"
                        step="0.05"
                        min="0"
                        max="0.3"
                        value={config.medium_risk_reduction}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            medium_risk_reduction: parseFloat(e.target.value),
                          })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Reduce asks by this percentage for medium-risk donors (default: 0.1 = 10%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confidence Threshold */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                    Confidence Settings
                  </h4>
                  <div className="max-w-md">
                    <Label htmlFor="min-confidence" className="text-sm text-neutral-700">
                      Minimum Confidence Score
                    </Label>
                    <Input
                      id="min-confidence"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={config.min_confidence_score}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          min_confidence_score: parseFloat(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Don't show suggestions below this confidence level (default: 0.6 = 60%)
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    variant="primary"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div variants={itemVariants}>
            <AskAnalytics analytics={analytics} />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
