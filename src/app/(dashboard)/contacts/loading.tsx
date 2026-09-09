import { Card, CardContent } from '@/components/ui/card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
}

export default function ContactsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
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
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40 ml-auto" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Table rows */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className="border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-6">
                <Skeleton className="h-4 w-4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-4 w-32 ml-auto" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-9 w-9 rounded" />
        </div>
      </div>
    </div>
  )
}
