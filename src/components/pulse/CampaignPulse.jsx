import { useEffect, useReducer, useRef, useState } from 'react';
import '../../styles/pulse.css';
import { DAYS, LOCAL, LATE, crewFor } from './pulseData.js';
import { stageOf, AmineProgress2, AmineRail, StayTuned, CreatorsFound } from './amine.jsx';
import FixedTable from './tableFix.jsx';
import { reviewNeeds, getReviewMode, setReviewMode, setFlagBeat, flagBeat } from './review.jsx';
import { forks } from './forks.js';
import { poolTotal, POOL_CASES, pool, setPool, OPEN_SPOT_CASES, openSpot, setOpenSpot, resetInvites } from '../../invite/openSpot.js';
import NpsAsk from '../nps/NpsAsk.jsx';
import NpsCorner from '../nps/NpsCorner.jsx';
import { nps } from '../nps/npsStore.js';

/*
  Campaign Pulse v34 — single experience (v33's C), kept lean for polishing:
  stat row + Amine stage rail + creators table + right rail, driven by the
  DAYS/CREW demo states. The A–D/W/Y/Z/0 exploration lives in v33 and git.
  v37: a COLLAB TYPE toggle (product | local) sits at the very top — local
  collabs swap the order stages for Confirmed/Visited and never mention
  shipping (Julia, Jul 27).
*/

// Survive captured-DOM remounts.
let persistedIdx = 3; // open on Day 9 — the dead middle is the thesis
let persistedMode = 'product';
/* v39 locks Julia's picks (Jul 28): table F only · rail A (split cards) ·
   stage = ramp dot + word (3A) · actions = calm (4C) · icons off.
   Undecided dims ship at their F defaults: edu footnote (B) · late quiet (7A) ·
   header grey #f8f9fa · ship band · amber buttons. Flip here if she re-opens one. */
const F_OPTS = { edu: 'b', stage: 'dots', act: 'calm', late: 'quiet', icons: 'off', btn: 'amber' };
/* v40 (Jul 29) — Julia's final picks, LOCKED: Grey header tint · ship flow in
   the card header · table K · solid wrap ring. The HEADER/SHIP/TABLE/RING
   switchers are gone from the pill (deep-links still accept overrides for the
   states gallery); the exploration lives in v39. */
let persistedToggles = { head: 'grey', ship: 'head', table: 'k', ring: 'solid' };
/* Katie's per-brand admin switch: declined invites stay hidden by default */
let persistedDeclined = false;

/* Demo deep-links (states-review gallery): ?day=9&mode=local&table=k&head=white
   &ship=head&ring=badge seed the demo state; ?embed=1 hides the demo chrome.
   No params → behavior unchanged. */
const Q = new URLSearchParams(window.location.search);
const EMBED = Q.has('embed');
if (Q.get('mode') === 'local') persistedMode = 'local';
if (Q.has('declined')) persistedDeclined = Q.get('declined') !== '0';
/* the shared /nf fork store is the source of truth when present (deep-link
   params seed it; the /nf ForkBar and this pill both write it) */
if (Q.get('mode')) forks.set('type', Q.get('mode') === 'local' ? 'local' : 'product');
if (Q.has('declined')) forks.set('declined', persistedDeclined);
for (const k of ['table', 'head', 'ship', 'ring']) if (Q.has(k)) persistedToggles = { ...persistedToggles, [k]: Q.get(k) };
/* Sep 21: ?late=one plays the straggler close-out (adds Day 37 · Closed),
   ?npsask=off hides the brand NPS asks (the store's own ?nps=<moment>&score=N
   deep-link is the email twin's one-tap landing) */
if (Q.has('late')) forks.set('late', Q.get('late') === 'one' ? 'one' : 'none');
if (Q.has('npsask')) forks.set('nps', Q.get('npsask') === 'off' ? 'off' : 'on');
if (Q.has('npsui')) forks.set('npsui', Q.get('npsui') === 'corner' ? 'corner' : 'card');
/* some days only exist for one collab type (day 10 = CSV shipping) or one
   ending (day 37 = the straggler close) */
const dayList = (mode, fulfill = forks.get('fulfill'), late = forks.get('late') === 'one') => DAYS
  .filter((d) => !(mode === 'local' && d.productOnly))
  .filter((d) => !(d.csvOnly && fulfill === 'shopify'))
  .filter((d) => !(d.lateOnly && !late));
