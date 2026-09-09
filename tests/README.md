# E2E Tests

This directory contains end-to-end tests for the Flourish CRM application using Playwright.

## Setup

Playwright and Chromium are already installed. If you need to reinstall:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Running Tests

### Run all tests

```bash
npm run test:e2e
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific test file

```bash
npx playwright test tests/e2e/dashboard.spec.ts
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

### Debug tests

```bash
npx playwright test --debug
```

## Test Structure

- `dashboard.spec.ts` - Dashboard page tests (metrics, quick actions, pending drafts)
- `contacts.spec.ts` - Contacts page tests (search, tabs, row actions)
- `donors.spec.ts` - Donors page tests (time range filter, chart, record gift flow)
- `volunteers.spec.ts` - Volunteers page tests (shifts, signups, status filters)
- `communications.spec.ts` - Communications tests (drafts, sent emails, voice training)
- `settings.spec.ts` - Settings page tests (organization setup, tabs, validation)

## Configuration

The tests are configured to:
- Run against `http://localhost:3000`
- Start the dev server automatically before running tests
- Use BYPASS_AUTH mode (configured in .env.local)
- Reuse existing server if already running

## Important Notes

1. **BYPASS_AUTH**: Tests rely on BYPASS_AUTH=true in .env.local to skip authentication
2. **Local Supabase**: Make sure local Supabase is running (`npx supabase start`)
3. **Dev Server**: Playwright will automatically start the dev server if not running
4. **Trace**: Traces are captured on first retry for debugging failed tests

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## CI/CD Integration

In CI environments (where process.env.CI is set), the tests will:
- Not reuse existing servers
- Run in headless mode by default
- Generate artifacts for failed tests
