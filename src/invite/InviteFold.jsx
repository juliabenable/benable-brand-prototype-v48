import { useState } from 'react';
import { crewFor, PHOTOS, SPOTS } from '../components/pulse/pulseData.js';
import { foldFor, COPY, INVITED_ON } from './openSpot.js';
import './demoBar.css';

/* The invites that aren't in the table, under one line at its bottom (Julia,
   Oct 22, decision 1A): "N creators still deciding" (rows "Invited Jul 16")
   while spots are open, "N creators saved for your next campaign" (rows
   "Invite expired") once they're full. Same anatomy as the declined-invites
   line just above it in tableFix. */
export default function InviteFold({ scene, filtered }) {
  const [open, setOpen] = useState(false);
  if (filtered) return null;
  const fold = foldFor(scene.day, crewFor(scene.day, scene.mode), SPOTS);
  if (!fold || !fold.list.length) return null;
  const n = fold.list.length;
  const chip = (c) => (fold.filled ? COPY.chipClosed : COPY.chipWaiting(c.invited || INVITED_ON.first));
  return (
    <>
      <button type="button" className="tf-declline" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{fold.filled ? COPY.foldClosed(n) : COPY.foldWaiting(n)}</span>
        <span className={`tf-declchev${open ? ' tf-declchev--open' : ''}`} aria-hidden>▾</span>
      </button>
      <div className={`tf-drawer${open ? ' tf-drawer--open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
        <div className="tf-drawer-in">
          {open && fold.list.map((c) => (
            <div key={c.name} className="am-row tf-row tf-declrow">
              <span className="am-who">
                <span className="am-avatar tf-declava"><img src={PHOTOS[c.name]} alt="" /></span>
                <span className="am-names">
                  <span className="am-name">{c.name}</span>
                  <span className="am-handle">{c.handle}</span>
                </span>
              </span>
              <span className="am-update" aria-hidden />
              <span className="tf-chipslot"><span className="tf-gdot"><i style={{ background: fold.filled ? '#d5d8d5' : '#b9dfcb' }} />{chip(c)}</span></span>
              <span aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
