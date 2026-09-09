import { z } from 'zod'

export const proposalSectionSchema = z.object({
  content: z.string(),
  wordCount: z.number(),
})

export type ProposalSection = z.infer<typeof proposalSectionSchema>

export const proposalSectionsSchema = z.object({
  executive_summary: proposalSectionSchema,
  statement_of_need: proposalSectionSchema,
  project_description: proposalSectionSchema,
  goals_and_objectives: proposalSectionSchema,
  methods: proposalSectionSchema,
  evaluation: proposalSectionSchema,
  budget_narrative: proposalSectionSchema,
  organizational_capacity: proposalSectionSchema,
})

export type ProposalSections = z.infer<typeof proposalSectionsSchema>

export const grantOpportunitySchema = z.object({
  funderName: z.string().min(1, 'Funder name is required'),
  grantName: z.string().optional(),
  amountRequested: z.number().positive().optional(),
  deadline: z.string().optional(),
  focusAreas: z.array(z.string()).min(1, 'At least one focus area is required'),
  requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
  additionalNotes: z.string().optional(),
})

export type GrantOpportunityInput = z.infer<typeof grantOpportunitySchema>

export const generateProposalSchema = z.object({
  grantId: z.string().uuid(),
  opportunity: grantOpportunitySchema,
})

export type GenerateProposalInput = z.infer<typeof generateProposalSchema>

export const saveProposalSchema = z.object({
  grantId: z.string().uuid(),
  sections: proposalSectionsSchema,
  status: z.enum(['draft', 'final', 'submitted']).default('draft'),
})

export type SaveProposalInput = z.infer<typeof saveProposalSchema>

export const regenerateSectionSchema = z.object({
  proposalId: z.string().uuid(),
  sectionName: z.enum([
    'executive_summary',
    'statement_of_need',
    'project_description',
    'goals_and_objectives',
    'methods',
    'evaluation',
    'budget_narrative',
    'organizational_capacity',
  ]),
})

export type RegenerateSectionInput = z.infer<typeof regenerateSectionSchema>

// Section metadata for UI
export const SECTION_METADATA: Record<
  keyof ProposalSections,
  { label: string; description: string; wordRange: string; icon: string }
> = {
  executive_summary: {
    label: 'Executive Summary',
    description: 'A compelling overview that hooks the reader and summarizes key points',
    wordRange: '150-200 words',
    icon: 'DocumentText',
  },
  statement_of_need: {
    label: 'Statement of Need',
    description: 'Articulate the problem being addressed with data and evidence',
    wordRange: '400-600 words',
    icon: 'ExclamationTriangle',
  },
  project_description: {
    label: 'Project Description',
    description: 'Describe the specific project or program being funded',
    wordRange: '600-1000 words',
    icon: 'DocumentDuplicate',
  },
  goals_and_objectives: {
    label: 'Goals & Objectives',
    description: 'List specific, measurable SMART objectives',
    wordRange: '300-500 words',
    icon: 'Target',
  },
  methods: {
    label: 'Methods',
    description: 'Explain how you will implement the project',
    wordRange: '500-800 words',
    icon: 'Cog',
  },
  evaluation: {
    label: 'Evaluation',
    description: 'How you will measure success and track outcomes',
    wordRange: '300-500 words',
    icon: 'ChartBar',
  },
  budget_narrative: {
    label: 'Budget Narrative',
    description: 'Justify the budget and explain how funds will be used',
    wordRange: '250-400 words',
    icon: 'CurrencyDollar',
  },
  organizational_capacity: {
    label: 'Organizational Capacity',
    description: 'Demonstrate ability to execute this project successfully',
    wordRange: '300-500 words',
    icon: 'BuildingOffice',
  },
}
