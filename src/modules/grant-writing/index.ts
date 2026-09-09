// Grant Writing Module Public Exports

// Actions
export { generateProposal } from './actions/generate-proposal'
export { saveProposal, updateProposalSection, exportProposalAsText } from './actions/save-proposal'
export { regenerateSection } from './actions/regenerate-section'

// Queries
export { getOrganizationContext, getGrantApplication, getGrantProposal } from './queries/get-org-context'

// Components
export { GrantWriterPageWrapper as GrantWriterPage } from './components/grant-writer-page-wrapper'
export { GrantWriterPage as GrantWriterPageClient } from './components/grant-writer-page'
export { GrantForm } from './components/grant-form'
export { SectionEditor } from './components/section-editor'

// Schemas & Types
export {
  type ProposalSection,
  type ProposalSections,
  type GrantOpportunityInput,
  type GenerateProposalInput,
  type SaveProposalInput,
  type RegenerateSectionInput,
  SECTION_METADATA,
} from './schemas/proposal.schema'
