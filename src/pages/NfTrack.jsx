import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CampaignDetailPage from './CampaignDetailPage.jsx';
import { NF_SHELL } from '../data/newFlowHtml.js';
import { forks } from '../components/pulse/forks.js';

/*
 * /nf/track — the v45 tracker (Campaign Pulse: Amine rail + creators table +
 * review shell + wrap-up), hosted under the NEW-chrome sidebar. The tracker
 * content is the OLD-chrome captured page + pulse overlays, so it must live
 * OUTSIDE the .nf scope (class names like .workflow-header/.workspace-grid
 * exist in BOTH CSS worlds); the layout is a plain grid: .nf-scoped sidebar
 * cell on the left, unscoped old-chrome document on the right.
 */
export default function NfTrack() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const overviewRoute = () => (forks.get('type') === 'local' ? '/nf/gc-overview' : '/nf/overview');

  // Sidebar (new chrome) clicks
  const onSideClick = (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    e.preventDefault();
    const txt = el.textContent.trim();
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    if (txt === 'Campaigns' || aria.includes('home')) navigate(overviewRoute());
    else if (txt === 'Settings') navigate('/nf/settings');
  };

  // The tracker's own back-link points at the old-chrome campaigns list —
  // intercept in the CAPTURE phase (before CampaignDetailPage's handler).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const h = (e) => {
      const back = e.target.closest('.workflow-header-backlink, .flow-backlink, .workflow-back-link');
      if (back) {
        e.preventDefault();
        e.stopPropagation();
        navigate(overviewRoute());
      }
    };
    el.addEventListener('click', h, true);
    return () => el.removeEventListener('click', h, true);
  }, [navigate]);

  // Patch the tracker's captured campaign title to the card the user opened
  // (the demo data underneath stays the Pikora scenario either way).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let title = '';
    try { title = sessionStorage.getItem('nfTrackTitle') || ''; } catch { /* ok */ }
    if (!title) return;
    const apply = () => {
      const h1 = el.querySelector('.workflow-header-main h1');
      if (h1 && h1.textContent !== title) h1.textContent = title;
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // Sidebar active state: Campaigns
  const sideRef = useRef(null);
  useEffect(() => {
    const aside = sideRef.current?.querySelector('aside');
    if (!aside) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = NF_SHELL.sidebar;
    ['campaigns', 'settings'].forEach((seg) => {
      const src = tmp.querySelector(`a[href$="/${seg}"]`);
      const dst = aside.querySelector(`a[href$="/${seg}"]`);
      if (src && dst) dst.className = src.className;
    });
  }, []);

  return (
    <div className="nf-track">
      {/* the sidebar needs the captured page's wrapper chain — the CSS
          custom properties (--accent, --text-muted) and Inter live on
          .brand-dashboard.svelte-187rxgr */}
      <div className="nf nf--embed nf-track__side" ref={sideRef} onClick={onSideClick}>
        <div className="brand-dashboard svelte-187rxgr" style={{ height: '100%' }}>
          <div
            className="dashboard-body svelte-187rxgr"
            style={{ display: 'block' }}
            dangerouslySetInnerHTML={{ __html: NF_SHELL.sidebar }}
          />
        </div>
      </div>
      <div className="nf-track__main brand-dashboard" ref={wrapRef}>
        <CampaignDetailPage />
      </div>
    </div>
  );
}
