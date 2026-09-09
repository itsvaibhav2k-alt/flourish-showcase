# Grant Tracker Module

A comprehensive grant management system for tracking grant applications, funders, deadlines, and funding pipeline.

## Overview

The Grant Tracker module provides nonprofits with a complete solution for managing their grant lifecycle from research to reporting. It includes funder relationship management, pipeline visualization, deadline tracking, and integration with the Grant Writing Assistant.

## Features

### 1. Grant Application Management
- **Full Lifecycle Tracking**: Track grants through 8 stages:
  - Researching - Initial opportunity research
  - Writing - Application in progress
  - Draft - Application ready for review
  - Submitted - Application submitted to funder
  - Pending - Awaiting decision
  - Approved - Grant awarded
  - Declined - Application not approved
  - Reporting - Active grant with reporting requirements

- **Key Information**:
  - Funder name and contact
  - Grant name/program
  - Amount requested and awarded
  - Deadlines and submission dates
  - Program area and requirements
  - Notes and attachments
  - Start and end dates

### 2. Funder Database
- **Comprehensive Funder Profiles**:
  - Basic info (name, type, website)
  - Contact information (name, email, phone)
  - Focus areas and geographic focus
  - Average grant size tracking
  - Total amount awarded history
  - Relationship status tracking
  - Custom notes

- **Funder Types**:
  - Foundation
  - Corporate
  - Government
  - Individual
  - Other

- **Relationship Statuses**:
  - Prospect - Potential funder
  - Applied - Application submitted
  - Active - Current funding relationship
  - Past - Previously funded
  - Declined - Previously declined

### 3. Pipeline Visualization
- Kanban-style pipeline view showing grants across all stages
- Visual progress tracking with color-coded stages
- Quick stats for each stage (count, total requested)
- Drag-and-drop capability (visual only, click to edit)
- At-a-glance view of funding pipeline health

### 4. Deadline Calendar
- Upcoming deadlines grouped by urgency:
  - This Week (urgent, highlighted in red)
  - Next Week
  - Next 2-4 Weeks
- Visual countdown indicators
- Quick access to grant details
- Overdue deadline alerts

### 5. Analytics & Statistics
- **Dashboard Stats**:
  - Total applications
  - Pending applications
  - Total amount requested
  - Total amount awarded
  - Upcoming deadlines (next 14 days)
  - Success rate calculation

- **Funder Analytics**:
  - Grant count per funder
  - Total requested from each funder
  - Total awarded by each funder
  - Active grants per funder

### 6. Integration with Grant Writing Assistant
- Direct link to Grant Writing Assistant for AI-powered proposal generation
- Seamless workflow from tracking to writing
- Shared grant application data

## Database Schema

### Tables

