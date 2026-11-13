/*
 * The tracker after the Invite Creators popup: 75 invites for 6 spots (Julia, Oct 22).
 *
 * 1. Counts follow the invites actually sent (Day 4 table and recap, Day 9 recap),
 *    and "N of 6 accepted their invite" reads as spots filled.
 * 2. OPEN SPOT switch (Days 9 to 11, black demo bar): how Lena's declined spot
 *    gets filled. "New matches" (default) = today's story, Katie's team sources
 *    replacements and the brand clicks Review matches on Day 11. "From invites" =
 *    one of the still-open invites (Amara) takes the spot, no brand action.
 * 3. The other invites sit under one line at the bottom of the table (InviteFold).
 * 4. FOUND switch (every day, black demo bar): we found 75 creators, or only 7
 *    (the tracker's six plus one: Emma, or Amara when she comes from the invites).
 *
 * pulseData.js calls installOpenSpot() once and asks openSpotCrew() first in
 * crewFor(). This file must not import pulseData (pulseData imports it).
 */
import { forks } from '../components/pulse/forks.js';
import { FIRST_ROUND_TOTAL, MORE_INVITED, AMARA_INVITE, SWAPPED_FOR_AMARA, REMATCH_OTHERS, FOUND_FACES, FOUND_FACES_7 } from './rounds.js';

export const OPEN_SPOT_CASES = [['matches', 'New matches'], ['invites', 'From invites']];
export const openSpot = () => (forks.get('openSpot') === 'invites' ? 'invites' : 'matches');
const fromInvites = () => openSpot() === 'invites';

export const POOL_CASES = [[75, '75'], [7, '7']];
export const pool = () => (Number(forks.get('invitePool')) === 7 ? 7 : FIRST_ROUND_TOTAL);
export const poolTotal = () => pool();
export const foundFaces = () => (pool() === 7 ? FOUND_FACES_7 : FOUND_FACES);

/* ---- every new brand-facing line (copywriter, Oct 22, PROPOSED) ---- */
const creators = (n) => `${n} creator${n === 1 ? '' : 's'}`;
export const COPY = {
  invitesSent: (n) => `${n} invite${n === 1 ? '' : 's'} sent`,
  spotsFilled: (n, spots) => `${n} of ${spots} spots filled`,
  foldWaiting: (n) => `${creators(n)} still deciding`,
  foldClosed: (n) => `${creators(n)} saved for your next campaign`,
  chipWaiting: (when) => `Invited ${when}`,
  chipClosed: 'Invite expired',
  // "From invites" only
  d9DeclinedRest: ', their spot stays open',
  d9Next: { text: 'Open spot fills', eta: 'when the next creator accepts', sep: ' ' },
  d11Label: 'Day 11 · Spot filled',
  d11Race: (spots) => `Day 11, all ${spots} spots filled. <strong>Most agencies are still recruiting.</strong>`,
  d11Next: {
    product: { text: 'Amara picks a product', eta: 'this week', sep: ' ' },
    local: { text: 'Amara emails you to book a visit', eta: 'this week', sep: ' ' },
  },
  d11Recap: { bold: 'Amara accepted your invite', rest: ' and took the open spot' },
  d11Closer: { clear: true, text: 'Nothing needs you. Everyone’s moving.' },
  amaraStatus: { product: '✅ Accepted today, picking a product', local: '✅ Accepted today, will email you to book a visit' },
  amaraSteps: [{ when: 'Jul 16', detail: 'Matched to your brief, 96% fit' }, { when: 'Jul 25', detail: 'Accepted, took the open spot' }],
};
/* when the tucked invites went out: the first round on Day 4, the rematch on Day 11 */
export const INVITED_ON = { first: 'Jul 16', rematch: 'Jul 25' };

/* ---- invites sent (the popup reports names; until then the full list) ---- */
let firstNames = null;
let rematchNames = null;
export const setFirstRoundSent = (names) => { firstNames = names; };
export const setRematchSent = (names) => { rematchNames = names; };
/* ↺ Reset invites (demo bar): forget every choice and invite sent in both popups
   (their sessionStorage), and close them so they reopen fresh (inviteOverlay listens) */
export function resetInvites() {
  firstNames = null;
  rematchNames = null;
  try {
    Object.keys(sessionStorage).filter((k) => k.startsWith('invite-creators')).forEach((k) => sessionStorage.removeItem(k));
  } catch { /* private mode: nothing saved */ }
  window.dispatchEvent(new Event('invite:reset'));
}
/* A new demo scenario (switch flipped) starts from the full list again */
export const setOpenSpot = (v) => { forks.set('openSpot', v); firstNames = null; rematchNames = null; };
export const setPool = (v) => { forks.set('invitePool', v); firstNames = null; rematchNames = null; };

const STORY = 6;   // the tracker's own six creators (Maya, Nia, Sofia, Jade, Priya, Lena)
/* Day 4's other rows: the popup list minus the six stand-ins, with Amara in for
   Adaeze when she comes from the invites; only the ones actually sent */
const EMMA = MORE_INVITED.find((c) => c.name === 'Emma Wilson');
export function firstRoundExtras() {
  const others = pool() === 7
    ? [fromInvites() ? AMARA_INVITE : EMMA]
    : fromInvites() ? MORE_INVITED.map((c) => (c.name === SWAPPED_FOR_AMARA ? AMARA_INVITE : c)) : MORE_INVITED;
  if (!firstNames) return others;
  const sent = new Set(firstNames);
  return others.filter((c) => sent.has(c.name)).slice(0, Math.max(0, firstNames.length - STORY));
}
export const firstRoundCount = () => (firstNames ? Math.max(firstNames.length, STORY) : poolTotal());

