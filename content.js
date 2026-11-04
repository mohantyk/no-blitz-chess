/**
 * No Blitz Chess - Content Script
 * Blocks Bullet and Blitz time controls on chess.com/play/online
 *
 * Selectors discovered via Playwright DOM discovery against live chess.com:
 *   - Section labels:  span.time-selector-section-label  ("Bullet", "Blitz", "Rapid")
 *   - Section header:  .time-selector-section-header
 *   - Time buttons:    [data-cy^="time-selector-category-"]
 *   - Bullet buttons:  data-cy = time-selector-category-60, 60|1, 120|1
 *   - Blitz buttons:   data-cy = time-selector-category-180, 180|2, 300
 *   - Start Game:      data-cy="new-game-index-play"
 *   - Selection show:  data-cy="new-game-time-selector-button"
 */

const BLOCKED_DATA_CY = new Set([
  // Bullet (≤2 min)
  'time-selector-category-60',
  'time-selector-category-60|1',
  'time-selector-category-120|1',
  // Blitz (3–5 min)
  'time-selector-category-180',
  'time-selector-category-180|2',
  'time-selector-category-300',
]);

const OVERLAY_CLASS = 'nbc-block-overlay';
const BANNER_ID = 'nbc-warning-banner';

let bannerEl = null;
let observer = null;

// ─── Block overlay injection ──────────────────────────────────────────────────

function injectOverlay(btn) {
  if (btn.dataset.nbcBlocked) return;
  btn.dataset.nbcBlocked = '1';

  if (getComputedStyle(btn).position === 'static') {
    btn.style.position = 'relative';
  }

  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASS;
  overlay.title = 'Blocked by No Blitz — choose Rapid or Daily!';
  overlay.innerHTML = '<span class="nbc-overlay-icon">🚫</span>';

  // Stop all pointer events in capture phase so Vue never sees the click
  ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart'].forEach(evt => {
    overlay.addEventListener(evt, e => { e.stopPropagation(); e.preventDefault(); }, true);
  });

  btn.appendChild(overlay);
}

function blockBulletAndBlitz() {
  BLOCKED_DATA_CY.forEach(cy => {
    const btn = document.querySelector(`[data-cy="${cy}"]`);
    if (btn) injectOverlay(btn);
  });
}

// ─── Warning banner + Start Game disable ─────────────────────────────────────

function getCurrentSelectionText() {
  const el = document.querySelector('[data-cy="new-game-time-selector-button"]');
  return el ? el.textContent.trim() : '';
}

function isBlockedSelection(text) {
  return text.includes('Bullet') || text.includes('Blitz');
}

function findStartGameButton() {
  return document.querySelector('[data-cy="new-game-index-play"]');
}

function preventStart(e) {
  if (e.currentTarget.dataset.nbcDisabled) {
    e.stopPropagation();
    e.preventDefault();
  }
}

function updateWarningState() {
  const selText = getCurrentSelectionText();
  const blocked = isBlockedSelection(selText);

  // Banner
  if (blocked) {
    if (!bannerEl || !document.body.contains(bannerEl)) {
      bannerEl = document.createElement('div');
      bannerEl.id = BANNER_ID;
      bannerEl.innerHTML =
        '🚫 <strong>No Blitz:</strong> Bullet &amp; Blitz are blocked. Please select Rapid or Daily!';
      document.body.appendChild(bannerEl);
    }
  } else {
    if (bannerEl && document.body.contains(bannerEl)) {
      bannerEl.remove();
      bannerEl = null;
    }
  }

  // Start Game button
  const startBtn = findStartGameButton();
  if (startBtn) {
    if (blocked) {
      startBtn.classList.add('nbc-start-disabled');
      startBtn.dataset.nbcDisabled = '1';
      startBtn.addEventListener('click', preventStart, true);
    } else {
      startBtn.classList.remove('nbc-start-disabled');
      delete startBtn.dataset.nbcDisabled;
      startBtn.removeEventListener('click', preventStart, true);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function run() {
  blockBulletAndBlitz();
  updateWarningState();
}

function startObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

run();
startObserver();

window.addEventListener('popstate', () => setTimeout(run, 500));
