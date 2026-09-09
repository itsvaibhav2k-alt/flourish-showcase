import { Card, CardContent } from '@/components/ui/card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
}

export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="shadow-sm border-neutral-200/60 bg-white">
        <CardContent className="p-0">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 border-b border-neutral-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-4 text-center border-r border-neutral-100 last:border-r-0">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {[...Array(5)].map((_, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-neutral-100 last:border-b-0">
              {[...Array(7)].map((_, dayIdx) => (
                <div key={dayIdx} className="min-h-[120px] p-2 border-r border-neutral-100 last:border-r-0">
                  <Skeleton className="h-6 w-6 rounded-full mb-2" />
                  {weekIdx % 2 === 0 && dayIdx % 3 === 0 && (
                    <Skeleton className="h-6 w-full rounded mb-1" />
                  )}
                  {weekIdx % 3 === 1 && dayIdx % 2 === 1 && (
                    <Skeleton className="h-6 w-full rounded" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
