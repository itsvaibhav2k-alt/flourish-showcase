import { z } from 'zod'

export const matchingGiftStatusSchema = z.enum([
  'unknown',
  'eligible',
  'submitted',
  'received',
  'ineligible',
])

export type MatchingGiftStatus = z.infer<typeof matchingGiftStatusSchema>

export const matchingGiftDataSchema = z.object({
  employer_name: z.string().optional().nullable(),
  matching_gift_eligible: z.boolean().optional().nullable(),
  matching_gift_status: matchingGiftStatusSchema.optional().nullable(),
  matching_gift_company_id: z.string().optional().nullable(),
  matching_gift_ratio: z.number().optional().nullable(),
  matching_gift_amount: z.number().optional().nullable(),
  matching_gift_received_at: z.string().optional().nullable(),
})

export type MatchingGiftData = z.infer<typeof matchingGiftDataSchema>

export interface MatchingGiftSummary {
  totalPotential: number
  totalSubmitted: number
  totalReceived: number
  potentialDonors: number
  submittedDonors: number
  receivedDonors: number
  captureRate: number
}

export interface MatchEligibleGift {
  id: string
  contactId: string
  contactName: string
  contactEmail: string | null
  amount: number
  giftDate: string
  employerName: string
  matchRatio: number | null
  status: MatchingGiftStatus
  potentialMatch: number | null
}
