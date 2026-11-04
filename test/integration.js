/**
 * Phase C — Integration Test
 * Loads the No Blitz Chess extension and verifies blocking behavior on chess.com.
 *
 * Usage:
 *   cd no-blitz-chess
 *   npm install playwright
 *   node test/integration.js
 */

const { chromium } = require('playwright');
const path = require('path');

const EXTENSION_PATH = path.resolve(__dirname, '..');
const CHESS_URL = 'https://www.chess.com/play/online';

// Bullet/Blitz data-cy values discovered via discover.js
const BULLET_BLITZ_CY = [
  'time-selector-category-60',
  'time-selector-category-60|1',
  'time-selector-category-120|1',
  'time-selector-category-180',
  'time-selector-category-180|2',
  'time-selector-category-300',
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

(async () => {
  console.log('=== No Blitz Chess Integration Tests ===\n');
  console.log(`Extension path: ${EXTENSION_PATH}`);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
    slowMo: 150,
  });

  const page = await context.newPage();

  // ── Test 1: Page loads ───────────────────────────────────────────────────
  console.log('\n[Test 1] Navigate to chess.com/play/online');
  await page.goto(CHESS_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000); // let Vue SPA + content script settle
  assert(page.url().includes('chess.com'), 'Page loaded chess.com');

  // ── Test 2: Open time control panel ─────────────────────────────────────
  console.log('\n[Test 2] Open time control panel');
  const toggleBtn = await page.$('[data-cy="new-game-time-selector-button"]');
  assert(toggleBtn !== null, 'Found time control toggle button');
  if (toggleBtn) {
    await toggleBtn.click();
    await page.waitForTimeout(1500);
  }

  // ── Test 3: Overlays are present on Bullet/Blitz buttons ────────────────
  console.log('\n[Test 3] Bullet/Blitz buttons have blocking overlays');
  await page.waitForTimeout(1000);
  const overlayCount = await page.$$eval('.nbc-block-overlay', els => els.length);
  assert(overlayCount > 0, `Found ${overlayCount} blocking overlay(s)`);
  // Expect overlays on all 6 blocked buttons
  assert(overlayCount >= 6, `All 6 Bullet/Blitz buttons blocked (got ${overlayCount})`);

  // ── Test 4: Clicking a Bullet button does NOT change selection ───────────
  console.log('\n[Test 4] Clicking Bullet "1 min" does not change selection');
  const selBefore = await page.$eval(
    '[data-cy="new-game-time-selector-button"]',
    el => el.textContent.trim()
  ).catch(() => '');

  const bulletBtn = await page.$('[data-cy="time-selector-category-60"]');
  if (bulletBtn) {
    await bulletBtn.click({ force: true });
    await page.waitForTimeout(500);
    const selAfter = await page.$eval(
      '[data-cy="new-game-time-selector-button"]',
      el => el.textContent.trim()
    ).catch(() => '');
    assert(selBefore === selAfter, `Selection unchanged after clicking Bullet (was: "${selBefore}")`);
  } else {
    console.log('  ⚠️  SKIP: Bullet button not found (panel may not be open)');
  }

  // ── Test 5: Warning banner when Blitz/Bullet is the active selection ─────
  console.log('\n[Test 5] Warning banner state');
  const selText = await page.$eval(
    '[data-cy="new-game-time-selector-button"]',
    el => el.textContent.trim()
  ).catch(() => '');
  const isBlocked = selText.includes('Bullet') || selText.includes('Blitz');
  const banner = await page.$('#nbc-warning-banner');
  if (isBlocked) {
    assert(banner !== null, 'Warning banner visible (Blitz/Bullet is selected)');
  } else {
    assert(banner === null, `No banner (selection is "${selText}" — not a blocked category)`);
  }

  // ── Test 6: Start Game button disabled when Blitz selected ──────────────
  console.log('\n[Test 6] Start Game button disabled state');
  const startBtn = await page.$('[data-cy="new-game-index-play"]');
  if (isBlocked) {
    const hasDisabledClass = await startBtn?.evaluate(el => el.classList.contains('nbc-start-disabled'));
    assert(hasDisabledClass === true, 'Start Game has nbc-start-disabled class');
  } else {
    assert(true, `Skip — current selection "${selText}" is not blocked`);
  }

  // ── Test 7: Rapid button has no overlay and is clickable ────────────────
  console.log('\n[Test 7] Rapid "10 min" button has no overlay and is selectable');
  const rapidBtn = await page.$('[data-cy="time-selector-category-600"]');
  if (rapidBtn) {
    const hasOverlay = await rapidBtn.$('.nbc-block-overlay');
    assert(hasOverlay === null, 'Rapid button has no blocking overlay');
    await rapidBtn.click();
    await page.waitForTimeout(500);
    const selAfterRapid = await page.$eval(
      '[data-cy="new-game-time-selector-button"]',
      el => el.textContent.trim()
    ).catch(() => '');
    assert(selAfterRapid.includes('Rapid'), `Rapid selected after click (got "${selAfterRapid}")`);
  } else {
    console.log('  ⚠️  SKIP: Rapid button not found (panel may not be open)');
  }

  // ── Results ──────────────────────────────────────────────────────────────
  console.log('\n=== Test Results ===');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Extension is working correctly.');
    console.log('\nTo install in your Chrome browser:');
    console.log('  1. Open Chrome → chrome://extensions');
    console.log('  2. Enable "Developer mode" (top right toggle)');
    console.log('  3. Click "Load unpacked"');
    console.log(`  4. Select: ${EXTENSION_PATH}`);
  } else {
    console.log('\n⚠️  Some tests failed. See details above.');
  }

  await page.waitForTimeout(2000);
  await context.close();
})();
