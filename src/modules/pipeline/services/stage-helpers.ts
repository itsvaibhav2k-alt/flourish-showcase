import type { Stage } from '../schemas/pipeline.schema'

/**
 * Validates if a stage transition is allowed
 * Can be used by UI to disable invalid transitions
 */
export function isValidStageTransition(currentStage: Stage, newStage: Stage): boolean {
  // For now, allow all transitions
  // You could add business logic here, e.g.:

  // Don't allow moving to the same stage
  if (currentStage === newStage) {
    return false
  }

  // Example: Can't move backwards from certain stages
  // if (currentStage === 'stewardship' && newStage !== 'stewardship') {
  //   return false
  // }

  return true
}

/**
 * Gets the next logical stage in the pipeline
 */
export function getNextStage(currentStage: Stage): Stage | null {
  const stageOrder: Stage[] = [
    'identification',
    'qualification',
    'cultivation',
    'solicitation',
    'stewardship',
  ]

  const currentIndex = stageOrder.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null
  }

  return stageOrder[currentIndex + 1]
}

/**
 * Gets the previous stage in the pipeline
 */
export function getPreviousStage(currentStage: Stage): Stage | null {
  const stageOrder: Stage[] = [
    'identification',
    'qualification',
    'cultivation',
    'solicitation',
    'stewardship',
  ]

  const currentIndex = stageOrder.indexOf(currentStage)
  if (currentIndex <= 0) {
    return null
  }

  return stageOrder[currentIndex - 1]
}

/**
 * Gets the stage index (0-4) for ordering
 */
export function getStageIndex(stage: Stage): number {
  const stageOrder: Stage[] = [
    'identification',
    'qualification',
    'cultivation',
    'solicitation',
    'stewardship',
  ]
  return stageOrder.indexOf(stage)
}

/**
 * Gets a human-readable label for a stage
 */
export function getStageLabel(stage: Stage): string {
  const labels: Record<Stage, string> = {
    identification: 'Identification',
    qualification: 'Qualification',
    cultivation: 'Cultivation',
    solicitation: 'Solicitation',
    stewardship: 'Stewardship',
  }
  return labels[stage]
}
