/* Months, not campaigns: the brand portal's campaign surfaces in two versions, mounted
   inside the /nf production chrome (pages/NfMonths.jsx).

   before = PROD TODAY. Rebuilt from the Aug 18 production capture (data/newFlowHtml.js,
            state 01-campaigns-overview) and the backend at origin/master
            (CampaignOverview::OverviewService, CadenceService, Dashboard::TrackerQuery):
            cards say "Campaign 1 · 29% Complete", the ready tile says "Your next campaign is
            ready to launch.", the locked tile shows only when nothing is ready, and the
            campaign page is the shipped Campaign Pulse with the campaign's title as h1.
   after  = THE NEW DESIGN. Same blocks, new syntax (Tony, Sep 8 call; his Sep 29 review of
            the Sep 24 Loom; Julia's Oct 1 passes). What changes is listed surface by surface
            in public/months-before-after.html, the engineering handoff for Nisarg.

   Switch: VERSION in the second black bar, or ?rev=before|after. Other deep links:
   ?day=signed|week4|slip|landed, ?tl=open, ?bar=line|segments, ?embed=1.

   Decided: one date ("first content expected"), no lateness states, monthly unlocks
   untouched (Tony, Sep 8) · the campaign is 8 weeks in TOTAL and first content is expected
   at 6 weeks (Julia, Oct 2; replaces the Sep 8 "first content at 8 weeks") · "Campaign 1 | November content" on tiles
   before launch, "Launch now", the standard sentence (Tony, Sep 29) · the name is
   the month of week 7, two campaigns may share a month, no launch-by line on the tile, product
   campaigns only (Julia, Oct 1). The Campaign timeline card now MOVES with the campaign
   (movingTimeline.js, decided Oct 6): this narrows "no lateness states" to the brand's own delays.
   TILE switch Moving | Fixed (the 8-week card as shipped Oct 5); CAMPAIGN 1 switch for the scenes. */

import { SCENES, SCENE_EVENTS, clock, computeMoving, creatorDays, movingCardHtml, movingMetaHtml } from './movingTimeline.js';

export { SCENES };
/* the Campaign timeline card: Moving = the decided Oct 6 design (movingTimeline.js), Fixed =
   the 8-week card as it shipped on Oct 5 (and as the handoff page frames it) */
export const TILES = [
  ['moving', 'Moving'],
  ['fixed', 'Fixed'],
];

export const REVS = [
  ['before', 'Prod today'],
  ['after', 'New design'],
];

