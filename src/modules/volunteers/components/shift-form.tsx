'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Type,
  FileText,
  Minus,
  Plus,
  AlertCircle,
  Loader2,
  Lightbulb,
  Repeat,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { createShift } from '../actions/create-shift'
import { updateShift } from '../actions/update-shift'
import type { Shift, RecurrenceRule } from '../schemas/shift.schema'

interface ShiftFormProps {
  shift?: Shift
  onSuccess?: () => void
}

// Generate time options in 15-minute intervals
function generateTimeOptions() {
  const times: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      times.push(`${h}:${m}`)
    }
  }
  return times
}

const TIME_OPTIONS = generateTimeOptions()

// Format time for display (12-hour format)
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function ShiftForm({ shift, onSuccess }: ShiftFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parse existing shift datetime values
  const parseExistingDateTime = (isoString?: string) => {
    if (!isoString) return { date: undefined, time: '09:00' }
    const date = new Date(isoString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = (Math.round(date.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0')
    return { date, time: `${hours}:${minutes}` }
  }

  const startParsed = parseExistingDateTime(shift?.start_time)
  const endParsed = parseExistingDateTime(shift?.end_time)

  // Form state
  const [startDate, setStartDate] = useState<Date | undefined>(startParsed.date)
  const [startTime, setStartTime] = useState(startParsed.time)
  const [endDate, setEndDate] = useState<Date | undefined>(endParsed.date)
  const [endTime, setEndTime] = useState(endParsed.time || '17:00')
  const [capacity, setCapacity] = useState(shift?.capacity || 10)

  // Recurring shift state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFreq, setRecurrenceFreq] = useState<
    'daily' | 'weekly' | 'biweekly' | 'monthly'
  >('weekly')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>()
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState<number>(4)
  const [recurrenceEndType, setRecurrenceEndType] = useState<'date' | 'count'>('count')

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const toggleDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Combine date and time for datetime values
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      setIsSubmitting(false)
      return
    }

    const startDateTime = new Date(startDate)
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    startDateTime.setHours(startHours, startMinutes, 0, 0)

    const endDateTime = new Date(endDate)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    endDateTime.setHours(endHours, endMinutes, 0, 0)

    const recurrence_rule: RecurrenceRule | undefined =
      isRecurring && !shift
        ? {
            freq: recurrenceFreq,
            ...(
              (recurrenceFreq === 'weekly' || recurrenceFreq === 'biweekly') &&
              recurrenceDays.length > 0
                ? { daysOfWeek: recurrenceDays }
                : {}
            ),
            ...(recurrenceEndType === 'date' && recurrenceEndDate
              ? { endDate: recurrenceEndDate.toISOString() }
              : {}),
            ...(recurrenceEndType === 'count'
              ? { occurrences: recurrenceOccurrences }
              : {}),
          }
        : undefined;

    const input = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      capacity: capacity,
      recurrence_rule,
    }

    const result = shift
      ? await updateShift(shift.id, input)
      : await createShift(input)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/volunteers/shifts')
      }
    }
  }

  const adjustCapacity = (delta: number) => {
    setCapacity((prev) => Math.max(1, Math.min(100, prev + delta)))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 p-4">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose-800">
              There was a problem
            </p>
            <p className="text-sm text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Type className="h-4 w-4 text-primary-600" />
                </div>
                Basic Information
              </div>

              {/* Title Field */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-neutral-700 text-sm">
                  Shift Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={shift?.title}
                  required
                  placeholder="e.g., Community Garden Cleanup"
                  className="h-10"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description" className="text-neutral-700 text-sm">
                    Description
                  </Label>
                  <span className="text-xs text-neutral-400">Optional</span>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={shift?.description}
                  placeholder="Describe what volunteers will be doing..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <MapPin className="h-4 w-4 text-primary-600" />
                </div>
                Location
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="location" className="text-neutral-700 text-sm">
                    Address or Venue
                  </Label>
                  <span className="text-xs text-neutral-400">Optional</span>
                </div>
                <Input
                  id="location"
                  name="location"
                  defaultValue={shift?.location}
                  placeholder="e.g., 123 Main St, City, State"
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="shadow-sm bg-gradient-to-br from-primary-50 to-violet-50 border-primary-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-900 mb-3">
                <Lightbulb className="h-4 w-4" />
                Quick Tips
              </div>
              <ul className="space-y-1.5 text-sm text-primary-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Clear titles help volunteers find opportunities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Include parking or access instructions in location
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Date & Time Card */}
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Clock className="h-4 w-4 text-primary-600" />
                </div>
                Date & Time
              </div>

              {/* Start Date & Time */}
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-neutral-700 text-sm">
                    Start Date <span className="text-rose-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'h-10 w-full justify-start text-left font-normal',
                          !startDate && 'text-neutral-500'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-neutral-400" />
                        {startDate ? format(startDate, 'MMM d, yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          if (!endDate && date) setEndDate(date)
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-700 text-sm">
                    Start Time <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="h-10">
                      <SelectValue>{formatTimeDisplay(startTime)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTimeDisplay(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-neutral-700 text-sm">
                    End Date <span className="text-rose-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'h-10 w-full justify-start text-left font-normal',
                          !endDate && 'text-neutral-500'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-neutral-400" />
                        {endDate ? format(endDate, 'MMM d, yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => {
                          const today = new Date(new Date().setHours(0, 0, 0, 0))
                          return date < today || (startDate ? date < startDate : false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-700 text-sm">
                    End Time <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="h-10">
                      <SelectValue>{formatTimeDisplay(endTime)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTimeDisplay(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Card */}
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Users className="h-4 w-4 text-primary-600" />
                </div>
                Volunteer Capacity
              </div>

              <div className="space-y-3">
                <Label className="text-neutral-700 text-sm">
                  Maximum Volunteers <span className="text-rose-500">*</span>
                </Label>

                <div className="flex items-center gap-4">
                  {/* Stepper Control */}
                  <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white">
                    <button
                      type="button"
                      onClick={() => adjustCapacity(-1)}
                      disabled={capacity <= 1}
                      className="flex h-10 w-10 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg border-r border-neutral-200"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val) && val >= 1 && val <= 100) setCapacity(val)
                      }}
                      min={1}
                      max={100}
                      className="w-16 h-10 text-center text-lg font-semibold bg-transparent border-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustCapacity(1)}
                      disabled={capacity >= 100}
                      className="flex h-10 w-10 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg border-l border-neutral-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick Selection */}
                  <div className="flex items-center gap-2">
                    {[5, 10, 20, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCapacity(num)}
                        className={cn(
                          'px-2.5 py-1 text-sm rounded-md transition-colors',
                          capacity === num
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Shift Card - only for new shifts */}
          {!shift && (
            <Card className="shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                      <Repeat className="h-4 w-4 text-primary-600" />
                    </div>
                    Recurring Shift
                  </div>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {isRecurring && (
                  <div className="space-y-4 pt-2">
                    {/* Frequency */}
                    <div className="space-y-1.5">
                      <Label className="text-neutral-700 text-sm">Frequency</Label>
                      <Select
                        value={recurrenceFreq}
                        onValueChange={(v) =>
                          setRecurrenceFreq(v as typeof recurrenceFreq)
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Day-of-week checkboxes for weekly/biweekly */}
                    {(recurrenceFreq === 'weekly' ||
                      recurrenceFreq === 'biweekly') && (
                      <div className="space-y-1.5">
                        <Label className="text-neutral-700 text-sm">
                          Days of Week
                        </Label>
                        <div className="flex gap-1.5">
                          {DAY_LABELS.map((label, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleDay(i)}
                              className={cn(
                                'h-9 w-9 rounded-lg text-xs font-medium transition-colors',
                                recurrenceDays.includes(i)
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* End type */}
                    <div className="space-y-3">
                      <Label className="text-neutral-700 text-sm">Ends</Label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrenceEnd"
                            checked={recurrenceEndType === 'count'}
                            onChange={() => setRecurrenceEndType('count')}
                            className="h-4 w-4 text-primary-600"
                          />
                          <span className="text-sm text-neutral-700">
                            After
                          </span>
                          <Input
                            type="number"
                            min={1}
                            max={52}
                            value={recurrenceOccurrences}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1 && val <= 52)
                                setRecurrenceOccurrences(val);
                            }}
                            className="h-8 w-16 text-center"
                            disabled={recurrenceEndType !== 'count'}
                          />
                          <span className="text-sm text-neutral-700">
                            occurrences
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrenceEnd"
                            checked={recurrenceEndType === 'date'}
                            onChange={() => setRecurrenceEndType('date')}
                            className="h-4 w-4 text-primary-600"
                          />
                          <span className="text-sm text-neutral-700">On date</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={recurrenceEndType !== 'date'}
                                className={cn(
                                  'h-8 justify-start text-left font-normal',
                                  !recurrenceEndDate && 'text-neutral-500'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-neutral-400" />
                                {recurrenceEndDate
                                  ? format(recurrenceEndDate, 'MMM d, yyyy')
                                  : 'Select'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={recurrenceEndDate}
                                onSelect={setRecurrenceEndDate}
                                disabled={(date) =>
                                  date <
                                  new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[140px] bg-primary-600 hover:bg-primary-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : shift ? (
            'Update Shift'
          ) : (
            'Create Shift'
          )}
        </Button>
      </div>
    </form>
  )
}
