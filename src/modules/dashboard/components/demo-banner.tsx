'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Database, ArrowRight, Trash2, CheckCircle } from 'lucide-react'

export type DemoBannerMode = 'load' | 'delete'

interface DemoBannerProps {
  mode: DemoBannerMode
  onLoadDemo: () => void
  onDeleteDemo: () => void
  isLoading: boolean
}

export function DemoBanner({ mode, onLoadDemo, onDeleteDemo, isLoading }: DemoBannerProps) {
  if (mode === 'load') {
    return (
      <Card className="shadow-card border-primary-200/60 bg-gradient-to-br from-primary-50 to-violet-50 mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Image
                src="/flora-waving.png"
                alt="Flora mascot"
                width={64}
                height={96}
                className="object-contain"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                Want to see Flourish in action?
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Load sample data to explore all features including donor management, volunteer scheduling, and AI-powered communications.
              </p>

              <div className="flex items-center gap-3">
                <Button
                  onClick={onLoadDemo}
                  disabled={isLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading Sample Data...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Load Sample Data
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>

                {!isLoading && (
                  <p className="text-xs text-neutral-500">
                    Adds 30 contacts, gifts, shifts, and email drafts
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Delete mode - show after demo data has been loaded
  return (
    <Card className="shadow-card border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              Sample data loaded successfully!
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Explore the dashboard, contacts, donors, and volunteers. When you&apos;re ready to use your own data, delete the sample data below.
            </p>

            <div className="flex items-center gap-3">
              <Button
                onClick={onDeleteDemo}
                disabled={isLoading}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    Deleting Sample Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Sample Data
                  </>
                )}
              </Button>

              {!isLoading && (
                <p className="text-xs text-neutral-500">
                  This will remove all sample contacts, gifts, and shifts
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
