'use client'

import { ReactNode, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InsightTileProps {
  title: string
  icon: ReactNode
  badge?: ReactNode
  children: ReactNode
  onRefresh?: () => Promise<void>
}

export function InsightTile({
  title,
  icon,
  badge,
  children,
  onRefresh,
}: InsightTileProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch from Radix UI dropdown IDs
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = async () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border-gray-100 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <div className="flex items-center gap-1">
              {badge}
              {mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isRefreshing ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
