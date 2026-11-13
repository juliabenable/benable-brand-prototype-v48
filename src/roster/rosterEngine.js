/* Direction E, the always-on roster, as a vanilla render engine mounted inside
   the /nf production chrome (see pages/NfRoster.jsx). Ported from the standalone
   selling-months-study/proto-e.html so the two stay in step.

   Model: no campaigns as a brand-facing object. The brand holds a monthly count
   (promised), the brief stands, creators are matched continuously, and creators
   who delivered can apply to come back. Six "today" snapshots (DAYS).

   Sep 8 (Julia): brands must be able to queue a month's brief as early as they
   like. Every month tile except the current one carries "Plan {month}" (or
   "Add a note" once creators are lined up): one click, the current products are
   reused by default, an optional note, saved as a plan the matched creators see
   from the 1st of the prior month. "Plan further ahead" reveals three more months. */

export const DAYS = [
  ['signed', 'Sep 8 · signed'],
  ['matching', 'Sep 10 · matching'],
  ['first', 'Sep 26 · first month'],
  ['steady', 'Dec 12 · steady'],
  ['behind', 'Jan 9 · behind'],
  ['paused', 'Feb 3 · paused'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthAfter = (name, k = 1) => MONTHS[(MONTHS.indexOf(name) + k + 12) % 12];
const opensOn = (name) => `${monthAfter(name, -1).slice(0, 3)} 1`;

const NAMES = [
  ['Maya Ruiz', '@maya.routine'], ['Jordan Kim', '@jordan.skin'], ['Priya Shah', '@priya.glow'], ['Elena Voss', '@elenav.daily'],
  ['Tasha Moore', '@tashamoore'], ['Noor Ali', '@noor.routine'], ['Camille Dubois', '@camille.d'], ['Ines Lopez', '@ines.lo'],
  ['Sofia Bell', '@sofiabell.skin'], ['Harper Wu', '@harperwu'], ['Lena Park', '@lena.pk'], ['Amara Osei', '@amara.o'],
  ['Rosa Marin', '@rosamarin'], ['Zoe Tan', '@zoe.tan'], ['Mila Novak', '@milanovak'], ['Ava Brooks', '@ava.brooks'],
  ['Chloe Reyes', '@chloereyes'], ['Nia Carter', '@nia.c'], ['Yara Haddad', '@yarahaddad'], ['Isla Grant', '@isla.g'],
  ['Freya Lund', '@freyalund'], ['Kai Nakamura', '@kai.nk'], ['Leah Fischer', '@leahf'], ['Bea Costa', '@beacosta'],
  ['Juno Alvarez', '@juno.alv'], ['Sana Iqbal', '@sana.iq'], ['Marta Rossi', '@martarossi'], ['Hana Sato', '@hana.sato'],
  ['Ruby Chen', '@rubychen'], ['Elif Demir', '@elif.d'], ['Nora Quinn', '@noraquinn'], ['Aria Patel', '@aria.p'],
  ['Wren Doyle', '@wrendoyle'], ['Lior Ben', '@lior.b'],
];
const PROMISED = 10;
const mk = (i, state, posts, reach, last, next) => ({ id: i, name: NAMES[i][0], handle: NAMES[i][1], state, posts, reach, last, next });

const rosterSigned = () => [];
const rosterMatching = () => Array.from({ length: 10 }, (_, i) => mk(i, 'invited', 0, '', '', 'answers by Sep 12'));
const rosterFirst = () => [
  mk(0, 'posting', 1, '6k', 'Sep 25', 'posted early'),
  mk(1, 'accepted', 0, '', '', 'delivered Sep 24 · posts by Oct 8'), mk(2, 'accepted', 0, '', '', 'delivered Sep 24 · posts by Oct 8'),
  mk(3, 'accepted', 0, '', '', 'delivered Sep 25 · posts by Oct 9'), mk(4, 'accepted', 0, '', '', 'delivered Sep 25 · posts by Oct 9'),
  mk(5, 'accepted', 0, '', '', 'arrives Sep 27'), mk(6, 'accepted', 0, '', '', 'arrives Sep 27'), mk(7, 'accepted', 0, '', '', 'arrives Sep 28'),
  mk(8, 'accepted', 0, '', '', 'arrives Sep 28'), mk(10, 'accepted', 0, '', '', 'replacement · ships Sep 26'),
  mk(9, 'declined', 0, '', '', 'declined Sep 17 · replaced by Lena Park'),
];
const rosterSteady = () => [
  mk(14, 'posting', 1, '12k', 'Dec 9', 'filming'), mk(15, 'posting', 1, '8k', 'Dec 4', 'posted'), mk(16, 'posting', 1, '6k', 'Dec 9', 'posted'),
  mk(17, 'posting', 1, '9k', 'Dec 2', 'posted'), mk(18, 'posting', 0, '', '', 'posts by Dec 14'), mk(19, 'posting', 0, '', '', 'posts by Dec 15'),
  mk(20, 'posting', 0, '', '', 'posts by Dec 16'), mk(21, 'posting', 1, '5k', 'Dec 8', 'posted'), mk(22, 'posting', 1, '7k', 'Dec 10', 'posted'),
  mk(23, 'posting', 1, '4k', 'Dec 11', 'posted'),
  mk(24, 'lined_up', 0, '', '', 'ships Dec 20'), mk(25, 'lined_up', 0, '', '', 'ships Dec 20'), mk(26, 'lined_up', 0, '', '', 'ships Dec 20'),
  mk(27, 'lined_up', 0, '', '', 'ships Dec 20'), mk(28, 'lined_up', 0, '', '', 'ships Dec 20'), mk(29, 'lined_up', 0, '', '', 'ships Dec 20'),
  mk(30, 'lined_up', 0, '', '', 'ships Dec 20'), mk(31, 'lined_up', 0, '', '', 'ships Dec 20'), mk(32, 'lined_up', 0, '', '', 'ships Dec 20'), mk(33, 'lined_up', 0, '', '', 'ships Dec 20'),
  mk(0, 'applied', 2, '18k', 'Oct 22', 'wants February'), mk(3, 'applied', 1, '9k', 'Oct 2', 'wants February'), mk(10, 'applied', 2, '31k', 'Nov 18', 'wants February'),
  mk(11, 'applied', 1, '12k', 'Nov 30', 'wants February'), mk(12, 'applied', 2, '22k', 'Nov 12', 'wants March'), mk(13, 'applied', 1, '7k', 'Nov 26', 'wants March'),
  mk(1, 'available', 1, '11k', 'Oct 4', ''), mk(2, 'available', 1, '8k', 'Oct 9', ''), mk(4, 'available', 1, '14k', 'Oct 14', ''), mk(5, 'available', 1, '9k', 'Oct 15', ''),
  mk(6, 'available', 1, '6k', 'Oct 16', ''), mk(7, 'available', 1, '19k', 'Oct 16', ''), mk(8, 'available', 1, '5k', 'Oct 24', ''),
];
const rosterBehind = () => {
  const r = rosterSteady();
  r.forEach((c) => {
    if (c.state === 'posting') { c.state = 'available'; c.next = ''; }
    else if (c.state === 'lined_up') { c.state = 'posting'; c.posts = 0; c.reach = ''; c.last = ''; c.next = 'posts by Jan 16'; }
  });
  [24, 25, 26].forEach((id, i) => { const c = r.find((x) => x.id === id); c.posts = 1; c.reach = ['9k', '7k', '11k'][i]; c.last = ['Jan 3', 'Jan 6', 'Jan 8'][i]; c.next = 'posted'; });
  [32, 33].forEach((id) => { const c = r.find((x) => x.id === id); c.next = 'shipped late Jan 5 · posts by Jan 24'; c.late = true; });
  [0, 3, 10, 11].forEach((id) => { const c = r.find((x) => x.id === id); c.state = 'lined_up'; c.next = 'ships Jan 20'; });
  [12, 13].forEach((id) => { const c = r.find((x) => x.id === id); c.state = 'applied'; c.next = 'wants March'; });
  return r;
};
const rosterPaused = () => {
  const r = rosterBehind();
  r.forEach((c) => {
    if (c.state === 'posting') { c.state = 'available'; c.next = ''; c.posts = c.posts || 1; c.reach = c.reach || '6k'; c.last = c.last || 'Jan 22'; c.late = false; }
    if (c.state === 'lined_up') { c.state = 'holding'; c.next = 'holding for March'; }
  });
  return r;
};

const tile = (m, tag, opts) => Object.assign({ m, tag }, opts);

const STATES = {
  signed: {
    today: 'Sep 8', intro: 'Tell us about your product once. We match <b>10 creators every month</b> from then on, and the ones who deliver can ask to come back.',
    months: [
      tile('October', 'your first month', { tone: 'now', num: 0, den: PROMISED, numMuted: true, st: { t: 'Waiting for your brief', tone: 'quiet' }, pace: 'First matches within <b>1 business day</b> of your brief · first post by <b>Oct 22</b>', fill: { pct: 0 } }),
      tile('November', '', { tone: 'dim', num: null, st: { t: 'Matching starts Oct 1', tone: 'quiet' }, pace: 'Plan it now and creators see your plan from Oct 1.' }),
      tile('December', '', { tone: 'dim', num: null, st: { t: 'Matching starts Nov 1', tone: 'quiet' }, pace: 'Holiday content? Plan December now and we match two weeks early.' }),
    ],
    hero: { title: 'October starts with your brief', copy: 'One brief, not a campaign. Pick the products creators can choose from and what a good post looks like. We match 10 creators for October within a business day, and every month after that without a new brief.', cta: 'Set up your brief', to: 'matching',
      steps: ['Your brief, about 10 minutes', 'We match 10 creators for October', 'They post; the good ones can come back'] },
    katie: null, apps: [], appsOn: false, appsEmpty: 'Creators who post for you can ask to come back. Nobody has posted yet.', roster: rosterSigned(),
    rosterEmpty: 'No creators yet. Your first ten arrive within a business day of your brief.',
  },
  matching: {
    today: 'Sep 10', intro: '<b>10 post for you every month.</b> Your brief is in. Creators are matched as they come, and the ones who deliver can ask to come back.',
    months: [
      tile('October', 'this month', { tone: 'now', num: 10, den: PROMISED, st: { t: '10 matched · invites out', tone: 'info' }, pace: 'Creators answer within <b>48 hours</b> · first post by <b>Oct 22</b>, all 10 by <b>Nov 5</b>', fill: { pct: 100, soft: true } }),
      tile('November', '', { tone: 'dim', num: null, st: { t: 'Matching starts Oct 1', tone: 'quiet' }, pace: 'Plan it now and creators see your plan from Oct 1.' }),
      tile('December', '', { tone: 'dim', num: null, st: { t: 'Matching starts Nov 1', tone: 'quiet' }, pace: 'Holiday content? Plan December now and we match two weeks early.' }),
    ],
    hero: null,
    katie: { t: 'We matched 10 creators for October overnight from 34 who fit your brief. Invites went out at 9am; creators answer within 48 hours and anyone who declines is replaced the same day. <b>Nothing needed from you.</b>' },
    apps: [], appsOn: false, appsEmpty: 'Opens after your first creators post.', roster: rosterMatching(),
  },
  first: {
    today: 'Sep 26', intro: '<b>10 post for you every month.</b> Your first creators have product in hand. The ones who deliver can ask to come back.',
    months: [
      tile('October', 'this month', { tone: 'now', num: 1, den: PROMISED, st: { t: '9 filming · on pace', tone: 'ok' }, pace: 'First post landed <b>Sep 25</b>, four weeks early · all 10 by <b>Nov 5</b>', fill: { pct: 10 } }),
      tile('November', '', { tone: 'dim', num: null, st: { t: 'Matching starts Oct 1', tone: 'quiet' }, pace: 'October\'s creators get first refusal. Plan it now and they see your plan from Oct 1.' }),
      tile('December', '', { tone: 'dim', num: null, st: { t: 'Matching starts Nov 1', tone: 'quiet' }, pace: 'Holiday content? Plan December now and we match two weeks early.' }),
    ],
    hero: null,
    katie: { t: 'Maya posted yesterday, four weeks ahead of the promise; we shipped hers first on purpose so you would see a post in your first two weeks. Sofia declined on Sep 17 and Lena took her spot the same day. <b>Nothing needed from you.</b>' },
    apps: [], appsOn: false, appsEmpty: 'Opens after your first creators post. Maya can apply for December once October is done.', roster: rosterFirst(),
  },
  steady: {
    today: 'Dec 12', intro: '<b>10 post for you every month.</b> Creators are matched as they come, and the ones who delivered can ask to come back.',
    months: [
      tile('December', 'this month', { tone: 'now', num: 7, den: PROMISED, st: { t: '3 filming · on pace', tone: 'ok' }, pace: 'First post landed <b>Dec 2</b> · all 10 by <b>Dec 28</b>', fill: { pct: 70 } }),
      tile('January', 'lined up', { tone: '', num: 10, den: PROMISED, small: 'confirmed', st: { t: 'Product ships Dec 20', tone: 'info' }, pace: 'First post by <b>Jan 8</b> · all 10 by <b>Jan 28</b>', fill: { pct: 100, soft: true } }),
      tile('February', 'filling', { tone: '', num: 4, den: PROMISED, small: 'confirmed', st: { t: '6 more to confirm by Jan 7', tone: 'warn' }, pace: 'Applications below count toward February.', fill: { pct: 40, soft: true }, dyn: true }),
    ],
    hero: null,
    katie: { t: 'December is on pace. Three creators are filming and post by the 16th. For February, four are confirmed from matching and six of your past creators have applied below; approve the ones you want and we match the rest.' },
    apps: [
      { id: 0, wants: 'February', why: 'Posted for you in October · 2 posts · 18k reach', note: '"My audience asked where to buy the serum."' },
      { id: 3, wants: 'February', why: 'Posted for you in October · 1 post · 9k reach', note: '"Would love to do a winter routine."' },
      { id: 10, wants: 'February', why: 'Posted for you in November · 2 posts · 31k reach', note: '"Back from a break, ready for more."' },
      { id: 11, wants: 'February', why: 'Posted for you in November · 1 post · 12k reach', note: '"Loved the barrier cream, my skin has been dry."' },
      { id: 12, wants: 'March', why: 'Posted for you in November · 2 posts · 22k reach', note: '"Spring skincare reset."' },
      { id: 13, wants: 'March', why: 'Posted for you in November · 1 post · 7k reach', note: '' },
    ],
    appsOn: true, roster: rosterSteady(),
    plans: { January: { note: 'Winter routine angle. Feature the barrier cream; the serum is fine as a second product.' } },
  },
  behind: {
    today: 'Jan 9', intro: '<b>10 post for you every month.</b> Creators are matched as they come, and the ones who delivered can ask to come back.',
    months: [
      tile('January', 'this month', { tone: 'now', num: 3, den: PROMISED, st: { t: 'Running 4 days behind', tone: 'warn' }, pace: 'First post landed <b>Jan 3</b> · all 10 now by <b>Feb 1</b>', fill: { pct: 30, warn: true } }),
      tile('February', 'at risk', { tone: '', num: 8, den: PROMISED, small: 'confirmed', st: { t: '2 more needed · 2 days past Jan 7', tone: 'warn' }, pace: 'We match the last two by <b>Jan 12</b> unless you approve applicants below.', fill: { pct: 80, soft: true }, dyn: true }),
      tile('March', '', { tone: 'dim', num: null, st: { t: 'Matching starts Feb 1', tone: 'quiet' }, pace: 'Two creators have already asked for March.' }),
    ],
    hero: null,
    katie: { warn: true, t: 'Two January orders left the warehouse on Jan 5, four days after the others; both creators post by Jan 24, so January finishes on Feb 1 instead of Jan 28. February is two creators short because two matches declined this week. <b>Nothing needed from you</b>, unless you would rather approve Rosa or Zoe below than have us match two new ones.' },
    apps: [
      { id: 12, wants: 'March', why: 'Posted for you in November · 2 posts · 22k reach', note: '"Spring skincare reset."' },
      { id: 13, wants: 'March', why: 'Posted for you in November · 1 post · 7k reach', note: '' },
    ],
    appsOn: true, roster: rosterBehind(),
  },
  paused: {
    today: 'Feb 3', intro: '<b>February is paused.</b> Your roster stays. Matching for March starts the moment you resume.',
    months: [
      tile('February', 'paused', { tone: 'paused', num: 0, den: PROMISED, numMuted: true, st: { t: 'Paused', tone: 'quiet' }, pace: 'Nothing ships and nothing bills this month.', fill: { pct: 0 } }),
      tile('March', 'resumes here', { tone: '', num: 4, den: PROMISED, small: 'holding', st: { t: 'Matching starts when you resume', tone: 'quiet' }, pace: 'Resume by <b>Feb 7</b> and March is a full month.', fill: { pct: 40, soft: true } }),
      tile('April', '', { tone: 'dim', num: null, st: { t: 'Matching starts Mar 1', tone: 'quiet' }, pace: '' }),
    ],
    hero: { paused: true, title: 'Paused by you on Jan 28', copy: 'Your 33 creators stay on your roster, applications wait, and the four who were lined up for February are holding for March. Resume by Feb 7 and March is a full month.', cta: 'Resume for March', to: 'toast:March is back on. Matching starts today; product ships Feb 20.' },
    katie: null, apps: [], appsOn: false, appsLocked: true, appsEmpty: 'Paused with your month. Two creators are waiting to apply for March.', roster: rosterPaused(),
  },
};

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const LABEL = { invited: 'Invited · answers within 48h', accepted: 'Accepted', posting: 'Posting this month', lined_up: 'Lined up for next month', holding: 'Holding for March', applied: 'Applied', available: 'Available', passed: 'Passed for now', invited_again: 'Invited again', declined: 'Declined' };
const KLASS = { invited: 'wait', accepted: 'lined', posting: 'posting', lined_up: 'lined', holding: 'lined', applied: 'applied', available: 'available', passed: 'available', invited_again: 'lined', declined: 'available' };

export function createRoster(root, opts = {}) {
  const onSideNote = opts.toast || null;
  let stateKey = 'signed';
  let S = null;
  let showAll = false;
  let toastT;

  function load(key) {
    stateKey = key; showAll = false;
    const src = STATES[key] || STATES.signed;
    S = {
      today: src.today, intro: src.intro,
      months: src.months.map((m) => Object.assign({}, m, { st: Object.assign({}, m.st), fill: m.fill ? Object.assign({}, m.fill) : null })),
      hero: src.hero, katie: src.katie,
      apps: src.apps.map((a) => Object.assign({}, a)), appsOn: src.appsOn, appsLocked: !!src.appsLocked, appsEmpty: src.appsEmpty,
      roster: src.roster.map((c) => Object.assign({}, c)), rosterEmpty: src.rosterEmpty,
      plans: Object.assign({}, src.plans || {}), planning: null, more: false,
    };
    try { localStorage.setItem('eState', key); } catch { /* private mode */ }
  }

  /* ---- plan block: the early-brief queue on every future month ---- */
  function planBlock(m, compact) {
    const month = m.m;
    const plan = S.plans[month];
    const label = m.num !== null && m.num > 0 ? `Add a note for ${month}` : `Plan ${month}`;
    if (S.planning === month) {
      const cur = S.months[0].m;
      return `
      <div class="plan-form" data-plan-form="${esc(month)}">
        <div class="plan-chips"><button type="button" class="chip on" data-chip="same">Same products as ${esc(cur)}</button><button type="button" class="chip" data-chip="pick">Pick different products</button></div>
        <textarea class="plan-note" rows="${compact ? 2 : 3}" placeholder="Anything different for ${esc(month)}? A holiday angle, a launch, a date to hit. Leave it empty and ${esc(month)} runs like ${esc(cur)}."></textarea>
        <div class="plan-actions"><button type="button" class="btn-sm" data-save-plan="${esc(month)}">Save ${esc(month)} plan</button><button type="button" class="btn-txt" data-cancel-plan>Cancel</button></div>
      </div>`;
    }
    if (plan) {
      return `
      <div class="plan done">
        <span class="plan-check" aria-hidden="true">✓</span>
        <div class="plan-copy"><b>Planned</b> · creators see it from ${opensOn(month)}${plan.note ? `<span class="plan-note-text">${esc(plan.note)}</span>` : `<span class="plan-note-text">Same as ${esc(S.months[0].m)}, no changes.</span>`}</div>
        <button type="button" class="btn-txt" data-plan="${esc(month)}">Edit</button>
      </div>`;
    }
    return `<div class="plan"><button type="button" class="btn-sm sec" data-plan="${esc(month)}">${esc(label)}</button><span class="plan-hint">One click. Same products, add a note if you like.</span></div>`;
  }

  function monthTile(m, heroHtml, i) {
    const cls = ['mt', m.tone, S.plans[m.m] && i > 0 ? 'planned' : ''].filter(Boolean).join(' ');
    const big = m.num === null ? '' : `<div class="big num ${m.numMuted ? 'muted' : ''}">${m.num}<small>of ${m.den} ${m.small || 'live'}</small></div>`;
    const st = m.st ? `<span class="st ${m.st.tone === 'info' ? '' : m.st.tone}">${esc(m.st.t)}</span>` : '';
    const pace = m.pace ? `<div class="pace">${m.pace}</div>` : '';
    const fill = m.fill ? `<div class="fill ${m.fill.soft ? 'soft' : ''} ${m.fill.warn ? 'warn' : ''}"><span style="--w:${m.fill.pct}%"></span></div>` : '';
    const head = `<div class="k"><b>${esc(m.m)}</b><span>${esc(m.tag)}</span></div>`;
    if (heroHtml) return `<div class="${cls}">${head}${big}${st}${heroHtml.replace('{{PACE}}', pace)}${fill}</div>`;
    const plan = i > 0 ? planBlock(m, false) : '';
    return `<div class="${cls}">${head}${big}${st}${pace}${plan}${fill}</div>`;
  }

  function moreTiles() {
    const last = S.months[S.months.length - 1].m;
    const names = [1, 2, 3].map((k) => monthAfter(last, k));
    if (!S.more) return `<div class="strip-more-toggle"><button type="button" class="btn-txt" data-more="1">Plan further ahead · ${names.join(', ')}</button></div>`;
    const tiles = names.map((name) => {
      const m = { m: name, tag: '', num: null };
      const cls = ['mt', 'dim', 'compact', S.plans[name] ? 'planned' : ''].filter(Boolean).join(' ');
      return `<div class="${cls}"><div class="k"><b>${esc(name)}</b><span>matching starts ${opensOn(name)}</span></div>${planBlock(m, true)}</div>`;
    }).join('');
    return `<div class="strip-more">${tiles}</div><div class="strip-more-toggle"><button type="button" class="btn-txt" data-more="0">Show fewer months</button></div>`;
  }

  function heroIn(h) {
    if (!h) return '';
    const steps = h.steps ? `<div class="steps">${h.steps.map((s, i) => `<div><i>${i + 1}</i>${esc(s)}</div>`).join('')}</div>` : '';
    return `<div class="hero-in"><h2>${esc(h.title)}</h2><p>${esc(h.copy)}</p>${steps}<div class="cta-row"><button type="button" class="btn-pill" data-cta="${esc(h.to)}">${esc(h.cta)}</button>{{PACE}}</div></div>`;
  }

  function katie(k) {
    if (!k) return '';
    return `<div class="katie ${k.warn ? 'warn' : ''}"><span class="av">K</span><div><b>Katie:</b> ${k.t}</div></div>`;
  }

  function applications() {
    const rows = S.apps.map((a) => {
      const c = S.roster.find((r) => r.id === a.id);
      return `
      <div class="app-row" data-app="${a.id}">
        <div class="who"><span class="av p">${initials(c.name)}</span><div class="t"><b>${esc(c.name)}</b><span>${esc(c.handle)} · wants ${esc(a.wants)}</span></div></div>
        <div class="hist"><b>${esc(a.why)}</b>${a.note ? `<span>${esc(a.note)}</span>` : ''}</div>
        <div class="act"><button type="button" class="btn-sm" data-approve="${a.id}" data-month="${esc(a.wants)}">Approve for ${esc(a.wants)}</button><button type="button" class="btn-txt" data-pass="${a.id}">Pass</button></div>
      </div>`;
    }).join('');
    const body = !S.appsOn
      ? `<div class="empty">${S.appsEmpty || 'Applications are off. Turn them on and creators who delivered for you can ask to come back.'}</div>`
      : (S.apps.length ? `<div class="apps" id="apps">${rows}</div>` : '<div class="empty">No applications waiting. Creators who post for you this month can apply for a later month from their app.</div>');
    const disabled = S.appsLocked || S.roster.filter((r) => r.posts > 0).length === 0;
    return `
    <section class="sec" aria-label="Applications">
      <div class="sec-head">
        <h3>Applications<span class="n num">${S.apps.length}</span></h3>
        <button type="button" class="toggle" role="switch" aria-checked="${S.appsOn}" data-apps-toggle ${disabled ? 'disabled' : ''}><span class="tr" aria-hidden="true"></span><span>Open to creators who delivered for you</span></button>
      </div>
      ${body}
    </section>`;
  }

  function roster() {
    if (!S.roster.length) {
      return `<section class="sec" aria-label="Roster"><div class="sec-head"><h3>Your roster<span class="n num">0</span></h3></div><div class="empty">${esc(S.rosterEmpty || '')}</div></section>`;
    }
    const rows = S.roster.map((r, i) => {
      const hidden = !showAll && i >= 12;
      const action = r.state === 'available' ? `<button type="button" class="btn-sm sec" data-invite="${r.id}">Invite again</button>`
        : r.state === 'invited_again' ? '<span class="muted">Invited</span>'
          : r.state === 'applied' ? '<span class="muted">See above</span>' : '';
      return `<tr class="${hidden ? 'hidden-row' : ''}" data-row="${r.id}">
        <td><div class="who"><span class="av">${initials(r.name)}</span><div class="t"><b>${esc(r.name)}</b><span>${esc(r.handle)}</span></div></div></td>
        <td><span class="state ${KLASS[r.state]}">${LABEL[r.state]}</span></td>
        <td class="r num">${r.posts || '<span class="muted">0</span>'}</td>
        <td class="r num">${r.reach || '<span class="muted">·</span>'}</td>
        <td class="num">${r.last || '<span class="muted">not yet</span>'}</td>
        <td class="${r.late ? 'late' : 'muted'}">${esc(r.next)}</td>
        <td class="r">${action}</td>
      </tr>`;
    }).join('');
    const posted = S.roster.filter((r) => r.posts > 0).length;
    const avail = S.roster.filter((r) => r.state === 'available').length;
    const hint = posted ? `${posted} have posted for you${avail ? ` · ${avail} available to invite again` : ''}` : 'Invited creators answer within 48 hours; anyone who declines is replaced the same day';
    return `
    <section class="sec" aria-label="Roster">
      <div class="sec-head"><h3>Your roster<span class="n num">${S.roster.length}</span></h3><span class="hint">${hint}</span></div>
      <div class="roster-wrap">
        <table class="roster">
          <thead><tr><th>Creator</th><th>Status</th><th class="r">Posts</th><th class="r">Reach</th><th>Last post</th><th>Next</th><th class="r"></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${S.roster.length > 12 ? `<div class="show-all"><button type="button" data-show-all>${showAll ? 'Show fewer' : 'Show all ' + S.roster.length}</button></div>` : ''}
    </section>`;
  }

  function render() {
    root.innerHTML = `
    <div class="page">
      <header class="overview-header">
        <h1>Your creators</h1>
        <p>${S.intro} Today is ${S.today}.</p>
      </header>
      <div class="strip ${S.hero ? 'first' : ''}">${S.months.map((m, i) => monthTile(m, i === 0 ? heroIn(S.hero) : null, i)).join('')}</div>
      ${moreTiles()}
      ${katie(S.katie)}
      ${S.appsOn && S.apps.length ? applications() + roster() : roster() + applications()}
    </div>
    <div class="toast" data-toast role="status"></div>`;
    if (opts.onRender) opts.onRender(stateKey);
  }

  function toast(msg) {
    const t = root.querySelector('[data-toast]');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }
  if (onSideNote) onSideNote.current = toast;

  function removeApp(id, cb) { const row = root.querySelector(`[data-app="${id}"]`); if (row) { row.classList.add('gone'); setTimeout(cb, 180); } else cb(); }
  function bumpDynamic() {
    const m = S.months.find((x) => x.dyn);
    if (!m) return;
    m.num = Math.min(m.den, m.num + 1); m.fill.pct = (m.num / m.den) * 100;
    const left = m.den - m.num;
    m.st = left === 0 ? { t: 'Full · product ships ' + (m.m === 'February' ? 'Jan 20' : 'Feb 20'), tone: 'ok' } : { t: `${left} more to confirm`, tone: 'warn' };
    if (left === 0) m.tag = 'lined up';
  }

  const onClick = (e) => {
    const t = e.target;
    const cta = t.closest('[data-cta]');
    if (cta) {
      const to = cta.dataset.cta;
      if (to.startsWith('toast:')) { toast(to.slice(6)); return; }
      load(to); render(); root.scrollTop = 0; toast('Brief saved. We are matching your October creators now; you will hear from Katie within a business day.'); return;
    }
    const plan = t.closest('[data-plan]');
    if (plan) { S.planning = plan.dataset.plan; render(); const ta = root.querySelector('.plan-note'); if (ta) { if (S.plans[S.planning]) ta.value = S.plans[S.planning].note || ''; ta.focus(); } return; }
    const chip = t.closest('[data-chip]');
    if (chip) {
      if (chip.dataset.chip === 'pick') { toast('Picking products is the existing wizard step; not rebuilt here. The plan keeps your current products.'); return; }
      return;
    }
    const save = t.closest('[data-save-plan]');
    if (save) {
      const month = save.dataset.savePlan;
      const note = (root.querySelector('.plan-note') || {}).value || '';
      S.plans[month] = { note: note.trim() }; S.planning = null; render();
      toast(`${month} is planned. Creators matched for ${month} see it from ${opensOn(month)}; edit it any time before then.`);
      return;
    }
    if (t.closest('[data-cancel-plan]')) { S.planning = null; render(); return; }
    const more = t.closest('[data-more]');
    if (more) { S.more = more.dataset.more === '1'; render(); return; }
    const ap = t.closest('[data-approve]');
    if (ap) {
      const id = +ap.dataset.approve, month = ap.dataset.month;
      removeApp(id, () => {
        S.apps = S.apps.filter((a) => a.id !== id);
        const c = S.roster.find((r) => r.id === id); c.state = 'lined_up'; c.next = 'ships ' + (month === 'February' ? 'Jan 20' : 'Feb 20');
        const dyn = S.months.find((x) => x.dyn); if (dyn && dyn.m === month) bumpDynamic();
        render(); toast(`${c.name} is lined up for ${month}. Product ships ${c.next.replace('ships ', '')}.`);
      });
      return;
    }
    const ps = t.closest('[data-pass]');
    if (ps) {
      const id = +ps.dataset.pass;
      removeApp(id, () => { S.apps = S.apps.filter((a) => a.id !== id); const c = S.roster.find((r) => r.id === id); c.state = 'passed'; c.next = ''; render(); toast(`Passed on ${c.name} for now. Katie will let them know kindly.`); });
      return;
    }
    const inv = t.closest('[data-invite]');
    if (inv) { const c = S.roster.find((r) => r.id === +inv.dataset.invite); c.state = 'invited_again'; c.next = 'answers within 48h'; render(); toast(`Invited ${c.name} for next month. Creators answer within 48 hours.`); return; }
    if (t.closest('[data-show-all]')) { showAll = !showAll; render(); return; }
    const tg = t.closest('[data-apps-toggle]');
    if (tg && !tg.disabled) { S.appsOn = !S.appsOn; render(); toast(S.appsOn ? 'Applications are on.' : 'Applications are off. Nothing changes for creators already lined up.'); }
  };
  root.addEventListener('click', onClick);

  let initial = 'signed';
  try { const s = localStorage.getItem('eState'); if (s && STATES[s]) initial = s; } catch { /* fresh */ }
  load(initial); render();

  return {
    setDay(key) { if (STATES[key] && key !== stateKey) { load(key); render(); root.scrollTop = 0; } },
    day: () => stateKey,
    toast,
    destroy() { root.removeEventListener('click', onClick); root.innerHTML = ''; },
  };
}
