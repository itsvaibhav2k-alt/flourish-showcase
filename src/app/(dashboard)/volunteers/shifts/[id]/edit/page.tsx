import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShiftForm } from '@/modules/volunteers/components/shift-form'
import { getShiftById } from '@/modules/volunteers/queries/get-shifts'
import type { Shift } from '@/modules/volunteers/schemas/shift.schema'

interface EditShiftPageProps {
  params: Promise<{ id: string }>
}

export default async function EditShiftPage({ params }: EditShiftPageProps) {
  const { id } = await params

  const shiftData = await getShiftById(id)

  if (!shiftData) {
    notFound()
  }

  // Map the query result to match the Shift schema expected by ShiftForm
  const shift: Shift = {
    id: shiftData.id,
    organization_id: shiftData.organization_id,
    title: shiftData.title,
    description: shiftData.description || undefined,
    location: shiftData.location || undefined,
    start_time: shiftData.start_time,
    end_time: shiftData.end_time,
    capacity: shiftData.capacity || 0,
    status: shiftData.status as 'open' | 'full' | 'completed' | 'cancelled',
    created_at: shiftData.created_at,
    updated_at: shiftData.created_at, // Use created_at as fallback
    created_by: shiftData.organization_id, // Use org_id as fallback
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/volunteers/shifts/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Shift</h1>
          <p className="text-neutral-500 mt-1">
            Update shift details for {shift.title}
          </p>
        </div>
      </div>

      <ShiftForm shift={shift} />
    </div>
  )
}
