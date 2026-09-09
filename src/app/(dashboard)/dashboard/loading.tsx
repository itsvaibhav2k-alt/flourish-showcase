import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] bg-neutral-50/50 flex flex-col">
      <div className="px-6 py-5 flex-1 flex flex-col gap-5">
        {/* Header skeleton */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>

        {/* Stats + Quick Actions Row */}
        <div className="grid gap-3 grid-cols-4 lg:grid-cols-8 flex-shrink-0">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="shadow-sm border-neutral-200/60 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-8" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content - 3 Column Grid */}
        <div className="grid gap-5 lg:grid-cols-3 flex-1 min-h-0">
          {/* Column 1: Recent Activity */}
          <Card className="shadow-sm border-neutral-200/60 bg-white flex flex-col h-full">
            <CardHeader className="py-3 px-5 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-neutral-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Upcoming Shifts */}
          <Card className="shadow-sm border-neutral-200/60 bg-white flex flex-col h-full">
            <CardHeader className="py-3 px-5 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-neutral-100">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Status Widgets */}
          <div className="flex flex-col h-full gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-sm border-neutral-200/60 bg-white flex-1">
                <CardContent className="p-5 h-full flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
