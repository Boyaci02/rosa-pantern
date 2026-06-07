import puppeteer from 'puppeteer'

const URL = 'https://qopla.com/restaurant/rosa-pantern-uppsala/qDQedKO728/order'

;(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 4000))

  // Dismiss "How to eat?"
  try {
    const btns = await page.$$('button')
    for (const btn of btns) {
      const txt = await btn.evaluate(b => b.textContent.trim())
      if (/take.?away|ta med|eat here|äta/i.test(txt)) { await btn.click(); break }
    }
    await new Promise(r => setTimeout(r, 2000))
  } catch {}

  // Scroll all the way down slowly to trigger lazy load
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await new Promise(r => setTimeout(r, 250))
  }
  await new Promise(r => setTimeout(r, 2000))

  // Dump DOM text from category headings
  const raw = await page.evaluate(() => {
    // category nav links
    const navLinks = Array.from(document.querySelectorAll('a[href*="#"]'))
      .map(a => a.textContent.trim()).filter(t => t.length > 1 && t.length < 50)

    // All headings
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'))
      .map(h => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 80) }))
      .filter(h => h.text.length > 1)

    // All visible text nodes that look like product names (short, near prices)
    const products = Array.from(document.querySelectorAll('[class*="name"],[class*="title"],[class*="product"],[class*="item"]'))
      .map(el => el.textContent.trim().slice(0, 80))
      .filter(t => t.length > 2 && t.length < 60)
      .slice(0, 200)

    return { navLinks, headings, products }
  })

  await browser.close()

  console.log('NAV:', raw.navLinks.slice(0,30).join(' | '))
  console.log('\nHEADINGS:')
  raw.headings.forEach(h => console.log(`  ${h.tag}: ${h.text}`))
  console.log('\nPRODUCTS (sample):')
  raw.products.slice(0, 100).forEach(p => console.log('  ' + p))
})()
