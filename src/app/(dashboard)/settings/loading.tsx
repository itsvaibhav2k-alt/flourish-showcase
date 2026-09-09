import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
}

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* AI Settings Card */}
      <Card className="shadow-sm border-primary-100 bg-gradient-to-r from-primary-50/50 to-violet-50/50 mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-16 rounded-lg" />
        <Skeleton className="h-10 w-16 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Content Card */}
      <Card className="shadow-sm border-neutral-200/60 bg-white">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <div className="pt-4">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
