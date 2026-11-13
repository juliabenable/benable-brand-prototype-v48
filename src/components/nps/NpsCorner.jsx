import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/nps.css';
import { nps } from './npsStore.js';
import { askFor } from './npsCopy.js';
import { forks } from '../pulse/forks.js';

/*
 * The corner slide-up: range option 3 in the study, reproduced from Airtable's
 * own in-app NPS (Julia's screenshots, Sep 24 2026). Same anatomy and flow on
 * purpose, so the two surfaces can be compared side by side with the card:
 *   - bottom-right card that slides up over the page, X top right
 *   - eleven SEPARATE chips with gaps (the card uses one joined control)
 *   - the number is NOT banked on the tap: Submit is a second click
 *   - one generic follow-up for every score ("What's the main reason for your
 *     score?"), where the card's follow-up changes with the band
 *   - Send Feedback, then a thanks line that tucks itself away
 * Portaled to body: .nf is a fixed z-index:10 stacking context, and the
 * tracker column hides anything mounted next to its host.
 * Airtable's primary is black; this keeps the portal's purple. Everything else
 * follows the screenshots.
 */
export default function NpsCorner({ moment, closedLate = false }) {
  const [, tick] = useState(0);
  useEffect(() => nps.sub(() => tick((t) => t + 1)), []);
  useEffect(() => forks.sub(() => tick((t) => t + 1)), []);
  const a = nps.get(moment);
  const copy = askFor(moment);
  const [picked, setPicked] = useState(null);
  const [note, setNote] = useState('');
  const [thanks, setThanks] = useState(false);

  /* Airtable's card arrives a beat after the page, not with it */
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 700); return () => clearTimeout(t); }, []);

  /* after Send Feedback the thanks line stays 2.5s, then the card goes */
  useEffect(() => {
    if (!thanks) return undefined;
    const t = setTimeout(() => { setThanks(false); nps.hide(moment); }, 2500);
    return () => clearTimeout(t);
  }, [thanks, moment]);

  if (!shown) return null;
  if (!thanks && (a?.status === 'dismissed' || a?.hidden || a?.status === 'sent')) return null;

  const step = thanks ? 'thanks' : a?.status === 'scored' ? 'why' : 'ask';
  const title = moment === 'close' && closedLate ? 'closed' : null;

  const X = ({ onClick }) => (
    <button type="button" className="npc-x" aria-label="Close" onClick={onClick}>
      <svg viewBox="0 0 12 12" width="11" height="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
    </button>
  );

  const body = step === 'ask' ? (
    <>
      <X onClick={() => nps.dismiss(moment)} />
      <p className="npc-q"><span aria-hidden>👋</span> Hi! {copy.q}</p>
      <div className="npc-scale" role="radiogroup" aria-label={copy.q}>
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} type="button" role="radio" aria-checked={picked === n} className={picked === n ? 'npc-n npc-n--on' : 'npc-n'} onClick={() => setPicked(n)}>{n}</button>
        ))}
      </div>
      <div className="npc-poles"><span>{copy.poles[0]}</span><span>{copy.poles[1]}</span></div>
      <div className="npc-foot">
        <button type="button" className="npc-btn" disabled={picked === null} onClick={() => nps.score(moment, picked, 'portal')}>Submit</button>
      </div>
    </>
  ) : step === 'why' ? (
    <>
      <X onClick={() => nps.send(moment, { comment: note.trim() })} />
      <p className="npc-q">What’s the main reason for your score?</p>
      <p className="npc-sub">A sentence or two is all we need. Thanks for sharing!</p>
      <textarea className="npc-note" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="Share your thoughts..." />
      <button type="button" className="npc-btn npc-btn--wide" onClick={() => { nps.send(moment, { comment: note.trim() }); setThanks(true); }}>Send Feedback</button>
    </>
  ) : (
    <p className="npc-thanks"><b>Thanks for sharing.</b> Your answer goes to the Benable team.</p>
  );

  return createPortal(
    <div className={`npc npc--${step}`} role="dialog" aria-label={title === 'closed' ? 'Your campaign is closed, one quick question' : 'One quick question'}>{body}</div>,
    document.body,
  );
}
