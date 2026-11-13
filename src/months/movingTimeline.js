/* The moving Campaign timeline card: the first-content date follows the campaign instead of
   the fixed 8 weeks that shipped on Oct 5 (beneble_app#747, benable-ui#430).

   Ported from the timeline tile study (timeline-tile-study/index.html, live at
   juliabenable.github.io/timeline-tile-study-1). Every rule and string below was decided by
   Julia on Oct 5 and 6, 2026:
   - the date follows the FIRST creator. It moves earlier when the first order, draft or post
     lands early (Early tag, old date small and crossed out, nothing under the date)
   - it moves later ONLY for the brand's own delays: approving creators (7 days from launch),
     shipping its own orders (14 days from acceptance), reviewing its own drafts (3 business
     days for Katie's team, then 3 for the brand). Delays on the creators' side hold the date
   - a later date shows the old one crossed out up to Film, and again while a draft waits on
     the brand's review
   - at most one line under the date: grey (where things are) or amber (the brand's move)
   - phase windows overlap; Now can sit on two phases; a closed window loses its Now
   - after the first post: "First content landed", then "All 10 posts are live", then
     "Campaign complete" with no date. Past week 8 with posts missing, Post stays Now. A campaign
     completes on its own 7 days after every post is live. Stragglers stay quiet. Counts are out
     of the creators on the campaign
   - rollout: new product campaigns and Pair (pending: Pecan Moon and Pholk, local campaigns)

   Days are counted from the launch day (day 0). */

const DAY = 86400000;
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PLAN = { accepted: 7, delivered: 21, draft: 35, post: 42 };
const ORDER = ['accepted', 'delivered', 'draft', 'post'];
const REMAIN = { accepted: 35, delivered: 21, draft: 7, post: 0 };   /* days from that step to first content */
const DUR = { accepted: 7, delivered: 14, draft: 14 };               /* the time each step is given */
const FILM_AFTER_SHIP = 6;      /* filming opens 6 days after shipping opens */
const REVIEW_AFTER_FILM = 10;   /* review opens 10 days after filming opens */
const ENDS = [7, 21, 35, 49, 56];   /* when each window closes; Review runs a week into Post */
const REVIEW_BIZ = 3;           /* Katie's team reviews (or pre-checks) each draft within 3 business days. Internal, never shown */
const BRAND_CAP = 28;           /* once the brand is 4 weeks past a step, no date (Julia, Oct 6) */
const BRAND_QUIET = 42;         /* 6 weeks past, the overview card drops the week number too (Julia, Oct 6) */
const BRAND_REVIEW_BIZ = 3;     /* the brand's own final review gets 3 more business days. Internal, never shown */

export const MOVING_PHASES = [
  { name: 'Match', line: "Katie's team matches creators for you to approve." },
  { name: 'Ship', line: 'Product ships to creators.' },
  { name: 'Film', line: 'Creators film with your product.' },
  { name: 'Review', line: "Katie's team sends each creator feedback on their draft." },
  { name: 'Post', line: 'Creators post once their draft is approved.' },
];

/* every string on the card */
const COPY = {
  expected: 'First content expected', landed: 'First content landed', completed: 'Campaign complete',
  allLive: (n) => `All ${n} posts are live`, tag: 'Early',
  n_match: "Katie's team is filling the last spots.",
  n_ship: 'The first order is on its way.',
  n_review: "Katie's team is reviewing the first draft.",
  n_approved: 'First draft approved, posting next.',
  n_filming: 'Your creators are filming.',
  wait: { accepted: '5 weeks after you approve your creators', delivered: '3 weeks after the first order is delivered', post: 'Once you approve the first draft' },
  review_brand: "Katie's team pre-checks each draft, then you approve it or send feedback.",
  n_updated: (date, what) => `Updated ${date}, after ${what}.`,
  n_count: (a, n) => `${a} of ${n} posts live.`,
  n_live: (a) => `${a} post${a === 1 ? '' : 's'} live.`,
  n_first: (a) => `First content landed ${a}.`,
  n_all: (n) => `All ${n} posts are live.`,
  y_approve: (n) => `${n} creator${n === 1 ? ' is' : 's are'} ready for your review.`,
  y_ship: (n) => `${n} order${n === 1 ? ' is' : 's are'} ready for you to ship.`,
  y_review: (n) => `${n} draft${n === 1 ? ' is' : 's are'} ready for your review.`,
};
const WHAT = { accepted: 'creators accepted', delivered: 'the first delivery', draft: 'the first draft' };

