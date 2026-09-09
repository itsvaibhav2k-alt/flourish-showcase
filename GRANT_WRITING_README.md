# AI Grant Writing Assistant - Implementation Guide

## Overview

The AI Grant Writing Assistant is a comprehensive feature for Flourish that helps nonprofits generate professional grant proposals using Claude AI, leveraging their organization's impact data, donor statistics, and program metrics.

## Features

### Core Capabilities

1. **AI-Powered Proposal Generation**
   - Section-by-section grant proposal generation
   - Uses Claude Sonnet 4 for high-quality output
   - Incorporates organization-specific context and data
   - Generates 8 standard sections:
     - Executive Summary (150-200 words)
     - Statement of Need (400-600 words)
     - Project Description (600-1000 words)
     - Goals & Objectives (300-500 words)
     - Methods (500-800 words)
     - Evaluation (300-500 words)
     - Budget Narrative (250-400 words)
     - Organizational Capacity (300-500 words)

2. **Grant Opportunity Input**
   - Funder name and grant program details
   - Amount requested and deadline tracking
   - Focus areas (multiple tags)
   - Requirements and guidelines (RFP text)
   - Additional notes and context

3. **Interactive Section Editor**
   - Edit any section in-place
   - Regenerate individual sections with AI
   - Real-time word count tracking
   - Copy individual sections
   - Visual indicators for target word ranges

4. **Export & Sharing**
   - Copy entire proposal to clipboard
   - Download as plain text file
   - Formatted output with section headers
   - Word counts included

5. **Version Control**
   - Draft and final status tracking
   - Version numbering for iterations
   - Full edit history (via updated_at)

## Technical Architecture

### Database Schema

**Table: `grant_proposals`**
```sql
- id (UUID, PK)
- organization_id (UUID, FK → organizations)
- grant_id (UUID, FK → grant_applications)
- version (INTEGER)
- status (TEXT: draft|final|submitted)
- sections (JSONB) - Contains all 8 proposal sections
- ai_model (TEXT)
- ai_tokens_used (INTEGER)
- ai_cost_usd (DECIMAL)
- org_context_snapshot (JSONB)
- created_by (UUID, FK → auth.users)
- created_at, updated_at, generated_at (TIMESTAMPTZ)
```

### File Structure

```
src/
├── lib/ai/grant-writing/
│   ├── proposal-generator.ts    # Core AI generation logic
│   └── rfp-analyzer.ts          # RFP analysis (future: PDF upload)
│
├── modules/grant-writing/
│   ├── actions/
│   │   ├── generate-proposal.ts      # Generate full proposal
│   │   ├── save-proposal.ts          # Save/update proposals
│   │   └── regenerate-section.ts     # Regenerate single section
│   ├── queries/
│   │   └── get-org-context.ts        # Fetch org data for AI
│   ├── schemas/
│   │   └── proposal.schema.ts        # Zod schemas
│   ├── components/
│   │   ├── grant-writer-page.tsx     # Main page component
│   │   ├── grant-form.tsx            # Grant opportunity form
│   │   └── section-editor.tsx        # Section editor UI
│   └── index.ts                      # Public exports
│
└── components/ui/
    └── alert.tsx                     # Alert component (created)
```

### AI Context Building

The AI receives rich context from the organization:

**Organization Data:**
- Name, mission, vision
- Years operating

**Impact Metrics:**
- Program metrics (custom metrics from impact module)
- People served
- Program outcomes

**Funding Data:**
- Total raised
- Donor count
- Major donor count (lifetime giving ≥ $1000)
- Average gift amount

**Volunteer Engagement:**
- Total volunteer hours
- Active volunteer count

## Usage Flow

1. **Navigate to Grant**
   - User selects a grant from Grant Tracker
   - Clicks "AI Grant Writer" button

2. **Enter Grant Details**
   - Fill in funder information
   - Add focus areas (tags)
   - Paste RFP requirements
   - Add any additional context

3. **Generate Proposal**
   - AI generates all 8 sections
   - Uses organization context automatically
   - Saves to database with metadata

4. **Edit & Refine**
   - Edit sections inline
   - Regenerate individual sections
   - Save drafts as you work

5. **Export**
   - Mark as final when complete
   - Download or copy to clipboard
   - Use in grant application

## Integration Points

### Grant Tracker Module
The grant writing assistant integrates with the existing Grant Tracker:
- Links to `grant_applications` table via `grant_id`
- Accessible from grant detail pages
- Status updates flow back to tracker

### Impact Module
Pulls program metrics for AI context:
- Uses `program_metrics` table
- Includes in proposal generation
- Demonstrates organizational capacity

