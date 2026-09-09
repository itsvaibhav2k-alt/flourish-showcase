'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ScoreRadarChartProps {
  capacityScore: number
  affinityScore: number
  propensityScore: number
  size?: number
  animated?: boolean
  className?: string
}

/**
 * Radar chart visualization for the 3 giving potential dimensions
 * Shows Capacity, Affinity, and Propensity as a triangular radar chart
 */
export function ScoreRadarChart({
  capacityScore,
  affinityScore,
  propensityScore,
  size = 280,
  animated = true,
  className,
}: ScoreRadarChartProps) {
  const [displayScores, setDisplayScores] = useState(
    animated
      ? { capacity: 0, affinity: 0, propensity: 0 }
      : { capacity: capacityScore, affinity: affinityScore, propensity: propensityScore }
  )

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayScores({
          capacity: capacityScore,
          affinity: affinityScore,
          propensity: propensityScore,
        })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [capacityScore, affinityScore, propensityScore, animated])

  // Calculate radar chart points
  // Triangle with vertices at 0°, 120°, 240° (top, bottom-right, bottom-left)
  const center = size / 2
  const maxRadius = (size * 0.38) // Leave 12% margin on each side
  const labelRadius = maxRadius + 20

  // Helper to get coordinates for a point on the radar
  const getPoint = (angle: number, value: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    const radius = (value / 100) * maxRadius
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    }
  }

  // Triangle vertices (normalized to 100)
  const angles = {
    capacity: 0, // Top
    propensity: 120, // Bottom-right
    affinity: 240, // Bottom-left
  }

  // Calculate data points
  const dataPoints = {
    capacity: getPoint(angles.capacity, displayScores.capacity),
    propensity: getPoint(angles.propensity, displayScores.propensity),
    affinity: getPoint(angles.affinity, displayScores.affinity),
  }

  // Create background grid (3 levels: 33%, 66%, 100%)
  const gridLevels = [100, 66, 33]
  const gridPolygons = gridLevels.map((level) => {
    const p1 = getPoint(angles.capacity, level)
    const p2 = getPoint(angles.propensity, level)
    const p3 = getPoint(angles.affinity, level)
    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`
  })

  // Create data polygon
  const dataPolygon = `${dataPoints.capacity.x},${dataPoints.capacity.y} ${dataPoints.propensity.x},${dataPoints.propensity.y} ${dataPoints.affinity.x},${dataPoints.affinity.y}`

  // Label positions
  const labels = {
    capacity: getPoint(angles.capacity, 100),
    propensity: getPoint(angles.propensity, 100),
    affinity: getPoint(angles.affinity, 100),
  }

  // Get color based on score
  const getColor = (score: number) => {
    if (score >= 80) return '#16a34a' // green-600
    if (score >= 60) return '#2563eb' // blue-600
    if (score >= 40) return '#f59e0b' // amber-500
    return '#a8a29e' // neutral-400
  }

  const averageScore = Math.round((capacityScore + affinityScore + propensityScore) / 3)

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background grid */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth={i === 0 ? 2 : 1}
            opacity={i === 0 ? 1 : 0.5}
          />
        ))}

        {/* Grid lines from center to vertices */}
        {Object.values(angles).map((angle, i) => {
          const point = getPoint(angle, 100)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#e5e5e5"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )
        })}

        {/* Data polygon fill */}
        <polygon
          points={dataPolygon}
          fill={getColor(averageScore)}
          fillOpacity={0.2}
          className="transition-all duration-500 ease-out"
        />

        {/* Data polygon outline */}
        <polygon
          points={dataPolygon}
          fill="none"
          stroke={getColor(averageScore)}
          strokeWidth={2.5}
          className="transition-all duration-500 ease-out"
        />

        {/* Data points */}
        <circle
          cx={dataPoints.capacity.x}
          cy={dataPoints.capacity.y}
          r={5}
          fill={getColor(capacityScore)}
          className="transition-all duration-500 ease-out"
        />
        <circle
          cx={dataPoints.propensity.x}
          cy={dataPoints.propensity.y}
          r={5}
          fill={getColor(propensityScore)}
          className="transition-all duration-500 ease-out"
        />
        <circle
          cx={dataPoints.affinity.x}
          cy={dataPoints.affinity.y}
          r={5}
          fill={getColor(affinityScore)}
          className="transition-all duration-500 ease-out"
        />

        {/* Labels */}
        <text
          x={labels.capacity.x}
          y={labels.capacity.y - 12}
          textAnchor="middle"
          className="text-xs font-semibold fill-neutral-700"
        >
          Capacity
        </text>
        <text
          x={labels.capacity.x}
          y={labels.capacity.y}
          textAnchor="middle"
          className="text-sm font-bold"
          fill={getColor(capacityScore)}
        >
          {Math.round(displayScores.capacity)}
        </text>

        <text
          x={labels.propensity.x + 8}
          y={labels.propensity.y + 8}
          textAnchor="start"
          className="text-xs font-semibold fill-neutral-700"
        >
          Propensity
        </text>
        <text
          x={labels.propensity.x + 8}
          y={labels.propensity.y + 22}
          textAnchor="start"
          className="text-sm font-bold"
          fill={getColor(propensityScore)}
        >
          {Math.round(displayScores.propensity)}
        </text>

        <text
          x={labels.affinity.x - 8}
          y={labels.affinity.y + 8}
          textAnchor="end"
          className="text-xs font-semibold fill-neutral-700"
        >
          Affinity
        </text>
        <text
          x={labels.affinity.x - 8}
          y={labels.affinity.y + 22}
          textAnchor="end"
          className="text-sm font-bold"
          fill={getColor(affinityScore)}
        >
          {Math.round(displayScores.affinity)}
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-600" />
          <span className="text-neutral-600">80-100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-blue-600" />
          <span className="text-neutral-600">60-79</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-neutral-600">40-59</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-neutral-400" />
          <span className="text-neutral-600">&lt;40</span>
        </div>
      </div>
    </div>
  )
}