/* The invites tucked under the table's line on a given day, and whether the spots are full */
export function foldFor(day, crew, spots) {
  if (day < 9) return null;
  let list = firstRoundExtras();
  if (fromInvites() && day >= 11) list = list.filter((c) => c.name !== AMARA_INVITE.name);
  if (!fromInvites() && day > 11) {
    const others = rematchNames ? REMATCH_OTHERS.filter((c) => rematchNames.includes(c.name)) : REMATCH_OTHERS;
    list = [...list, ...others.map((c) => ({ ...c, invited: INVITED_ON.rematch }))];
  }
  const filled = crew.filter((c) => !c.mystery && c.stage >= 1).length >= spots;
  return { list, filled };
}

/* crewFor() asks this first: under "From invites" Days 9 to 11 lose the casting
   row, and on Day 11 Amara is the one who accepted */
const amaraRow = (mode) => ({ name: 'Amara', handle: '@amara.gold', stage: 1, status: { type: 'static', phrases: [COPY.amaraStatus[mode === 'local' ? 'local' : 'product']] } });
export function openSpotCrew(day, mode, CREW, LOCAL) {
  if (!fromInvites() || ![9, 10, 11].includes(day)) return null;
  const base = (mode === 'local' && LOCAL.crew[day]) || CREW[day];
  if (!base) return null;
  const rows = base.filter((c) => !c.mystery);
  if (day === 11) rows.push(amaraRow(mode));
  return rows;
}

/* ---- getters on the demo data (installed once from pulseData.js) ---- */
const accessor = (obj, key, read) => {
  if (!obj || !(key in obj)) return;
  const orig = obj[key];
  Object.defineProperty(obj, key, { configurable: true, enumerable: true, get: () => read(orig) });
};
const mapItems = (recap, fn) => recap && accessor(recap, 'items', (items) => items.map(fn));

export function installOpenSpot({ CREW, DAYS, LOCAL, TIMELINES, SPOTS }) {
  const day = (d) => DAYS.find((x) => x.day === d);
  const filledOn = (d, mode) => ((mode === 'local' && LOCAL.crew[d]) || CREW[d] || []).filter((c) => !c.mystery && c.stage >= 1).length;

  // Day 4: the rows and the count follow the invites sent
  const story4 = CREW[4].filter((c) => !MORE_INVITED.includes(c));
  Object.defineProperty(CREW, 4, { configurable: true, enumerable: true, get: () => [...story4, ...firstRoundExtras()] });
  mapItems(day(4)?.recap, (it) => (/invites sent$/.test(it.bold) ? { ...it, bold: COPY.invitesSent(firstRoundCount()) } : it));

  // Days 9 and 10 recaps: invites sent, spots filled, and the decline line under "From invites"
  const recapFix = (d, mode) => (it) => {
    if (/invites sent$/.test(it.bold)) return { ...it, bold: COPY.invitesSent(firstRoundCount()) };
    if (/accepted their invite$/.test(it.bold)) return { ...it, bold: COPY.spotsFilled(filledOn(d, mode), SPOTS) };
    if (fromInvites() && it.bold === '1 creator declined') return { ...it, rest: COPY.d9DeclinedRest };
    return it;
  };
  [9, 10].forEach((d) => {
    mapItems(day(d)?.recap, recapFix(d, 'product'));
    mapItems(LOCAL.recap[d], recapFix(d, 'local'));
  });
  const d9next = (items) => (fromInvites() ? items.map((it) => (it.text === 'Replacement picks' ? { ...it, ...COPY.d9Next } : it)) : items);
  accessor(day(9), 'upNext', d9next);
  accessor(LOCAL.upNext, 9, d9next);

  // Day 11 under "From invites": the spot is filled, nothing to review
  const d11 = day(11);
  accessor(d11, 'scrubLabel', (v) => (fromInvites() ? COPY.d11Label : v));
  accessor(d11, 'race', (v) => (fromInvites() ? { ...v, caption: COPY.d11Race(SPOTS) } : v));
  const d11next = (mode) => (items) => (fromInvites()
    ? items.map((it) => (/^Pick who you want/.test(it.text) ? { ...it, ...COPY.d11Next[mode] } : it))
    : items);
  accessor(d11, 'upNext', d11next('product'));
  accessor(LOCAL.upNext, 11, d11next('local'));
  const d11recap = (r) => (fromInvites()
    ? { ...r, items: r.items.map((it) => (it.bold === 'Replacement matches found' ? { ...it, ...COPY.d11Recap } : it)), closer: COPY.d11Closer }
    : r);
  accessor(d11, 'recap', d11recap);
  accessor(LOCAL.recap, 11, d11recap);

  // Amara's first step and the Day 4 rows' histories
  [TIMELINES, LOCAL.timelines].forEach((T) => {
    // under "From invites" she was matched with the first round and accepted on Day 11
    COPY.amaraSteps.forEach((step, i) => {
      if (!T?.Amara?.[i]) return;
      accessor(T.Amara[i], 'when', (v) => (fromInvites() ? step.when : v));
      accessor(T.Amara[i], 'detail', (v) => (fromInvites() ? step.detail : v));
    });
    if (T?.Lena) [AMARA_INVITE, ...REMATCH_OTHERS].forEach((c) => { T[c.name] = T.Lena; });
  });
}
