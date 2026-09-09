# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js 16 with Turbopack)
npm run build    # Production build
npm run lint     # Run ESLint
```

### Supabase

```bash
npx supabase start                    # Start local Supabase
npx supabase db reset                 # Reset database and run migrations
npx supabase gen types typescript --local > src/lib/supabase/types.ts  # Regenerate types
```

### Inngest (Background Jobs)

```bash
npx inngest-cli@latest dev            # Start Inngest dev server (runs on port 8288)
```

## Architecture

**Flourish** is a nonprofit CRM with AI-powered communications for managing donors, volunteers, and contacts.

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + RLS), Inngest (background jobs)
- **AI**: Anthropic Claude API for email generation
- **Email**: Resend for transactional emails

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Public auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/inngest/       # Inngest webhook endpoint
├── components/
│   ├── ui/                # Shadcn/ui components
│   ├── layouts/           # Dashboard shell, page headers
│   └── common/            # Shared components
├── modules/               # Feature modules (domain-driven)
│   ├── contacts/          # Contact management
│   ├── donors/            # Gift tracking, lapse risk
│   ├── volunteers/        # Shifts, signups, check-in
│   └── communications/    # AI emails, drafts, voice training
├── lib/
│   ├── supabase/          # Client, server, middleware helpers
│   ├── ai/                # Claude integration, prompts, context builders
│   ├── inngest/           # Background job definitions
│   ├── email/             # Resend client, email templates
│   └── import/            # CSV parsing, duplicate detection
└── providers/             # React context providers
```

### Module Pattern

Each module in `src/modules/` follows this structure:
- `actions/` - Server actions (mutations)
- `queries/` - Data fetching functions
- `schemas/` - Zod validation schemas
- `services/` - Business logic (e.g., lapse risk calculation)
- `components/` - Module-specific React components
- `index.ts` - Public exports

### Data Flow

1. **Authentication**: Supabase Auth with middleware-based session refresh
2. **Multi-tenancy**: Organization-scoped data via RLS policies using `organization_id`
3. **Server Actions**: All mutations use Next.js server actions in `actions/` directories
4. **Background Jobs**: Inngest handles async tasks (email generation, reminders, stats updates)

### Key Inngest Functions

Located in `src/lib/inngest/functions/`:
- `generateThankYou` - AI-generated thank-you emails triggered by gifts
- `sendApprovedEmails` - Batch send approved email drafts
- `calculateLapseRiskJob` - Periodic donor lapse risk calculation
- `sendVolunteerReminders` - Automated shift reminders
- `updateContactStats` - Recalculate contact aggregates

### AI Communications

The AI system in `src/lib/ai/` includes:
- **Voice Training**: Analyzes sample emails to learn organization's writing style
- **Context Building**: Constructs rich prompts with donor/volunteer history
- **Prompt Templates**: Type-specific prompts (thank-you, re-engagement, volunteer)
- **Cost Tracking**: Logs token usage to `ai_usage` table

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `INNGEST_SIGNING_KEY` (production)

### Tailwind CSS v4

This project uses Tailwind v4 with the new CSS-based configuration. Custom theme colors are defined in `src/app/globals.css` using `@theme inline {}` blocks. Avoid using `@apply` with custom utilities.
