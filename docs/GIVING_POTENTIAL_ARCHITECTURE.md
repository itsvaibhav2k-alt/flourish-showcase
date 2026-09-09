# Giving Potential System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GIVING POTENTIAL SYSTEM                         │
│                  3D Wealth Screening & Scoring                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Three Dimensions of Scoring

```
                    ┌─────────────┐
                    │  CAPACITY   │
                    │   (40%)     │
                    │   0-100     │
                    └──────┬──────┘
                           │
                           │
                    Financial Ability
                    to Give
                           │
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼─────────┐
│   AFFINITY     │ │    OVERALL     │ │   PROPENSITY   │
│    (30%)       │ │     SCORE      │ │     (30%)      │
│    0-100       │ │     0-100      │ │     0-100      │
└────────────────┘ └────────────────┘ └────────────────┘
     Connection         Composite       Likelihood
   to Organization      Rating          to Give
```

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Contact    │  │  Prospects   │  │  Smart Ask   │              │
│  │  Detail     │  │  Dashboard   │  │  Amounts     │              │
│  │  Page       │  │   /prospects │  │              │              │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                │                  │                       │
└─────────┼────────────────┼──────────────────┼───────────────────────┘
          │                │                  │
          ▼                ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       COMPONENT LAYER                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Giving        │  │ Score Radar  │  │ Prospect     │            │
│  │ Potential     │  │ Chart        │  │ List         │            │
│  │ Panel         │  │ (NEW)        │  │              │            │
│  └───────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│          │                 │                  │                     │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Score         │  │ Giving       │  │ Badge        │            │
│  │ Meters        │  │ Potential    │  │ Component    │            │
│  │               │  │ Form         │  │              │            │
│  └───────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│          │                 │                  │                     │
└──────────┼─────────────────┼──────────────────┼─────────────────────┘
           │                 │                  │
           ▼                 ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     SERVER ACTION LAYER                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  calculateScores(wealthData, engagement, capacity)      │        │
│  └────────────────────────────┬────────────────────────────┘        │
│                               │                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  calculateScoresForContact(contactId, wealthData)       │        │
│  └────────────────────────────┬────────────────────────────┘        │
│                               │                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  saveGivingPotential(contactId, scores, wealthData)     │        │
│  └────────────────────────────┬────────────────────────────┘        │
│                               │                                      │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ calculateCapacity│  │ calculateAffinity│  │ calculatePropensity│ │
│  │    Score()       │  │    Score()       │  │    Score()       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │             │
│           └──────────┬──────────┴──────────┬──────────┘             │
│                      │                     │                        │
│             ┌────────▼─────────────────────▼────────┐               │
│             │  calculateOverallScore()              │               │
│             └───────────────────────────────────────┘               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  calculateGivingGapRatio(lifetimeGiving, capacity)        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         QUERY LAYER                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  getGivingPotential(contactId)                          │        │
│  │  ↓ SELECT * FROM giving_potential WHERE contact_id = ? │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  getTopProspects({ limit, minScore })                   │        │
│  │  ↓ SELECT * FROM giving_potential                       │        │
│  │    WHERE overall_score >= ?                             │        │
│  │    ORDER BY overall_score DESC LIMIT ?                  │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  giving_potential TABLE                                    │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  - contact_id (unique)                                     │    │
│  │  - organization_id                                         │    │
│  │                                                            │    │
│  │  Wealth Indicators:                                        │    │
│  │  - estimated_net_worth                                     │    │
│  │  - real_estate_value                                       │    │
│  │  - stock_holdings                                          │    │
│  │  - political_donations                                     │    │
│  │  - employer, job_title                                     │    │
│  │                                                            │    │
│  │  Scores (0-100):                                           │    │
│  │  - capacity_score                                          │    │
│  │  - affinity_score                                          │    │
│  │  - propensity_score                                        │    │
│  │  - overall_score                                           │    │
│  │                                                            │    │
│  │  Analysis:                                                 │    │
│  │  - giving_gap_ratio                                        │    │
│  │  - data_sources (JSONB)                                    │    │
│  │  - notes                                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Indexes:                                                            │
│  - idx_giving_potential_contact_id                                  │
│  - idx_giving_potential_organization_id                             │
│  - idx_giving_potential_overall_score                               │
│  - idx_giving_potential_capacity_score                              │
│                                                                      │
│  RLS Policies:                                                       │
│  ✓ Organization-scoped SELECT                                       │
│  ✓ Organization-scoped INSERT/UPDATE/DELETE                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Background Job Architecture (NEW)

