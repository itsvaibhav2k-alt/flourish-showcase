/**
 * Sequences Actions Index
 *
 * Centralized exports for all sequence-related server actions
 */

// Sequence management
export { createSequence } from './create-sequence'
export type { CreateSequenceResult } from './create-sequence'

export { updateSequence } from './update-sequence'
export type { UpdateSequenceResult } from './update-sequence'

export { deleteSequence } from './delete-sequence'
export type { DeleteSequenceResult } from './delete-sequence'

export { saveSequence } from './save-sequence'
export type { SaveSequenceResult } from './save-sequence'

// Step management
export { addStep, updateStep, deleteStep } from './manage-steps'
export type { StepActionResult } from './manage-steps'

// Enrollment management
export {
  enrollContact,
  pauseEnrollment,
  resumeEnrollment,
  cancelEnrollment,
} from './manage-enrollments'
export type { EnrollmentActionResult } from './manage-enrollments'
