const { chromium } = require('C:/Users/Filipe/AppData/Roaming/npm/node_modules/playwright')
const path = require('path')
const fs = require('fs')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()
  const outDir = path.join(__dirname, '../tmp-screenshots')
  fs.mkdirSync(outDir, { recursive: true })
  const ss = (name) => page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false })

  const BASE = 'http://localhost:3001'

  try {
    // ── Login ──────────────────────────────────────────────────────────────────
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', 'adm@accoelho.com.br')
    await page.fill('input[type="password"]', '123456y@')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(3000)   // let data fetch settle
    await ss('01-dashboard-overview')
    console.log('✓ Login + Dashboard loaded')
    console.log('  Current semana:', await page.locator('button').filter({ hasText: /S\d+\/\d{4}/ }).first().textContent().catch(() => '?'))

    // ── Ensino Técnico main tab ────────────────────────────────────────────────
    await page.locator('button').filter({ hasText: 'Ensino Técnico' }).first().click()
    await page.waitForTimeout(1500)
    await ss('02-et-consolidated')
    console.log('✓ Ensino Técnico tab')

    // Check consolidated shows KPIs
    const investidoTexts = await page.locator('text=/R\$\s*[\d.,]+/').allTextContents()
    console.log('  Investido cards:', investidoTexts.slice(0, 3))

    // ── Meta Ads sub-tab ──────────────────────────────────────────────────────
    await page.locator('button').filter({ hasText: 'Meta Ads' }).first().click()
    await page.waitForTimeout(1500)
    await ss('03-et-meta-ads')
    console.log('✓ ET > Meta Ads tab')

    // Check for empty state vs real data
    const emptyCount  = await page.locator('text=/Nenhum dado/i').count()
    const mcpErrCount = await page.locator('text=/cache MCP/i').count()
    const sheetErrCount = await page.locator('text=/SHEETS_META_URL/i').count()

    if (sheetErrCount > 0) {
      console.error('✗ OLD wrong error message (SHEETS_META_URL) still shown!')
    } else if (mcpErrCount > 0) {
      console.warn('⚠ MCP cache error message shown (no data for this period?)')
    } else if (emptyCount > 0) {
      console.warn('⚠ Empty state (no data for current period)')
    } else {
      console.log('✓ ET > Meta Ads has data (no empty-state message)')
    }

    // Capture some visible metric values
    const cardValues = await page.locator('[class*="font-bold"], [class*="text-2xl"], [class*="text-3xl"]').allTextContents()
    console.log('  Sample metric values:', cardValues.slice(0, 6).join(' | '))

    // ── Google Ads sub-tab ─────────────────────────────────────────────────────
    await page.locator('button').filter({ hasText: 'Google Ads' }).first().click()
    await page.waitForTimeout(1500)
    await ss('04-et-google-ads')
    const googleEmpty = await page.locator('text=/Nenhum dado/i').count()
    console.log(googleEmpty > 0 ? '⚠ Google Ads: empty state' : '✓ Google Ads has data')

    // ── Graduação tab ──────────────────────────────────────────────────────────
    await page.locator('button').filter({ hasText: 'Graduação' }).first().click()
    await page.waitForTimeout(1000)
    await ss('05-graduacao')
    console.log('✓ Graduação tab switched OK')

    // ── Admin check (optional) ─────────────────────────────────────────────────
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    await ss('06-admin')
    const adminTitle = await page.locator('h1, h2').first().textContent().catch(() => '')
    console.log('✓ Admin page:', adminTitle || 'loaded')

    console.log('\n✓ Smoke test passed — screenshots in tmp-screenshots/')
  } catch (err) {
    await ss('ERROR').catch(() => {})
    console.error('\n✗ Smoke test FAILED:', err.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
})()