if (Q.has('day')) {
  /* the fork store is the collab type's source of truth (seeded from ?mode above);
     persistedMode alone drifted every day after 9 when Local was persisted */
  const qi = dayList(forks.get('type') === 'local' ? 'local' : 'product').findIndex((d) => d.day === Number(Q.get('day')));
  if (qi >= 0) persistedIdx = qi;
}

/* Let /nf open the tracker on a specific day (e.g. a COMPLETED campaign
   lands on Day 30 — the wrap state). Respects the current collab type's
   day list. */
export const setPulseDay = (day) => {
  const i = dayList(forks.get('type') === 'local' ? 'local' : 'product').findIndex((d) => d.day === day);
  if (i >= 0) persistedIdx = i;
};

export default function CampaignPulse() {
  const [idx, setIdx] = useState(persistedIdx);
  // the shared fork store wins over module memory — a fork flipped on any
  // /nf page carries into the tracker (and vice versa via the write-backs)
  const [mode, setMode] = useState(() => (forks.get('type') === 'local' ? 'local' : 'product'));
  const [tg, setTg] = useState(persistedToggles);
  const setToggle = (k, v) => setTg((o) => ({ ...o, [k]: v }));
  const [openCrew, setOpenCrew] = useState(() => new Set());
  const [stageFilter, setStageFilter] = useState(null);
  /* review decisions land on asset objects (review.jsx) — pulse the whole
     page so the rail, chips and table re-derive together */
  const [, pulse] = useReducer((n) => n + 1, 0);
  /* WHO REVIEWS — per-brand config (Aug 10 study @4218): 'benable' default,
     'brand' = the Trilogy model. Module getter feeds every derivation, so
     set it synchronously before re-rendering. */
  const [review, setReview] = useState(() => {
    if (forks.get('review') !== getReviewMode()) setReviewMode(forks.get('review'));
    return getReviewMode();
  });
  const switchReview = (r) => { setReviewMode(r); setReview(r); forks.set('review', r); };
  /* v43 explores review direction B: the conversation (reviewChat.jsx).
     Chat opens by default; the v42 sheet stays one click away. */
  /* declined-invites visibility — Katie's admin switch, off by default */
  const [showDeclined, setShowDeclined] = useState(() => forks.get('declined'));
  useEffect(() => { persistedDeclined = showDeclined; forks.set('declined', showDeclined); }, [showDeclined]);
  /* FULFILLMENT fork (product only): 'shopify' = orders placed + tracked
     automatically, the whole Day-10 CSV machinery disappears; 'csv' = the
     brand ships (order sheet + tracking). */
  const [fulfill, setFulfill] = useState(() => forks.get('fulfill') || 'csv');
  useEffect(() => { forks.set('fulfill', fulfill); }, [fulfill]);
  /* STRAGGLERS fork + the brand NPS asks (Sep 21, Tony's proposal) */
  const [late, setLate] = useState(() => forks.get('late') === 'one');
  /* crewFor / pctFor read the fork store at call time, so the store is written
     BEFORE the state flips (same as switchReview); an effect would render one
     half-flipped frame that nothing re-renders */
  const switchLate = (v) => {
    forks.set('late', v ? 'one' : 'none');
    setLate(v);
    setIdx((i) => Math.min(i, dayList(mode, fulfill, v).length - 1));
  };
  /* NPS: off, or which question set plays (the one real choice for Tony) */
  const [npsMode, setNpsMode] = useState(() => (forks.get('nps') === 'off' ? 'off' : forks.get('npsq') === 'recommend' ? 'recommend' : 'moment'));
  const switchNps = (v) => {
    forks.set('nps', v === 'off' ? 'off' : 'on');
    if (v !== 'off') forks.set('npsq', v);
    setNpsMode(v);
  };
  const npsOn = npsMode !== 'off';
  /* where the ask lives: the card in the page flow, or Airtable's corner slide-up (Sep 24) */
  const [npsUi, setNpsUi] = useState(() => (forks.get('npsui') === 'corner' ? 'corner' : 'card'));
  const switchNpsUi = (v) => { forks.set('npsui', v); setNpsUi(v); };
  const rootRef = useRef(null);
  const days = dayList(mode, fulfill, late);
  /* the list shrinks when a fork flips (Day 37, Day 10): keep idx inside it */
  const at = Math.min(idx, days.length - 1);
  useEffect(() => { if (idx > days.length - 1) setIdx(days.length - 1); }, [idx, days.length]);
  const base0 = days[at];
  /* under One late, day 30 is the deadline day, not the wrap */
  const base = late && LATE.days[base0.day] ? { ...base0, ...LATE.days[base0.day] } : base0;
  /* day-16 recap/upNext copy differs by reviewer — resolve the variant */
  const pickR = (v) => (v && v.byReview ? (v[review] ?? v.benable) : v);
  const scene = mode === 'local'
    ? { ...base, mode, review, showDeclined, fulfill, late, upNext: pickR(LOCAL.upNext[base.day] ?? base.upNext), recap: pickR(LOCAL.recap[base.day] ?? base.recap) }
    : { ...base, mode, review, showDeclined, fulfill, late, upNext: pickR(base.upNext), recap: pickR(base.recap) };
  const phase = scene.phase; // 'sourcing' | 'review' | undefined (live dashboard)

  const switchMode = (m) => {
    if (m === mode) return;
    const day = days[at].day;
    const nextDays = dayList(m, fulfill, late);
    const at = nextDays.findIndex((d) => d.day === day);
    setIdx(at >= 0 ? at : Math.min(idx, nextDays.length - 1));
    setMode(m);
  };

  useEffect(() => { persistedIdx = idx; }, [idx]);
  useEffect(() => { persistedToggles = tg; }, [tg]);
  useEffect(() => { persistedMode = mode; forks.set('type', mode); }, [mode]);
  useEffect(() => { setStageFilter(null); }, [idx, mode, review]);

  const toggleCrew = (k) =>
    setOpenCrew((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });

  // The pulse view replaces the Dashboard tab's own content; the grey
  // #f9fafb pane fills everything below the tabs (tabs strip stays white).
  useEffect(() => {
    const wrap = rootRef.current?.parentElement;
    const column = wrap?.classList.contains('cp-host') ? wrap.parentElement : wrap;
    if (!column) return undefined;
    const pane = column.parentElement;
    column.classList.add('cp-crew-mode');
    if (!phase) {
      column.classList.add('cp-crew-mode--labs');
      pane?.classList.add('cp-labs-pane');
    }
    return () => {
      column.classList.remove('cp-crew-mode', 'cp-crew-mode--labs');
      pane?.classList.remove('cp-labs-pane');
    };
  }, [phase]);

  // Recruiting pill (Figma #fff0ce/#a85321) while sourcing/reviewing; Active after.
  useEffect(() => {
    const pill = document.querySelector('.workflow-header-main .phase-pill');
    const label = pill?.querySelector('span:last-child');
    const dot = pill?.querySelector('.phase-pill-dot');
    if (!pill || !label) return undefined;
    if (!phase) return undefined;
    label.textContent = 'Recruiting';
    pill.style.background = '#fff0ce';
    pill.style.color = '#a85321';
    if (dot) dot.style.background = '#a85321';
    return () => {
      label.textContent = 'Active';
      pill.style.background = '';
      pill.style.color = '';
      if (dot) dot.style.background = '';
    };
  }, [phase]);

  /* Completed pill once the campaign is closed (Sep 21): everyone posted, or
     the deadline + 7 days close with a straggler still out. Production's own
     completed colors. */
  const campaignClosed = !phase && (scene.closed || (scene.day === 30 && !late));
  useEffect(() => {
    const pill = document.querySelector('.workflow-header-main .phase-pill');
    const label = pill?.querySelector('span:last-child');
    const dot = pill?.querySelector('.phase-pill-dot');
    if (!pill || !label || !campaignClosed) return undefined;
    /* everyone posted = Completed; closed with someone still out = Closed, the
       word every sentence on that page uses (and NOT production's completed status) */
    label.textContent = scene.closed ? 'Closed' : 'Completed';
    pill.style.background = 'rgb(235, 247, 239)';
    pill.style.color = 'rgb(22, 114, 69)';
    if (dot) dot.style.background = 'rgb(22, 114, 69)';
    return () => {
      label.textContent = 'Active';
      pill.style.background = '';
      pill.style.color = '';
      if (dot) dot.style.background = '';
    };
  }, [campaignClosed, scene.closed]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      /* the review modal owns the arrow keys while open (draft flipping) */
      if (document.querySelector('.rvm')) return;
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, days.length - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [days.length]);

  const needsAction = (c) => (c.mystery && c.found) || (!c.mystery && !!c.action) || reviewNeeds(c, mode);
  const crewRows = crewFor(scene.day, mode)
    .filter((c) => {
      if (stageFilter == null) return true;
      if (stageFilter === 'casting') return !!c.mystery;
      if (stageFilter === 'needs') return needsAction(c);
      return !c.mystery && stageOf(c, scene.day, mode) === stageFilter;
    })
    // action items float to the top of the list
    .sort((a, b) => Number(needsAction(b)) - Number(needsAction(a)));

  const askDue = npsOn && (!EMBED || Q.get('npsask') === 'on') && scene.nps && !phase;
  const askNode = askDue && npsUi === 'card' ? (
    <NpsAsk key={`nps-${scene.nps}-${scene.day}`} moment={scene.nps} skin="rail" closedLate={!!scene.closed} />
  ) : null;
  /* the corner card portals to body, so it renders here and lands bottom right */
  const cornerNode = askDue && npsUi === 'corner' ? (
    <NpsCorner key={`npc-${scene.nps}-${scene.day}`} moment={scene.nps} closedLate={!!scene.closed} />
  ) : null;

  return (
    <div className="cp-root cp-root--c" ref={rootRef}>
      {/* demo control — collab type, at the very top (Julia, Jul 27) */}
      {!EMBED && <div className="cp-mode" role="group" aria-label="Demo config">
        <span className="cp-scrub-tag">TYPE</span>
        <button type="button" className={mode === 'product' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchMode('product')}>
          Product
        </button>
        <button type="button" className={mode === 'local' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchMode('local')}>
          Local
        </button>
        {mode === 'product' && (
          <>
            <span className="cp-mode-sep" aria-hidden />
            <span className="cp-scrub-tag">FULFILL</span>
            <button type="button" className={fulfill === 'shopify' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => setFulfill('shopify')}>
              Shopify
            </button>
            <button type="button" className={fulfill === 'csv' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => setFulfill('csv')}>
              CSV
            </button>
          </>
        )}
        <span className="cp-mode-sep" aria-hidden />
        <span className="cp-scrub-tag">REVIEWS</span>
        <button type="button" className={review === 'benable' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchReview('benable')}>
          Benable
        </button>
        <button type="button" className={review === 'brand' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchReview('brand')}>
          Brand
        </button>
        <span className="cp-mode-sep" aria-hidden />
        <span className="cp-scrub-tag">DECLINED</span>
        <button type="button" className={!showDeclined ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => setShowDeclined(false)}>
          Hidden
        </button>
        <button type="button" className={showDeclined ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => setShowDeclined(true)}>
          Shown
        </button>
        <span className="cp-mode-sep" aria-hidden />
        <span className="cp-scrub-tag">LATE</span>
        <button type="button" className={!late ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchLate(false)}>
          None
        </button>
        <button type="button" className={late ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchLate(true)}>
          One
        </button>
        <span className="cp-mode-sep" aria-hidden />
        {/* the question set is the fork Tony has to judge, so it plays here */}
        <span className="cp-scrub-tag">NPS</span>
        {[['moment', 'By moment'], ['recommend', 'Same ×3'], ['off', 'Off']].map(([v, label]) => (
          <button key={v} type="button" className={npsMode === v ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchNps(v)}>
            {label}
          </button>
        ))}
        <button type="button" className="cp-scrub-day" title="Clear all three answers" aria-label="Clear all three answers" onClick={() => { nps.reset(); pulse(); }}>
          ↺
        </button>
        <span className="cp-mode-sep" aria-hidden />
        <span className="cp-scrub-tag">ASK</span>
        {[['card', 'Card'], ['corner', 'Corner']].map(([v, label]) => (
          <button key={v} type="button" className={npsUi === v ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => switchNpsUi(v)}>
            {label}
          </button>
        ))}
        {/* FOUND (Julia, Oct 22): we found 75 creators for the 6 spots, or only 7 */}
        <span className="cp-mode-sep" aria-hidden />
        <span className="cp-scrub-tag">FOUND</span>
        {POOL_CASES.map(([v, label]) => (
          <button key={v} type="button" className={pool() === v ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => { setPool(v); pulse(); }}>
            {label}
          </button>
        ))}
        <button type="button" className="cp-scrub-day" title="Forget every choice and invite sent in the Invite Creators popups" onClick={() => { resetInvites(); pulse(); }}>
          ↺ Reset invites
        </button>
        {/* OPEN SPOT (Julia, Oct 22), Days 9 to 11: how the declined creator's spot gets
            filled. New matches = Katie's team sources, the brand reviews on Day 11;
            From invites = one of the open invites takes it (src/invite/openSpot.js) */}
        {[9, 10, 11].includes(scene.day) && (
          <>
            <span className="cp-mode-sep" aria-hidden />
            <span className="cp-scrub-tag">OPEN SPOT</span>
            {OPEN_SPOT_CASES.map(([v, label]) => (
              <button key={v} type="button" className={openSpot() === v ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => { setOpenSpot(v); pulse(); }}>
                {label}
              </button>
            ))}
          </>
        )}
        {/* FLAG DEMO — steps every flagged asset through the resolution
            beats (Julia, Aug 18: fix agreed → resolved, no re-review; she
            publishes directly). Appears once something is flagged. */}
        {review === 'brand' && flagBeat(mode) !== null && (
          <>
            <span className="cp-mode-sep" aria-hidden />
            <span className="cp-scrub-tag">FLAG DEMO</span>
            {[['flagged', 'Flagged'], ['agreed', 'Fix agreed'], ['resolved', 'Resolved']].map(([beat, label]) => (
              <button
                key={beat}
                type="button"
                className={flagBeat(mode) === beat ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
                onClick={() => { setFlagBeat(mode, beat); pulse(); }}
              >
                {label}
              </button>
            ))}
          </>
        )}
      </div>}

      {cornerNode}
      {phase === 'sourcing' ? (
        <StayTuned />
      ) : phase === 'review' ? (
        <CreatorsFound count={poolTotal()} />
      ) : (
        <>
          <AmineProgress2 scene={scene} filter={stageFilter} onFilter={setStageFilter} />
          <div className={`cp-crew2 tf-noicons${tg.head === 'grey' ? ' tf-heads-grey' : ''}`} key={`b-${scene.day}`}>
            <div className="cp-crew-cols cp-crew-cols--left">
              <div className="cp-crew-left">
                <FixedTable
                  scene={scene}
                  rows={crewRows}
                  filter={stageFilter}
                  onFilter={setStageFilter}
                  openCrew={openCrew}
                  toggleCrew={toggleCrew}
                  opts={{ ...F_OPTS, ...tg, layout: tg.table }}
                  onReviewChange={pulse}
                />
              </div>

              <aside className="cp-tile-stack">
                {/* brand NPS ask, never a pop-up, never blocking. Cast set: top of
                    the rail. Close: after the recap card, so the wrap-up door (the
                    payoff) comes before the question */}
                {askNode && scene.nps !== 'close' && askNode}
                <AmineRail scene={scene} railVar="a" afterRecap={scene.nps === 'close' ? askNode : null} />
              </aside>
            </div>
          </div>
        </>
      )}

      {/* demo scrubber — presenter control, not product UI */}
      {!EMBED && <nav className="cp-scrubber" aria-label="Demo controls">
        <span className="cp-scrub-tag">PULSE DEMO</span>
        <button type="button" className="cp-scrub-arrow" disabled={at === 0} onClick={() => setIdx(at - 1)}>←</button>
        {days.map((d, i) => (
          <button type="button" key={d.day} className={i === at ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => setIdx(i)}>
            {i === at ? ((late && LATE.days[d.day]?.scrubLabel) || d.scrubLabel) : `D${d.day}`}
          </button>
        ))}
        <button type="button" className="cp-scrub-arrow" disabled={at === days.length - 1} onClick={() => setIdx(at + 1)}>→</button>
      </nav>}
    </div>
  );
}
