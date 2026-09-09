# Flourish Documentation

## Giving Potential System

The Giving Potential Scoring System is a comprehensive 3D wealth screening and major gift prospect identification solution.

### Quick Links

- **[Quick Start Guide](GIVING_POTENTIAL_QUICK_START.md)** - Get started in 5 minutes
- **[Full System Documentation](GIVING_POTENTIAL_SYSTEM.md)** - Complete reference (17KB)
- **[Architecture Guide](GIVING_POTENTIAL_ARCHITECTURE.md)** - Visual diagrams and flow charts
- **[Enhancement Summary](GIVING_POTENTIAL_ENHANCEMENT_SUMMARY.md)** - What's new and what was built

### Overview

The system scores donors across three dimensions:

1. **Capacity** (40% weight) - Financial ability to give based on wealth indicators
2. **Affinity** (30% weight) - Connection to organization based on engagement
3. **Propensity** (30% weight) - Likelihood to give based on behavior patterns

**Overall Score** = Weighted composite (0-100 scale)

### Key Features

- ✅ 3D scoring algorithm (Capacity, Affinity, Propensity)
- ✅ Real-time score calculation
- ✅ Radar chart visualization (NEW)
- ✅ Automated background recalculation (NEW)
- ✅ Giving gap analysis
- ✅ Top prospects dashboard
- ✅ Smart Ask integration
- ✅ Major gift pipeline integration

### Documentation Structure

```
docs/
├── README.md (this file)
│
├── GIVING_POTENTIAL_QUICK_START.md
│   └── 5-minute overview, usage examples, common tasks
│
├── GIVING_POTENTIAL_SYSTEM.md
│   └── Complete system reference, API docs, security, performance
│
├── GIVING_POTENTIAL_ARCHITECTURE.md
│   └── Visual diagrams, data flow, integration maps
│
└── GIVING_POTENTIAL_ENHANCEMENT_SUMMARY.md
    └── What was built, enhancements added, file locations
```

### Getting Started

1. Read the [Quick Start Guide](GIVING_POTENTIAL_QUICK_START.md)
2. Review the scoring algorithm in [System Documentation](GIVING_POTENTIAL_SYSTEM.md#scoring-algorithm)
3. Check out [Architecture diagrams](GIVING_POTENTIAL_ARCHITECTURE.md) for visual reference
4. See [Enhancement Summary](GIVING_POTENTIAL_ENHANCEMENT_SUMMARY.md) for what's new

### Module Location

```
src/modules/giving-potential/
├── actions/          # Server actions (calculate, save)
├── components/       # React components
├── queries/          # Data fetching
├── schemas/          # Zod validation
└── services/         # Business logic
```

### Key Files

**NEW Enhancements:**
- `src/modules/giving-potential/components/score-radar-chart.tsx` - 3D visualization
- `src/lib/inngest/functions/recalculate-giving-scores.ts` - Background jobs

**Core Components:**
- `src/modules/giving-potential/services/score-calculator.ts` - Scoring algorithm
- `src/modules/giving-potential/actions/calculate-scores.ts` - Score calculation
- `src/app/(dashboard)/prospects/page.tsx` - Top prospects page

**Database:**
- `supabase/migrations/019_giving_potential.sql` - Schema and indexes

### Quick Examples

#### Calculate Scores

```typescript
import { calculateScoresForContact } from '@/modules/giving-potential'

const result = await calculateScoresForContact(contactId, {
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
})
```

#### Display Radar Chart

```typescript
import { ScoreRadarChart } from '@/modules/giving-potential'

<ScoreRadarChart
  capacityScore={75}
  affinityScore={60}
  propensityScore={68}
/>
```

#### Get Top Prospects

```typescript
import { getTopProspects } from '@/modules/giving-potential'

const prospects = await getTopProspects({ limit: 20, minScore: 60 })
```

### Support

- **Technical Issues:** Review troubleshooting section in [System Docs](GIVING_POTENTIAL_SYSTEM.md#troubleshooting)
- **Usage Questions:** Check [Quick Start Guide](GIVING_POTENTIAL_QUICK_START.md)
- **Architecture:** See [Architecture Guide](GIVING_POTENTIAL_ARCHITECTURE.md)

### Total Documentation

- **4 comprehensive guides** (77KB total)
- **450+ lines of new code** (Radar chart + Inngest jobs)
- **Full integration** with existing system
- **Production-ready** implementation

---

For module-specific documentation, see:
- `/src/modules/giving-potential/README.md`
- `/src/modules/giving-potential/API.md`
- `/src/modules/giving-potential/components/README.md`