/* a campaign's clock: date helpers counted from its launch day */
export function clock(launchISO) {
  const launch = new Date(launchISO + 'T12:00:00');
  const dateOf = (d) => new Date(launch.getTime() + d * DAY);
  const fmt = (d) => { const x = dateOf(d); return `${SHORT[x.getMonth()]} ${x.getDate()}`; };
  const mondayOf = (d) => d - ((dateOf(d).getDay() + 6) % 7);
  const range = (a, b) => { const x = dateOf(a); const y = dateOf(b); return x.getMonth() === y.getMonth() ? `${fmt(a)} to ${y.getDate()}` : `${fmt(a)} to ${fmt(b)}`; };
  const addBiz = (d, n) => { let x = d; for (let k = 0; k < n;) { x += 1; const wd = dateOf(x).getDay(); if (wd !== 0 && wd !== 6) k += 1; } return x; };
  const dayOf = (iso) => Math.round((new Date(iso + 'T12:00:00') - launch) / DAY);
  return { dateOf, fmt, mondayOf, range, addBiz, dayOf };
}

/* who holds each step: the brand approves its creators, ships its own orders, reviews its own drafts */
const ownerOf = (sc, k) => (k === 'accepted' ? sc.matchOwner : k === 'delivered' ? sc.ships : k === 'post' ? sc.reviewer : 'creator');

/* sc = what happened, in days from launch: { acc, del, draft, posts: [one per creator], n,
   matchOwner, ships, reviewer, completed }. t = today, in days from launch. */
