# AI Grant Writing Assistant - Quick Start Guide

## What Was Built

A complete AI Grant Writing Assistant for Flourish that generates professional grant proposals using Claude AI with your organization's impact data.

## Files Created (17 total, 2,438 lines)

### Core Implementation
1. Database migration: `034_grant_writing.sql`
2. AI proposal generator: `src/lib/ai/grant-writing/proposal-generator.ts`
3. RFP analyzer: `src/lib/ai/grant-writing/rfp-analyzer.ts`
4. Cost tracking helper: `src/lib/ai/cost-tracker-helpers.ts`
5. Alert UI component: `src/components/ui/alert.tsx`

### Module (src/modules/grant-writing/)
6. `actions/generate-proposal.ts` - Generate full proposal
7. `actions/save-proposal.ts` - Save/update/export proposals
8. `actions/regenerate-section.ts` - Regenerate individual sections
9. `queries/get-org-context.ts` - Fetch organization data for AI
10. `schemas/proposal.schema.ts` - Zod validation schemas
11. `components/grant-form.tsx` - Grant opportunity input form
12. `components/section-editor.tsx` - Individual section editor
13. `components/grant-writer-page.tsx` - Main writer interface
14. `components/grant-writer-page-wrapper.tsx` - Grant selection UI
15. `index.ts` - Module public API

### Documentation
16. `GRANT_WRITING_README.md` - Full feature documentation
17. `GRANT_WRITING_IMPLEMENTATION_SUMMARY.md` - Implementation details

## Setup (3 Steps)

### 1. Run Database Migration

```bash
cd /Users/vaibhav/Projects/flourish
npx supabase db reset
```

Or apply just this migration:
```bash
npx supabase migration up
```

### 2. Regenerate TypeScript Types

```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

### 3. Add Route to Your App

Create: `src/app/(dashboard)/addon/grant-tracker/[id]/write/page.tsx`

```tsx
import { GrantWriterPage } from '@/modules/grant-writing'
import { getGrantApplication, getGrantProposal } from '@/modules/grant-writing'

export default async function GrantWriterRoute({
  params,
}: {
  params: { id: string }
}) {
  const grant = await getGrantApplication(params.id)
  const proposal = await getGrantProposal(params.id)

  return (
    <GrantWriterPage
      grantId={params.id}
      grantDetails={{
        funder_name: grant.funder_name,
        grant_name: grant.grant_name,
        amount_requested: grant.amount_requested,
      }}
      existingProposal={proposal}
    />
  )
}
```

### 4. Add Button to Grant Tracker

In your grant detail or list page:

```tsx
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

<Button
  onClick={() => router.push(`/addon/grant-tracker/${grantId}/write`)}
  variant="primary"
>
  <Sparkles className="h-4 w-4 mr-1" />
  AI Grant Writer
</Button>
```

## How It Works

### Input
1. Grant opportunity details (funder, amount, deadline)
2. Focus areas (education, health, etc.)
3. RFP requirements (paste the full text)
4. Additional notes

### AI Generation
The AI automatically pulls from your organization:
- **Mission & Vision** (from Settings)
- **Program Metrics** (from Impact module)
- **Donor Statistics** (total raised, donor count)
- **Volunteer Data** (hours, active volunteers)

### Output
8 proposal sections:
1. Executive Summary (150-200 words)
2. Statement of Need (400-600 words)
3. Project Description (600-1000 words)
4. Goals & Objectives (300-500 words)
5. Methods (500-800 words)
6. Evaluation (300-500 words)
7. Budget Narrative (250-400 words)
8. Organizational Capacity (300-500 words)

### Editing
- Edit any section inline
- Regenerate individual sections
- Copy to clipboard
- Download as text file
- Auto-save as you work

## Feature Highlights

- **Context-Aware**: Uses your actual organization data
- **High Quality**: Claude Sonnet 4 for professional writing
- **Interactive**: Edit and regenerate sections
- **Export**: Copy or download complete proposals
- **Cost Tracking**: All AI usage tracked automatically
- **Version Control**: Draft/final status with versioning

## Example Usage

1. **Navigate**: Go to Grant Tracker, select a grant
2. **Click**: "AI Grant Writer" button
3. **Fill Form**:
   - Funder: "XYZ Foundation"
   - Amount: $50,000
   - Focus Areas: Education, Youth Development
   - Requirements: [Paste RFP text]
4. **Generate**: Click "Generate Proposal" (15-30 seconds)
5. **Review**: AI creates all 8 sections using your org data
6. **Edit**: Make any changes, regenerate sections as needed
7. **Export**: Copy to clipboard or download as .txt
8. **Submit**: Use in your grant application

## Requirements

Already met by Flourish:
- ✅ ANTHROPIC_API_KEY environment variable
- ✅ Supabase database
- ✅ Next.js 16 with App Router
- ✅ React 19
- ✅ Tailwind CSS v4
- ✅ shadcn/ui components

## Testing Checklist

Before using in production:

- [ ] Run migration successfully
- [ ] Regenerate TypeScript types
- [ ] Add organization mission/vision in Settings
- [ ] Add at least one program metric in Impact module
- [ ] Record a test gift (for donor stats)
- [ ] Create a test grant in Grant Tracker
- [ ] Generate a proposal
- [ ] Edit a section
- [ ] Regenerate a section
- [ ] Export as text
- [ ] Verify cost in ai_usage table

## Cost

- **Full Proposal**: ~$0.06 (Claude Sonnet 4)
- **Section Regeneration**: ~$0.01-0.02
- **Tokens**: ~4000 output tokens per proposal
- **Words**: 3,500-4,500 total

## Database Table

**grant_proposals**:
- Links to grant_applications via grant_id
- Stores all sections as JSONB
- Tracks AI model, tokens, cost
- Version control
- Status: draft/final/submitted

## Troubleshooting

**"No organization context found"**
→ Add mission/vision in Settings > Organization

**"Failed to generate proposal"**
→ Check ANTHROPIC_API_KEY is set and has credits

**Sections are empty**
→ Requirements field needs at least 10 characters

**Cost seems high**
→ Using Sonnet 4 for quality (~$0.06/proposal). Can switch to Haiku for ~$0.01

## Support

See full documentation:
- **Feature Docs**: `GRANT_WRITING_README.md`
- **Implementation**: `GRANT_WRITING_IMPLEMENTATION_SUMMARY.md`

## Architecture

```
Grant Tracker
    ↓
Grant Writer Page (select grant)
    ↓
Grant Form (enter details)
    ↓
AI Generator (Claude Sonnet 4)
    ↓ (uses)
Org Context (mission, metrics, donors, volunteers)
    ↓
Proposal Sections (8 sections)
    ↓
Section Editors (edit, regenerate)
    ↓
Export (copy/download)
```

## Next Phase (Future)

- RFP PDF upload and auto-extraction
- Grant fit assessment scoring
- Budget integration
- Team collaboration features
- Proposal templates library

---

**Ready to use!** Follow the 3 setup steps above, then navigate to a grant in Grant Tracker and click "AI Grant Writer".
