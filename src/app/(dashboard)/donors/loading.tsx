import { Card, CardContent } from '@/components/ui/card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
}

export default function DonorsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Table */}
      <Card className="shadow-sm border-neutral-200/60 bg-white">
        <CardContent className="p-0">
          {/* Table header */}
          <div className="border-b border-neutral-200 px-6 py-4">
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28 ml-auto" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-6">
                <Skeleton className="h-4 w-4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
