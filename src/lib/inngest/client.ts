import { Inngest, EventSchemas } from 'inngest'
import type { Events } from './events'

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !process.env.INNGEST_EVENT_KEY

// Create and export the Inngest client
export const inngest = new Inngest({
  id: 'flourish',
  schemas: new EventSchemas().fromRecord<Events>(),
  // In development, don't require event key - dev server will handle events
  ...(isDev && {
    isDev: true,
  }),
})
