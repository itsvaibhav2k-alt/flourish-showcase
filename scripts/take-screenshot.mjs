import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

async function takeScreenshots() {
  // Create screenshots directory
  try { mkdirSync('screenshots', { recursive: true }) } catch {}

  const browser = await chromium.launch({
    headless: false,  // Show the browser
    slowMo: 300       // Slow down for visibility
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })

  const page = await context.newPage()

  console.log('Taking screenshots of contextual help features...')

  // 1. Pipeline page with help button
  console.log('1. Pipeline page...')
  await page.goto('http://localhost:3000/pipeline')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'screenshots/01-pipeline-page.png', fullPage: false })

  // 2. Click the help button to open sidebar
  console.log('2. Opening help sidebar...')
  const helpButton = page.locator('button[aria-label="How to use this page"]')
  if (await helpButton.isVisible()) {
    await helpButton.click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/02-pipeline-help-sidebar.png', fullPage: false })
    // Close it
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // 3. Donors page
  console.log('3. Donors page...')
  await page.goto('http://localhost:3000/donors')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'screenshots/03-donors-page.png', fullPage: false })

  // 4. Prospects/Giving Potential page
  console.log('4. Prospects page...')
  await page.goto('http://localhost:3000/prospects')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'screenshots/04-prospects-page.png', fullPage: false })

  // 5. Volunteers page
  console.log('5. Volunteers page...')
  await page.goto('http://localhost:3000/volunteers')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'screenshots/05-volunteers-page.png', fullPage: false })

  // 6. Dashboard
  console.log('6. Dashboard...')
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'screenshots/06-dashboard.png', fullPage: false })

  console.log('Done! Screenshots saved to screenshots/ folder')

  await browser.close()
}

takeScreenshots().catch(console.error)
