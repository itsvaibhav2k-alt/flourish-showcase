/**
 * Sponsorships Module
 *
 * Provides sponsorship management for nonprofits:
 * - Tier definitions (Bronze, Silver, Gold, etc.)
 * - Sponsorship tracking with kanban pipeline
 * - Benefit delivery tracking
 * - Renewal automation
 */

// Schemas
export {
  sponsorshipTierSchema,
  sponsorshipSchema,
  sponsorshipBenefitSchema,
  updateSponsorshipStatusSchema,
  sponsorshipStatuses,
  sponsorshipStatusEnum,
} from './schemas/sponsorship.schema';

export type {
  SponsorshipTierInput,
  SponsorshipInput,
  SponsorshipBenefitInput,
  UpdateSponsorshipStatusInput,
  SponsorshipStatus,
} from './schemas/sponsorship.schema';

// Queries
export { getTiers, getAllTiers } from './queries/get-tiers';
export type { SponsorshipTier } from './queries/get-tiers';

export { getSponsorships } from './queries/get-sponsorships';
export type { SponsorshipWithContact } from './queries/get-sponsorships';

export { getSponsorship } from './queries/get-sponsorship';
export type { SponsorshipDetail, SponsorshipBenefit } from './queries/get-sponsorship';

export { getSponsorPipeline, getSponsorshipStats } from './queries/get-sponsor-pipeline';
export type { SponsorshipPipelineColumn } from './queries/get-sponsor-pipeline';

// Actions
export { createTier, updateTier, deleteTier } from './actions/manage-tiers';
export type { TierResult } from './actions/manage-tiers';

export { createSponsorship } from './actions/create-sponsorship';
export type { CreateSponsorshipResult } from './actions/create-sponsorship';

export {
  updateSponsorshipStatus,
  updateSponsorship,
} from './actions/update-sponsorship';
export type { UpdateSponsorshipResult } from './actions/update-sponsorship';

export {
  markBenefitDelivered,
  unmarkBenefitDelivered,
  addBenefit,
} from './actions/track-benefits';
export type { TrackBenefitResult } from './actions/track-benefits';
