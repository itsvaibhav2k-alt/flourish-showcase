/**
 * Pipeline Module
 *
 * This module provides complete major gift pipeline management:
 * - Prospect tracking across pipeline stages
 * - Cultivation move logging
 * - Readiness score calculation
 * - Stage transitions and workflow
 * - Integration with contact data
 */

// Schemas
export {
  prospectSchema,
  updateStageSchema,
  cultivationMoveSchema,
  updateOutcomeSchema,
  pipelineStages,
  moveTypes,
  outcomes,
  stageEnum,
  moveTypeEnum,
  outcomeEnum,
  addProspectSchema,
  logMoveSchema,
} from './schemas/pipeline.schema'

export type {
  PipelineStage,
  MoveType,
  Outcome,
  ProspectInput,
  UpdateStageInput,
  CultivationMoveInput,
  UpdateOutcomeInput,
  Stage,
  AddProspectInput,
  LogMoveInput,
} from './schemas/pipeline.schema'

// Queries
export {
  getProspectsByStage,
  getPipelineStats,
} from './queries/get-prospects-by-stage'
export type { PipelineProspect } from './queries/get-prospects-by-stage'

export {
  getAllProspects,
} from './queries/get-pipeline'
export type {
  ProspectWithContact,
  PipelineByStage,
} from './queries/get-pipeline'

export {
  getProspect,
  isContactInPipeline,
  getProspectByContactId,
} from './queries/get-prospect'
export type {
  ProspectWithMoves,
  CultivationMove,
} from './queries/get-prospect'

export {
  getMoves,
  getRecentMoves,
  getMoveStats,
} from './queries/get-moves'
export type { MoveWithUser } from './queries/get-moves'

export {
  getStageHistory,
  getStageHistoryStats,
} from './queries/get-stage-history'
export type { StageHistoryEntry } from './queries/get-stage-history'

// Actions (existing implementations)
export { addToPipeline } from './actions/add-to-pipeline'
export { updateProspectStage } from './actions/update-stage'
export { logCultivationMove } from './actions/log-cultivation-move'

// Actions (extended implementations with more features)
export {
  addProspect,
  removeProspect,
} from './actions/add-prospect'
export type { AddProspectResult } from './actions/add-prospect'

export { moveStage } from './actions/move-stage'
export type { MoveStageResult } from './actions/move-stage'

// Stage helper functions (pure functions, not server actions)
export {
  isValidStageTransition,
  getNextStage,
  getPreviousStage,
  getStageIndex,
  getStageLabel,
} from './services/stage-helpers'

export {
  logMove,
  deleteMove,
} from './actions/log-move'
export type { LogMoveResult } from './actions/log-move'

export {
  updateProspect,
  updateProspectOutcome,
} from './actions/update-prospect'
export type { UpdateProspectInput, UpdateProspectResult } from './actions/update-prospect'

// Services
export {
  calculateReadinessScore,
  getReadinessDescription,
  getSuggestedNextMoves,
} from './services/readiness-calculator'
export type {
  ProspectData,
  MoveData,
  ReadinessCalculation,
} from './services/readiness-calculator'