export function computeMoving(sc, t, launchISO) {
  const { fmt, mondayOf, addBiz } = clock(launchISO);
  const weekOf = (d) => `Week of ${fmt(mondayOf(d))}`;
  const n = sc.n || sc.posts.length;
  const firstPost = Math.min(...sc.posts);
  const ev = { accepted: sc.acc, delivered: sc.del, draft: sc.draft, post: firstPost };
  const done = (k) => ev[k] != null && ev[k] <= t;
  const reached = ORDER.filter(done);
  const front = reached.length;
  const next = ORDER.find((k) => !done(k)) || null;
  const movers = reached.filter((k) => k !== 'accepted');
  const latest = movers[movers.length - 1] || null;
  const posted = done('post');
  const live = sc.posts.filter((d) => d <= t).length;
  const lastPost = Math.max(...sc.posts);
  const allLive = Number.isFinite(lastPost) && lastPost <= t;
  /* by the team, when every creator is thanked, or on its own 7 days after every post is live (Julia, Oct 6) */
  const completed = (sc.completed != null && t >= sc.completed) || (allLive && t >= lastPost + 7);

  /* 1. days lost while the ball was with the brand */
  let bd = 0; let brandHolds = null; let brandStep = null; let holdOver = 0;
  const cum = ORDER.map((k, i) => {
    if (ownerOf(sc, k) === 'brand' && (i === 0 || done(ORDER[i - 1]))) {
      const prev = i ? ev[ORDER[i - 1]] : 0;
      const end = done(k) ? ev[k] : t;
      let over;
      if (k === 'post') {
        const withBrand = addBiz(prev, REVIEW_BIZ);
        over = end > addBiz(prev, REVIEW_BIZ + BRAND_REVIEW_BIZ) ? Math.max(0, end - Math.max(PLAN[k] + bd, withBrand)) : 0;
      } else over = Math.max(0, end - Math.max(PLAN[k] + bd, prev + DUR[k]));
      if (over) { bd += over; if (done(k)) brandStep = k; else { brandHolds = k; holdOver = over; } }
    }
    return bd;
  });

  /* 2. the realistic date, from the first creator */
  const base = latest ? ev[latest] + REMAIN[latest] : Math.max(42, done('accepted') ? ev.accepted + REMAIN.accepted : 42);
  const floor = posted ? ev.post : t + REMAIN[next];
  const realistic = Math.max(base, floor);
  const overdue = !posted && floor > base && realistic > 42;

  /* 3. early pulls the date in, only the brand pushes it out */
  const forecast = posted ? ev.post : Math.min(realistic, 42 + bd);
  const early = mondayOf(forecast) < mondayOf(42);
  const stale = !posted && mondayOf(t) > mondayOf(forecast);

  /* 4. the full timeline: overlapping windows, starts follow the first creator, ends move only with the brand's days */
  const open = [0, PLAN.accepted + cum[0]];
  const st = [0];
  for (let i = 1; i <= 3; i += 1) {
    if (i > 1) open[i] = st[i - 1] + (i === 2 ? FILM_AFTER_SHIP : REVIEW_AFTER_FILM) + (cum[i - 1] - cum[i - 2]);
    st.push(done(ORDER[i - 1]) ? Math.min(ev[ORDER[i - 1]], open[i]) : open[i]);
  }
  open[4] = 42 + bd;
  st.push(Math.max(Math.min(forecast, open[4]), st[3] + 1));
  const en = ENDS.map((b, i) => Math.max(b + cum[Math.min(i, 3)], st[i] + 1));
  const idx = front;
  if (brandHolds) en[idx] = Math.max(en[idx], t + 1);
  const earlyBy = st.map((d, i) => (i && done(ORDER[i - 1]) && open[i] - d >= 2 ? open[i] - d : 0));
  const after = t >= en[4];
  /* past week 8 with posts missing, Post stays Now while the campaign is open (Julia, Oct 6) */
  const now = completed || allLive ? [] : after ? [4] : [0, 1, 2, 3, 4].filter((i) => i === idx || (i < idx && t < en[i]));
  const frac = Math.min(0.9, Math.max(0.1, (t - st[idx]) / Math.max(1, en[idx] - st[idx])));
  const pct = completed || allLive || after ? 100 : Math.round((idx + frac) * 20);

  /* what the card says */
  let label = COPY.expected; let value; let was = ''; let tag = false; let line = null; let capped = false; let quiet = false;
  if (completed) {
    label = ''; value = COPY.completed;   /* no date (Julia, Oct 6) */
    tag = allLive && mondayOf(lastPost) < mondayOf(55);
    line = live ? ['note', allLive ? COPY.n_all(n) : COPY.n_live(live)] : null;
  } else if (allLive) {
    label = COPY.allLive(n); value = fmt(lastPost);
    tag = mondayOf(lastPost) < mondayOf(55);
    line = ['note', COPY.n_first(fmt(ev.post))];
  } else if (posted) {
    label = COPY.landed; value = fmt(ev.post); tag = early;
    line = ['note', COPY.n_count(live, n)];
  } else {
    value = weekOf(forecast);
    tag = early;
    if (early || (mondayOf(forecast) > mondayOf(42) && (front < 2 || brandHolds === 'post'))) was = fmt(mondayOf(42));
    /* amber counts come from the stage counts (sc.waiting) when known: creators to approve, orders to ship, drafts to review */
    const w = sc.waiting || {};
    if (brandHolds) line = ['you', brandHolds === 'accepted' ? COPY.y_approve(w.creators || n) : brandHolds === 'delivered' ? COPY.y_ship(w.orders || n) : COPY.y_review(w.drafts || 1)];
    else if (overdue || stale) {
      const checked = next === 'post' && t >= addBiz(ev.draft, REVIEW_BIZ);
      line = next === 'post' && checked && sc.reviewer === 'brand' ? ['you', COPY.y_review(w.drafts || 1)]
        : ['note', next === 'accepted' ? COPY.n_match : next === 'delivered' ? COPY.n_ship : next === 'draft' ? COPY.n_filming : checked ? COPY.n_approved : COPY.n_review];
    } else if (was && !early && brandStep && WHAT[brandStep]) line = ['note', COPY.n_updated(fmt(ev[brandStep]), WHAT[brandStep])];
    /* more than 4 weeks past a brand step: no date, say what first content waits for; the amber line stays */
    if (brandHolds && holdOver > BRAND_CAP) { capped = true; value = COPY.wait[brandHolds]; was = ''; tag = false; }
    if (brandHolds && holdOver > BRAND_QUIET) quiet = true;
  }
  return { sc, n, t, ev, posted, live, allLive, completed, lastPost, forecast, firstPost, bd, early, stale, capped, quiet, st, en, earlyBy, idx, now, after, pct, week: Math.floor(t / 7) + 1, label, value, was, tag, line };
}

