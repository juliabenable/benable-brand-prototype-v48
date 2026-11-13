import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NF_SHELL } from '../data/newFlowHtml.js';
import { forks } from '../components/pulse/forks.js';
import NfForkBar from './NfForkBar.jsx';
import { createMonths, DAYS, REVS, SCENES, TILES } from '../months/monthsEngine.js';
import '../styles/pulse.css';
import '../styles/months.css';

/*
 * /nf/months and /nf/months/track: "months, not campaigns" in the real captured chrome
 * (NF_SHELL header + sidebar, content inside production's .workspace-content-shell).
 *
 * VERSION (second black bar): Prod today = what the brand portal shows now, New design =
 * the change. Both are rendered by months/monthsEngine.js (its header has the sources and
 * the decisions). "Launch now" hands off to the REAL captured wizard: prod opens on the
 * intro screen (/nf/step1), the new design goes straight to setup (/nf/step2); NewFlow
 * patches the copy in months mode and its back links return here.
 *
 * Second black bar: PAGE (Overview | Campaign page), VERSION, TODAY IS, and in the new design
 * TILE (Moving = the decided Oct 6 timeline card, Fixed = the 8-week card as it shipped Oct 5),
 * CAMPAIGN 1 (what happens to it: On plan, Early, Brand ships late, Brand reviews late,
 * Creators late) and, for the fixed card on the campaign page, BAR (Line | Segments).
 * Deep links: ?rev=before|after, ?day=signed|week4|slip|landed, ?tl=open (timeline
 * expanded), ?tile=moving|fixed, ?scen=plan|early|brandship|brandreview|creators,
 * ?bar=line|segments (the fixed card's progress bar), ?embed=1 (no black bars, nothing
 * written to storage: the handoff page's frames).
 * Engineering handoff with the two versions side by side: public/months-before-after.html
 */
export default function NfMonths({ screen = 'overview' }) {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const [day, setDayState] = useState('week4');
  const [rev, setRevState] = useState('after');
  const [bar, setBarState] = useState('line');
  const [tile, setTileState] = useState('moving');
  const [scen, setScenState] = useState('plan');
  const [params] = useSearchParams();
  const embed = params.has('embed');

  const go = (next) => navigate('/nf/' + next);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;
    const engine = createMonths(el, {
      init: { rev: params.get('rev'), day: params.get('day'), tl: params.get('tl'), bar: params.get('bar'), tile: params.get('tile'), scen: params.get('scen'), embed },
      onRender: (k, _screen, r, b, tl, sc) => { setDayState(k); setRevState(r); setBarState(b); setTileState(tl); setScenState(sc); },
      onOpen: () => navigate('/nf/months/track'),
      onBack: () => navigate('/nf/months'),
      onPlan: ({ month, todayISO, number, rev: planRev }) => {
        // the real captured wizard. Prod opens on the intro screen; the new design skips it
        // (Tony, Sep 8) and goes straight to setup, already named (NewFlow patches the copy).
        // The prototype's "today" rides along so the launch screen dates from it, not the real clock
        if (typeof window !== 'undefined' && window.__nfLive) Object.assign(window.__nfLive, { monthsTarget: month, monthsToday: todayISO, monthsNumber: number });
        navigate(planRev === 'before' ? '/nf/step1' : '/nf/step2');
      },
    });
    engineRef.current = engine;
    engine.setScreen(screen);
    return () => { engine.destroy(); engineRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    const got = e.setScreen(screen);
    if (got !== screen && screen === 'track') navigate('/nf/months', { replace: true });
  }, [screen, navigate]);

  const onShellClick = (e) => {
    if (mountRef.current && mountRef.current.contains(e.target)) return;
    const el = e.target.closest('a, button');
    if (!el) return;
    e.preventDefault();
    const txt = el.textContent.trim();
    const toast = engineRef.current?.toast;
    if (txt === 'Campaigns' || (el.getAttribute('aria-label') || '').toLowerCase().includes('home')) { navigate('/nf/months'); return; }
    if (txt === 'Settings') { navigate('/nf/settings'); return; }
    if (/UGC Studio|Push Alerts|Brand Intelligence/.test(txt)) { toast && toast('Coming soon in production too.'); }
  };

  useEffect(() => forks.sub((s) => {
    if (s.model === 'campaigns') navigate(forks.get('type') === 'local' ? '/nf/gc-overview' : '/nf/overview');
    if (s.model === 'roster') navigate('/nf/roster');
  }), [navigate]);
  useEffect(() => { if (forks.get('model') !== 'months') forks.set('model', 'months'); }, []);

  return (
    <>
      <div className="nf" onClick={onShellClick}>
        <div className="brand-dashboard svelte-187rxgr">
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.header }} />
          <div className="dashboard-body svelte-187rxgr">
            <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.sidebar }} />
            <main className="workspace-content svelte-187rxgr" aria-busy="false">
              <div className="workspace-content-shell svelte-187rxgr">
                <div className={embed ? 'nf-months nfm-embed' : 'nf-months'} ref={mountRef} />
              </div>
            </main>
          </div>
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.backdrop }} />
        </div>
      </div>
      {!embed && <NfForkBar go={go} />}
      {!embed && (
      <div className="cp-mode cp-mode--opts nf-forkbar nf-roster-days" role="group" aria-label="Months version and day">
        {/* PAGE: the campaign page (Dashboard) is one click away from any day. Sep 8 has no
            campaign yet, so it jumps to Oct 5; otherwise the only door is a campaign card */}
        <span className="cp-scrub-tag">PAGE</span>
        <button type="button" className={screen === 'overview' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => navigate('/nf/months')}>Overview</button>
        <button
          type="button"
          className={screen === 'track' ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
          onClick={() => { if (day === 'signed') engineRef.current?.setDay('week4'); navigate('/nf/months/track'); }}
        >
          Campaign page
        </button>
        <span className="cp-mode-sep" aria-hidden />
        <span className="cp-scrub-tag">VERSION</span>
        {REVS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={rev === key ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
            onClick={() => engineRef.current?.setRev(key)}
          >
            {label}
          </button>
        ))}
        <span className="cp-mode-sep" aria-hidden />
        <span className="cp-scrub-tag">TODAY IS</span>
        {DAYS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={day === key ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
            onClick={() => { engineRef.current?.setDay(key); if (key === 'signed' && screen === 'track') navigate('/nf/months'); }}
          >
            {label}
          </button>
        ))}
        {rev === 'after' && (
          <>
            <span className="cp-mode-sep" aria-hidden />
            <span className="cp-scrub-tag">TILE</span>
            {TILES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={tile === key ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
                onClick={() => engineRef.current?.setTile(key)}
              >
                {label}
              </button>
            ))}
            <span className="cp-mode-sep" aria-hidden />
            <span className="cp-scrub-tag">CAMPAIGN 1</span>
            {SCENES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={scen === key ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
                onClick={() => engineRef.current?.setScen(key)}
              >
                {label}
              </button>
            ))}
          </>
        )}
        {rev === 'after' && tile === 'fixed' && screen === 'track' && (
          <>
            <span className="cp-mode-sep" aria-hidden />
            <span className="cp-scrub-tag">BAR</span>
            {[['line', 'Line'], ['segments', 'Segments']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={bar === key ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
                onClick={() => engineRef.current?.setBar(key)}
              >
                {label}
              </button>
            ))}
          </>
        )}
      </div>
      )}
    </>
  );
}
