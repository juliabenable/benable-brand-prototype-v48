import { useEffect, useRef, useState } from 'react';
import '../../styles/nps.css';
import { nps, band } from './npsStore.js';
import { askFor, CLOSED_TITLE, CALL_ME, SAVED, OPTIONAL, SEND, DONE, reads, THANKS, receipt, CHANGE } from './npsCopy.js';
import { forks } from '../pulse/forks.js';

/*
 * The brand NPS ask, one component for all three moments (launch | cast | close).
 * Rules from the study (brand-nps-study/, rules of the field):
 *   - the whole 0 to 10 scale is visible at once, one joined neutral control, poles labeled
 *   - the FIRST tap banks the score; the note is optional; closing the card never loses a score
 *   - the follow-up wording changes with the band (0-6 / 7-8 / 9-10) and the moment
 *   - it never blocks the page and it can always be dismissed
 *   - once answered it folds down to ONE quiet line (with Change, and an X to tuck it away)
 * skin: 'nf'   = card on the new-chrome launch screen (Inter, 20px radius)
 *       'rail' = a rail card in the tracker (am-card anatomy, grey head strip, pill buttons)
 *       'page' = the login-free answer page behind the email twin (no dismiss: they came to answer)
 * `closedLate` = the campaign closed with someone still out: the head says closed, not complete.
 */
export default function NpsAsk({ moment, skin = 'rail', closedLate = false }) {
  const [, tick] = useState(0);
  useEffect(() => nps.sub(() => tick((t) => t + 1)), []);
  useEffect(() => forks.sub(() => tick((t) => t + 1)), []); // the QUESTION fork swaps the wording live
  const a = nps.get(moment);
  const copy = askFor(moment);
  const title = moment === 'close' && closedLate ? CLOSED_TITLE : copy.title;
  const [note, setNote] = useState(a?.comment || '');
  const [callMe, setCallMe] = useState(!!a?.callMe);
  /* roving focus for the radiogroup: arrows move focus only, Space / Enter picks */
  const [focusN, setFocusN] = useState(null);
  const scaleRef = useRef(null);

  /* Reset (or a fresh launch) clears the answer: the local draft goes with it */
  useEffect(() => {
    if (!a) { setNote(''); setCallMe(false); setFocusN(null); }
  }, [a]);

  if (a?.status === 'dismissed' || a?.hidden) return null;

  const pick = (n) => nps.score(moment, n, a?.via === 'email' ? 'email' : 'portal');

  const onScaleKey = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    /* the tracker's day scrubber listens for arrows on window: keep them here */
    e.preventDefault();
    e.stopPropagation();
    const cur = focusN ?? (Number.isInteger(a?.score) ? a.score : 0);
    let next = cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(10, cur + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, cur - 1);
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 10;
    setFocusN(next);
    scaleRef.current?.querySelectorAll('button')[next]?.focus();
  };

  const X = ({ label, onClick }) => (
    <button type="button" className="nps-x" aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 12 12" width="11" height="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
    </button>
  );

  /* answered: one quiet line */
  if (a?.status === 'sent') {
    const t = THANKS[band(a.score)];
    return (
      <section className={`nps nps--${skin} nps--done`} aria-label="Your answer">
        <p className="nps-receipt">
          <b>{t.head}</b>{' '}
          {a.callMe && t.bodyCall ? `${t.bodyCall} ` : ''}
          {receipt(a.score)}{' '}
          <button type="button" className="nps-link" onClick={() => nps.reopen(moment)}>{CHANGE}</button>
        </p>
        {skin !== 'page' && <X label="Hide" onClick={() => nps.hide(moment)} />}
      </section>
    );
  }

  const scored = a?.status === 'scored';
  const b = scored ? band(a.score) : null;
  const tabStop = focusN ?? (scored ? a.score : 0);

  return (
    <section className={`nps nps--${skin}${scored ? ' nps--scored' : ''}`} aria-label={title}>
      <div className="nps-head">
        <div className="nps-head-l">
          {/* on the launch screen the page itself already says "Your campaign is live" */}
          <p className="nps-title">{skin === 'nf' ? copy.lead : title}</p>
          {skin !== 'nf' && <p className="nps-sub">{copy.lead}</p>}
        </div>
        {skin !== 'page' && <X label={scored ? 'Close' : 'Dismiss this question'} onClick={() => nps.dismiss(moment)} />}
      </div>
      <div className="nps-body">
        <p className="nps-q" id={`nps-q-${moment}`}>{copy.q}</p>
        <div className="nps-scale" role="radiogroup" aria-labelledby={`nps-q-${moment}`} ref={scaleRef} onKeyDown={onScaleKey}>
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={scored && a.score === n}
              tabIndex={tabStop === n ? 0 : -1}
              className={scored && a.score === n ? 'nps-n nps-n--on' : 'nps-n'}
              onClick={() => { setFocusN(n); pick(n); }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="nps-poles">
          <span>{copy.poles[0]}</span>
          <span className="nps-saved" aria-live="polite">{scored ? SAVED : ''}</span>
          <span>{copy.poles[1]}</span>
        </div>

        {scored && (
          <div className="nps-follow">
            <label className="nps-follow-label" htmlFor={`nps-note-${moment}`}>{copy.follow[b]}</label>
            <textarea
              id={`nps-note-${moment}`}
              className="nps-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={OPTIONAL}
            />
            {b === 'detractor' && (
              <label className="nps-check">
                <input type="checkbox" checked={callMe} onChange={(e) => setCallMe(e.target.checked)} />
                <span>{CALL_ME}</span>
              </label>
            )}
            <div className="nps-actions">
              <span className="nps-reads">{reads(moment)}</span>
              {/* one adaptive pill: nothing typed = Done, something to send = Send */}
              <button
                type="button"
                className="nps-btn"
                onClick={() => nps.send(moment, { comment: note.trim(), callMe: b === 'detractor' && callMe })}
              >
                {note.trim() || (b === 'detractor' && callMe) ? SEND : DONE}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
