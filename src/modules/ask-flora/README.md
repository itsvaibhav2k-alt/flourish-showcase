# Ask Flora - Natural Language Query System

A powerful natural language query interface for the Flourish nonprofit CRM that allows users to query their data using plain English questions.

## Overview

Ask Flora uses Claude AI (Haiku model) to parse natural language questions into structured query plans, then executes those queries against the Supabase database to return formatted results.

## Features

- **Natural Language Processing**: Parse questions like "Show me my top 10 donors" or "How much did we raise last month?"
- **Multiple Query Types**: Supports filtering, aggregation, comparison, and list queries
- **Real-time Results**: Chat-like interface with instant query processing
- **Smart Suggestions**: Pre-built query suggestions organized by category
- **Rich Result Display**: Tables, cards, and comparison views with animations
- **Cost Tracking**: Monitors AI API usage and costs

## Architecture

### Query Flow

1. User enters natural language question
2. `parse-query.ts` sends question to Claude Haiku
3. Claude returns structured query plan (filters, aggregations, time ranges)
4. `execute-query.ts` translates plan into Supabase queries
5. Results are formatted and displayed to user

### File Structure

```
src/modules/ask-flora/
├── actions/
│   └── process-query.ts          # Server action to process queries
├── components/
│   ├── ask-flora-page.tsx        # Main chat interface
│   ├── query-results.tsx         # Results display component
│   └── suggested-queries.tsx     # Quick query suggestions
└── index.ts                       # Public exports

src/lib/ai/query-parser/
├── parse-query.ts                # Claude-powered query parser
├── execute-query.ts              # Query executor
└── index.ts                       # Public exports
```

## Query Types

### 1. Filter/List Queries
Find specific contacts or records matching criteria.

**Examples:**
- "Show me lapsed major donors"
- "Who are my most reliable volunteers?"
- "Show me contacts tagged with 'board member'"

**Result Type:** Table of matching records

### 2. Aggregate Queries
Calculate sums, averages, counts, etc.

**Examples:**
- "How many new donors did we get this month?"
- "What is the average gift amount for recurring donors?"
- "How many volunteer hours were logged this month?"

**Result Type:** Metric cards with aggregated values

### 3. Comparison Queries
Compare metrics across time periods.

**Examples:**
- "How much did we raise last month vs this month?"
- "What was our total revenue in Q4 vs Q3?"

**Result Type:** Side-by-side comparison with change indicators

### 4. List Items
Top/bottom N items sorted by a metric.

**Examples:**
- "Who are my top 10 donors this year?"
- "Show me all gifts over $500 this year"

**Result Type:** Sorted table with limit

## Supported Entities

- **contacts**: All people in the database
- **donors**: Contacts with `is_donor = true`
- **volunteers**: Contacts with `is_volunteer = true`
- **gifts**: Donation records
- **shifts**: Volunteer shift records
- **activities**: Contact activity log

## Common Filter Patterns

The query parser understands these common patterns:

| Pattern | Translates To |
|---------|---------------|
| "major donors" | `lifetime_giving >= 10000` |
| "lapsed donors" | `lapse_risk in ['medium', 'high']` |
| "recurring donors" | `is_recurring = true` in gifts |
| "at-risk donors" | `lapse_risk in ['medium', 'high']` |
| "this year" | Current calendar year |
| "last month" | Previous calendar month |
| "Q4" | Oct-Dec of current year |
| "30 days" | Last 30 days from today |

## Time Expressions

Supported time ranges:
- Absolute: ISO dates
- Relative: "30 days ago", "last month", "this year"
- Periods: "Q1", "Q2", "Q3", "Q4", "YTD"

## Usage

### In Code

```tsx
import { AskFloraPage } from '@/modules/ask-flora'

export default function Page() {
  return <AskFloraPage />
}
```

### Via Server Action

```tsx
import { processQuery } from '@/modules/ask-flora'

const result = await processQuery('Show me my top donors')
console.log(result.data) // Query results
```

## Configuration

### AI Model
Uses Claude Haiku 4.5 for cost efficiency. Can be changed in `parse-query.ts`:

```typescript
model: MODELS.HAIKU, // or MODELS.SONNET for higher quality
```

### Default Limits
Queries are limited to 50 results by default. Override in query plan:

```typescript
limit: 100 // or any number
```

## Cost Tracking

All queries are tracked in the `ai_usage` table with:
- Input/output token counts
- Estimated cost
- Model used
- Timestamp

View usage stats in Settings > AI Usage.

## Performance

- **Parse Query**: ~500ms (Claude Haiku API call)
- **Execute Query**: 100-500ms (depends on data size)
- **Total**: ~600-1000ms for typical queries

## Limitations

1. Complex joins across multiple entities not yet supported
2. Subqueries not implemented
3. Grouping by multiple fields limited
4. Maximum 50 results per query (pagination not implemented)

## Future Enhancements

- [ ] Export results to CSV
- [ ] Save queries as "views"
- [ ] Query history and favorites
- [ ] Multi-entity joins (e.g., "donors who are also volunteers")
- [ ] Pagination for large result sets
- [ ] Natural language follow-up questions
- [ ] Data visualization (charts, graphs)
- [ ] Scheduled queries with email reports

## Example Queries

### Donors
```
- Who are my top 10 donors this year?
- Show me lapsed major donors
- How many new donors did we get this month?
- What is the average gift amount for recurring donors?
- Show me at-risk donors with lifetime giving over $1000
```

### Giving
```
- How much did we raise last month vs this month?
- What was our total revenue in Q4?
- Show me all gifts over $500 this year
- How many recurring donors do we have?
```

### Volunteers
```
- Show me volunteers who haven't signed up in 30 days
- Who are my most reliable volunteers?
- How many volunteer hours were logged this month?
- Which shifts need more volunteers?
```

### Contacts
```
- Show me contacts tagged with "board member"
- Who did we add to the database this week?
```

## Troubleshooting

### Query Returns No Results
- Check if filters are too restrictive
- Verify time range is correct
- Try simplifying the question

### Parse Error
- Rephrase the question
- Be more specific about entities and metrics
- Use one of the suggested queries as a template

### Slow Performance
- Reduce result limit
- Narrow time range
- Add more specific filters

## Support

For issues or feature requests, contact the Flourish development team.
