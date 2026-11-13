import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NF_SHELL } from '../data/newFlowHtml.js';
import { forks } from '../components/pulse/forks.js';
import NfForkBar from './NfForkBar.jsx';
import { createRoster, DAYS } from '../roster/rosterEngine.js';
import '../styles/pulse.css';
import '../styles/roster.css';

/*
 * /nf/roster — direction E ("the always-on roster") from the Sep 8 study
 * "October, On Track", hosted in the NEW production chrome exactly like the
 * captured flow: the real header + sidebar HTML from NF_SHELL, and the page
 * content mounted inside production's own .workspace-content shell so the
 * scroll chain and fonts are production's. The sidebar is patched in place:
 * "Campaigns" becomes "Creators" (active) and "Content" / "Brief" are added,
 * since a roster portal has no campaigns to list.
 * The engine (src/roster/rosterEngine.js) is the same code as the standalone
 * selling-months-study/proto-e.html; six "today" snapshots live on the second
 * black bar under the fork bar.
 */
/* The captured sidebar, patched once for the roster model. Patching after mount
   is a race: React recreates the dangerouslySetInnerHTML subtree on re-render,
   so the patched string itself is what gets rendered. */
const ROSTER_SIDEBAR = (() => {
  const tmp = document.createElement('div');
  tmp.innerHTML = NF_SHELL.sidebar;
  const camp = tmp.querySelector('a[href$="/campaigns"]');
  if (camp) {
    const label = camp.querySelector('.nav-label');
    if (label) label.textContent = 'Creators';
    camp.classList.add('active');
    camp.dataset.roster = 'creators';
  }
  const ugc = tmp.querySelector('a[href$="/ugc"]');
  if (ugc) {
    [['content', 'Content'], ['brief', 'Brief']].forEach(([seg, text]) => {
      const a = ugc.cloneNode(true);
      a.setAttribute('href', `/brand/benable-collab-studio/${seg}`);
      a.classList.remove('active');
      a.dataset.roster = seg;
      const l = a.querySelector('.nav-label'); if (l) l.textContent = text;
      const pill = a.querySelector('.coming-soon-pill'); if (pill) pill.remove();
      ugc.parentNode.insertBefore(a, ugc);
    });
  }
  return tmp.innerHTML;
})();

export default function NfRoster() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const [day, setDayState] = useState('signed');

  const go = (next) => navigate('/nf/' + next);

  // mount the vanilla engine once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;
    const engine = createRoster(el, { onRender: (k) => setDayState(k) });
    engineRef.current = engine;
    return () => { engine.destroy(); engineRef.current = null; };
  }, []);

  // sidebar + header clicks (the captured anchors would navigate to benable.com)
  const onShellClick = (e) => {
    if (mountRef.current && mountRef.current.contains(e.target)) return; // the engine owns its own clicks
    const el = e.target.closest('a, button');
    if (!el) return;
    e.preventDefault();
    const txt = el.textContent.trim();
    const toast = engineRef.current?.toast;
    if (txt === 'Creators' || el.dataset.roster === 'creators') return;
    if (txt === 'Settings') { navigate('/nf/settings'); return; }
    if (el.dataset.roster === 'content') { toast && toast('Content is the library of every post; not in this prototype.'); return; }
    if (el.dataset.roster === 'brief') { toast && toast('Your standing brief: products, what to post, rights. The editor is the existing wizard.'); return; }
    if (/UGC Studio|Push Alerts|Brand Intelligence/.test(txt)) { toast && toast('Coming soon in production too.'); return; }
  };

  // the fork bar's MODEL group can send us back to campaigns
  useEffect(() => forks.sub((s) => {
    if (s.model === 'campaigns') navigate(forks.get('type') === 'local' ? '/nf/gc-overview' : '/nf/overview');
    if (s.model === 'months') navigate('/nf/months');
  }), [navigate]);
  useEffect(() => { if (forks.get('model') !== 'roster') forks.set('model', 'roster'); }, []);

  return (
    <>
      <div className="nf" ref={rootRef} onClick={onShellClick}>
        <div className="brand-dashboard svelte-187rxgr">
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.header }} />
          <div className="dashboard-body svelte-187rxgr">
            <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: ROSTER_SIDEBAR }} />
            <main className="workspace-content svelte-187rxgr" aria-busy="false">
              <div className="workspace-content-shell svelte-187rxgr">
                <div className="nf-roster" ref={mountRef} />
              </div>
            </main>
          </div>
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.backdrop }} />
        </div>
      </div>
      <NfForkBar go={go} />
      <div className="cp-mode cp-mode--opts nf-forkbar nf-roster-days" role="group" aria-label="Roster day">
        <span className="cp-scrub-tag">TODAY IS</span>
        {DAYS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={day === key ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
            onClick={() => engineRef.current?.setDay(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