/* short labels: the second black bar also carries PAGE and VERSION and must fit a laptop */
export const DAYS = [
  ['signed', 'Sep 8 · signed'],
  ['week4', 'Oct 5 · week 4'],
  ['slip', 'Oct 19 · late launch'],
  ['landed', 'Oct 28 · posts live'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* THE RULE, written once so engineering and the prototype agree (the handoff page carries
   the same function and a table of worked dates):
     launch_date            = launched_at in the organization's cadence time zone. Before
                              launch: today for a ready tile, the unlock date for a locked one.
     campaign length        = 8 weeks in total ("Week 4 of 8").
     first_content_expected = launch_date + 6 weeks (42 days). Julia, Oct 2, from the steps:
                              about 1 week to match and accept, about 2 weeks to ship, 10 days
                              to film, about 1 week to review and post. Shown as
                              "week of {the Monday of that week}".
     content_month          = the month of WEEK 7: the month it is 7 weeks (49 days) after
                              launch. Julia, Oct 2: "week 6 will have the first content, and
                              most will be on week 7 and 8". Week 7's last day is the middle
                              of the two weeks when most posts go live, so the name is the
                              month holding most of that window. This replaces the Oct 1
                              "last 4 days of the month" cut-off: first content in the last
                              week of a month already takes the next month's name.
     week                   = floor((today - launch_date) / 7) + 1
   Before launch the month is recomputed every day, so a campaign that is not launched
   moves to the next month by itself (Tony, Sep 29). At launch it freezes. */
export const WEEKS = 8;
export const FIRST_CONTENT_WEEKS = 6;
export const NAME_WEEKS = 7;
const DAY = 86400000;
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (d) => `${SHORT[d.getMonth()]} ${d.getDate()}`;
const at = (iso) => new Date(iso + 'T12:00:00');
const mondayOf = (d) => { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; };
export function timeline(launchISO, todayISO) {
  const launch = at(launchISO);
  const first = new Date(launch.getTime() + FIRST_CONTENT_WEEKS * 7 * DAY);
  const days = Math.max(0, Math.round((at(todayISO) - launch) / DAY));
  const week = Math.floor(days / 7) + 1;
  return {
    launch: fmt(launch),
    launchLong: `${MONTHS[launch.getMonth()]} ${launch.getDate()}`,
    first_content: fmt(mondayOf(first)),
    content_month: MONTHS[new Date(launch.getTime() + NAME_WEEKS * 7 * DAY).getMonth()],
    week,
    pct: Math.min(100, Math.round((Math.min(week, WEEKS) / WEEKS) * 100)),
  };
}
export const contentMonthFor = (launchISO) => timeline(launchISO, launchISO).content_month;
/* which version the wizard should speak (NewFlow reads this in months mode); ?rev= wins */
export const monthsRev = () => {
  try {
    const q = new URLSearchParams(window.location.search).get('rev');
    if (q === 'before' || q === 'after') return q;
    return localStorage.getItem('acRev') === 'before' ? 'before' : 'after';
  } catch { return 'after'; }
};

/* the five phases of the eight weeks (same split as the launch confirmation card). The
   expanded timeline dates them from the launch day. It is the PLAN with a you-are-here
   marker, not live tracking (Tony, Sep 8: no pace vs plan): a phase is past, now or next by
   the calendar week only, so every line stays in plan tense and never claims a creator
   stage. The creators table carries the real status. The one stated fact is the first
   post's date, which is public. Review assumes Benable reviews (who-reviews fork: OPEN). */
export const PHASES = [
  { name: 'Match', weeks: [1, 1], line: "Katie's team matches creators for you to approve." },
  { name: 'Ship', weeks: [2, 3], line: 'Product ships to creators.' },
  { name: 'Film', weeks: [4, 5], line: 'Creators film with your product.' },
  { name: 'Review', weeks: [6, 6], line: "Katie's team reviews each draft and the first posts go live." },
  { name: 'Post', weeks: [7, 8], line: 'The rest of the posts go live.' },
];
const TAIL = { name: 'After week 8', line: 'Any last posts go live.' };
/* Tony's Sep 8 framing, cut to fit two lines in the rail (Julia, Oct 1) */
export const TIMELINE_NOTE = 'A classic campaign takes about eight weeks. The industry benchmark is eight to ten.';

/* ---------- demo data ---------- */
const BASE = import.meta.env.BASE_URL;
const CREATORS = [
  ['Maya Ruiz', '@maya.routine'], ['Jordan Kim', '@jordan.skin'], ['Priya Shah', '@priya.glow'], ['Elena Voss', '@elenav.daily'],
  ['Tasha Moore', '@tashamoore'], ['Noor Ali', '@noor.routine'], ['Camille Dubois', '@camille.d'], ['Ines Lopez', '@ines.lo'],
  ['Sofia Bell', '@sofiabell.skin'], ['Harper Wu', '@harperwu'],
];
const FACES = ['creators/maya.jpg', 'review/posters/quinn-1.jpg', 'creators/priya.jpg', 'creators/lena.jpg', 'creators/amara.jpg', 'creators/nia.jpg', 'review/posters/emery-1.jpg', 'creators/jade.jpg', 'creators/sofia.jpg', 'review/posters/jasper-1.jpg'];
const creator = (i, stage, when) => ({ name: CREATORS[i][0], handle: CREATORS[i][1], stage, when, av: FACES[i] });
/* Campaign 2's ten are a new set: each campaign is its own group of creators */
const CREATORS_2 = [
  ['Ava Chen', '@avachen.skin'], ['Lena Park', '@lena.glowup'], ['Mia Torres', '@miat.daily'], ['Zoe Grant', '@zoegrant'],
  ['Rina Sato', '@rina.routine'], ['Amara Obi', '@amara.obi'], ['Lucy Hart', '@lucyhart.skin'], ['Nadia Karim', '@nadia.k'],
  ['Grace Lin', '@gracelin.co'], ['Talia Stone', '@talia.stone'],
];
const FACES_2 = ['review/posters/quinn-2.jpg', 'review/posters/emery-2.jpg', 'creators/jade.jpg', 'creators/amara.jpg', 'creators/nia.jpg', 'creators/lena.jpg', 'creators/sofia.jpg', 'creators/maya.jpg', 'creators/priya.jpg', 'review/posters/jasper-1.jpg'];
const creator2 = (i, stage, when) => ({ name: CREATORS_2[i][0], handle: CREATORS_2[i][1], stage, when, av: FACES_2[i] });

/* sc = what happened, in days from launch (movingTimeline.js). Campaign 1's "On plan" matches
   the hand-written days below; Campaign 2's first orders arrived on day 15, a week early */
const RUN = { id: 88, number: 1, title: 'Fall Campaign', launchISO: '2026-09-10', sc: SCENE_EVENTS.plan };
const RUN2 = { id: 89, number: 2, title: 'Holiday Campaign', launchISO: '2026-10-12', sc: { acc: 7, del: 15, draft: 33, posts: [40, 42, 43, 45, 46, 47, 49, 50, 52, 53] } };

/* Tiles carry no hand-typed month or number. A ready tile is named for launching today, a
   locked one for launching the day it unlocks; both are numbered after the running campaigns.
   The brand signed Sep 8, so windows open Sep 8, Oct 8, Nov 8, Dec 8 (calendar months from
   the anchor, as CadenceService does today). */
const DB = {
  signed: {
    todayISO: '2026-09-08', today: 'Sep 8',
    runs: [],
    opportunities: [{ state: 'available' }, { state: 'locked', unlockISO: '2026-10-08' }],
  },
  week4: {
    todayISO: '2026-10-05', today: 'Oct 5',
    runs: [Object.assign({}, RUN, {
      creators: [
        creator(0, 'Order delivered', 'filming'), creator(1, 'Order delivered', 'filming'), creator(2, 'Order delivered', 'filming'),
        creator(3, 'Order delivered', 'filming'), creator(4, 'Order delivered', 'filming'), creator(5, 'Order delivered', 'filming'),
        creator(6, 'Order delivered', 'filming'), creator(7, 'Order delivered', 'filming'), creator(8, 'Order shipped', 'arrives Oct 7'), creator(9, 'Order shipped', 'arrives Oct 7'),
      ],
      activity: [['📦', '8 orders delivered', '2 more arrive Oct 7. Creators film once the product is in hand.']],
      next: [['🎬', 'Drafts start arriving around week 5', "Katie's team reviews each one for quality before it goes live."]],
    })],
    opportunities: [{ state: 'locked', unlockISO: '2026-10-08' }],
  },
  /* Tony, Sep 29: "if they slip in launching we'll need to change the months e.g. Dec to Jan".
     Campaign 2 has been ready since Oct 8 (November content then) and is still not launched
     on Oct 19. Launched today, first content is expected the week of Nov 30 and week 7 ends
     Dec 7, so it is December content. Campaign 3 unlocks Nov 8 and is December too
     (two campaigns may share a month; the numbers tell them apart). A branch of its own:
     on the Oct 28 day Campaign 2 was launched Oct 12. */
  slip: {
    todayISO: '2026-10-19', today: 'Oct 19',
    runs: [Object.assign({}, RUN, {
      creators: [
        creator(0, 'Draft approved', 'posts this week'), creator(1, 'Draft approved', 'posts this week'), creator(2, 'Draft approved', 'posts this week'),
        creator(3, 'Draft submitted', 'we review by Oct 21'), creator(4, 'Draft submitted', 'we review by Oct 21'), creator(5, 'Draft submitted', 'we review by Oct 21'),
        creator(6, 'Draft submitted', 'we review by Oct 21'), creator(7, 'Order delivered', 'filming'), creator(8, 'Order delivered', 'filming'), creator(9, 'Order delivered', 'filming'),
      ],
      activity: [['✅', '3 drafts approved', 'They post this week.'], ['📝', '4 drafts in review', "Katie's team reviews them by Oct 21."]],
      next: [['🚀', 'First posts go live this week', 'We track every post for you once it is live.']],
    })],
    opportunities: [{ state: 'available' }, { state: 'locked', unlockISO: '2026-11-08' }],
  },
  landed: {
    todayISO: '2026-10-28', today: 'Oct 28',
    runs: [Object.assign({}, RUN, {
      first_live: 'Oct 21',
      creators: [
        creator(0, 'Content published', 'Oct 21'), creator(1, 'Content published', 'Oct 23'), creator(2, 'Content published', 'Oct 26'),
        creator(3, 'Draft approved', 'posts this week'), creator(4, 'Draft approved', 'posts this week'), creator(5, 'Draft approved', 'posts this week'),
        creator(6, 'Draft approved', 'posts this week'), creator(7, 'Draft submitted', 'we review by Oct 30'), creator(8, 'Draft submitted', 'we review by Oct 30'), creator(9, 'Order delivered', 'filming'),
      ],
      activity: [['🎉', '3 posts are live!', "Katie's team checked every draft against your brief before it went live."], ['✅', '4 drafts approved', 'They post this week.']],
      next: [['💌', 'Send thank-yous to 3 creators', 'Thoughtful notes help strengthen your creator relationships after their posts went live.']],
    }), Object.assign({}, RUN2, {
      creators: [
        creator2(0, 'Order delivered', 'filming'), creator2(1, 'Order delivered', 'filming'), creator2(2, 'Order delivered', 'filming'),
        creator2(3, 'Order delivered', 'filming'), creator2(4, 'Order shipped', 'arrives Oct 30'), creator2(5, 'Order shipped', 'arrives Oct 30'),
        creator2(6, 'Order shipped', 'arrives Oct 30'), creator2(7, 'Order shipped', 'arrives Oct 30'), creator2(8, 'Order shipped', 'arrives Oct 30'), creator2(9, 'Order shipped', 'arrives Oct 30'),
      ],
      activity: [['📦', '4 orders delivered', '6 more arrive Oct 30. Creators film once the product is in hand.']],
      next: [['🎬', 'Creators film over the next two weeks', "Drafts start arriving around week 5. Katie's team reviews each one before it goes live."]],
    })],
    opportunities: [{ state: 'locked', unlockISO: '2026-11-08' }],
  },
};

/* ---------- the Dashboard as shipped in production (Campaign Pulse) ----------
   The stat line, the 8-stage rail, the Creators card and the right rail. Ported from
   content-handoff-study/surface.html's renderDashboard (rebuilt there from Julia's Oct 1
   prod captures on this repo's pulse.css). Same am-/am2-/tf-/cp- classes. */
const PULSE_STAGES = ['Sourcing', 'Invited', 'Accepted', 'Order shipped', 'Order delivered', 'Draft approved', 'Content published', 'Thanked'];
const RAMP = ['#dbeee3', '#b9dfcb', '#8fceae', '#5fb98c', '#2e9e6b', '#1f8f5a', '#17864f', '#124a33'];
const STAGE_OF = { Accepted: 2, 'Order shipped': 3, 'Order delivered': 4, 'Draft submitted': 4, 'Draft approved': 5, 'Content published': 6 };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const rowOf = (c) => {
  const stage = STAGE_OF[c.stage] ?? 4;
  const live = c.stage === 'Content published';
  const update = live ? `Post live since ${c.when}`
    : c.stage === 'Order shipped' ? `Order shipped, ${c.when}`
      : c.stage === 'Draft submitted' ? (c.yours ? 'Draft ready for your review' : "Draft in review with Katie's team")
        : c.stage === 'Draft approved' ? `Draft approved, ${c.when}`
          : c.stage === 'Accepted' ? 'Accepted, order not shipped yet' : 'Has the product, filming';
  return { c, stage, live, update, draft: c.stage === 'Draft submitted' };
};
/* production's progress_percent (Dashboard::TrackerQuery): sum of stage slots over cohort x 7, capped at 99 until completed */
const progressPercent = (rows) => Math.min(99, Math.round((rows.reduce((a, x) => a + x.stage, 0) / (rows.length * 7)) * 100));
/* NEW, PROPOSED: the card's one-line status, derived from the same stage counts the Dashboard
   rail already shows (replaces the campaign title under "Campaign N") */
function statusLine(rows) {
  const n = rows.length;
  const live = rows.filter((x) => x.live).length;
  const drafts = rows.filter((x) => x.draft || x.stage === 5).length;
  const shipping = rows.filter((x) => x.stage === 3).length;
  const accepted = rows.filter((x) => x.stage === 2).length;
  const filming = n - live - drafts - shipping - accepted;
  if (live === n) return `All ${n} posts are live`;
  if (live) return `${plural(live, 'post')} live, ${n - live} more on the way`;
  if (drafts) return `${plural(drafts, 'draft')} in, ${n - drafts} still filming`;
  if (filming) return shipping ? `${plural(filming, 'creator')} filming, ${plural(shipping, 'order')} on the way` : `All ${n} creators are filming`;
  if (shipping) return `Product is on its way to ${plural(shipping, 'creator')}`;
  return `${plural(accepted, 'creator')} confirmed`;
}

/* Recent activity and Up next for a campaign generated from a WHAT HAPPENS scene */
function notesFor(rows) {
  const count = (f) => rows.filter(f).length;
  const live = count((x) => x.live);
  const approved = count((x) => x.stage === 5);
  const sub = count((x) => x.draft);
  const yours = count((x) => x.draft && x.c.yours);
  const filming = count((x) => x.stage === 4 && !x.draft);
  const shipping = count((x) => x.stage === 3);
  const waiting = count((x) => x.stage === 2);
  const activity = [];
  if (live) activity.push(['🎉', `${plural(live, 'post')} ${live === 1 ? 'is' : 'are'} live!`, "Katie's team checked every draft against your brief before it went live."]);
  if (approved) activity.push(['✅', `${plural(approved, 'draft')} approved`, 'They post this week.']);
  if (sub && activity.length < 2) activity.push(['📝', yours ? `${plural(yours, 'draft')} ready for your review` : `${plural(sub, 'draft')} in review`, yours ? "Katie's team pre-checked each one. Approve it or send feedback." : "Katie's team reviews each one before it goes live."]);
  if (filming && activity.length < 2) activity.push(['📦', `${plural(filming, 'order')} delivered`, 'Creators film once the product is in hand.']);
  if (shipping && activity.length < 2) activity.push(['🚚', `${plural(shipping, 'order')} on the way`, 'Creators film once the product arrives.']);
  if (waiting && activity.length < 2) activity.push(['📦', `${plural(waiting, 'order')} ready to ship`, 'Ship them and add tracking so creators can start filming.']);
  const next = waiting ? ['📦', 'Ship your orders', 'Creators have about 10 days to film once the product arrives.']
    : yours ? ['📝', 'Review the drafts that are ready', 'Each post goes live once you approve it.']
      : live ? ['💌', `Send thank-yous to ${plural(live, 'creator')}`, 'Thoughtful notes help strengthen your creator relationships after their posts went live.']
        : approved || sub ? ['🚀', 'First posts go live soon', 'We track every post for you once it is live.']
          : filming ? ['🎬', 'Drafts start arriving', "Katie's team reviews each one before it goes live."]
            : ['🎬', 'Creators film once the product arrives', 'Drafts follow about 10 days later.'];
  return { activity, next: [next] };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ARROW = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M5 10h10M11 5l5 5-5 5"/></svg>';
const BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 3L5 8l5 5"/></svg>';
const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
const GRADIENT = 'https://benable.com/_app/immutable/assets/campaign-window-gradient.DdmQlVVC.webp';
const SUB_PROD = 'Manage your active campaigns and creator relationships.';
const SUB_NEW = 'Each campaign shows the month its content starts going live. Manage your active campaigns and creator relationships.';

export function createMonths(root, opts = {}) {
  let stateKey = 'week4';
  let rev = 'after';
  let screen = 'overview';
  let tlOpen = false;
  let bar = 'line'; // the timeline card's progress: 'line' = one continuous bar | 'segments' = eight week segments
  let tile = 'moving'; // the timeline card: 'moving' (decided Oct 6) | 'fixed' (as shipped Oct 5)
  let scen = 'plan'; // what happens to Campaign 1 (SCENES)
  let openId = null;
  let toastT;
  const S = () => DB[stateKey];
  /* deep links win over storage; an embedded frame never writes storage, so a Prod frame
     and a New frame can sit side by side on one page */
  const init = opts.init || {};
  const store = (k, v) => { if (!init.embed) { try { localStorage.setItem(k, v); } catch { /* ok */ } } };
  try { const s = localStorage.getItem('acState'); if (s && DB[s]) stateKey = s; } catch { /* fresh */ }
  try { if (localStorage.getItem('acRev') === 'before') rev = 'before'; } catch { /* fresh */ }
  try { if (localStorage.getItem('acBar') === 'segments') bar = 'segments'; } catch { /* fresh */ }
  try { if (localStorage.getItem('acTile') === 'fixed') tile = 'fixed'; } catch { /* fresh */ }
  try { const v = localStorage.getItem('acScen'); if (v && SCENE_EVENTS[v]) scen = v; } catch { /* fresh */ }
  try { const o = Number(sessionStorage.getItem('acOpen')); if (o) openId = o; } catch { /* fresh */ }
  if (init.day && DB[init.day]) { stateKey = init.day; store('acState', stateKey); }
  if (init.rev === 'before' || init.rev === 'after') { rev = init.rev; store('acRev', rev); }
  if (init.bar === 'line' || init.bar === 'segments') { bar = init.bar; store('acBar', bar); }
  if (init.tl === 'open') tlOpen = true;
  if (init.tile === 'moving' || init.tile === 'fixed') { tile = init.tile; store('acTile', tile); }
  if (init.scen && SCENE_EVENTS[init.scen]) { scen = init.scen; store('acScen', scen); }
  const after = () => rev === 'after';
  const moving = () => after() && tile === 'moving';

  /* Campaign 1 under a WHAT HAPPENS scene other than On plan: the creators, their days and the
     rail notes are generated from the scene, so the table agrees with the card */
  function sceneRun(r) {
    const sc = SCENE_EVENTS[scen];
    const { fmt, addBiz, dayOf } = clock(r.launchISO);
    const t = dayOf(S().todayISO);
    const creators = sc.posts.map((_, i) => {
      const d = creatorDays(sc, i, r.launchISO);
      let stage; let when; let yours = false;
      if (d.post <= t) { stage = 'Content published'; when = fmt(d.post); }
      else if (d.approve <= t) { stage = 'Draft approved'; when = 'posts this week'; }
      else if (d.draft <= t) {
        stage = 'Draft submitted';
        yours = sc.reviewer === 'brand' && t >= addBiz(d.draft, 3);
        when = yours ? 'waiting for your review' : `we review by ${fmt(addBiz(d.draft, 3))}`;
      } else if (d.del <= t) { stage = 'Order delivered'; when = 'filming'; }
      else if (d.ship <= t) { stage = 'Order shipped'; when = `arrives ${fmt(d.del)}`; }
      else { stage = 'Accepted'; when = 'order not shipped yet'; }
      return Object.assign(creator(i, stage, when), { yours, days: d });
    });
    const waiting = { drafts: creators.filter((c) => c.yours).length, orders: creators.filter((c) => c.stage === 'Accepted').length };
    const run = Object.assign({}, r, { sc: Object.assign({}, sc, { waiting }), creators, first_live: sc.posts[0] <= t ? fmt(sc.posts[0]) : undefined });
    return Object.assign(run, notesFor(creators.map(rowOf)));
  }
  const runsOf = () => S().runs.map((r) => (after() && scen !== 'plan' && r.id === RUN.id ? sceneRun(r) : r));
  const movingOf = (r) => computeMoving(r.sc, clock(r.launchISO).dayOf(S().todayISO), r.launchISO);

  const tl = (r) => timeline(r.launchISO, S().todayISO);
  /* Tony, Sep 29: "Campaign 1 | November content" on the tiles, where prod shows the number only */
  const title = (n, month) => `Campaign ${n}<span class="nfm-div" aria-hidden="true"></span><span class="nfm-mo">${esc(month)} content</span>`;

  /* ---------- overview ---------- */
  function runCard(r) {
    const t = tl(r);
    const rows = r.creators.map(rowOf);
    const open = `<span class="campaign-card__open svelte-1fvpax8" aria-hidden="true">${ARROW}</span>`;
    if (!after()) {
      /* prod: "Launched September 10" pill, the number, the campaign's title, "54% Complete" */
      const pct = progressPercent(rows);
      return `
    <a class="campaign-card svelte-1fvpax8 nfm-prodcard" href="#" data-open="${r.id}" aria-label="Open Campaign ${r.number}, ${esc(r.title)}">
      <div class="campaign-card__heading svelte-1fvpax8"><span class="campaign-card__date svelte-1fvpax8">Launched <strong class="svelte-1fvpax8">${t.launchLong}</strong></span> <h2 class="svelte-1fvpax8">Campaign ${r.number}</h2></div>
      <p class="campaign-card__subtitle svelte-1fvpax8">${esc(r.title)}</p>
      <div class="campaign-card__progress-copy svelte-1fvpax8"><strong class="svelte-1fvpax8">${pct}%</strong> <span class="svelte-1fvpax8">Complete</span></div>
      <div class="campaign-card__progress svelte-1fvpax8" role="progressbar" aria-label="Campaign ${r.number} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width: ${pct}%" class="svelte-1fvpax8"></span></div>
      ${open}
    </a>`;
    }
    const live = rows.filter((x) => x.live).length;
    const n = rows.length;
    /* one quiet line over the bar: the week until the first post, the live count after it */
    const line = moving() ? movingMetaHtml(movingOf(r), r.launchISO)
      : live
        ? `<b>${live} of ${n} live</b> · first on ${r.first_live}`
        : `<b>${t.week <= WEEKS ? `Week ${t.week} of ${WEEKS}` : `Week ${t.week}`}</b> · first content expected the week of ${t.first_content}`;
    const pct = live ? Math.round((live / n) * 100) : t.pct;
    return `
    <a class="campaign-card svelte-1fvpax8" href="#" data-open="${r.id}" aria-label="Open Campaign ${r.number}, ${esc(t.content_month)} content">
      <div class="campaign-card__heading svelte-1fvpax8">
        <span class="campaign-card__date svelte-1fvpax8"><strong class="svelte-1fvpax8">${esc(t.content_month)} content</strong> · launched ${t.launch}</span>
        <h2 class="svelte-1fvpax8">Campaign ${r.number}</h2>
      </div>
      <p class="campaign-card__subtitle svelte-1fvpax8">${esc(statusLine(rows))}</p>
      <div class="nfm-bottom">
        <div class="nfm-meta">${line}</div>
        <div class="campaign-card__progress svelte-1fvpax8 ${live ? '' : 'nfm-weeks'}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width: ${pct}%" class="svelte-1fvpax8"></span></div>
      </div>
      ${open}
    </a>`;
  }

  function oppCard(o, i) {
    const s = S();
    /* numbered in the order they unlock: the launched campaigns first, then the tiles */
    const number = s.runs.length + i + 1;
    const visuals = `<span class="opportunity__visuals svelte-75h9ek" aria-hidden="true"><img class="opportunity__action-gradient svelte-75h9ek" src="${GRADIENT}" alt=""> <span class="opportunity__action-overlay svelte-75h9ek"></span></span>`;
    if (o.state === 'locked') {
      const inDays = Math.max(1, Math.round((at(o.unlockISO) - at(s.todayISO)) / DAY));
      const countdown = `<span class="opportunity__countdown svelte-75h9ek">in <strong class="svelte-75h9ek">${inDays} ${inDays === 1 ? 'day' : 'days'}</strong></span>`;
      /* prod's locked tile was never captured (it only shows when nothing is ready), so its
         wording here is rebuilt, not copied. New: the pill lines up with "Launch now" above it */
      return after()
        ? `
      <article class="opportunity opportunity--locked svelte-75h9ek nfm-locked">
        <div class="opportunity__locked-copy svelte-75h9ek"><h2 class="svelte-75h9ek nfm-title">${title(number, contentMonthFor(o.unlockISO))}</h2><p class="svelte-75h9ek">Unlocks ${esc(fmt(at(o.unlockISO)))}.</p></div>
        ${countdown}
      </article>`
        : `
      <article class="opportunity opportunity--locked svelte-75h9ek">
        <div class="opportunity__locked-copy svelte-75h9ek"><h2 class="svelte-75h9ek">Campaign ${number}</h2><p class="svelte-75h9ek">Your next campaign unlocks ${esc(fmt(at(o.unlockISO)))}.</p></div>
        ${countdown}
      </article>`;
    }
    if (!after()) {
      return `
    <article class="opportunity opportunity--action svelte-75h9ek">
      ${visuals}
      <div class="opportunity__action-copy svelte-75h9ek"><div class="opportunity__title-row svelte-75h9ek"><h2 class="svelte-75h9ek">Campaign ${number}</h2> </div> <p class="svelte-75h9ek">Your next campaign is ready to launch.</p></div>
      <button type="button" class="opportunity__action svelte-75h9ek" data-plan data-num="${number}">Launch now</button>
    </article>`;
    }
    /* named for launching today, so the month moves by itself while the campaign is not launched.
       Two lines, one style (Julia, Oct 2): production's sentence, then Tony's */
    const month = contentMonthFor(s.todayISO);
    return `
    <article class="opportunity opportunity--action svelte-75h9ek">
      ${visuals}
      <div class="opportunity__action-copy svelte-75h9ek">
        <div class="opportunity__title-row svelte-75h9ek"><h2 class="svelte-75h9ek nfm-title">${title(number, month)}</h2></div>
        <p class="svelte-75h9ek">Your next campaign is ready to launch.<br>Creator content will start going live in ${esc(month)}.</p>
      </div>
      <button type="button" class="opportunity__action svelte-75h9ek" data-plan="${esc(month)}" data-num="${number}">Launch now</button>
    </article>`;
  }

  function renderOverview() {
    const s = S();
    /* prod (CadenceService#monthly_opportunities_for) shows the locked tile only when nothing
       is ready; the new design shows the next one alongside (Tony's "Campaign 1 | November
       content / Campaign 2 | December content" on one screen) */
    const ready = s.opportunities.some((o) => o.state !== 'locked');
    const opps = s.opportunities.filter((o) => after() || o.state !== 'locked' || !ready);
    return `
    <div class="campaign-overview svelte-9w8so5 nfm-overview">
      <header class="overview-header svelte-9w8so5"><div><h1 class="svelte-9w8so5">Campaigns Overview</h1> <p class="svelte-9w8so5">${after() ? SUB_NEW : SUB_PROD}</p></div></header>
      <div class="overview-controls svelte-9w8so5">
        <div class="overview-tabs svelte-9w8so5" role="tablist" aria-label="Campaign overview"><button type="button" role="tab" class="svelte-9w8so5 active">Active</button> <button type="button" role="tab" class="svelte-9w8so5" data-inert="Completed campaigns land here with the full report and every post">Completed</button></div>
        <div class="nfm-plan-line">Today is <b>${s.today}</b></div>
      </div>
      <section class="overview-stack svelte-9w8so5">
        <section class="campaign-group svelte-9w8so5"><div class="campaign-group__reveal svelte-9w8so5"><div class="campaign-group__cards svelte-9w8so5">${runsOf().map(runCard).join('')}${opps.map(oppCard).join('')}</div></div></section>
      </section>
    </div>`;
  }

  /* ---------- campaign page ---------- */
  /* NEW: the Campaign timeline card, first in the Dashboard's right rail (Tony, Sep 8: top right,
     above "While you were away"; Sep 29: "a small widget on that page that you can click and
     it expands into the full timeline"). Collapsed = the date, one progress bar, five phases.
     Expanded in place = the phases dated from this campaign's launch day, with a Now marker. */
  function timelineCard(r) {
    if (moving()) return movingCardHtml(movingOf(r), { launchISO: r.launchISO, open: tlOpen, chev: CHEV, note: TIMELINE_NOTE });
    const t = tl(r);
    const live = r.creators.filter((c) => c.stage === 'Content published').length;
    const launch = at(r.launchISO);
    const day = (n) => new Date(launch.getTime() + n * DAY);
    const span = (a, b) => { const x = day(7 * (a - 1)); const y = day(7 * b - 1); return x.getMonth() === y.getMonth() ? `${fmt(x)} to ${y.getDate()}` : `${fmt(x)} to ${fmt(y)}`; };
    const stateOf = ([a, b]) => (t.week > b ? 'done' : t.week >= a ? 'now' : 'next');
    /* Segments: each label centered over its own weeks. Line: no weeks are drawn, so the five
       phases get five EQUAL slots and the fill runs through those slots: it ends inside the
       current phase, under its label */
    const even = bar === 'line';
    const segs = Array.from({ length: WEEKS }, (_, i) => `<span class="${i + 1 < t.week ? 'done' : i + 1 === t.week ? 'now' : ''}"></span>`).join('');
    const names = PHASES.map((p) => `<span${even ? '' : ` style="grid-column: span ${p.weeks[1] - p.weeks[0] + 1}"`} class="${stateOf(p.weeks)}">${p.name}</span>`).join('');
    const k = PHASES.findIndex((p) => t.week <= p.weeks[1]);
    const linePct = k < 0 ? 100 : Math.round((k + (t.week - PHASES[k].weeks[0] + 0.5) / (PHASES[k].weeks[1] - PHASES[k].weeks[0] + 1)) * 20);
    const steps = PHASES.map((p) => {
      const st = stateOf(p.weeks);
      const line = p.name === 'Review' && live ? `Katie's team reviewed each draft. First post went live ${r.first_live}.` : p.line;
      return `<li class="${st}"><span class="nfm-tl__dot" aria-hidden="true"></span><div><div class="nfm-tl__row"><b>${p.name}</b>${st === 'now' ? '<span class="nfm-tl__now">Now</span>' : ''}<span class="nfm-tl__dates">${span(p.weeks[0], p.weeks[1])}</span></div><p>${esc(line)}</p></div></li>`;
    }).join('');
    const tailNow = t.week > WEEKS;
    const tail = `<li class="${tailNow ? 'now' : 'next'}"><span class="nfm-tl__dot" aria-hidden="true"></span><div><div class="nfm-tl__row"><b>${TAIL.name}</b>${tailNow ? '<span class="nfm-tl__now">Now</span>' : ''}<span class="nfm-tl__dates">From ${fmt(day(WEEKS * 7))}</span></div><p>${esc(tailNow && live ? `${live} of ${r.creators.length} live. ${TAIL.line}` : TAIL.line)}</p></div></li>`;
    /* worn as one of production's rail cards (am-card head + body); no week pill in the head (Julia, Oct 1) */
    return `
    <section class="am-card nfm-tl${tlOpen ? ' is-open' : ''}" aria-label="Campaign timeline">
      <div class="am-card-head"><div class="am-head-l"><div><p class="am-card-title">Campaign timeline</p></div></div></div>
      <div class="am-card-body nfm-tl__body">
        <div class="nfm-tl__compact" data-tl>
          <div class="nfm-tl__k">${live ? 'First content went live' : 'First content expected'}</div>
          <div class="nfm-tl__v">${live ? esc(r.first_live) : `Week of ${t.first_content}`}</div>
          ${even
    ? `<div class="nfm-tl__line" aria-hidden="true"><span style="width:${linePct}%"></span></div>`
    : `<div class="nfm-tl__track" aria-hidden="true">${segs}</div>`}
          <div class="nfm-tl__phases${even ? ' nfm-tl__phases--even' : ''}" aria-hidden="true">${names}</div>
        </div>
        <button type="button" class="nfm-tl__toggle" data-tl aria-expanded="${tlOpen}"><span>${tlOpen ? 'Hide the full timeline' : 'See the full timeline'}</span>${CHEV}</button>
        <div class="nfm-tl__full"><div>
          <ol class="nfm-tl__steps">${steps}${tail}</ol>
          <p class="nfm-tl__note">${esc(TIMELINE_NOTE)}</p>
        </div></div>
      </div>
    </section>`;
  }

  function stageHistory(row, r) {
    const launch = at(r.launchISO);
    const d = (n) => fmt(new Date(launch.getTime() + n * DAY));
    const own = row.c.days || { ship: 10, del: 17, approve: 38 };
    const steps = [
      ['Invited', d(5), 'Matched to your brief'],
      ['Accepted', d(7), 'Accepted the invite'],
      ['Order shipped', d(own.ship), row.stage === 3 ? `Product on its way, ${row.c.when}` : 'Product on its way'],
      ['Order delivered', d(own.del), row.draft ? (row.c.yours ? 'Package arrived. The draft is ready for your review' : "Package arrived. The draft is in review with Katie's team") : 'Package arrived, filming'],
      ['Draft approved', d(own.approve), row.c.yours ? 'You approved the draft' : "Katie's team checked the draft against your brief"],
      ['Live!', row.live ? row.c.when : 'up next', row.live ? 'Post went live' : 'Post goes live, we track how it does for you'],
      ['Thanked', 'up next', 'Your thank-you, right after the post'],
    ];
    const nowIdx = row.stage - 1;
    return `<div class="am-hist"><p class="am-hist-title">Stage history</p><div class="cp-crew-history am-hist-body">${steps.map(([label, when, detail], i) => {
      const st = i < nowIdx ? 'done' : i === nowIdx ? 'now' : 'next';
      return `<div class="cp-hist-step cp-hist-step--${st}"><span class="cp-hist-dot">${st === 'done' ? '✓' : ''}</span><div class="cp-hist-body"><div class="cp-hist-top"><span class="cp-hist-label">${label}</span><span class="cp-hist-when">${st === 'next' ? 'up next' : st === 'now' && !row.live ? 'now' : when}</span></div><div class="cp-hist-detail">${esc(detail)}</div></div></div>`;
    }).join('')}</div></div>`;
  }

  /* the Dashboard, identical in both versions except the timeline card at the top of the rail */
  function pulse(r) {
    const rows = r.creators.map(rowOf);
    const n = rows.length;
    const pct = progressPercent(rows);
    const counts = PULSE_STAGES.map((_, i) => rows.filter((x) => x.stage === i).length);
    const maxStage = Math.max(...rows.map((x) => x.stage));
    const drafts = rows.filter((x) => x.draft).length;
    const rail = PULSE_STAGES.map((label, i) => {
      const count = counts[i];
      const radius = i === 0 ? '74px 4px 4px 74px' : i === PULSE_STAGES.length - 1 ? '4px 100px 100px 4px' : '4px';
      let slab; let hint;
      if (count === 0 && i < maxStage) {
        slab = `<button type="button" disabled class="am2-bar" style="background:#eff5f1;border-radius:${radius}"><span class="am2-count" style="color:#17864f"><span class="am2-check" role="img" aria-label="All ${n} moved ahead">✓</span></span></button>`;
        hint = i === 0 ? 'All done for now' : `All ${n} moved ahead`;
      } else if (count === 0) {
        slab = `<button type="button" disabled class="am2-bar am-seg--sliver" style="border-radius:${radius}"><span class="am2-count" style="color:#a3a8a3">0</span></button>`;
        hint = i === 7 ? 'After posts go live' : i === 6 ? 'Once quality checks pass' : 'Up next';
      } else {
        slab = `<button type="button" tabindex="-1" aria-disabled="true" class="am2-bar" style="cursor:default;background:${RAMP[i]};border-radius:${radius}"><span class="am2-count" style="color:${i >= 4 ? '#fff' : '#06301f'}">${count}</span></button>`;
        hint = i === 6 ? `${plural(count, 'post')} now live!` : i === 5 ? `${count} posting soon` : i === 4 ? (drafts ? `${plural(drafts, 'draft')} in review` : `${count} filming`) : i === 3 ? `${count} on the way` : `${count} here now`;
      }
      return `<div class="am2-col">${slab}<div class="am2-leg"><p class="am2-label">${label}</p><p class="am2-hint">${hint}</p></div></div>`;
    }).join('');
    const verified = `<img alt="Verified" class="am-verified" src="${BASE}review/assets/icons/verified.svg">`;
    const crew = rows.map((x, i) => {
      const fact = x.live ? `<span class="cp-live-fact"><span class="cp-celebrate-emoji" aria-hidden="true">🎉</span> ${esc(x.update)}</span>` : `<span class="cp-live-fact cp-live-fact--gray">${esc(x.update)}</span>`;
      return `<div class="am-item"><div role="button" tabindex="0" class="am-row tf-row" aria-expanded="false" data-row="${i}">
        <span class="am-who"><span><span class="am-avatar"><img alt="" src="${BASE}${x.c.av}"></span></span><span class="am-names"><span class="am-name">${esc(x.c.name)}${verified}</span><span class="am-handle">${esc(x.c.handle)}</span></span></span>
        <span class="am-update"><span class="cp-live">${fact}</span></span>
        <span class="tf-chipslot"><span class="tf-gdot"><i style="background:${RAMP[x.stage]}"></i>${PULSE_STAGES[x.stage]}</span></span><span class="am-chev"><img alt="" src="${BASE}labs/chevron.svg" style="rotate: 90deg;"></span></div>
        <div class="tf-drawer" aria-hidden="true" inert><div class="tf-drawer-in">${stageHistory(x, r)}</div></div></div>`;
    }).join('');
    const notes = (list) => (list || []).map(([emoji, strong, rest], i, arr) => `<div class="am-note${i === arr.length - 1 ? ' am-note--last' : ''}"><span class="am-note-emoji" aria-hidden="true">${emoji}</span><p class="am-note-text"><strong>${esc(strong)}</strong><span> · ${esc(rest)}</span></p></div>`).join('');
    return `<div class="nfm-pulse cp-root--c">
      <div class="am-progress"><div class="am-stat"><div class="am-stat-left"><span class="am-stat-big">${pct}%</span><span class="am-stat-cap">through your campaign</span></div></div>
        <div class="am2-rail" role="group" aria-label="Creator funnel: ${pct}% through">${rail}</div></div>
      <div class="cp-crew2 tf-noicons tf-heads-grey"><div class="cp-crew-cols cp-crew-cols--left"><div class="cp-crew-left">
        <section class="am-card am-table tf-table" aria-label="Creators"><div class="am-card-head tf-head"><div class="am-head-l"><div><p class="am-card-title">Creators</p><span class="am-card-sub">Review creator progress below.</span></div></div><div class="am-head-r"></div></div>${crew}</section>
      </div>
      <aside class="cp-tile-stack"><aside class="am-rail">
        ${after() ? timelineCard(r) : ''}
        <section class="am-card"><div class="am-card-head"><div class="am-head-l"><div><p class="am-card-title">Recent activity</p></div></div></div><div class="am-card-body">${notes(r.activity)}</div></section>
        <section class="am-card"><div class="am-card-head"><div class="am-head-l"><div><p class="am-card-title">Up next</p></div></div></div><div class="am-card-body">${notes(r.next)}</div></section>
      </aside></aside></div></div>
    </div>`;
  }

  function renderTracker() {
    const runs = runsOf();
    const r = runs.find((x) => x.id === openId) || runs[0];
    if (!r) return renderOverview();
    /* prod's h1 is the campaign's title; new = "Campaign N". The grey "October content" pill
       that sat before it (Julia, Sep 24; handoff page E1) was removed by Julia on Oct 6 */
    const head = after() ? `<h1>Campaign ${r.number}</h1>` : `<h1>${esc(r.title)}</h1>`;
    return `
    <section class="workflow-page nfm-track">
      <div class="workspace-grid">
        <main class="main-column">
          <header class="workflow-header">
            <a class="workflow-header-backlink" href="#" data-back><span class="icon" aria-hidden="true">${BACK}</span> <span>Campaigns</span></a>
            <div class="workflow-header-row">
              <div class="workflow-header-main">
                ${head}
                <span class="phase-pill phase-pill--active"><span class="phase-pill-dot" aria-hidden="true"></span> <span>Active</span></span>
              </div>
              <div class="header-right"><button type="button" class="workflow-header-edit-btn" data-inert="Edit campaign is unchanged; it opens the brief">Edit Campaign</button></div>
            </div>
          </header>
          <div>
            <section class="workflow-stage-shell">
              <section class="stage-primary-surface">
                <div class="workflow-dashboard-controls"><nav class="workflow-dashboard-tabs" aria-label="Campaign dashboard tabs"><button type="button" class="workflow-dashboard-tab active">Dashboard</button> <button type="button" class="workflow-dashboard-tab" data-inert="Content lands here once creators submit and Benable approves it">Content</button></nav></div>
                <article class="stage-top-card content-dashboard-panel content-dashboard-panel--tabbed svelte-p6dn97 nfm-dash">${pulse(r)}</article>
              </section>
            </section>
          </div>
        </main>
      </div>
    </section>`;
  }

  function render() {
    root.innerHTML = (screen === 'track' ? renderTracker() : renderOverview()) + '<div class="nfm-toast" data-toast role="status"></div>';
    if (opts.onRender) opts.onRender(stateKey, screen, rev, bar, tile, scen);
  }
  function toast(msg) {
    const t = root.querySelector('[data-toast]'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  const onClick = (e) => {
    const t = e.target;
    const open = t.closest('[data-open]');
    if (open) {
      e.preventDefault();
      openId = Number(open.dataset.open);
      try { sessionStorage.setItem('acOpen', String(openId)); } catch { /* ok */ }
      opts.onOpen && opts.onOpen();
      return;
    }
    if (t.closest('[data-back]')) { e.preventDefault(); opts.onBack && opts.onBack(); return; }
    const plan = t.closest('[data-plan]');
    if (plan) { opts.onPlan && opts.onPlan({ month: plan.dataset.plan || contentMonthFor(S().todayISO), todayISO: S().todayISO, number: Number(plan.dataset.num) || S().runs.length + 1, rev }); return; }
    const row = t.closest('[data-row]');
    if (row) {
      /* class flips, not re-renders, so drawers and the timeline animate */
      const drawer = row.nextElementSibling;
      const isOpen = !drawer.classList.contains('tf-drawer--open');
      drawer.classList.toggle('tf-drawer--open', isOpen);
      drawer.toggleAttribute('inert', !isOpen);
      drawer.setAttribute('aria-hidden', String(!isOpen));
      row.setAttribute('aria-expanded', String(isOpen));
      row.querySelector('.am-chev img').style.rotate = isOpen ? '-90deg' : '90deg';
      return;
    }
    if (t.closest('[data-tl]')) {
      tlOpen = !tlOpen;
      const box = root.querySelector('.nfm-tl');
      if (box) {
        box.classList.toggle('is-open', tlOpen);
        const btn = box.querySelector('.nfm-tl__toggle');
        btn.setAttribute('aria-expanded', String(tlOpen));
        btn.querySelector('span').textContent = tlOpen ? 'Hide the full timeline' : 'See the full timeline';
      }
      return;
    }
    const inert = t.closest('[data-inert]');
    if (inert) { e.preventDefault(); toast(inert.dataset.inert); }
  };
  const onKey = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-row]')) { e.preventDefault(); e.target.click(); }
  };
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  render();

  return {
    setDay(key) { if (DB[key] && key !== stateKey) { stateKey = key; store('acState', key); if (!DB[key].runs.length) screen = 'overview'; render(); } },
    setRev(next) { if ((next === 'before' || next === 'after') && next !== rev) { rev = next; store('acRev', rev); render(); } },
    setBar(next) { if ((next === 'line' || next === 'segments') && next !== bar) { bar = next; store('acBar', bar); render(); } },
    setTile(next) { if ((next === 'moving' || next === 'fixed') && next !== tile) { tile = next; store('acTile', tile); render(); } },
    setScen(next) { if (SCENE_EVENTS[next] && next !== scen) { scen = next; store('acScen', scen); render(); } },
    setScreen(next) { const want = next === 'track' && S().runs.length ? 'track' : 'overview'; if (want !== screen) { screen = want; render(); } return screen; },
    day: () => stateKey,
    rev: () => rev,
    bar: () => bar,
    tile: () => tile,
    scen: () => scen,
    toast,
    destroy() { root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); root.innerHTML = ''; },
  };
}