#### `funders`
```sql
CREATE TABLE funders (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('foundation', 'corporate', 'government', 'individual', 'other')),
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  focus_areas TEXT[],
  geographic_focus TEXT[],
  average_grant_size NUMERIC(12,2),
  total_awarded NUMERIC(12,2) DEFAULT 0,
  relationship_status TEXT DEFAULT 'prospect',
  last_contact_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `grant_applications` (Enhanced)
```sql
CREATE TABLE grant_applications (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  funder_id UUID REFERENCES funders(id),
  funder_name TEXT NOT NULL,
  funder_contact_id UUID REFERENCES contacts(id),
  grant_name TEXT,
  program_area TEXT,
  amount_requested NUMERIC(12,2),
  amount_awarded NUMERIC(12,2),
  status TEXT CHECK (status IN ('researching', 'writing', 'draft', 'submitted', 'pending', 'approved', 'declined', 'reporting')),
  deadline DATE,
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  reporting_due DATE,
  start_date DATE,
  end_date DATE,
  requirements TEXT,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Views

#### `grant_statistics`
Pre-computed statistics view for analytics:
- Grant counts by status
- Total requested and awarded amounts
- Upcoming deadlines count
- Success rate calculation

## Module Structure

```
src/modules/grant-tracker/
├── actions/
│   ├── index.ts                    # Grant CRUD operations
│   └── manage-funders.ts          # Funder CRUD operations
├── queries/
│   ├── index.ts                    # Grant queries
│   └── funders.ts                  # Funder queries
├── schemas/
│   ├── grant.schema.ts            # Grant validation schemas
│   └── funder.schema.ts           # Funder validation schemas
├── components/
│   ├── grant-tracker-enhanced-page.tsx  # Main enhanced page
│   ├── grant-tracker-page.tsx           # Original simple page
│   ├── grant-card.tsx                   # Grant card component
│   ├── grant-form-modal.tsx             # Grant form
│   ├── application-pipeline.tsx         # Pipeline kanban view
│   ├── deadline-calendar.tsx            # Deadline calendar view
│   ├── funder-list.tsx                  # Funder grid view
│   └── funder-form-modal.tsx            # Funder form
└── index.tsx                       # Module exports
```

## Usage

### Accessing the Grant Tracker

The Grant Tracker is an add-on that must be enabled in organization settings:

1. Navigate to Settings > Add-ons
2. Enable "Grant Tracker"
3. Access via `/addon/grant-tracker`

### Creating a Grant Application

```typescript
import { createGrant } from '@/modules/grant-tracker'

const result = await createGrant({
  funderName: 'Gates Foundation',
  grantName: 'Community Development Grant 2025',
  amountRequested: 50000,
  deadline: '2025-03-15',
  notes: 'Focus on education programs',
})
```

### Creating a Funder

```typescript
import { createFunder } from '@/modules/grant-tracker'

const result = await createFunder({
  name: 'Gates Foundation',
  type: 'foundation',
  website: 'https://gatesfoundation.org',
  contactName: 'Jane Smith',
  contactEmail: 'jane@gates.org',
  focusAreas: ['education', 'health'],
  averageGrantSize: 100000,
  relationshipStatus: 'prospect',
})
```

### Querying Grants

```typescript
import { getGrantApplications, getGrantStats } from '@/modules/grant-tracker'

// Get all grants
const grants = await getGrantApplications()

// Get grants by status
const draftGrants = await getGrantApplications({ status: 'draft' })

// Get statistics
const stats = await getGrantStats()
```

### Querying Funders

```typescript
import { getFunders, getFundersWithGrants } from '@/modules/grant-tracker'

// Get all funders
const funders = await getFunders()

// Get funders with grant history
const fundersWithHistory = await getFundersWithGrants()

// Search funders
const results = await searchFunders('gates')
```

## Server Actions

### Grant Actions
- `createGrant(input)` - Create new grant application
- `updateGrant(input)` - Update existing grant
- `deleteGrant(id)` - Delete grant application
- `submitGrant(id)` - Mark as submitted
- `approveGrant(id, amount, reportingDue?)` - Mark as approved
- `declineGrant(id)` - Mark as declined
- `updateGrantStatus(id, status)` - Update status

### Funder Actions
- `createFunder(input)` - Create new funder
- `updateFunder(input)` - Update existing funder
- `deleteFunder(id)` - Delete funder

## Components

### GrantTrackerEnhancedPage
Main page component with tabbed interface:
- Pipeline view - Kanban-style pipeline
- Deadlines view - Calendar of upcoming deadlines
- All Grants view - Grid of all grant cards
- Funders view - Grid of all funder profiles

Props:
- `organizationId: string` - Current organization ID

### ApplicationPipeline
Kanban-style pipeline visualization showing grants across stages.

Props:
- `grants: GrantWithMeta[]` - Array of grants to display
- `onGrantClick?: (grant) => void` - Click handler

### DeadlineCalendar
Calendar view showing upcoming deadlines grouped by urgency.

Props:
- `grants: GrantWithMeta[]` - Array of grants to display
- `onGrantClick?: (grant) => void` - Click handler

### FunderList
Grid of funder cards with relationship tracking.

Props:
- `funders: Funder[]` - Array of funders to display
- `onEdit?: (funder) => void` - Edit handler
- `onDelete?: (funder) => void` - Delete handler
- `onView?: (funder) => void` - View details handler

## Migration

The module includes a migration file that creates the necessary database tables and views:

**File**: `supabase/migrations/036_grant_tracker_enhancements.sql`

Run migration:
```bash
npx supabase db reset
```

Or apply specific migration:
```bash
npx supabase migration up
```

## Integration with Grant Writing Assistant

The Grant Tracker integrates seamlessly with the Grant Writing Assistant:

1. **Link in Header**: Direct "Grant Writer" button in page header
2. **Shared Data**: Grant applications can be used as context for AI proposal generation
3. **Workflow**: Research → Track → Write → Submit → Track reporting

Navigate to Grant Writer:
```
/flora/grants
```

## Best Practices

### Grant Management
1. **Start with Research**: Add grants in "researching" status when you first discover them
2. **Track Deadlines**: Always add deadlines when known
3. **Update Status**: Move grants through pipeline as they progress
4. **Add Notes**: Document requirements, contacts, and application tips
5. **Link Funders**: Connect grants to funder profiles for relationship tracking

### Funder Database
1. **Build Relationships**: Track all interactions and update relationship status
2. **Document Focus Areas**: Record what the funder supports to match future opportunities
3. **Update After Decisions**: Move funders to "active" or "declined" based on outcomes
4. **Track Metrics**: Record average grant sizes and total awarded for strategic planning

### Pipeline Management
1. **Regular Reviews**: Check pipeline weekly to identify bottlenecks
2. **Prioritize Deadlines**: Focus on grants in "This Week" and "Next Week"
3. **Success Rate**: Monitor approval vs decline ratio to refine strategy
4. **Funder Relationships**: Track which funders have highest success rates

## Future Enhancements

Potential additions:
- [ ] Grant reporting workflow with report templates
- [ ] Email reminders for upcoming deadlines
- [ ] Funder matching suggestions based on focus areas
- [ ] Grant success analytics and predictions
- [ ] Document attachment management
- [ ] Collaborative grant review and approval workflow
- [ ] Integration with accounting systems for grant disbursements
- [ ] Custom pipeline stages per organization

## Support

For issues or questions about the Grant Tracker module, please refer to the main Flourish documentation or contact support.
