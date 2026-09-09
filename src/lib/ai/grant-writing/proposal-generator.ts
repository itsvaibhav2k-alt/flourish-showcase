/**
 * AI Grant Proposal Generator
 *
 * Generates comprehensive grant proposals section-by-section using Claude AI
 * with organization context (impact data, donor stats, program metrics).
 */

import { generateWithCaching, MODELS } from '../claude'
import type { ClaudeModel } from '../claude'

export interface GrantOpportunity {
  funderName: string
  grantName?: string
  amountRequested?: number
  deadline?: string
  focusAreas: string[]
  requirements: string
  additionalNotes?: string
}

export interface OrganizationContext {
  organization: {
    name: string
    mission?: string
    vision?: string
  }
  impact: {
    programMetrics: Array<{
      name: string
      value: number
      unit: string
      description?: string
    }>
    peopleServed?: number
    yearsOperating?: number
  }
  funding: {
    totalRaised?: number
    donorCount?: number
    majorDonorCount?: number
    averageGift?: number
  }
  volunteers: {
    totalHours?: number
    activeVolunteers?: number
  }
}

export interface ProposalSection {
  content: string
  wordCount: number
}

export interface GeneratedProposal {
  sections: {
    executive_summary: ProposalSection
    statement_of_need: ProposalSection
    project_description: ProposalSection
    goals_and_objectives: ProposalSection
    methods: ProposalSection
    evaluation: ProposalSection
    budget_narrative: ProposalSection
    organizational_capacity: ProposalSection
  }
  usage: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens?: number
    cacheReadInputTokens?: number
  }
  model: string
}

/**
 * Generate a complete grant proposal with all sections
 */