const daysWord = (d) => `${d} day${d === 1 ? '' : 's'}`;

/* the card, in the prototype's nfm-tl classes (worn as one of production's rail cards) */
export function movingCardHtml(c, { launchISO, open = false, chev = '', note = '' }) {
  const { fmt, range } = clock(launchISO);
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const names = MOVING_PHASES.map((p, i) => `<span class="${c.now.includes(i) ? 'now' : ''}">${p.name}</span>`).join('');
  const why = c.line ? `<div class="nfm-tl__why${c.line[0] === 'you' ? ' is-you' : ''}"><i aria-hidden="true"></i><span>${esc(c.line[1])}</span></div>` : '';
  let steps = MOVING_PHASES.map((p, i) => {
    const st = c.now.includes(i) ? 'now' : c.completed || c.allLive || c.after || i < c.idx ? 'done' : 'next';
    const startedEarly = c.earlyBy[i] ? ` <span class="nfm-tl__started">Started ${daysWord(c.earlyBy[i])} early.</span>` : '';
    const line = i === 3 && c.sc.reviewer === 'brand' ? COPY.review_brand : p.line;
    return `<li class="${st}"><span class="nfm-tl__dot" aria-hidden="true"></span><div><div class="nfm-tl__row"><b>${p.name}</b>${st === 'now' ? '<span class="nfm-tl__now">Now</span>' : ''}<span class="nfm-tl__dates">${range(c.st[i], c.en[i] - 1)}</span></div><p>${esc(line)}${startedEarly}</p></div></li>`;
  }).join('');
  /* stragglers get no mention: the team's follow-ups are logged but never shown */
  const tailNow = c.after && !c.allLive;
  if (!c.completed) steps += `<li class="${c.allLive ? 'done' : tailNow ? 'now' : 'next'}"><span class="nfm-tl__dot" aria-hidden="true"></span><div><div class="nfm-tl__row"><b>${c.bd > 0 ? 'After that' : 'After week 8'}</b>${tailNow ? '<span class="nfm-tl__now">Now</span>' : ''}<span class="nfm-tl__dates">From ${fmt(c.en[4])}</span></div><p>${c.allLive ? 'Every post is live.' : 'Any last posts go live.'}</p></div></li>`;
  return `
    <section class="am-card nfm-tl nfm-tl--moving${open ? ' is-open' : ''}" aria-label="Campaign timeline">
      <div class="am-card-head"><div class="am-head-l"><div><p class="am-card-title">Campaign timeline</p></div></div></div>
      <div class="am-card-body nfm-tl__body">
        <div class="nfm-tl__compact" data-tl>
          <div class="nfm-tl__k">${esc(c.label)}</div>
          <div class="nfm-tl__v"><span>${esc(c.value)}</span>${c.was ? `<span class="nfm-tl__was">${esc(c.was)}</span>` : ''}${c.tag ? `<span class="nfm-tl__early">${COPY.tag}</span>` : ''}</div>
          ${why}
          <div class="nfm-tl__line" aria-hidden="true"><span style="width:${c.pct}%"></span></div>
          <div class="nfm-tl__phases nfm-tl__phases--even" aria-hidden="true">${names}</div>
        </div>
        <button type="button" class="nfm-tl__toggle" data-tl aria-expanded="${open}"><span>${open ? 'Hide the full timeline' : 'See the full timeline'}</span>${chev}</button>
        <div class="nfm-tl__full"><div>
          <ol class="nfm-tl__steps">${steps}</ol>
          ${note ? `<p class="nfm-tl__note">${esc(note)}</p>` : ''}
        </div></div>
      </div>
    </section>`;
}

