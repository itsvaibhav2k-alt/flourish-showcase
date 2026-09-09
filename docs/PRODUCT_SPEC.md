# Flourish Product Specification

> **Flourish** is an AI-powered nonprofit CRM designed specifically for managing donors, volunteers, and contacts with intelligent communications.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Features](#core-features)
3. [AI Capabilities](#ai-capabilities)
4. [Competitive Advantages](#competitive-advantages)
5. [Technical Architecture](#technical-architecture)

---

## Executive Summary

Unlike traditional CRMs that require manual data entry and generic templates, Flourish uses Claude AI to:

- **Generate personalized emails** that match your organization's voice
- **Calculate optimal donation amounts** based on donor capacity and history
- **Answer questions in plain English** - just ask "Who are my top donors?"
- **Write grant proposals** automatically using your organization's data
- **Identify at-risk donors** before they lapse

---

## Core Features

### 1. Contact Management

| Feature | Description |
|---------|-------------|
| **Unified Contact Hub** | Single record for each person, whether donor, volunteer, or both |
| **Multi-role Support** | Track if someone is a donor, volunteer, or both with role-specific data |
| **Activity Timeline** | Complete history of all interactions (gifts, emails, shifts, notes) |
| **Tags & Segmentation** | Flexible tagging system for custom groupings |
| **Portal Access** | Generate secure tokens for donor/volunteer self-service portals |
| **Batch Import** | CSV import with smart duplicate detection |
| **Search & Filter** | Full-text search with advanced filtering |

---

### 2. Donor Management

| Feature | Description |
|---------|-------------|
| **Gift Tracking** | Record one-time, recurring, pledges, and in-kind gifts |
| **Gift Import** | Bulk import donation history from spreadsheets |
| **Automatic Stats** | Lifetime giving, total gifts, average gift auto-calculated |
| **Donor Segments** | Automatic categorization (new, active, lapsed, major) |
| **Lapse Risk Alerts** | AI calculates risk of donor lapsing based on giving patterns |
| **Giving History** | Visual timeline of donation history with trends |

#### Lapse Risk Algorithm

The system calculates lapse risk based on each donor's unique giving pattern:

- **New donors (1-2 gifts):** Fixed thresholds
  - High risk: >90 days since last gift
  - Medium risk: >30 days since last gift

- **Established donors:** Compares to their average giving interval
  - Low risk: <1.5x their average interval
  - Medium risk: 1.5-2.5x their average interval
  - High risk: >2.5x their average interval

---

### 3. Volunteer Management

| Feature | Description |
|---------|-------------|
| **Shift Creation** | Create volunteer opportunities with capacity limits |
| **Public Signup** | Shareable links for self-service volunteer registration |
| **Check-in System** | Track attendance and calculate hours worked |
| **Reliability Scoring** | Automatic score (0-1) based on attendance history |
| **Automated Reminders** | AI-generated reminders at 7 days, 1 day, and morning of |
| **Hours Tracking** | Aggregate volunteer hours per person |

---

### 4. Communications

| Feature | Description |
|---------|-------------|
| **Voice Training** | Analyzes 5-15 sample emails to learn your organization's tone |
| **Thank-You Emails** | Auto-generated personalized thank-yous when gifts are recorded |
| **Re-engagement** | AI writes thoughtful emails to bring back lapsed donors |
| **Volunteer Emails** | Confirmations, reminders, and thank-yous for volunteers |
| **Approval Workflow** | Human review before any email is sent |
| **Batch Sending** | Send multiple approved emails at once |

#### Supported Email Types

| Type | Trigger | Description |
|------|---------|-------------|
| Thank You | Gift received | Personalized acknowledgment |
| Re-engagement | Manual/Lapse risk | Win back lapsed donors |
| Volunteer Confirmation | Shift signup | Confirm signup with details |
| Volunteer Reminder | 7d/1d/morning | Pre-shift reminders |
| Volunteer Thank You | Shift completed | Appreciation for service |
| Custom | Manual | Any purpose |

#### Voice Profile Extraction

When you train your voice profile, the AI extracts:
- **Formality level:** Casual / Moderate / Formal
- **Warmth rating:** 1-10 scale
- **Signature phrases:** Common expressions you use
- **Greeting & closing styles:** How you start and end emails

---

### 5. Ask Flora - Natural Language Queries

Ask questions about your data in plain English:

```
"Show me lapsed major donors"
"How much did we raise last month vs this month?"
"Who are my most reliable volunteers?"
"What's our average gift amount this year?"
"Top 10 donors this year"
```

| Query Type | Example |
|------------|---------|
| **Filter/List** | "Show me donors tagged 'board member'" |
| **Aggregate** | "How many new donors this month?" |
| **Comparison** | "Q4 vs Q3 revenue?" |
| **Ranking** | "Top 5 volunteers by hours" |
| **Conversational** | "How do I improve donor retention?" |

#### Smart Filter Patterns

The AI understands nonprofit terminology:
- "major donors" → lifetime_giving >= $10,000
- "lapsed donors" → lapse_risk in ['medium', 'high']
- "recurring donors" → is_recurring = true
- "this year" → current calendar year
- "last month" → previous calendar month

---

### 6. Major Gift Pipeline

A 5-stage pipeline for cultivating major donors:

```
Identification → Qualification → Cultivation → Solicitation → Stewardship
```

| Feature | Description |
|---------|-------------|
| **Cultivation Tracking** | Log calls, meetings, tours, events, proposals |
| **Readiness Scoring** | AI calculates 0-100 score based on engagement |
| **AI Recommendations** | Suggested next moves and optimal ask timing |
| **Outcome Tracking** | Record wins, losses, and deferred prospects |

#### Readiness Score Formula

| Factor | Weight | Description |
|--------|--------|-------------|
| Move Count | 30% | Number of cultivation moves relative to stage |
| Recency | 25% | Time since last interaction |
| Stage Duration | 20% | Time in current stage (too short or long = lower score) |
| Move Quality | 15% | Diversity and value of interactions |
| Response Sentiment | 10% | Positive/negative language in outcomes |

---

### 7. Smart Ask - Donation Recommendations

AI-calculated ask amounts with three tiers:

| Tier | Multiplier | Description |
|------|------------|-------------|
| **Stretch** | 1.5x | Ambitious ask for maximum impact |
| **Target** | 1.2x | Likely successful ask |
| **Accessible** | 1.0x | Conservative, high-confidence ask |

#### Calculation Factors

- Gift history (last gift, average gift, largest gift)
- Giving potential scores (capacity, affinity, propensity)
- Lapse risk level:
  - High risk: 40% reduction
  - Medium risk: 20% reduction
  - Low/unknown: Full amount
- Gift frequency and growth trends

Each recommendation includes a **confidence score** (0-100) and **reasoning explanation**.

---

### 8. Giving Potential / Wealth Screening

Three-dimensional scoring system:

| Score | Weight | Description |
|-------|--------|-------------|
| **Capacity** | 40% | Financial ability to give |
| **Affinity** | 30% | Connection and engagement level |
| **Propensity** | 30% | Likelihood to give based on history |

#### Capacity Indicators

- Real estate value (40%)
- Stock holdings (30%)
- Job title/level (20%)
- Political donations (10%)

#### Giving Gap

Identifies donors giving significantly less than their capacity:
```
Giving Gap = (Capacity Score - Actual Giving) / Capacity Score
```

High giving gap = major gift prospect

---

### 9. Grant Writing

AI-generated grant proposals with 8 sections:

1. **Executive Summary** (150-200 words)
2. **Statement of Need** (400-600 words)
3. **Project Description** (600-1000 words)
4. **Goals and Objectives** (300-500 words)
5. **Methods** (500-800 words)
6. **Evaluation Plan** (300-500 words)
7. **Budget Narrative** (250-400 words)
8. **Organizational Capacity** (300-500 words)

| Feature | Description |
|---------|-------------|
| **Section-by-Section** | Edit or regenerate individual sections |
| **Word Count Tracking** | Meet funder requirements automatically |
| **Context Integration** | Uses org mission, impact metrics, donor data |
| **Version History** | Track proposal iterations |

---

### 10. Grant Tracker

| Feature | Description |
|---------|-------------|
| **Application Pipeline** | Track from prospecting to reporting |
| **Deadline Management** | Never miss submission or reporting deadlines |
| **Amount Tracking** | Requested vs awarded amounts |
| **Funder Database** | Store funder contacts and history |

Status workflow:
```
Draft → Submitted → Pending → Approved/Declined → Reporting
```

---

### 11. Impact Stories

Personalized donor impact narratives:

| Feature | Description |
|---------|-------------|
| **Personalized Narratives** | AI-generated stories for each donor |
| **Impact Breakdown** | Show exactly what their giving funded |
| **Program Metrics** | Define cost-per-unit for each program |
| **Public Sharing** | Secure links for donors to share |

Example output:
> "Your $500 gift provided 100 meals, housed 2 families for a week, and trained 5 job seekers."

---

### 12. Campaign Central

| Feature | Description |
|---------|-------------|
| **Campaign Types** | Fundraising, awareness, event, annual, capital |
| **Progress Tracking** | Real-time raised vs goal visualization |
| **Gift Attribution** | Link gifts to specific campaigns |
| **Performance Metrics** | Donor count, total raised, ROI |

---

### 13. Email Sequences (Drip Campaigns)

| Feature | Description |
|---------|-------------|
| **Automated Journeys** | Multi-step email sequences |
| **Trigger-Based** | Gift, signup, lapse risk, or date |
| **Step Delays** | Configure days/hours between steps |
| **Conditional Logic** | Skip steps based on conditions |
| **Execution Tracking** | Audit trail of sent emails |

---

### 14. Dashboard & Analytics

| Widget | Description |
|--------|-------------|
| **Real-Time KPIs** | Contacts, donors, volunteers, donations |
| **AI Tiles** | Donor Health, Weekly Priorities, Org Pulse |
| **Copilot Actions** | AI-suggested next actions |
| **Recent Activity** | Live feed of interactions |
| **Donor Alerts** | At-risk or notable donors |
| **Upcoming Shifts** | Volunteer schedule preview |

---

### 15. Reporting & Export

| Feature | Description |
|---------|-------------|
| **CSV Exports** | Contacts, donors, gifts, volunteers |
| **Date Filtering** | Custom date range analysis |
| **Giving Trends** | Monthly/yearly visualization |
| **Volunteer Hours** | Hours by month and person |
| **Email Statistics** | Open, click, and delivery rates |

---

### 16. Settings & Configuration

| Area | Options |
|------|---------|
| **Team Management** | Invite members, assign roles (owner, admin, user) |
| **Automation** | Toggle auto-emails, reminders, risk calculation |
| **AI Configuration** | Model selection, cost tracking, voice profile |
| **Customization** | Dashboard layout, navigation, themes |
| **Demo Data** | Seed sample data for testing |

---

## AI Capabilities

### Models Used

| Model | Use Case | Cost |
|-------|----------|------|
| **Claude Haiku 4.5** | Queries, quick tasks | $1.00/M input, $5.00/M output |
| **Claude Sonnet** | Emails, grants, complex analysis | $3.00/M input, $15.00/M output |

### Cost Optimization

- **Prompt Caching:** 90% cost reduction with 5-minute cache
- **Model Selection:** Haiku for queries, Sonnet only when needed
- **Usage Tracking:** Per-feature cost logging
- **Budget Limits:** Configurable monthly caps

---

## Competitive Advantages

### 1. AI-Native Design

| Capability | Traditional CRMs | Flourish |
|------------|-----------------|----------|
| Email Writing | Manual templates | AI generates personalized emails |
| Donation Asks | Guesswork | AI calculates with confidence scores |
| Data Queries | Complex report builders | Plain English questions |
| Grant Writing | Manual documents | AI generates proposals |
| Donor Insights | Basic reports | Proactive risk detection |

### 2. Voice Training

Traditional CRMs use generic templates that sound robotic.

Flourish analyzes your actual emails to match:
- Writing style and tone
- Signature phrases
- Greeting/closing patterns
- Formality and warmth

**Result:** Every AI email sounds like your team wrote it.

### 3. Smart Ask System

Traditional CRMs rely on guesswork or simple formulas.

Flourish considers:
- Complete giving history
- Wealth indicators
- Engagement level
- Lapse risk (auto-adjusts)
- Returns 3 tiers with confidence scores

### 4. Natural Language Interface

Traditional CRMs require navigating complex menus.

Flourish: Just ask "Show me lapsed major donors"

### 5. Proactive Risk Detection

Traditional CRMs use simple date-based alerts.

Flourish:
- Analyzes each donor's unique pattern
- Calculates personalized risk thresholds
- Alerts before donors fully lapse
- Suggests re-engagement actions

### 6. Unified Donor/Volunteer View

Traditional CRMs often use separate systems.

Flourish single contact record:
- Donation history
- Volunteer hours
- Email communications
- Notes and tasks
- AI predictions

### 7. Cost Transparency

Traditional CRMs hide AI costs.

Flourish shows:
- Real-time cost per feature
- Usage by email type and model
- Monthly spending reports
- Budget limit configuration

### 8. Purpose-Built for Nonprofits

Traditional CRMs adapt sales/business tools.

Flourish designed for:
- Gift acknowledgment workflows
- Donor-specific lapse risk
- Major gift cultivation pipeline
- Volunteer coordination
- Impact reporting

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL), Inngest (background jobs) |
| AI | Anthropic Claude API |
| Email | Resend |
| Database | PostgreSQL with Row-Level Security |

### Security

- **Row-Level Security (RLS)** on all database tables
- **Organization-scoped multi-tenancy**
- **Portal tokens** for secure public access
- **Complete audit trails**

### Background Jobs (Inngest)

| Job | Schedule | Description |
|-----|----------|-------------|
| Thank-you generation | On gift | AI email when gift recorded |
| Send approved emails | Every 5 min | Batch send pending emails |
| Lapse risk calculation | Daily 6 AM | Update all donor risk scores |
| Volunteer reminders | Before shifts | 7d, 1d, morning reminders |
| Copilot suggestions | Daily 6 AM | Generate AI action items |
| AI tile refresh | Daily 5 AM | Update dashboard insights |

---

## Summary

Flourish differentiates from traditional nonprofit CRMs by:

1. **AI at the core** - Not a bolt-on feature, but foundational
2. **Voice-matched communications** - Emails sound like your team
3. **Intelligent insights** - Proactive recommendations, not just reports
4. **Natural language access** - Ask questions in English
5. **Unified platform** - Donors, volunteers, communications, grants in one place
6. **Cost transparency** - Know exactly what AI features cost
7. **Purpose-built** - Designed for nonprofit workflows from day one

The result: A CRM that handles routine tasks (thank-yous, risk detection, queries) while providing intelligent insights for strategic decisions (who to ask, how much, when).
