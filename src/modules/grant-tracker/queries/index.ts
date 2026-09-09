// Re-export all grant queries from individual files
// Note: Each source file has 'use server' directive

export { getGrantApplications, getGrantById, getGrantStats, getUpcomingDeadlines } from './grant-queries'
export { getFunders, getFunderById, getFundersWithGrants, searchFunders } from './funders'

// Re-export types from schemas for client components
export type { GrantWithMeta } from '../schemas/grant.schema'
