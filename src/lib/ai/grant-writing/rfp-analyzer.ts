/**
 * RFP (Request for Proposal) Analyzer
 *
 * Analyzes RFP documents to extract key requirements, focus areas, and deadlines.
 * Future enhancement: PDF upload support for automatic RFP parsing.
 */

import { generateSimple, MODELS } from '../claude'
import type { ClaudeModel } from '../claude'

export interface RFPAnalysis {
  funderName?: string
  grantName?: string
  amountAvailable?: number
  deadline?: string
  focusAreas: string[]
  requirements: string
  eligibilityCriteria?: string[]
  applicationComponents?: string[]
  evaluationCriteria?: string[]
  keyDates?: Array<{ date: string; event: string }>
  contactInfo?: string
  summary: string
}

/**
 * Analyze RFP text to extract structured information
 */
export async function analyzeRFP(
  rfpText: string,
  model: ClaudeModel = MODELS.HAIKU
): Promise<RFPAnalysis> {
  const prompt = `You are an expert at analyzing grant RFPs (Requests for Proposals).

Analyze the following RFP text and extract key information. Return your analysis as a JSON object with this structure:

{
  "funderName": "string or null",
  "grantName": "string or null",
  "amountAvailable": number or null,
  "deadline": "ISO date string or null",
  "focusAreas": ["array of strings"],
  "requirements": "detailed string describing all requirements",
  "eligibilityCriteria": ["array of strings"],
  "applicationComponents": ["array of required components/sections"],
  "evaluationCriteria": ["array of how proposals will be evaluated"],
  "keyDates": [{ "date": "ISO string", "event": "description" }],
  "contactInfo": "string or null",
  "summary": "2-3 sentence summary of this opportunity"
}

RFP TEXT:
${rfpText}

Return ONLY the JSON object, no additional text.`

  try {
    const response = await generateSimple({
      prompt,
      maxTokens: 2048,
      model,
    })

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse RFP analysis response')
    }

    const analysis = JSON.parse(jsonMatch[0]) as RFPAnalysis

    // Validate required fields
    if (!analysis.focusAreas || !Array.isArray(analysis.focusAreas)) {
      analysis.focusAreas = []
    }

    if (!analysis.requirements) {
      analysis.requirements = 'No specific requirements extracted from RFP'
    }

    if (!analysis.summary) {
      analysis.summary = 'Grant opportunity requiring further analysis'
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing RFP:', error)
    throw new Error(
      `Failed to analyze RFP: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extract key deadlines from RFP text
 */
export async function extractDeadlines(
  rfpText: string,
  model: ClaudeModel = MODELS.HAIKU
): Promise<Array<{ date: string; event: string }>> {
  const prompt = `Extract all important dates and deadlines from this RFP. Return as a JSON array of objects with "date" (ISO format) and "event" (description) fields.

RFP TEXT:
${rfpText}

Return ONLY the JSON array, no additional text.`

  try {
    const response = await generateSimple({
      prompt,
      maxTokens: 512,
      model,
    })

    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    const deadlines = JSON.parse(jsonMatch[0])
    return Array.isArray(deadlines) ? deadlines : []
  } catch (error) {
    console.error('Error extracting deadlines:', error)
    return []
  }
}

/**
 * Assess organization's fit for this RFP based on mission and focus areas
 */
export async function assessFit(
  rfpAnalysis: RFPAnalysis,
  organizationMission: string,
  organizationFocusAreas: string[],
  model: ClaudeModel = MODELS.HAIKU
): Promise<{
  fitScore: number // 0-100
  strengths: string[]
  gaps: string[]
  recommendation: string
}> {
  const prompt = `You are assessing whether a nonprofit organization is a good fit for a grant opportunity.

GRANT OPPORTUNITY:
Funder: ${rfpAnalysis.funderName || 'Unknown'}
Focus Areas: ${rfpAnalysis.focusAreas.join(', ')}
Requirements: ${rfpAnalysis.requirements}
${rfpAnalysis.eligibilityCriteria ? `Eligibility: ${rfpAnalysis.eligibilityCriteria.join(', ')}` : ''}

ORGANIZATION:
Mission: ${organizationMission}
Focus Areas: ${organizationFocusAreas.join(', ')}

Assess the fit and return a JSON object:
{
  "fitScore": 0-100,
  "strengths": ["areas where org aligns well with grant"],
  "gaps": ["areas where org may not align or needs to strengthen"],
  "recommendation": "brief recommendation on whether to pursue this grant"
}

Return ONLY the JSON object.`

  try {
    const response = await generateSimple({
      prompt,
      maxTokens: 1024,
      model,
    })

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse fit assessment')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error assessing fit:', error)
    return {
      fitScore: 50,
      strengths: [],
      gaps: [],
      recommendation: 'Unable to assess fit - manual review recommended',
    }
  }
}

/**
 * Generate a checklist of required components from RFP
 */
export function generateApplicationChecklist(
  analysis: RFPAnalysis
): Array<{ item: string; completed: boolean }> {
  const checklist: Array<{ item: string; completed: boolean }> = []

  // Add application components
  if (analysis.applicationComponents && analysis.applicationComponents.length > 0) {
    analysis.applicationComponents.forEach(component => {
      checklist.push({
        item: component,
        completed: false,
      })
    })
  }

  // Add deadline as checklist item
  if (analysis.deadline) {
    checklist.push({
      item: `Submit application by ${new Date(analysis.deadline).toLocaleDateString()}`,
      completed: false,
    })
  }

  // Add eligibility verification
  if (analysis.eligibilityCriteria && analysis.eligibilityCriteria.length > 0) {
    checklist.push({
      item: 'Verify eligibility criteria',
      completed: false,
    })
  }

  return checklist
}