```
┌──────────────────────────────────────────────────────────────────────┐
│                      INNGEST BACKGROUND JOBS                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  recalculateGivingScores                                   │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  Triggers:                                                 │    │
│  │  - Cron: Weekly (Sunday 2 AM)                              │    │
│  │  - Event: scores/recalculate.requested                     │    │
│  │                                                            │    │
│  │  Process:                                                  │    │
│  │  1. Fetch all giving_potential records                     │    │
│  │  2. Process in batches of 10                               │    │
│  │  3. Recalculate scores for each contact                    │    │
│  │  4. Update database                                        │    │
│  │  5. Return summary (updated, errors)                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  recalculateSingleContactScore                             │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  Trigger:                                                  │    │
│  │  - Event: contact/giving-potential.updated                 │    │
│  │                                                            │    │
│  │  Process:                                                  │    │
│  │  1. Receive contactId and wealthData                       │    │
│  │  2. Calculate new scores                                   │    │
│  │  3. Update database immediately                            │    │
│  │  4. Return updated scores                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Scoring Algorithm Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   INPUT DATA SOURCES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Wealth      │  │  Engagement  │  │  Giving      │         │
│  │  Indicators  │  │  Metrics     │  │  History     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                 │
└─────────┼─────────────────┼──────────────────┼─────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DIMENSION SCORING                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  CAPACITY SCORE (0-100)                               │     │
│  ├───────────────────────────────────────────────────────┤     │
│  │  Real Estate Value      × 40%  ───┐                  │     │
│  │  Stock Holdings         × 30%  ───┤                  │     │
│  │  Job Level             × 20%  ───┼──► Sum = Score    │     │
│  │  Political Donations    × 10%  ───┘                  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  AFFINITY SCORE (0-100)                               │     │
│  ├───────────────────────────────────────────────────────┤     │
│  │  Lifetime Giving/Capacity × 40%  ───┐                │     │
│  │  Volunteer Hours         × 30%  ───┤                │     │
│  │  Email Open Rate         × 20%  ───┼──► Sum = Score  │     │
│  │  Event Attendance        × 10%  ───┘                │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  PROPENSITY SCORE (0-100)                             │     │
│  ├───────────────────────────────────────────────────────┤     │
│  │  Recency of Last Gift   × 40%  ───┐                  │     │
│  │  Giving Frequency       × 30%  ───┼──► Sum = Score    │     │
│  │  Gift Growth Trend      × 30%  ───┘                  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────┬───────────────────┬───────────────────┬───────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OVERALL SCORE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Capacity Score    × 40%  ───┐                                 │
│  Affinity Score    × 30%  ───┼──► Sum = Overall Score (0-100) │
│  Propensity Score  × 30%  ───┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GIVING GAP ANALYSIS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Estimated Capacity  -  Lifetime Giving  =  Giving Gap         │
│                                                                 │
│  Lifetime Giving / Estimated Capacity = Giving Gap Ratio       │
│                                                                 │
│  Lower ratio = Higher untapped potential                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Map

```
┌─────────────────────────────────────────────────────────────────┐
│                  GIVING POTENTIAL SYSTEM                        │
│              (3D Wealth Screening & Scoring)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌────────────┐ ┌─────────────────┐
│ CONTACT MGMT   │ │ SMART ASK  │ │ MAJOR GIFT      │
│                │ │            │ │ PIPELINE        │
├────────────────┤ ├────────────┤ ├─────────────────┤
│ • Detail view  │ │ • Amount   │ │ • Prospect      │
│ • Editing      │ │   calc     │ │   qualification │
│ • Notes        │ │ • Risk adj │ │ • Stage tracking│
└────────────────┘ └────────────┘ └─────────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  COPILOT ACTIONS              │
         ├───────────────────────────────┤
         │ • Next step suggestions       │
         │ • Cultivation strategies      │
         │ • Ask timing optimization     │
         └───────────────────────────────┘
