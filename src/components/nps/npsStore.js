/* Brand NPS demo store (Sep 21 2026, from Tony's three-asks proposal; study at
   brand-nps-study/, port 4292). One answer per MOMENT of a campaign:
     launch = campaign is live, sourcing has started
     cast   = every spot is filled and the products (or visits) are on the way
     close  = the campaign closed (everyone posted, or the deadline + 7 days)
   An answer is saved on the FIRST tap of a number (status 'scored'); the
   follow-up note is optional (status 'sent'). 'dismissed' = the brand closed
   the ask without a number; the email twin then carries it once. A banked
   score is never lost: closing the card after a tap counts as 'sent', and
   'hidden' only tucks the receipt away.
   Module + localStorage so answers survive captured-DOM remounts and route
   changes, same pattern as forks.js. */

export const MOMENTS = ['launch', 'cast', 'close'];

const KEY = 'nfNps';
const state = { launch: null, cast: null, close: null };
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* fresh */ }

const subs = new Set();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  subs.forEach((f) => f(state));
};

export const band = (n) => (n <= 6 ? 'detractor' : n <= 8 ? 'passive' : 'promoter');

export const nps = {
  get: (m) => state[m],
  all: () => ({ ...state }),
  /* first tap: the number is banked before any follow-up */
  score(m, score, via = 'portal') {
    state[m] = { ...(state[m] || {}), score, via, status: 'scored', at: new Date().toISOString() };
    save();
  },
  send(m, patch) {
    if (!state[m]) return;
    state[m] = { ...state[m], ...patch, status: 'sent' };
    save();
  },
  reopen(m) {
    if (!state[m]) return;
    state[m] = { ...state[m], status: 'scored', hidden: false };
    save();
  },
  dismiss(m) {
    const cur = state[m];
    state[m] = Number.isInteger(cur?.score) ? { ...cur, status: 'sent' } : { status: 'dismissed', at: new Date().toISOString() };
    save();
  },
  /* tuck the one-line receipt away; the answer stays */
  hide(m) {
    if (!state[m]) return;
    state[m] = { ...state[m], hidden: true };
    save();
  },
  reset(m) {
    if (m) state[m] = null;
    else MOMENTS.forEach((k) => { state[k] = null; });
    save();
  },
  sub(f) { subs.add(f); return () => subs.delete(f); },
};

/* Deep-link seed, the email twin's one-tap link: ?nps=cast&score=8 lands in
   the portal with the number already banked and the follow-up open. */
try {
  const Q = new URLSearchParams(window.location.search);
  const m = Q.get('nps');
  const raw = Q.get('score') || '';
  if (MOMENTS.includes(m) && /^(10|\d)$/.test(raw)) {
    const s = Number(raw);
    /* a reload must not reopen an answer that was already sent */
    if (!(state[m]?.score === s && state[m]?.status === 'sent')) nps.score(m, s, 'email');
  }
  if (m === 'reset') nps.reset();
  if (m) {
    /* the seed is one-shot: drop the params so a reload does not bank again */
    Q.delete('nps'); Q.delete('score');
    const qs = Q.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  }
} catch { /* no window */ }
