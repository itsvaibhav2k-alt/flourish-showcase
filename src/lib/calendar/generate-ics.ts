/**
 * ICS (iCalendar) Generator for Volunteer Shifts
 * Generates valid ICS files for calendar imports and subscriptions
 */

export interface CalendarEvent {
  uid: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  organizer?: { name: string; email: string }
}

/**
 * Formats a date to ICS format (YYYYMMDDTHHMMSSZ)
 * ICS requires UTC time in this specific format
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Escapes special characters in ICS text fields
 * According to RFC 5545, certain characters need to be escaped
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')  // Backslash must be escaped first
    .replace(/;/g, '\\;')    // Semicolon
    .replace(/,/g, '\\,')    // Comma
    .replace(/\n/g, '\\n')   // Newline
    .replace(/\r/g, '')      // Remove carriage returns
}

/**
 * Folds long lines according to ICS specification
 * Lines should be no longer than 75 octets
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line
  }

  const result: string[] = []
  let remaining = line

  while (remaining.length > 75) {
    result.push(remaining.slice(0, 75))
    remaining = ' ' + remaining.slice(75) // Continuation lines start with a space
  }

  if (remaining.length > 0) {
    result.push(remaining)
  }

  return result.join('\r\n')
}

/**
 * Generates a VEVENT component for a single event
 */
function generateVEVENT(event: CalendarEvent): string {
  const lines: string[] = []

  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${event.uid}`)
  lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
  lines.push(`DTSTART:${formatICSDate(event.startTime)}`)
  lines.push(`DTEND:${formatICSDate(event.endTime)}`)
  lines.push(`SUMMARY:${escapeICSText(event.title)}`)

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`)
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`)
  }

  if (event.organizer) {
    lines.push(`ORGANIZER;CN=${escapeICSText(event.organizer.name)}:mailto:${event.organizer.email}`)
  }

  // Add status as confirmed
  lines.push('STATUS:CONFIRMED')

  // Add sequence number (0 for new events)
  lines.push('SEQUENCE:0')

  lines.push('END:VEVENT')

  // Fold long lines and join with CRLF
  return lines.map(foldLine).join('\r\n')
}

/**
 * Generates a complete ICS file with one or more events
 * @param events - Array of calendar events to include
 * @returns Valid ICS file content as a string
 */
export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = []

  // VCALENDAR header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Flourish CRM//Volunteer Shifts//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')

  // Add all events
  events.forEach(event => {
    lines.push(generateVEVENT(event))
  })

  // VCALENDAR footer
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Generates an ICS file for a single event
 * Convenience wrapper around generateICS for single events
 */
export function generateSingleEventICS(event: CalendarEvent): string {
  return generateICS([event])
}