### Donor Module
Leverages giving data:
- Aggregates from `gifts` table
- Calculates donor statistics
- Shows community support

### Volunteer Module
Incorporates volunteer engagement:
- Uses `shift_signups` data
- Demonstrates volunteer impact
- Shows community involvement

## Cost Tracking

All AI usage is tracked via the existing `trackAIUsage` function:
- Model used (Claude Sonnet 4)
- Input/output tokens
- Cache usage (for cost optimization)
- Cost in USD
- Metadata (grant ID, proposal ID, section name)

## Future Enhancements

### Phase 2 (Future)
1. **RFP PDF Upload**
   - Auto-extract requirements from PDF
   - Parse deadlines and sections
   - Identify eligibility criteria

2. **Section Regeneration with Context**
   - Currently implemented but needs UI integration
   - Regenerate with user feedback
   - Adjust tone/length/focus

3. **Grant Fit Assessment**
   - AI-powered fit scoring
   - Identify alignment with mission
   - Flag potential gaps

4. **Budget Integration**
   - Link to budget templates
   - Generate budget narratives from actual budgets
   - Sync with financial data

5. **Collaboration Features**
   - Team comments on sections
   - Review/approval workflow
   - Track who edited what

## Setup Instructions

### 1. Run Migration

```bash
npx supabase migration up
# Or reset to apply all migrations
npx supabase db reset
```

### 2. Regenerate Types

```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

### 3. Environment Variables

Ensure these are set (already required for Flourish):
```env
ANTHROPIC_API_KEY=your_key_here
```

### 4. Add to Grant Tracker UI

In the grant detail page or grant list, add a button:

```tsx
import { GrantWriterPage } from '@/modules/grant-writing'

// In your grant detail page:
<Button onClick={() => router.push(`/addon/grant-tracker/${grantId}/write`)}>
  <Sparkles className="h-4 w-4 mr-1" />
  AI Grant Writer
</Button>

// Create route: app/(dashboard)/addon/grant-tracker/[id]/write/page.tsx
export default async function GrantWriterRoute({ params }: { params: { id: string } }) {
  const grant = await getGrantApplication(params.id)
  const proposal = await getGrantProposal(params.id)

  return (
    <GrantWriterPage
      grantId={params.id}
      grantDetails={grant}
      existingProposal={proposal}
    />
  )
}
```

## API Reference

### Server Actions

**`generateProposal(input: GenerateProposalInput)`**
- Generates complete proposal with all sections
- Returns proposal ID and sections
- Tracks AI usage and cost

**`saveProposal(input: SaveProposalInput)`**
- Saves or updates a proposal
- Supports draft/final status
- Increments version number

**`updateProposalSection(proposalId, sectionName, content)`**
- Updates a single section
- Recalculates word count
- Auto-saves changes

**`regenerateSection(input: RegenerateSectionInput)`**
- Regenerates one section with AI
- Maintains context from other sections
- Tracks usage separately

**`exportProposalAsText(proposalId)`**
- Returns formatted text export
- Includes all sections
- Ready for copy/paste

### Queries

**`getOrganizationContext()`**
- Aggregates all org data for AI
- Returns structured context object

**`getGrantApplication(grantId)`**
- Fetches grant details
- Used for pre-filling form

**`getGrantProposal(grantId)`**
- Gets existing proposal if any
- Null if no proposal exists

## Best Practices

1. **RFP Quality**: The more detailed the requirements input, the better the AI output
2. **Context**: Ensure organization has mission/vision set in settings
3. **Metrics**: Add program metrics in Impact module for better proposals
4. **Review**: Always review and edit AI-generated content before submission
5. **Drafts**: Save frequently as drafts to preserve work
6. **Regeneration**: Use section regeneration sparingly (costs tokens)

## Troubleshooting

**"No organization context found"**
- Ensure organization settings are complete
- Add mission statement in Settings > Organization

**"Failed to generate proposal"**
- Check ANTHROPIC_API_KEY is set
- Verify API key has credits
- Check network connectivity

**"Proposal sections are empty"**
- Review RFP requirements field - needs at least 10 characters
- Ensure focus areas are added
- Check browser console for errors

## Performance Notes

- Full proposal generation: ~4096 output tokens (≈$0.06 with Sonnet 4)
- Uses prompt caching to reduce costs on regeneration
- Typical proposal: 3,500-4,500 words total
- Generation time: 15-30 seconds for full proposal

## Security

- Row-Level Security (RLS) enforces organization isolation
- All queries filtered by organization_id
- User must be org member to access
- Proposal data encrypted at rest (Supabase default)
