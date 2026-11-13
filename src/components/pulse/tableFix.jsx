import { useEffect, useReducer, useState } from 'react';
import { crewFor, PHOTOS, TIMELINES, CASTING_TIMELINE, STAGE_LABELS, SPOTS, LOCAL, NEXT_HINTS, DECLINED } from './pulseData.js';
import { stageOf, isWrapDay, stagesFor, AM_FILTER_LABEL, ActionModal } from './amine.jsx';
import { reviewAutoOpenDue, dismissReviewAutoOpen, firstPendingCreator, assetsOf, isReviewRow, reviewRowFace, reviewNeeds, rowReviewState } from './review.jsx';
import { ReviewModal } from './reviewModal.jsx';
import LiveStatus from './LiveStatus.jsx';
import InviteFold from '../../invite/InviteFold.jsx';

/* F · Table fixes — the creators-table study's picks, worn together
   (creators-table-study/, Jul 28) + Julia's Jul 28 review round:
   1C header status light KEPT · 2A ⓘ chip REJECTED → edu variants B/C/D/E
   (footnote / system row / Katie rail note / coach mark, F-options switcher) ·
   stage = rail chips (3B) or ramp dot + word (3A) · actions = amber row
   anatomy (4A) or grouped bands (4D) · thanks = a NORMAL button (postcard
   rejected) · late campaign = quiet done rows (7A) or split sections (7B),
   wrap roster (7C) on day 30. The A table (AmineTable) stays untouched. */

const B = import.meta.env.BASE_URL;
const ICO = {
  group: `${B}labs/group.svg`,
  check: `${B}labs/check-circle.svg`,
  chevron: `${B}labs/chevron.svg`,
};

/* stage chip fills = the rail's exact ramp (AM2_RAIL fills, amine.jsx) */
const CHIP_FILLS = [
  { bg: '#b9dfcb', ink: '#06301f' },
  { bg: '#8fceae', ink: '#06301f' },
  { bg: '#5fb98c', ink: '#06301f' },
  { bg: '#30aa70', ink: '#ffffff' },
  { bg: '#17864f', ink: '#ffffff' },
  { bg: '#1a6f4c', ink: '#ffffff' },
  { bg: '#124a33', ink: '#ffffff' },
];

const needsAction = (c, mode) => (c.mystery && c.found) || (!c.mystery && !!c.action) || reviewNeeds(c, mode);

/* "thank-you sent 💌" moved into the stamp — strip it from the status line */
const cleanStatus = (status) => ({
  ...status,
  phrases: status.phrases.map((p) => p.replace(/\s*·\s*thank-you sent 💌\s*$/, '')),
});

/* one-time demo dismissals survive captured-DOM remounts */
let sysRowDismissed = false;
let coachDismissed = false;

/* the spots rule, one sentence — shared by every edu variant */
const SPOTS_RULE = `First ${SPOTS} to reply take the spots — extras are saved for your next campaign.`;