export async function generateGrantProposal(
  opportunity: GrantOpportunity,
  orgContext: OrganizationContext,
  model: ClaudeModel = MODELS.SONNET
): Promise<GeneratedProposal> {
  const systemPrompt = buildSystemPrompt(orgContext)
  const userPrompt = buildUserPrompt(opportunity)

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      maxTokens: 4096,
      model,
      temperature: 0.7,
    })

    // Parse the response into sections
    const sections = parseProposalSections(response.content)

    return {
      sections,
      usage: response.usage,
      model: response.model,
    }
  } catch (error) {
    console.error('Error generating grant proposal:', error)
    throw new Error(
      `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Regenerate a specific section of the proposal
 */
export async function regenerateSection(
  sectionName: string,
  opportunity: GrantOpportunity,
  orgContext: OrganizationContext,
  currentSections: Partial<Record<string, ProposalSection>>,
  model: ClaudeModel = MODELS.SONNET
): Promise<{ section: ProposalSection; usage: any }> {
  const systemPrompt = buildSystemPrompt(orgContext)
  const userPrompt = buildSectionRegeneratePrompt(
    sectionName,
    opportunity,
    currentSections
  )

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      maxTokens: 2048,
      model,
      temperature: 0.7,
    })

    const content = response.content.trim()
    const wordCount = content.split(/\s+/).length

    return {
      section: {
        content,
        wordCount,
      },
      usage: response.usage,
    }
  } catch (error) {
    console.error('Error regenerating section:', error)
    throw new Error(
      `Failed to regenerate section: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Build system prompt with organization context
 */
function buildSystemPrompt(orgContext: OrganizationContext): string {
  const { organization, impact, funding, volunteers } = orgContext

  return `You are an expert grant writer helping ${organization.name} create compelling grant proposals.

ORGANIZATION INFORMATION:
Name: ${organization.name}
${organization.mission ? `Mission: ${organization.mission}` : ''}
${organization.vision ? `Vision: ${organization.vision}` : ''}

IMPACT METRICS:
${impact.programMetrics.length > 0 ? impact.programMetrics.map(m => `- ${m.name}: ${m.value} ${m.unit}${m.description ? ` (${m.description})` : ''}`).join('\n') : '- No specific metrics provided'}
${impact.peopleServed ? `- People Served: ${impact.peopleServed.toLocaleString()}` : ''}
${impact.yearsOperating ? `- Years Operating: ${impact.yearsOperating}` : ''}

FUNDING SNAPSHOT:
${funding.totalRaised ? `- Total Raised: $${funding.totalRaised.toLocaleString()}` : ''}
${funding.donorCount ? `- Active Donors: ${funding.donorCount}` : ''}
${funding.majorDonorCount ? `- Major Donors: ${funding.majorDonorCount}` : ''}
${funding.averageGift ? `- Average Gift: $${funding.averageGift.toFixed(2)}` : ''}

VOLUNTEER ENGAGEMENT:
${volunteers.totalHours ? `- Total Volunteer Hours: ${volunteers.totalHours.toLocaleString()}` : ''}
${volunteers.activeVolunteers ? `- Active Volunteers: ${volunteers.activeVolunteers}` : ''}

Your task is to write compelling, data-driven grant proposal sections that:
1. Use specific metrics and data from the organization's track record
2. Tell a compelling story about impact and need
3. Demonstrate organizational capacity and sustainability
4. Align with the funder's priorities and requirements
5. Use clear, professional language that is persuasive but not hyperbolic
6. Include concrete examples and measurable outcomes

Write in a professional yet engaging tone. Use active voice. Be specific and evidence-based.`
}

/**
 * Build user prompt for complete proposal generation
 */
function buildUserPrompt(opportunity: GrantOpportunity): string {
  const { funderName, grantName, amountRequested, deadline, focusAreas, requirements, additionalNotes } = opportunity

  return `Generate a complete grant proposal for the following opportunity:

GRANT OPPORTUNITY:
Funder: ${funderName}
${grantName ? `Grant Program: ${grantName}` : ''}
${amountRequested ? `Amount Requested: $${amountRequested.toLocaleString()}` : ''}
${deadline ? `Deadline: ${deadline}` : ''}
Focus Areas: ${focusAreas.join(', ')}

REQUIREMENTS:
${requirements}

${additionalNotes ? `ADDITIONAL NOTES:\n${additionalNotes}` : ''}

Please generate ALL of the following sections. Use the format "=== SECTION_NAME ===" followed by the content for each section:

1. EXECUTIVE_SUMMARY (150-200 words): A compelling overview that hooks the reader and summarizes the key points of the proposal.

2. STATEMENT_OF_NEED (400-600 words): Clearly articulate the problem or need being addressed, using data and compelling evidence. Explain why this is urgent and important.

3. PROJECT_DESCRIPTION (600-1000 words): Describe the specific project or program being funded. What will you do? Who will benefit? What makes this approach effective?

4. GOALS_AND_OBJECTIVES (300-500 words): List specific, measurable goals and SMART objectives. What will success look like?

5. METHODS (500-800 words): Explain HOW you will implement the project. What are the specific activities, timeline, and approach?

6. EVALUATION (300-500 words): How will you measure success? What metrics and evaluation methods will you use to track progress and outcomes?

7. BUDGET_NARRATIVE (250-400 words): Justify the budget and explain how grant funds will be used. Connect expenses to project activities.

8. ORGANIZATIONAL_CAPACITY (300-500 words): Demonstrate your organization's ability to successfully execute this project. Highlight relevant experience, expertise, and track record.

Generate the complete proposal now, using the exact section markers shown above.`
}

/**
 * Build prompt for regenerating a specific section
 */
function buildSectionRegeneratePrompt(
  sectionName: string,
  opportunity: GrantOpportunity,
  currentSections: Partial<Record<string, ProposalSection>>
): string {
  const sectionDescriptions: Record<string, string> = {
    executive_summary: 'A compelling 150-200 word overview that hooks the reader and summarizes key points',
    statement_of_need: 'A 400-600 word section articulating the problem being addressed with data and evidence',
    project_description: 'A 600-1000 word description of the specific project or program being funded',
    goals_and_objectives: 'A 300-500 word section with specific, measurable SMART objectives',
    methods: 'A 500-800 word explanation of HOW the project will be implemented',
    evaluation: 'A 300-500 word section on measuring success and tracking outcomes',
    budget_narrative: 'A 250-400 word justification of the budget and how funds will be used',
    organizational_capacity: 'A 300-500 word demonstration of ability to execute this project',
  }

  let contextFromOtherSections = ''
  if (Object.keys(currentSections).length > 0) {
    contextFromOtherSections = '\n\nCONTEXT FROM OTHER SECTIONS:\n'
    Object.entries(currentSections).forEach(([key, section]) => {
      if (key !== sectionName && section) {
        contextFromOtherSections += `\n${key.toUpperCase()}:\n${section.content.substring(0, 200)}...\n`
      }
    })
  }

  return `Regenerate the ${sectionName.toUpperCase().replace(/_/g, ' ')} section for this grant opportunity:

GRANT OPPORTUNITY:
Funder: ${opportunity.funderName}
${opportunity.grantName ? `Grant Program: ${opportunity.grantName}` : ''}
${opportunity.amountRequested ? `Amount Requested: $${opportunity.amountRequested.toLocaleString()}` : ''}
Focus Areas: ${opportunity.focusAreas.join(', ')}

REQUIREMENTS:
${opportunity.requirements}
${contextFromOtherSections}

Please write a fresh version of the ${sectionName.replace(/_/g, ' ')} section.

Guidelines: ${sectionDescriptions[sectionName]}

Write only the content for this section - do NOT include the section heading or markers.`
}

/**
 * Parse the AI response into structured sections
 */
function parseProposalSections(content: string): GeneratedProposal['sections'] {
  const sectionNames = [
    'EXECUTIVE_SUMMARY',
    'STATEMENT_OF_NEED',
    'PROJECT_DESCRIPTION',
    'GOALS_AND_OBJECTIVES',
    'METHODS',
    'EVALUATION',
    'BUDGET_NARRATIVE',
    'ORGANIZATIONAL_CAPACITY',
  ]

  const sections: any = {}

  for (let i = 0; i < sectionNames.length; i++) {
    const sectionName = sectionNames[i]
    const nextSectionName = sectionNames[i + 1]

    const startMarker = `=== ${sectionName} ===`
    const startIndex = content.indexOf(startMarker)

    if (startIndex === -1) {
      // Fallback: try without markers
      continue
    }

    const contentStart = startIndex + startMarker.length
    let contentEnd = content.length

    if (nextSectionName) {
      const nextMarker = `=== ${nextSectionName} ===`
      const nextIndex = content.indexOf(nextMarker)
      if (nextIndex !== -1) {
        contentEnd = nextIndex
      }
    }

    const sectionContent = content.substring(contentStart, contentEnd).trim()
    const wordCount = sectionContent.split(/\s+/).length

    const key = sectionName.toLowerCase() as keyof GeneratedProposal['sections']
    sections[key] = {
      content: sectionContent,
      wordCount,
    }
  }

  // Validate all sections were found
  const requiredKeys: Array<keyof GeneratedProposal['sections']> = [
    'executive_summary',
    'statement_of_need',
    'project_description',
    'goals_and_objectives',
    'methods',
    'evaluation',
    'budget_narrative',
    'organizational_capacity',
  ]

  for (const key of requiredKeys) {
    if (!sections[key]) {
      throw new Error(`Failed to parse required section: ${key}`)
    }
  }

  return sections as GeneratedProposal['sections']
}
