import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
}

export default function CommunicationsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-16 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drafts List */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-3 pt-2">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