export default function FixedTable({ scene, rows: rowsIn, filter, onFilter, openCrew, toggleCrew, opts = {}, onReviewChange }) {
  const { edu = 'b', stage = 'chips', act = 'rows', late = 'quiet', head = 'grey', ship = 'band', btn = 'amber', layout = 'f', ring = 'solid' } = opts;
  const split = layout === 'g' || layout === 'h'; // G/H · dedicated status + action columns
  const swapCols = layout === 'h'; // H · action column before status column
  const ghostBtns = layout === 'i' || layout === 'j' || layout === 'k'; // I/J/K · no action column — the ghost button replaces the status dot
  const flushDot = layout === 'j' || layout === 'k'; // J/K · the button's dot aligns with the status dots around it
  const bandInHead = layout === 'k'; // K · the moment band's message lives in the header (rows carry Say thanks)
  const purpleBtns = btn === 'purple';
  const [, bump] = useReducer((n) => n + 1, 0);
  const crewAll = crewFor(scene.day, scene.mode);
  /* folded rows (closed campaign, still following up) leave the main list */
  const rows = rowsIn.filter((c) => !c.folded);
  const cohort = crewAll.length;
  const filtered = filter != null;
  /* a stage filter that lands on a folded creator opens the fold instead of
     claiming the stage is empty (the rail still counts her) */
  const foldHit = filtered && rowsIn.some((c) => c.folded);
  const stages = stagesFor(scene.mode);
  const [modal, setModal] = useState(null);
  const [sheetDone, setSheetDone] = useState(false);
  /* declined-invites fold (Katie's switch) — collapsed by default */
  const [declOpen, setDeclOpen] = useState(false);
  /* still-following-up fold (the straggler close, Sep 21) — collapsed by default */
  const [foldOpen, setFoldOpen] = useState(false);
  /* arrival with posts waiting opens the review DIRECTLY (Julia, Aug 21 —
     the "N posts are ready" pop-up is gone); once per session, never in
     the gallery's embed frames */
  useEffect(() => {
    if (reviewAutoOpenDue(scene, crewAll)) {
      const name = firstPendingCreator(scene, crewAll);
      if (name) { dismissReviewAutoOpen(); setModal({ kind: 'review', name }); }
    }
  }, [scene.day, scene.mode, scene.review]); // eslint-disable-line react-hooks/exhaustive-deps
  /* warm the review posters + the stage gradient from the dashboard so the
     modal opens with everything already painted (Julia: no loading feel) */
  useEffect(() => {
    let any = false;
    crewAll.forEach((c) => {
      if (!c.mystery && c.draftIn) assetsOf(c, scene.mode).forEach((a) => {
        any = true;
        if (a.poster) { const i = new Image(); i.src = a.poster; }
      });
    });
    if (any) { const g = new Image(); g.src = `${B}review/assets/modal/gradient-bg.webp`; }
  }, [scene.day, scene.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const inviting = crewAll.some((c) => !c.mystery && c.stage === 0 && !c.found);
  const shipDay = scene.fulfill !== 'shopify' && crewAll.some((c) => c.ship); // Shopify auto-fulfillment: no brand shipping ever
  const wrapped = isWrapDay(scene.day);
  /* STRAGGLERS · One late (Sep 21): a `late` row never wears the wrap; once
     the campaign is closed (day 37) it folds under "Still following up" so it
     no longer holds the campaign open. `rows` below = the unfolded ones. */
  const lateAll = crewAll.filter((c) => c.late);
  const foldRows = crewAll.filter((c) => c.folded);
  const postedN = crewAll.filter((c) => !c.mystery && !c.late).length;
  const isLive = (c) => !c.mystery && !wrapped && stageOf(c, scene.day, scene.mode) === 5;
  /* thanks is a gift, not a task — it never counts into the amber light */
  const isAmber = (c) => needsAction(c, scene.mode) && !isLive(c);
  const liveAll = crewAll.filter(isLive);
  const liveNames = liveAll.map((c) => c.name);
  /* >3 names would overflow the header — truncate to "Nia, Sofia and 3 more" */
  const liveLabel = liveNames.length > 3
    ? `${liveNames.slice(0, 2).join(', ')} and ${liveNames.length - 2} more`
    : liveNames.length > 1
      ? `${liveNames.slice(0, -1).join(', ')} and ${liveNames[liveNames.length - 1]}`
      : liveNames[0];
  const needs = crewAll.filter(isAmber).length;
  const coaching = edu === 'e' && inviting && !coachDismissed;

  /* §1 · the subtitle is the table's status light (1C — kept, Julia Jul 28) */
  const sub = coaching ? (
    <span className="am-card-sub" style={{ color: '#1c1c1c', fontWeight: 500 }}>
      {cohort} invited · <b>0 of {SPOTS} spots</b> filled
    </span>
  ) : filtered ? (
    <span className="am-card-sub">{rowsIn.length} of {cohort} · {AM_FILTER_LABEL(filter, scene.mode)}</span>
  ) : needs > 0 ? (
    <span className="am-card-sub tf-sub--amber"><i className="tf-dot" style={{ background: '#f0a32e' }} />{needs} waiting on you</span>
  ) : inviting ? (
    /* invite days: the spots concept, still behind the status light (Julia, Jul 28) */
    <span className="am-card-sub"><i className="tf-dot" style={{ background: '#2baf87' }} />
      {crewAll.filter((c) => !c.mystery).length} invited · <b className="tf-sub-b">{crewAll.filter((c) => !c.mystery && c.stage > 0).length} of {SPOTS} spots</b>&nbsp;filled
      {/* the spots rule lives in a light tooltip, not in the chrome (Julia, Jul 28) */}
      <span className="tf-inf" tabIndex={0} aria-label={SPOTS_RULE}>ⓘ
        <span className="tf-tip" role="tooltip">{SPOTS_RULE}</span>
      </span>
    </span>
  ) : liveAll.length && bandInHead && !wrapped ? (
    /* pending thank-yous show the amber light too — consistent with the
       tracker badge (Julia, Jul 29) */
    <span className="am-card-sub"><i className="tf-dot" style={{ background: '#f0a32e' }} />
      {liveLabel} went live 🎉 — send your thank-yous now
    </span>
  ) : (
    <span className="am-card-sub"><i className="tf-dot" style={{ background: '#2baf87' }} />
      {wrapped && scene.closed && lateAll.length ? 'Nothing left to do. Your campaign is closed'
        : wrapped && lateAll.length ? `Nothing needs you. Katie’s team is following up with ${lateAll.map((c) => c.name).join(' and ')}`
        : wrapped ? 'Nothing left to do — campaign wrapped'
        : liveAll.length ? `Nothing needs you — ${liveAll.length} live this week`
        : 'Nothing needs you — everyone’s moving'}
    </span>
  );

  const downloadOrders = () => {
    const named = crewAll.filter((c) => !c.mystery);
    const csv = [
      'Creator,Handle,Product,Shipping status',
      ...named.map((c) => [c.name, c.handle, c.product || '—', c.ship ? 'needs shipping' : 'shipped'].join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'benable-orders.csv' });
    a.click();
    URL.revokeObjectURL(url);
    setSheetDone(true);
  };

  /* the ship flow's pieces, shared by the band and the in-header placement */
  /* the ship flow only surfaces when the visible rows actually hold the
     orders — "See all" or the needs/Accepted focus, never e.g. Sourcing
     (Julia, Jul 28) */
  const shipVisible = shipDay && rows.some((c) => c.ship);
  const shipInHead = shipVisible && ship === 'head';
  /* two steps — three wrapped on smaller screens (Julia, Jul 29). The shape
     NEVER changes: downloading just ticks step ① and hands "now" to step ② */
  const stepsSeq = (
    <>
      <span className={`tf-step ${sheetDone ? 'tf-step--done' : 'tf-step--now'}`}><i className="tf-sn">{sheetDone ? '✓' : '1'}</i>Download the order sheet</span>
      <span className="tf-arrow" aria-hidden>→</span>
      <span className={`tf-step${sheetDone ? ' tf-step--now' : ''}`}><i className="tf-sn">2</i>Ship, then add tracking below</span>
    </>
  );
  /* the button never changes after the download — the steps tick, it stays put (Julia, Jul 28) */
  const dlBtn = (label) => (
    <button type="button" className="tf-dl" onClick={downloadOrders}>
      <svg aria-hidden width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M8 2.5v7m0 0 3-3m-3 3-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 13.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  );

  /* ---- one row ---------------------------------------------------------- */
  const renderRow = (c, i, { calm = false } = {}) => {
    const rowKey = `${scene.day}-${c.name}-${i}`;
    const open = openCrew.has(rowKey);
    /* local collabs get visit histories, never product ones (Steph call, Jul 28) */
    const timeline = c.mystery ? CASTING_TIMELINE
      : (scene.mode === 'local' && LOCAL.timelines[c.name]) || TIMELINES[c.name] || [];
    const reached = c.mystery ? -1 : stageOf(c, scene.day, scene.mode);
    const foundRow = c.mystery && c.found;
    /* the wrap is per row: a late creator keeps her real stage and face */
    const wrappedRow = wrapped && !c.late;
    const live = isLive(c);
    /* §4 · amber = the ball is in your court; in 4D group mode the band
       carries the color and rows stay calm (gold text + pill only) */
    const amber = isAmber(c);
    /* brand-review rows derive their whole face (status/action) from the
       asset states — the base row data stays Katie-flavored (study @4218) */
    const face = isReviewRow(c) && !c.mystery ? reviewRowFace(c, scene.mode) : null;
    const actModal = face?.cta
      ? { kind: 'review', name: c.name }
      : c.ship
        ? { kind: 'ship', name: c.name }
        : c.confirmEmail
          ? { kind: 'visit', name: c.name }
          : null;
    /* honest buttons age better: the ship modal asks for tracking (amber mode);
       the purple set mirrors Julia's mock verbatim, incl. "Mark shipped" */
    const cta = foundRow ? 'Review matches' : face?.cta ? face.cta : c.ship ? (purpleBtns ? 'Mark shipped' : 'Ship and add tracking') : c.confirmEmail ? 'Confirm visit' : c.action?.cta;
    const actBtnClass = purpleBtns
      ? `tf-pbtn${foundRow ? ' tf-pbtn--primary' : ''}`
      : 'tf-abtn';
    /* live rows stay calm too — no warm wash (Julia, Jul 28) */
    const rowClass = `am-row tf-row${split ? ' tf-row--split' : ''}${amber && !calm ? ' tf-needs' : ''}${wrappedRow ? ' tf-done tf-wraprow' : ''}`;

    /* G · status cell: always the ramp dot + stage word; the dot flips amber
       when the row waits on the brand (Julia's mock) */
    const statusCell = c.mystery && !foundRow ? (
      <span className="tf-gdot"><i style={{ background: '#d5d8d5' }} />Sourcing…</span>
    ) : foundRow ? (
      <span className="tf-gdot"><i style={{ background: '#f0a32e' }} />Match found</span>
    ) : (
      <span className="tf-statcell">
        {/* plain text — filtering lives on the tracker, not here (Julia, Jul 28) */}
        <span className="tf-gdot">
          {/* needs-you rows: the status dot goes amber too (Julia, Jul 28) */}
          <i style={{ background: amber ? '#f0a32e' : CHIP_FILLS[reached].bg }} />
          {/* resolved flags wear their own word — the rail keeps its stages (Julia) */}
          {wrappedRow ? 'Thanked' : face && rowReviewState(c, scene.mode) === 'resolved' ? 'Draft Issue Resolved' : stages[reached].label}
        </span>
      </span>
    );

    /* G · action cell: the button lives here (ghost, per the mock) or a quiet — */
    const actionCell = amber ? (
      <button
        type="button"
        className={`tf-gbtn${shipDay && c.ship && !sheetDone ? ' tf-abtn--waiting' : ''}`}
        onClick={(e) => { e.stopPropagation(); if (actModal) setModal(actModal); }}
      >
        <i className="tf-btndot" aria-hidden />{cta}
      </button>
    ) : live ? (
      <button type="button" className="tf-gbtn" onClick={(e) => e.stopPropagation()}>Say thanks</button>
    ) : wrappedRow && !c.mystery ? (
      <span className="tf-stamp">💌 Sent</span>
    ) : (
      <span className="tf-noact" aria-hidden>—</span>
    );

    return (
      <div key={rowKey} className="am-item">
        <div
          role="button"
          tabIndex={foundRow ? undefined : 0}
          className={rowClass}
          onClick={foundRow ? undefined : () => toggleCrew(rowKey)}
          onKeyDown={foundRow ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCrew(rowKey); } }}
          aria-expanded={foundRow ? undefined : open}
        >
          <span className="am-who">
            {foundRow ? (
              <span className="am-avatar am-avatar--blur"><img src={PHOTOS.Amara} alt="" /></span>
            ) : !c.mystery && PHOTOS[c.name] ? (
              <span className={wrappedRow ? `tf-ring tf-ring--${ring}` : undefined}><span className="am-avatar"><img src={PHOTOS[c.name]} alt="" /></span></span>
            ) : (
              <span className="am-avatar am-avatar--mystery">?</span>
            )}
            <span className="am-names">
              <span className="am-name">
                {foundRow ? c.name : c.mystery ? 'Sourcing' : c.name}
                {!c.mystery && <img src={ICO.check} alt="Verified" className="am-verified" />}
              </span>
              <span className="am-handle">{foundRow ? 'To fill your campaign' : c.mystery ? 'New creators for your campaign' : c.handle}</span>
            </span>
          </span>

          {/* the update line says why; the flag glyph retired — the edge is the flag */}
          <span className={`am-update${amber ? ' tf-uamber' : ''}`}>
            <LiveStatus status={face ? { type: 'static', phrases: [face.status] } : wrappedRow ? cleanStatus(c.status) : c.status} />
            {/* wrap day: the post link rides with the update text; plural when
                she has several posts — still ONE link, landing on all of them */}
            {wrappedRow && !c.mystery && (
              <a className="tf-rowlink" href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                See her {(c.posts || 1) > 1 ? 'posts' : 'post'} <span aria-hidden>↗</span>
              </a>
            )}
          </span>

          {/* §3/§4/§5 · the stage slot: chip or dot, amber pill, or thanks */}
          {split ? (
            swapCols ? (
              <>
                <span className="tf-actcell">{actionCell}</span>
                <span className="tf-chipslot">{statusCell}</span>
              </>
            ) : (
              <>
                <span className="tf-chipslot">{statusCell}</span>
                <span className="tf-actcell">{actionCell}</span>
              </>
            )
          ) : amber ? (
            <span className="am-row-cta-slot">
              <button
                type="button"
                className={`${ghostBtns ? 'tf-gbtn' : actBtnClass}${flushDot ? ' tf-gbtn--flush' : ''}${shipDay && c.ship && !sheetDone ? ' tf-abtn--waiting' : ''}`}
                onClick={(e) => { e.stopPropagation(); if (actModal) setModal(actModal); }}
              >
                {ghostBtns && <i className="tf-btndot" aria-hidden />}{cta}
              </button>
            </span>
          ) : live ? (
            /* thanks reverted to a normal button (postcard retired, Julia Jul 28) */
            <span className="am-row-cta-slot">
              {purpleBtns ? (
                <button type="button" className="tf-pbtn tf-pbtn--love" onClick={(e) => e.stopPropagation()}><i aria-hidden>♡</i> Say thanks</button>
              ) : ghostBtns ? (
                /* thanks wears a quiet heart on the dot axis (Julia, Jul 28) */
                <button type="button" className={`tf-gbtn${flushDot ? ' tf-gbtn--flush tf-gbtn--thanks' : ''}`} onClick={(e) => e.stopPropagation()}>
                  <i className="tf-btnheart" aria-hidden>♥</i>Say thanks
                </button>
              ) : (
                <button type="button" className="tf-abtn" onClick={(e) => e.stopPropagation()}>Say thanks</button>
              )}
            </span>
          ) : (
            <span className="tf-chipslot">
              {c.mystery ? (
                stage === 'dots'
                  ? <span className="tf-gdot"><i style={{ background: '#d5d8d5' }} />Sourcing…</span>
                  : <span className="tf-chip" style={{ background: '#f1f1f1', color: '#8a8a8a' }}>Sourcing…</span>
              ) : stage === 'dots' ? (
                /* plain text — filtering lives on the tracker (Julia, Jul 28) */
                <span className="tf-gdot">
                  <i style={{ background: CHIP_FILLS[reached].bg }} />
                  {wrappedRow ? 'Thanked' : face && rowReviewState(c, scene.mode) === 'resolved' ? 'Draft Issue Resolved' : stages[reached].label}
                </span>
              ) : (
                <span className="tf-chip" style={{ background: CHIP_FILLS[reached].bg, color: CHIP_FILLS[reached].ink }}>
                  {wrappedRow ? 'Thanked' : stages[reached].label}
                </span>
              )}
            </span>
          )}

          <span className="am-chev">
            {!foundRow && <img src={ICO.chevron} alt="" style={{ rotate: open ? '270deg' : '90deg' }} />}
          </span>
        </div>
        {/* drawer stays mounted; a grid-rows transition animates open AND
            close so nothing snaps or shifts (Julia, Jul 28) */}
        <div className={`tf-drawer${open ? ' tf-drawer--open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
          <div className="tf-drawer-in">
          <div className="am-hist">
            <p className="am-hist-title">Stage history</p>
            <div className="cp-crew-history am-hist-body">
              {/* the drawer mirrors the tracker's 7 stages — Thanked included */}
              {(c.mystery ? timeline : [...timeline, { detail: 'Thank-you sent 💌' }]).map((st, si) => {
                const state = c.mystery
                  ? (st.live ? 'now' : st.when ? 'done' : 'next')
                  : wrappedRow ? 'done'
                  : si < reached ? 'done' : si === reached ? 'now' : 'next';
                return (
                  <div key={si} className={`cp-hist-step cp-hist-step--${state}`} style={{ animationDelay: `${0.05 * si}s` }}>
                    <span className="cp-hist-dot">{state === 'done' ? '✓' : ''}</span>
                    <div className="cp-hist-body">
                      <div className="cp-hist-top">
                        {/* history speaks the tracker's stage names — except the
                            finale, which gets its exclamation (Julia, Jul 28) */}
                        <span className="cp-hist-label">{c.mystery ? st.label : si === 6 ? 'Thanked' : si === 5 ? 'Live!' : si === 4 && face && rowReviewState(c, scene.mode) === 'resolved' ? 'Draft Issue Resolved' : stages[si].label}</span>
                        <span className="cp-hist-when">{state === 'done' ? (st.when || 'done') : state === 'now' ? 'right now' : 'up next'}</span>
                      </div>
                      {/* future steps only say what's PLANNED — never a past
                          fact we couldn't know yet (Julia, Jul 28) */}
                      {/* detail = a fact that stays true forever; `now` carries the
                          forward-looking flavor and only shows while current
                          (Julia, Jul 28 — no "shoot confirmed" on passed steps) */}
                      <div className="cp-hist-detail">
                        {/* brand-review rows own stage 4 — the drawer says so
                           instead of the Katie-checks line (Julia, Aug 10);
                           flagged rows tell the resolution story (Aug 18) */}
                        {face && si === 4
                          ? (state === 'next'
                              ? (rowReviewState(c, scene.mode) === 'changes'
                                  ? (assetsOf(c, scene.mode).some((a) => a.state === 'changes' && a.fix === 'agreed')
                                      ? 'Feedback sent — she updates it, then posts'
                                      : 'We’re resolving your flag — then she posts')
                                  : 'Your review — then she posts')
                              : (rowReviewState(c, scene.mode) === 'resolved'
                                  ? 'Issue resolved with Katie’s team ✓'
                                  : 'Approved by you ✓'))
                          : state === 'next' && !c.mystery
                            /* a late creator's next step says who has the ball, never a stale due date */
                            ? (c.late && si === reached + 1 ? 'Katie’s team is following up' : (st.next || NEXT_HINTS[scene.mode === 'local' ? 'local' : 'product'][si]))
                            : state === 'now'
                              ? ((!c.late && st.now) || st.detail)
                              : st.detail}
                      </div>
                      {/* once she's live, the step links to the post itself */}
                      {!c.mystery && si === 5 && state !== 'next' && (
                        <a className="tf-histlink" href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          See the live {(c.posts || 1) > 1 ? 'posts' : 'post'} <span aria-hidden>↗</span>
                        </a>
                      )}
                      {state === 'now' && (
                        <div className="cp-hist-live">
                          <LiveStatus status={face ? { type: 'static', phrases: [face.status] } : c.status} />
                          {/* decided rows drop the row CTA (Julia, Aug 17) — the
                              drawer keeps a quiet door back into what was sent */}
                          {face && assetsOf(c, scene.mode).some((a) => a.state) && (
                            <a
                              className="tf-histlink tf-sentlink"
                              href="#"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModal({ kind: 'review', name: c.name }); }}
                            >
                              See what you sent <span aria-hidden>↗</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---- section plan: 4D action group · 7B late split ---------------------
     rows arrive pre-sorted (action items first); segments re-cut them. */
  const needsRows = rows.filter(isAmber);
  const liveRows = rows.filter(isLive);
  const restRows = rows.filter((c) => !isAmber(c) && !isLive(c));
  const actGroup = act === 'group' && needsRows.length > 0 && !wrapped && !filtered;
  const lateGroups = late === 'groups' && liveRows.length > 0 && !wrapped && !filtered;
  const grouped = actGroup || lateGroups;

  return (
    <section className="am-card am-table tf-table" aria-label="Creators">
      <div className={`am-card-head tf-head${head === 'white' ? ' tf-head--white' : ''}`}>
        <div className="am-head-l rel-anchor">
          <span className="amsym am-symtile"><img src={ICO.group} alt="" /></span>
          <div style={{ position: 'relative' }}>
            <p className="am-card-title">Creators</p>
            {sub}
            {/* 2E · coach mark — shown once, then never again */}
            {coaching && (
              <div className="tf-coach" role="dialog" aria-label="How spots work">
                <b>Spots fill in reply order.</b> {SPOTS_RULE}
                <button type="button" className="tf-coach-got" onClick={() => { coachDismissed = true; bump(); }}>Got it</button>
              </div>
            )}
          </div>
        </div>
        {/* SHIP Header — the flow lives inside the header (Julia's mock, Jul 28) */}
        {shipInHead && <div className="tf-steps-h">{stepsSeq}</div>}
        <div className="am-head-r">
          {/* face stack removed from the header (Julia, Jul 29) */}
          {shipInHead && dlBtn('Download orders')}
          {filtered && (
            <button type="button" className="am-showall" onClick={() => onFilter(null)}>
              Show all <span aria-hidden>✕</span>
            </button>
          )}
        </div>
      </div>

      {/* §6 · the shipping flow reads as a flow — download is step one */}
      {shipVisible && !shipInHead && (
        <div className="tf-steps">
          <div className="tf-steps-l">{stepsSeq}</div>
          {dlBtn('Download order sheet')}
        </div>
      )}

      {/* §5 · the moment band — celebration (and its education) above the rows */}
      {liveAll.length > 0 && !wrapped && !bandInHead && (
        <div className="tf-band">
          <span className="tf-faces">
            {liveAll.map((c) => <img key={c.name} src={PHOTOS[c.name]} alt="" />)}
          </span>
          <span className="tf-band-txt">
            <b>{liveLabel} went live 🎉</b> — this is when a thank-you lands the deepest. Creators who feel the love post again.
          </span>
          {purpleBtns ? (
            <button type="button" className="tf-pbtn tf-pbtn--love tf-band-cta"><i aria-hidden>♡</i> Send yours</button>
          ) : (
            <button type="button" className="tf-abtn tf-band-cta">Send yours</button>
          )}
        </div>
      )}

      {/* §7 · wrap day — the table becomes a trophy shelf (7C) */}
      {wrapped && (lateAll.length === 0 || scene.closed) && (
        <div className="tf-wrapband">
          {lateAll.length === 0 && <span className="tf-wrap-emoji" aria-hidden>🎉</span>}
          <div>
            <p className="tf-wrap-big">{lateAll.length ? `${postedN} creators posted, and every one is thanked` : `All ${cohort} live — every thank-you sent`}</p>
            <p className="tf-wrap-sub">{lateAll.length ? 'Your wrap-up is ready' : 'Wrapped 37 days ahead of average · your wrap-up is ready'}</p>
          </div>
          {/* the wrap deserves a door, not just a sentence (Julia, Jul 28) */}
          <button type="button" className="tf-wrapbtn">🎁 See your wrap-up</button>
        </div>
      )}

      {/* no column strip in F — the header + rows carry the reading (Julia, Jul 28:
          "double header" once the status-light sub landed) */}

      {/* 2C · the system row — education as a dismissable row, speaking table */}
      {edu === 'c' && inviting && !sysRowDismissed && (
        <div className="tf-sysrow">
          <span aria-hidden>🎟️</span>
          <span><b>{SPOTS} spots, first come first matched</b> — {SPOTS_RULE.replace(/^First/, 'the first').replace(' take the spots', ' are in').replace('.', '.')}</span>
          <button type="button" className="tf-sysrow-x" aria-label="Dismiss" onClick={() => { sysRowDismissed = true; bump(); }}>✕</button>
        </div>
      )}

      {rows.length === 0 && foldHit ? null : rows.length === 0 ? (
        <div className="am-empty">
          <p className="am-empty-title">Nobody is in {AM_FILTER_LABEL(filter, scene.mode) ?? 'this filter'} right now</p>
          <p className="am-empty-sub">The stage is empty at the moment. Clear the filter to see the rest of the cohort.</p>
          <button type="button" className="am-showall am-empty-btn" onClick={() => onFilter(null)}>
            Show all creators
          </button>
        </div>
      ) : !grouped ? (
        /* ACTIONS Calm (4C): gold text + pill only — no row wash, no edge */
        rows.map((c, i) => renderRow(c, i, { calm: act === 'calm' }))
      ) : (
        <>
          {actGroup ? (
            <>
              <div className="tf-ghead tf-ghead--amber"><span className="tf-gn">{needsRows.length}</span>Waiting on you</div>
              {needsRows.map((c, i) => renderRow(c, `n${i}`, { calm: true }))}
            </>
          ) : (
            needsRows.map((c, i) => renderRow(c, `n${i}`, { calm: act === 'calm' }))
          )}
          {lateGroups ? (
            <>
              {restRows.length > 0 && (
                <>
                  <div className="tf-ghead"><span className="tf-gn tf-gn--grey">{restRows.length}</span>Still in motion</div>
                  {restRows.map((c, i) => renderRow(c, `r${i}`))}
                </>
              )}
              <div className="tf-ghead tf-ghead--green"><span className="tf-gn tf-gn--green">{liveRows.length}</span>Live this week 🎉</div>
              {liveRows.map((c, i) => renderRow(c, `l${i}`))}
            </>
          ) : (
            <>
              {actGroup && (liveRows.length + restRows.length) > 0 && (
                <div className="tf-ghead tf-ghead--green"><span className="tf-gn tf-gn--green">{liveRows.length + restRows.length}</span>Moving on their own</div>
              )}
              {[...liveRows, ...restRows].map((c, i) => renderRow(c, `m${i}`))}
            </>
          )}
        </>
      )}

      {/* ---- declined invites (Aug 11, Julia) — the quiet fold at the table's
           bottom, rendered ONLY when Katie's per-brand switch is on. Same
           spirit as the portal's "not a good fit" line, in tracker language:
           who + when, never why; every entry reads as motion. */}
      {scene.showDeclined && !filtered && (DECLINED[scene.mode] ?? []).length > 0 && (
        <>
          <button type="button" className="tf-declline" aria-expanded={declOpen} onClick={() => setDeclOpen(!declOpen)}>
            <span>{(DECLINED[scene.mode]).length} creator{(DECLINED[scene.mode]).length > 1 ? 's' : ''} declined</span>
            <span className={`tf-declchev${declOpen ? ' tf-declchev--open' : ''}`} aria-hidden>▾</span>
          </button>
          <div className={`tf-drawer${declOpen ? ' tf-drawer--open' : ''}`} aria-hidden={!declOpen} inert={declOpen ? undefined : ''}>
            <div className="tf-drawer-in">
              {(DECLINED[scene.mode]).map((d) => (
                <div key={d.handle} className="am-row tf-row tf-declrow">
                  <span className="am-who">
                    <span className="am-avatar tf-declava"><img src={PHOTOS[d.photo]} alt="" /></span>
                    <span className="am-names">
                      <span className="am-name">{d.name}</span>
                      <span className="am-handle">{d.handle}</span>
                    </span>
                  </span>
                  <span className="am-update" aria-hidden />
                  <span className="tf-chipslot"><span className="tf-gdot"><i style={{ background: '#d5d8d5' }} />Declined {d.when}</span></span>
                  <span aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ---- still following up (Sep 21, the straggler close): once the campaign
           is closed, a creator who has not posted folds here. Same quiet fold as
           declined invites: who, never why; the campaign is closed either way. */}
      {foldRows.length > 0 && (!filtered || foldHit) && (
        <>
          <button type="button" className="tf-declline" aria-expanded={foldOpen || foldHit} onClick={() => setFoldOpen(!foldOpen)}>
            <span>Katie’s team is still following up with {foldRows.length} creator{foldRows.length > 1 ? 's' : ''}</span>
            <span className={`tf-declchev${foldOpen || foldHit ? ' tf-declchev--open' : ''}`} aria-hidden>▾</span>
          </button>
          <div className={`tf-drawer${foldOpen || foldHit ? ' tf-drawer--open' : ''}`} aria-hidden={!(foldOpen || foldHit)} inert={foldOpen || foldHit ? undefined : ''}>
            <div className="tf-drawer-in">
              {foldRows.map((d) => (
                <div key={d.handle} className="am-row tf-row tf-declrow">
                  <span className="am-who">
                    {/* still being worked with, so not the declined-invite ghosting */}
                    <span className="am-avatar tf-foldava"><img src={PHOTOS[d.name]} alt="" /></span>
                    <span className="am-names">
                      <span className="am-name">{d.name}</span>
                      <span className="am-handle">{d.handle}</span>
                    </span>
                  </span>
                  <span className="am-update">If {d.name} posts, it lands in your Content tab and we will email you</span>
                  <span className="tf-chipslot"><span className="tf-gdot"><i style={{ background: '#d5d8d5' }} />Not posted</span></span>
                  <span aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* the other invites, under one line (Julia, Oct 22): waiting on a reply, or closed once the spots fill */}
      <InviteFold scene={scene} filtered={filtered} />

      {modal?.kind === 'review' ? (
        <ReviewModal scene={scene} rows={crewAll} initial={modal.name} onClose={() => setModal(null)} onDecide={() => { bump(); onReviewChange?.(); }} />
      ) : modal ? (
        <ActionModal act={modal} onClose={() => setModal(null)} />
      ) : null}

    </section>
  );
}

/* 2D · Katie says it — education in the voice that already teaches.
   Rendered by the rail (CampaignPulse passes it) so the table stays clean. */
export function KatieSpotsNote() {
  return (
    <section className="am-card tf-katie">
      <span className="tf-katie-face" aria-hidden>K</span>
      <div>
        <p className="tf-katie-note">
          Your {SPOTS} invites are out! First {SPOTS} to say yes are in — if more reply, we save them for your next round. Good problem to have 😉
        </p>
        <p className="tf-katie-sig">Katie · for your Benable team</p>
      </div>
    </section>
  );
}