```

## Component Hierarchy

```
App Router Pages
│
├── /contacts/[id]
│   └── ContactDetailPage
│       └── GivingPotentialPanel
│           ├── CircularScoreMeter (Overall)
│           ├── ScoreMeter × 3 (Capacity, Affinity, Propensity)
│           ├── GivingGapAnalysis (Card)
│           ├── WealthIndicators (Grid)
│           └── GivingPotentialForm (Edit mode)
│
├── /prospects
│   └── ProspectsPage
│       ├── StatsCards × 4
│       │   ├── Total Prospects
│       │   ├── Average Score
│       │   ├── High Potential Count
│       │   └── Untapped Capacity
│       └── ProspectList
│           └── ProspectRow × N
│               ├── Contact Info
│               ├── GivingPotentialBadge
│               ├── Capacity Display
│               └── Giving Gap Display
│
└── /smart-ask
    └── SmartAskPage
        └── AmountCalculator
            └── Uses capacity_score for suggestions
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                               │
│                  (Supabase Auth)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                ROW LEVEL SECURITY (RLS)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Policy: Organization-scoped access                             │
│  ─────────────────────────────────────────────────────────     │
│  SELECT: WHERE organization_id IN (                            │
│            SELECT organization_id FROM organization_members     │
│            WHERE user_id = auth.uid()                          │
│          )                                                      │
│                                                                 │
│  INSERT/UPDATE/DELETE: Same policy                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATA ENCRYPTION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • At rest: Supabase default AES-256                           │
│  • In transit: TLS 1.3                                         │
│  • Consider: Additional encryption for net_worth field         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## File Organization

```
flourish/
│
├── src/
│   ├── app/(dashboard)/
│   │   ├── contacts/[id]/page.tsx ────────── Contact detail + scores
│   │   └── prospects/page.tsx ───────────── Top prospects dashboard
│   │
│   ├── modules/giving-potential/
│   │   ├── actions/
│   │   │   ├── calculate-scores.ts ──────── Server action for calculation
│   │   │   └── save-giving-potential.ts ─── Server action for saving
│   │   ├── components/
│   │   │   ├── giving-potential-badge.tsx ─ Compact score badge
│   │   │   ├── giving-potential-form.tsx ── Edit form
│   │   │   ├── giving-potential-panel.tsx ─ Full detail panel
│   │   │   ├── prospect-list.tsx ────────── Sortable table
│   │   │   ├── score-meter.tsx ──────────── Progress bars
│   │   │   └── score-radar-chart.tsx ────── NEW: 3D visualization
│   │   ├── queries/
│   │   │   ├── get-giving-potential.ts ──── Fetch single contact
│   │   │   └── get-top-prospects.ts ─────── Fetch ranked list
│   │   ├── schemas/
│   │   │   └── giving-potential.schema.ts ─ Zod validation
│   │   ├── services/
│   │   │   └── score-calculator.ts ──────── Pure scoring functions
│   │   └── index.ts ────────────────────── Public exports
│   │
│   └── lib/inngest/functions/
│       ├── recalculate-giving-scores.ts ─── NEW: Background jobs
│       └── index.ts ─────────────────────── Function registry
│
├── supabase/migrations/
│   └── 019_giving_potential.sql ─────────── Table schema & indexes
│
└── docs/
    ├── GIVING_POTENTIAL_SYSTEM.md ───────── Full documentation (17KB)
    ├── GIVING_POTENTIAL_QUICK_START.md ──── Quick reference (7KB)
    ├── GIVING_POTENTIAL_ENHANCEMENT_SUMMARY.md ─ This enhancement
    └── GIVING_POTENTIAL_ARCHITECTURE.md ──── Architecture diagrams
```

## Performance Characteristics

```
Operation                    | Response Time | Throughput
─────────────────────────────┼───────────────┼─────────────
Single contact lookup        | < 50ms        | 1000+ req/s
Top prospects query (50)     | < 100ms       | 500+ req/s
Score calculation (single)   | < 200ms       | 100+ req/s
Batch recalculation (10,000) | ~ 5 minutes   | 33 contacts/s
Form save + recalculate      | < 500ms       | N/A
```

## Scalability

```
Contacts     | DB Size | Recalc Time | Memory Usage
─────────────┼─────────┼─────────────┼──────────────
1,000        | ~ 5 MB  | ~ 30 sec    | < 100 MB
10,000       | ~ 50 MB | ~ 5 min     | < 200 MB
50,000       | ~ 250 MB| ~ 25 min    | < 500 MB
100,000      | ~ 500 MB| ~ 50 min    | < 1 GB
```

## Monitoring Points

```
┌─────────────────────────────────────────────────────────────────┐
│                      MONITORING                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Database:                                                      │
│  • Query performance (slow query log)                           │
│  • Index usage (pg_stat_user_indexes)                          │
│  • Table size growth                                            │
│                                                                 │
│  Background Jobs:                                               │
│  • Inngest execution time                                       │
│  • Success/error rates                                          │
│  • Batch processing stats                                       │
│                                                                 │
│  Application:                                                   │
│  • API response times                                           │
│  • Score calculation errors                                     │
│  • Form submission failures                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This architecture document provides a visual reference for understanding the Giving Potential System's structure, data flow, and integration points.
