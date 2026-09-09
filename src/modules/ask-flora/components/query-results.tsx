'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { QueryResultData } from '@/lib/ai/query-parser'
import { TrendingUp, TrendingDown, Minus, User, Calendar, DollarSign, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

// Extended type to include conversation
interface ExtendedQueryResultData extends QueryResultData {
  type: 'list' | 'aggregate' | 'comparison' | 'conversation'
}

interface QueryResultsProps {
  result: ExtendedQueryResultData
  executionTime?: number
}

export function QueryResults({ result, executionTime }: QueryResultsProps) {
  // For conversational responses, show a chat-like UI
  if (result.type === 'conversation') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex gap-3 max-w-3xl">
          <div className="flex-shrink-0">
            <div className="relative w-10 h-10">
              <Image
                src="/flora-waving.png"
                alt="Flora"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div className="absolute -top-0.5 -right-0.5">
                <Sparkles className="h-3 w-3 text-violet-500" />
              </div>
            </div>
          </div>
          <Card className="flex-1 bg-gradient-to-br from-violet-50 to-white border-violet-100">
            <CardContent className="p-4">
              <div className="prose prose-sm max-w-none text-neutral-700">
                {result.summary?.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
              {executionTime && (
                <div className="mt-3 pt-2 border-t border-violet-100">
                  <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                    {executionTime}ms
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  // For data results, show the card-based UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-3 max-w-4xl">
        <div className="flex-shrink-0">
          <div className="relative w-10 h-10">
            <Image
              src="/flora-waving.png"
              alt="Flora"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="absolute -top-0.5 -right-0.5">
              <Sparkles className="h-3 w-3 text-violet-500" />
            </div>
          </div>
        </div>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {result.summary && (
                  <p className="text-sm text-neutral-700 leading-relaxed">{result.summary}</p>
                )}
              </div>
              {executionTime && (
                <Badge variant="secondary" className="text-xs ml-3 flex-shrink-0">
                  {executionTime}ms
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result.type === 'list' && <ListResults data={result} />}
            {result.type === 'aggregate' && <AggregateResults data={result} />}
            {result.type === 'comparison' && <ComparisonResults data={result} />}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function ListResults({ data }: { data: QueryResultData }) {
  if (!data.rows || data.rows.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No results found</p>
      </div>
    )
  }

  // Determine which columns to show based on available data
  const sampleRow = data.rows[0]
  const columns = Object.keys(sampleRow).filter(
    (key) =>
      !key.includes('id') &&
      !key.includes('organization') &&
      !key.includes('created_at') &&
      !key.includes('updated_at') &&
      sampleRow[key] !== null &&
      sampleRow[key] !== undefined
  )

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="capitalize">
                {formatColumnName(col)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col}>{formatCellValue(col, row[col])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function AggregateResults({ data }: { data: QueryResultData }) {
  if (!data.aggregates) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(data.aggregates).map(([key, value]) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-white to-neutral-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-lg">
                  {getMetricIcon(key)}
                </div>
                <div>
                  <p className="text-sm text-neutral-600 capitalize">
                    {formatColumnName(key)}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {formatMetricValue(key, value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function ComparisonResults({ data }: { data: QueryResultData }) {
  if (!data.comparison) return null

  const { current, previous, change } = data.comparison

  return (
    <div className="space-y-4">
      {Object.keys(current).map((key) => {
        const curr = current[key]
        const prev = previous[key]
        const chg = change[key]
        const isIncrease = String(chg).startsWith('+')
        const isDecrease = String(chg).startsWith('-')

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-white to-neutral-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600 capitalize mb-2">
                      {formatColumnName(key)}
                    </p>
                    <div className="flex items-baseline gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Current</p>
                        <p className="text-2xl font-bold text-neutral-900">
                          {formatMetricValue(key, curr)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Previous</p>
                        <p className="text-xl text-neutral-600">
                          {formatMetricValue(key, prev)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isIncrease && (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    )}
                    {isDecrease && (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    {!isIncrease && !isDecrease && (
                      <Minus className="h-5 w-5 text-neutral-400" />
                    )}
                    <Badge
                      variant={
                        isIncrease ? 'default' : isDecrease ? 'destructive' : 'secondary'
                      }
                      className={
                        isIncrease
                          ? 'bg-green-100 text-green-700'
                          : isDecrease
                            ? 'bg-red-100 text-red-700'
                            : ''
                      }
                    >
                      {chg}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// Helper functions

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatCellValue(columnName: string, value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-neutral-400">-</span>
  }

  // Format monetary values
  if (
    columnName.includes('amount') ||
    columnName.includes('giving') ||
    columnName.includes('revenue')
  ) {
    return `$${Number(value).toLocaleString()}`
  }

  // Format dates
  if (
    columnName.includes('date') ||
    columnName.includes('_at') ||
    value instanceof Date
  ) {
    return new Date(value).toLocaleDateString()
  }

  // Format booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  // Format arrays (tags, etc.)
  if (Array.isArray(value)) {
    return (
      <div className="flex gap-1 flex-wrap">
        {value.map((item: string, idx: number) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    )
  }

  return String(value)
}

function formatMetricValue(key: string, value: number | string): string {
  if (typeof value === 'string') return value

  // Format monetary values
  if (
    key.includes('amount') ||
    key.includes('giving') ||
    key.includes('revenue') ||
    key.includes('sum')
  ) {
    return `$${value.toLocaleString()}`
  }

  // Format percentages
  if (key.includes('percent') || key.includes('rate')) {
    return `${value.toFixed(1)}%`
  }

  // Format regular numbers
  if (Number.isInteger(value)) {
    return value.toLocaleString()
  }

  return value.toFixed(2)
}

function getMetricIcon(key: string): React.ReactNode {
  const iconClass = 'h-5 w-5 text-primary-600'

  if (key.includes('amount') || key.includes('giving') || key.includes('revenue')) {
    return <DollarSign className={iconClass} />
  }

  if (key.includes('count') || key.includes('total')) {
    return <User className={iconClass} />
  }

  if (key.includes('date')) {
    return <Calendar className={iconClass} />
  }

  return <TrendingUp className={iconClass} />
}
