/*
 * Invite Creators: Amine's v2 popup, V1 layout only, cleaned for engineering
 * (public/invite-creators/, see its README.md for what changed from his build).
 *
 * Two doors on the tracker open it in a full-screen iframe over the page:
 *   - "Review Creators" on Day 3 (CreatorsFound in amine.jsx): the first round,
 *     with the campaign's spots (SPOTS) and the demo scenario (FOUND 75 or 7;
 *     Amara on the list when the OPEN SPOT switch says she comes from the invites).
 *   - "Review matches" on Day 11 (the rematch row in either table): a rematch
 *     for the open spots (the found rows that day).
 * His background page (sidebar + campaign header) is hidden so our tracker
 * shows through his dim. The page and this file talk with postMessage:
 * invite:sent { names } once invites go out (Day 4 then lists exactly those,
 * via openSpot.js), invite:closed { sent } when it closes, invite:open to
 * reopen it. Once invites are sent, closing it moves the tracker to the next
 * day: after Send the dashboard is the creators table. Each round + scenario
 * keeps its iframe, so choices survive a close and reopen; the page also saves
 * them as the brand goes (sessionStorage).
 */
import { SPOTS, crewFor } from '../components/pulse/pulseData.js';
import { forks } from '../components/pulse/forks.js';
import { pool, openSpot, setFirstRoundSent, setRematchSent } from './openSpot.js';

const SRC = `${import.meta.env.BASE_URL}invite-creators/index.html`;

const EMBED_CSS = `
  html { overscroll-behavior: none; }
  html, body { background: transparent !important; }
  .sidebar, .page-head { display: none !important; }
`;

const collab = () => (forks.get('type') === 'local' ? 'local' : 'product');
const openSpots = (day) => crewFor(day, collab()).filter((c) => c.mystery && c.found).length || 1;

const ROUNDS = {
  first: () => `?spots=${SPOTS}&pool=${pool()}${openSpot() === 'invites' ? '&amara=1' : ''}`,
  rematch: () => `?mode=rematch&spots=${openSpots(11)}`,
};
const frames = {};   // by round + query: flipping a demo switch opens a fresh list

const show = (frame, on) => {
  frame.style.visibility = on ? 'visible' : 'hidden';
  frame.style.pointerEvents = on ? 'auto' : 'none';
  if (on) frame.focus();
};

// The tracker's own day scrubber moves the demo (its day state lives inside CampaignPulse)
function goToNextDay() {
  const arrows = document.querySelectorAll('.cp-scrubber .cp-scrub-arrow');
  arrows[arrows.length - 1]?.click();
}

function open(round) {
  const key = round + ROUNDS[round]();
  const known = frames[key];
  if (known) {
    if (!known.ready) return;
    known.el.contentWindow.postMessage({ type: 'invite:open' }, location.origin);
    show(known.el, true);
    return;
  }
  const el = document.createElement('iframe');
  el.src = SRC + ROUNDS[round]();
  el.title = 'Invite Creators';
  el.className = 'ic-embed';
  Object.assign(el.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    border: '0', background: 'transparent', zIndex: '2147483000',
  });
  const f = { el, round, ready: false };
  frames[key] = f;
  show(el, false); // until the embed CSS is in, so his background page never flashes
  el.addEventListener('load', () => {
    const st = el.contentDocument.createElement('style');
    st.textContent = EMBED_CSS;
    el.contentDocument.head.appendChild(st);
    f.ready = true;
    show(el, true);
  });
  document.body.appendChild(el);
}

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  const f = Object.values(frames).find((x) => x.el.contentWindow === e.source);
  if (!f) return;
  if (e.data?.type === 'invite:sent' && Array.isArray(e.data.names)) {
    (f.round === 'first' ? setFirstRoundSent : setRematchSent)(e.data.names);
  }
  if (e.data?.type !== 'invite:closed') return;
  show(f.el, false);
  if (e.data.sent) goToNextDay();
});

// ↺ Reset invites: drop every popup so the next open starts from a fresh list
window.addEventListener('invite:reset', () => {
  Object.keys(frames).forEach((k) => { frames[k].el.remove(); delete frames[k]; });
});

const ROUND_FOR = (el) => {
  if (el.closest('.am-found-btn')) return 'first';
  const btn = el.closest('button, .am-row-cta');
  return btn && btn.textContent.trim().endsWith('Review matches') ? 'rematch' : null;
};

document.addEventListener('click', (e) => {
  const round = e.target instanceof Element && ROUND_FOR(e.target);
  if (!round) return;
  e.preventDefault();
  e.stopPropagation();
  open(round);
}, true);
