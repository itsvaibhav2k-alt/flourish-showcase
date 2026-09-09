'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import {
  createShiftSchema,
  type CreateShiftInput,
  type RecurrenceRule,
} from '../schemas/shift.schema'
import { revalidatePath } from 'next/cache'

const MAX_OCCURRENCES = 52;

function generateOccurrenceDates(
  startTime: Date,
  endTime: Date,
  rule: RecurrenceRule,
): Array<{ start: Date; end: Date }> {
  const dates: Array<{ start: Date; end: Date }> = [];
  const durationMs = endTime.getTime() - startTime.getTime();
  const maxCount = rule.occurrences
    ? Math.min(rule.occurrences, MAX_OCCURRENCES)
    : MAX_OCCURRENCES;
  const endDate = rule.endDate ? new Date(rule.endDate) : null;

  let current = new Date(startTime);

  for (let i = 0; i < maxCount; i++) {
    // Advance to next occurrence
    current = getNextDate(current, rule, i === 0);
    if (!current) break;

    if (endDate && current > endDate) break;

    const occurrenceStart = new Date(current);
    const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
    dates.push({ start: occurrenceStart, end: occurrenceEnd });
  }

  return dates;
}

function getNextDate(
  current: Date,
  rule: RecurrenceRule,
  isFirst: boolean,
): Date {
  const next = new Date(current);

  if (isFirst) {
    // For weekly with daysOfWeek, find the next matching day after the start
    if (
      (rule.freq === 'weekly' || rule.freq === 'biweekly') &&
      rule.daysOfWeek?.length
    ) {
      // Find next valid day of week after current date
      for (let d = 1; d <= 7; d++) {
        const candidate = new Date(next);
        candidate.setDate(candidate.getDate() + d);
        if (rule.daysOfWeek.includes(candidate.getDay())) {
          return candidate;
        }
      }
    }

    switch (rule.freq) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }

  // For weekly/biweekly with daysOfWeek, cycle through days
  if (
    (rule.freq === 'weekly' || rule.freq === 'biweekly') &&
    rule.daysOfWeek?.length
  ) {
    for (let d = 1; d <= 14; d++) {
      const candidate = new Date(next);
      candidate.setDate(candidate.getDate() + d);
      if (rule.daysOfWeek.includes(candidate.getDay())) {
        return candidate;
      }
    }
  }

  switch (rule.freq) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export async function createShift(input: CreateShiftInput) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { error: 'No organization selected' }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'User not authenticated' }
    }

    // Validate input
    const validated = createShiftSchema.safeParse(input)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid input' }
    }

    // Ensure end time is after start time
    if (new Date(validated.data.end_time) <= new Date(validated.data.start_time)) {
      return { error: 'End time must be after start time' }
    }

    const { recurrence_rule, ...shiftData } = validated.data;

    // Insert parent shift
    const { data: shift, error } = await supabase
      .from('shifts')
      .insert({
        organization_id: organizationId,
        title: shiftData.title,
        description: shiftData.description,
        location: shiftData.location,
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        capacity: shiftData.capacity,
        status: 'open',
        recurrence_rule: recurrence_rule || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating shift:', error)
      return { error: 'Failed to create shift' }
    }

    const allShifts = [shift];

    // Generate child shifts for recurring shifts
    if (recurrence_rule) {
      const occurrences = generateOccurrenceDates(
        new Date(shiftData.start_time),
        new Date(shiftData.end_time),
        recurrence_rule,
      );

      if (occurrences.length > 0) {
        const childInserts = occurrences.map((occ) => ({
          organization_id: organizationId,
          title: shiftData.title,
          description: shiftData.description,
          location: shiftData.location,
          start_time: occ.start.toISOString(),
          end_time: occ.end.toISOString(),
          capacity: shiftData.capacity,
          status: 'open' as const,
          recurrence_parent_id: shift.id,
        }));

        const { data: children, error: childError } = await supabase
          .from('shifts')
          .insert(childInserts)
          .select();

        if (childError) {
          console.error('Error creating child shifts:', childError);
          // Parent was created successfully, so we return it even if children fail
        } else if (children) {
          allShifts.push(...children);
        }
      }
    }

    revalidatePath('/volunteers')
    revalidatePath('/volunteers/shifts')

    return { data: allShifts.length === 1 ? shift : allShifts }
  } catch (error) {
    console.error('Unexpected error creating shift:', error)
    return { error: 'An unexpected error occurred' }
  }
}