/* the overview card's line over the bar, from the same computation */
export function movingMetaHtml(c, launchISO) {
  const { fmt, mondayOf } = clock(launchISO);
  const tag = c.tag ? `<span class="nfm-tl__early">${COPY.tag}</span>` : '';
  if (c.completed) return c.live ? `<b>${c.live} live</b> · campaign complete` : '<b>Campaign complete</b>';
  if (c.allLive) return `<b>${c.n} of ${c.n} live</b> · last on ${fmt(c.lastPost)}${tag}`;
  if (c.posted) return `<b>${c.live} of ${c.n} live</b> · first on ${fmt(c.firstPost)}${tag}`;
  const wk = c.week <= 8 ? `Week ${c.week} of 8` : `Week ${c.week}`;
  /* the week has passed, or no date any more: the card's own line in place of the date (Julia, Oct 6) */
  if (c.quiet && c.line) return c.line[1].replace(/\.$/, '');   /* 6 weeks past a brand step: no week number either */
  if ((c.stale || c.capped) && c.line) return `<b>${wk}</b> · ${c.line[1].replace(/\.$/, '')}`;
  return `<b>${wk}</b> · first content expected the week of ${fmt(mondayOf(c.forecast))}${tag}`;
}

/* ---------- what happens to Campaign 1 (the second black bar) ----------
   On plan matches the prototype's hand-written days (first post Oct 21, 3 live by Oct 28).
   The others move the same campaign; the creators table is generated from them so the
   whole page agrees with the card. */
const PLAN_POSTS = [41, 43, 46, 50, 51, 52, 53, 55, 56, 58];
export const SCENES = [
  ['plan', 'On plan'],
  ['early', 'Early'],
  ['brandship', 'Brand ships late'],
  ['brandreview', 'Brand reviews late'],
  ['creators', 'Creators late'],
];
export const SCENE_EVENTS = {
  plan: { acc: 7, del: 21, draft: 35, posts: PLAN_POSTS },
  early: { acc: 7, del: 14, draft: 28, posts: PLAN_POSTS.map((d) => d - 7) },
  brandship: { acc: 7, del: 30, draft: 44, posts: PLAN_POSTS.map((d) => d + 9), ships: 'brand' },
  brandreview: { acc: 7, del: 21, draft: 35, posts: PLAN_POSTS.map((d) => d + 8), reviewer: 'brand' },
  creators: { acc: 7, del: 30, draft: 44, posts: PLAN_POSTS.map((d) => d + 9) },
};

/* each creator's own days, spread around the first creator's */
const DEL_SPREAD = [0, 0, 0, 1, 1, 2, 2, 3, 5, 6];
export function creatorDays(sc, i, launchISO) {
  const { addBiz } = clock(launchISO);
  const post = sc.posts[i];
  const draft = i === 0 ? sc.draft : Math.max(sc.draft, post - 6);
  /* a brand that reviews its own drafts releases the post the day it approves */
  const approve = sc.reviewer === 'brand' ? post : Math.max(post - 2, draft + 1);
  const del = Math.min(sc.del + DEL_SPREAD[i], draft - 3);
  const ship = sc.ships === 'brand' ? sc.del - 3 : Math.min(del - 3, 10 + (i % 3));
  return { ship, del, draft, approve, post };
}
