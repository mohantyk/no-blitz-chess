/**
 * Phase A — DOM Discovery Script
 * Launches chess.com/play/online and dumps the time control panel HTML
 * to identify exact selectors for Bullet/Blitz sections and buttons.
 *
 * Usage:
 *   cd no-blitz-chess
 *   npm install playwright
 *   node test/discover.js
 */

const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to chess.com/play/online ...');
  await page.goto('https://www.chess.com/play/online', { waitUntil: 'load', timeout: 30000 });

  // Wait for the page to settle
  await page.waitForTimeout(3000);

  // Try to open the time control panel by clicking the current time control header
  try {
    console.log('\n--- Attempting to open time control panel ---');
    // Look for the time control selector button
    const tcButton = await page.$('[data-cy="time-selector-toggle"], [class*="time-selector"], [class*="TimeControl"]');
    if (tcButton) {
      await tcButton.click();
      console.log('Clicked time control toggle button');
      await page.waitForTimeout(1500);
    } else {
      console.log('No time control toggle found by data-cy, trying text search...');
      // Try clicking on elements containing "(Blitz)", "(Bullet)", "(Rapid)"
      const elements = await page.$$('button, [role="button"]');
      for (const el of elements) {
        const text = await el.textContent();
        if (text && (text.includes('Blitz') || text.includes('Bullet') || text.includes('Rapid'))) {
          console.log(`Clicking element with text: "${text.trim()}"`);
          await el.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    }
  } catch (e) {
    console.log('Error clicking time control:', e.message);
  }

  // Dump the full body HTML for analysis
  console.log('\n--- Full page HTML structure (truncated to 20000 chars) ---');
  const html = await page.content();
  console.log(html.substring(0, 20000));

  // Try to find Bullet/Blitz elements
  console.log('\n--- Searching for Bullet/Blitz text elements ---');
  const bulletBlitzEls = await page.$$eval('*', els =>
    els
      .filter(el => el.children.length === 0 && ['Bullet', 'Blitz', 'Rapid', 'Daily'].includes(el.textContent.trim()))
      .map(el => ({
        tag: el.tagName,
        text: el.textContent.trim(),
        class: el.className,
        id: el.id,
        parentClass: el.parentElement?.className,
        outerHTML: el.outerHTML.substring(0, 200)
      }))
  );
  console.log(JSON.stringify(bulletBlitzEls, null, 2));

  // Find all buttons visible on page
  console.log('\n--- All visible buttons ---');
  const buttons = await page.$$eval('button', btns =>
    btns
      .filter(b => b.offsetParent !== null)
      .map(b => ({
        text: b.textContent.trim().substring(0, 80),
        class: b.className.substring(0, 100),
        ariaLabel: b.getAttribute('aria-label'),
        dataCy: b.getAttribute('data-cy'),
        outerHTML: b.outerHTML.substring(0, 300)
      }))
  );
  console.log(JSON.stringify(buttons, null, 2));

  console.log('\n--- Discovery complete. Check output above for selectors. ---');

  await browser.close();
})();
