// Invite Creators: Amine's v2 popup (AmineBenjil/invite-creators-prototype-v2 @2cd968a), V1 layout only,
// cleaned for engineering (Julia, Oct 22). What changed from his build is listed in README.md.
const api = mockApi;
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const first = name => name.split(' ')[0];
const STACK = 4;   // avatars shown before the "+N" bubble
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const SPOTS = api.campaign.spots;

// ---------- Creator card + its Not a Fit row ----------
// A profile never shows an empty field: a section with no data is left out (stats one by one).
const statHtml = (cls, label, value) => value ? `<div class="c-stat ${cls}"><small>${label}</small><b>${value}</b></div>` : '';
const engHtml = c => c.engagement ? `
          <div class="c-stat c-eng">
            <small>Engagement <img src="assets/card-info-12.svg" alt="" width="12" height="12"></small>
            <b><span class="c-ig12"><img src="assets/card-instagram-12.svg" alt="" width="13" height="13"></span>${c.engagement}</b>
          </div>` : '';
const statsHtml = c => {
  const soc = statHtml('c-fol', 'Followers', c.followers) + engHtml(c);
  const aud = statHtml('c-loc', 'Location', c.location) + statHtml('c-age', 'Age Range', c.age) + statHtml('c-gender', 'Gender', c.gender);
  if (!soc && !aud) return '';
  return `
    <div class="c-stats">
      ${soc ? `<div class="c-col c-soc"><p class="c-label">Social Stats</p><div class="c-box">${soc}</div></div>` : ''}
      ${aud ? `<div class="c-col c-aud"><p class="c-label">Audience</p><div class="c-box">${aud}</div></div>` : ''}
    </div>`;
};

const cardHtml = c => `
  <div class="c-main">
    <div class="c-top">
      <div class="c-who">
        <div class="c-av"><span><img src="assets/${c.avatar}.jpg" alt=""></span></div>
        <div class="c-id">
          <div class="c-line">
            <span class="c-name">${c.name}<img src="assets/card-verified-16.svg" alt="" width="16" height="16"></span>
            <span class="c-handle">${c.handle}</span>
            ${c.source === 'new' ? '<span class="c-new">New</span>' : ''}
          </div>
          ${c.bio ? `<p class="c-bio">${c.bio}</p>` : ''}
        </div>
      </div>
      <div class="c-social">
        <img src="assets/card-instagram-24.svg" alt="Instagram" width="24" height="24">
        <img src="assets/card-tiktok-24.svg" alt="TikTok" width="24" height="24">
      </div>
    </div>
    ${c.source === 'approved' && c.history ? `<div class="c-history"><span class="c-tag">Previously approved</span><p>${c.history}</p></div>` : ''}
    ${c.fits.length ? `<div class="c-fit">
      <p class="c-fit-head"><img src="assets/card-sparkle-16.svg" alt="" width="16" height="16">Why they fit</p>
      <ul>${c.fits.map(f => `<li><img src="assets/card-bullet-16.svg" alt="" width="16" height="16">${f}</li>`).join('')}</ul>
    </div>` : ''}
    ${statsHtml(c)}
    ${c.content.length ? `<div class="c-recent">
      <p class="c-label">Recent content</p>
      <div class="c-thumbs">${c.content.map(img => `<span><img src="assets/${img}.jpg" alt=""></span>`).join('')}</div>
    </div>` : ''}
  </div>
  <div class="c-foot">
    <button class="c-btn" data-act="notfit">Not a Fit</button>
    <button class="c-btn${c.priority ? ' prio-on' : ''}" data-act="prio" aria-pressed="${c.priority}">
      <img class="off" src="assets/prioritize-16.svg" alt="" width="16" height="16">
      <img class="on" src="assets/prioritize-16-purple.svg" alt="" width="16" height="16">
      <span class="off">Prioritize</span><span class="on">Prioritized</span>
      <span class="tip" role="tooltip">Prioritized creators get their invite first.</span>
    </button>
  </div>`;

// Not a Fit collapses the card straight into this row (Inline, Figma 15347:68305; Julia, Oct 22: no popup first)
const rowHtml = c => `
  <div class="r-who">
    <div class="r-av"><span><img src="assets/${c.avatar}.jpg" alt=""></span></div>
    <p class="r-text"><span class="r-name">${c.name}</span><span class="r-chip">Not a Fit</span>${
      c.feedback ? '<span class="r-sent">Feedback sent</span>' : '<button class="r-why" data-act="why">Tell us why?</button>'}</p>
  </div>
  <button class="r-undo" data-act="undo">Undo</button>`;

const itemHtml = (c, i) => `<div class="nc ${c.notFit ? 'row' : 'card'}${c.source === 'approved' ? ' ap' : ''}" data-id="${c.id}" style="--i:${Math.min(i, REVEAL_CAP)}">${c.notFit ? rowHtml(c) : cardHtml(c)}</div>`;

// Swap a card and its row in place as one morph: the avatar and name are the same person in both,
// so they glide and resize from where they were to where they land (40px avatar to 28px, the name
// shrinking into the small grey one). Everything else dissolves: the old parts fade out where they
// are, the new ones fade in, while the slot eases to its new height. Undo plays it in reverse.
const SWAP_MS = 480;   // keep in step with .nc.anim in styles.css
const SWAP_EASE = 'cubic-bezier(.4, 0, .2, 1)';
const AV = '.c-av, .r-av', NAME = '.c-name, .r-name';
// The parts that only exist on one side: they dissolve in rather than move
const ADDED = '.c-main > :not(.c-top), .c-foot, .c-social, .c-bio, .c-handle, .c-new, .c-name img, .r-chip, .r-why, .r-sent, .r-undo';

// The name's text box (the card's name also holds the verified badge)
function textRect(el) {
  const r = document.createRange();
  r.selectNodeContents(el.firstChild || el);
  return r.getBoundingClientRect();
}

// FLIP: put `el` back where `from` was, then let it travel home. `scale` sizes it from its top-left.
function morphFrom(el, from, to, scale, extra = {}) {
  const dx = from.left - (to.left + (to.ox || 0) * scale), dy = from.top - (to.top + (to.oy || 0) * scale);
  el.style.transformOrigin = '0 0';
  el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, ...extra.from },
              { transform: 'none', ...extra.to }], { duration: SWAP_MS, easing: SWAP_EASE });
}

function finishSwap(el) {
  clearTimeout(el._t);
  el.querySelectorAll(':scope > .nc-old').forEach(n => n.remove());
  el.getAnimations({ subtree: true }).forEach(a => a.cancel());
  el.style.height = '';
  el.classList.remove('anim', 'morph');
}

function setItem(el, c) {
  finishSwap(el);
  const swap = () => {
    el.innerHTML = c.notFit ? rowHtml(c) : cardHtml(c);
    el.classList.toggle('row', c.notFit);
    el.classList.toggle('card', !c.notFit);
    syncPrioCap();
  };
  if (reduceMotion || !el.offsetParent) { swap(); keepInView(el); return; }   // a closed group just takes the new state

  // Before: where the avatar and name are now
  const from = el.offsetHeight;
  const oAv = el.querySelector(AV), oName = el.querySelector(NAME);
  const avFrom = oAv.getBoundingClientRect(), nameFrom = textRect(oName);
  const nameStyle = getComputedStyle(oName), fromSize = parseFloat(nameStyle.fontSize), fromColor = nameStyle.color;

  // The old content stays as a layer that dissolves; its avatar and name hand over to the new ones
  const old = document.createElement('div');
  old.className = 'nc-old';
  old.style.height = from + 'px';
  old.append(...el.childNodes);
  old.querySelectorAll(AV + ', ' + NAME).forEach(n => { n.style.visibility = 'hidden'; });
  swap();
  const nAv = el.querySelector(AV), nName = el.querySelector(NAME);   // the new ones, before the old layer goes back in
  el.prepend(old);

  // After: lay the new content out at its final height, then pin the slot back to where it started
  el.style.height = '';
  const to = el.offsetHeight;
  el.style.setProperty('--mid', to / 2 + 'px');   // the row content sits at its final spot while the slot shrinks
  el.classList.add('morph');
  el.style.height = from + 'px';
  keepInView(el);

  const avTo = nAv.getBoundingClientRect();
  const elTo = nName.getBoundingClientRect(), txtTo = textRect(nName);
  const toStyle = getComputedStyle(nName);
  morphFrom(nAv, avFrom, avTo, avFrom.width / avTo.width);
  morphFrom(nName, nameFrom, { left: elTo.left, top: elTo.top, ox: txtTo.left - elTo.left, oy: txtTo.top - elTo.top },
    fromSize / parseFloat(toStyle.fontSize), { from: { color: fromColor }, to: { color: toStyle.color } });

  old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
  el.querySelectorAll(ADDED).forEach(n => n.closest('.nc-old') || n.animate([{ opacity: 0 }, { opacity: 1 }],
    { duration: 260, delay: 180, easing: 'ease-out', fill: 'backwards' }));

  void el.offsetHeight;   // commit the start height before animating
  el.classList.add('anim');
  el.style.height = to + 'px';
  el._t = setTimeout(() => finishSwap(el), SWAP_MS + 80);
}

// A card collapsing from deep inside it would leave its row above the fold (or under the sticky heading):
// scroll so the row lands just below the heading, alongside the height animation
function keepInView(el) {
  const body = el.closest('.m-body');
  if (!body || !el.offsetParent) return;
  const head = el.closest('.group')?.querySelector('.g-head');
  const floor = body.getBoundingClientRect().top + (head ? head.offsetHeight : 0) + 8;
  const top = el.getBoundingClientRect().top;
  if (top >= floor) return;
  const from = body.scrollTop, to = Math.max(0, from - (floor - top));
  if (reduceMotion) { body.scrollTop = to; return; }
  // Tweened by hand: a native smooth scroll gets cancelled when the content shrinks under it
  cancelAnimationFrame(body._keep);
  clearTimeout(body._keepT);
  const t0 = performance.now(), dur = SWAP_MS;   // moves with the collapse, same length and easing
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    body.scrollTop = from + (to - from) * e;
    if (p < 1) body._keep = requestAnimationFrame(step);
  };
  body._keep = requestAnimationFrame(step);
  body._keepT = setTimeout(() => { cancelAnimationFrame(body._keep); body.scrollTop = to; }, dur + 80);   // frames can stall
}

// ---------- Opening animations ----------
const LOAD_MS = 500;      // first open: skeletons stand in this long
const REVEAL_CAP = 5;     // cards past this one share the last delay (they're below the fold anyway)
const REVEAL_MS = 1400;   // long enough for the last card's parts to settle

const b = (w, h, r = 6, extra = '') => `<b class="sk-b" style="width:${w};height:${h}px;border-radius:${r}px;${extra}"></b>`;
const skeletonHtml = approved => `
  <div class="nc card sk${approved ? ' ap' : ''}" aria-hidden="true">
    <div class="c-main">
      <div class="sk-row">
        ${b('40px', 40, 100)}
        <div class="sk-col">${b('180px', 14)}${b(approved ? '320px' : '260px', 10)}${approved ? '' : b('200px', 10)}</div>
        <div class="sk-row" style="margin-left:auto; gap:8px">${b('24px', 24, 100)}${b('24px', 24, 100)}</div>
      </div>
      ${approved ? `<div class="sk-row">${b('141px', 25, 100)}${b('300px', 10)}</div>` : ''}
      <div class="sk-col" style="gap:${approved ? 12 : 10}px">${b('90px', 12)}${b('440px', 10)}${b('410px', 10)}${b('380px', 10)}</div>
      <div class="sk-row" style="gap:${approved ? 20 : 16}px">${b('240px', 52, 12)}${b('auto', 52, 12, 'flex:1')}</div>
      <div class="sk-col" style="gap:12px">${b('90px', 12)}
        <div class="sk-row" style="gap:12px">${Array.from({ length: 7 }, () => b('auto', approved ? 108 : 86, 8, 'flex:1')).join('')}</div>
      </div>
    </div>
    <div class="c-foot"><span class="sk-row" style="gap:32px; padding-right:16px">${b('64px', 14)}${b('84px', 14)}</span></div>
  </div>`;

// Replays the staggered entrance: cards rise one after another, then each card's parts settle in order
function reveal(panel) {
  clearTimeout(panel._reveal);
  panel.classList.remove('reveal');
  void panel.offsetWidth;   // restart the animations
  panel.classList.add('reveal');
  panel._reveal = setTimeout(() => panel.classList.remove('reveal'), REVEAL_MS);
}

function openGroup(group, open) {
  const panel = group.querySelector('.g-panel');
  group.classList.toggle('open', open);
  group.querySelector('.g-bar').setAttribute('aria-expanded', open);
  clearTimeout(panel._load);
  if (!open) { panel.classList.remove('loading', 'reveal'); return; }
  if (group.dataset.loaded || reduceMotion) { group.dataset.loaded = 1; reveal(panel); return; }
  // First open: show skeletons briefly, as if the profiles were loading
  panel.classList.add('loading');
  panel._load = setTimeout(() => {
    group.dataset.loaded = 1;
    panel.classList.remove('loading');
    reveal(panel);
  }, LOAD_MS);
}

// ---------- Groups ----------
// "Emma" · "Emma and Maya" · "Emma, Maya and 1 other" · "Emma, Maya and 16 others"
const namesHtml = list => {
  const [a, b2] = list.map(c => first(c.name)), n = list.length;
  if (n === 1) return `<b>${a}</b>`;
  if (n === 2) return `<b>${a} </b>and <b>${b2}</b>`;
  return `<b>${a}, ${b2} </b>and ${plural(n - 2, 'other', 'others')}`;
};

const groupHtml = g => {
  const n = g.creators.length;
  const shown = g.creators.slice(0, STACK);
  return `
  <section class="group" data-id="${g.id}">
    <div class="g-head">
      <div class="g-text">
        <p class="g-title">${g.title} <span class="dot">· </span><span class="num">${n}</span></p>
        <p class="g-sub">${g.sub}</p>
      </div>
      <button class="g-hide">${g.hide}<img src="assets/chevron-up-12.svg" alt="" width="12" height="12"></button>
    </div>
    <div class="g-box">
      <button class="g-bar" aria-expanded="false">
        <span class="g-summary">
          <span class="g-stack">
            ${shown.map(c => `<span class="g-av"><img src="assets/${c.avatar}.jpg" alt=""></span>`).join('')}
            ${n > STACK ? `<span class="g-more"><span>+${n - STACK}</span></span>` : ''}
          </span>
          <span class="g-names">${namesHtml(g.creators)}</span>
        </span>
        <span class="g-chev">
          <img class="down" src="assets/chevron-down-16.svg" alt="" width="16" height="16">
          <img class="up" src="assets/chevron-up-16.svg" alt="" width="16" height="16">
        </span>
      </button>
      <div class="g-panel">${[0, 1, 2].map(() => skeletonHtml(g.id === 'approved')).join('')}${g.creators.map(itemHtml).join('')}</div>
    </div>
  </section>`;
};

const modal = $('modal');
const approveBtn = $('approve');

// The Approve button counts everyone not marked Not a Fit; at zero it can't be pressed
const renderCount = () => {
  if (modal.classList.contains('is-done')) return;
  const n = api.approvedCount();
  approveBtn.querySelector('.js-approve').textContent = n ? `Approve ${plural(n, 'creator', 'creators')}` : 'Approve creators';
  approveBtn.disabled = !n;
};

// Prioritize: at most one creator per spot (Julia, Oct 22). Once that many are prioritized, every other
// Prioritize button is greyed out with a tooltip saying how to free one up.
const CAP_TIP = `You've prioritized ${SPOTS}, one per spot. Turn one off to swap.`;
const PRIO_TIP = 'Prioritized creators get their invite first.';
function syncPrioCap() {
  const full = api.prioritizedCount() >= SPOTS;
  modal.querySelectorAll('.nc.card [data-act=prio]').forEach(b => {
    const capped = full && !b.classList.contains('prio-on');
    b.classList.toggle('prio-full', capped);
    b.setAttribute('aria-disabled', capped);
    b.querySelector('.tip').textContent = capped ? CAP_TIP : PRIO_TIP;
  });
}

// Groups with nobody in them are left out (a brand's first campaign has no previously approved creators)
const groups = api.groups().filter(g => g.creators.length)
  .map(g => ({ ...g, hide: g.id === 'approved' ? 'Hide previously approved' : 'Hide new creators' }));
const total = groups.reduce((n, g) => n + g.creators.length, 0);
modal.querySelector('.groups').innerHTML = groups.map(groupHtml).join('');
$('headline').textContent = `Great news, we've selected ${plural(total, 'creator', 'creators')} for your campaign.`;
// When we found 40% or less above the spots, ask for as many as they can approve (Julia, Oct 22)
if (total <= SPOTS * 1.4) {
  $('poolNote').textContent = `Approve as many creators as possible to fit your ${plural(SPOTS, 'spot', 'spots')}.`;
  $('poolNote').hidden = false;
}
renderCount();
syncPrioCap();

modal.querySelector('.groups').addEventListener('click', e => {
  const toggle = e.target.closest('.g-bar, .g-hide');
  if (toggle) {
    const group = toggle.closest('.group');
    openGroup(group, !group.classList.contains('open'));
    return;
  }
  const btn = e.target.closest('[data-act]');
  const item = btn && btn.closest('.nc');
  if (!item) return;
  const id = item.dataset.id;
  const act = btn.dataset.act;
  if (act === 'prio') {
    if (btn.classList.contains('prio-full')) return;   // at the cap: the tooltip explains
    const on = !btn.classList.contains('prio-on');
    api.setPriority(id, on);
    btn.classList.toggle('prio-on', on);
    btn.setAttribute('aria-pressed', on);
    syncPrioCap();
  } else if (act === 'notfit') {
    setNotFit(id, true);   // collapses right away; "Tell us why?" on the row asks later
  } else if (act === 'why') {
    openFit(id);
  } else {
    setNotFit(id, false);
  }
});

// Applies a Not a fit (or its Undo)
function setNotFit(id, on) {
  api.setNotFit(id, on);
  modal.querySelectorAll(`.nc[data-id="${id}"]`).forEach(el => setItem(el, api.get(id)));
  renderCount();
  syncPrioCap();
}

// White background + stroke only once a heading is actually pinned to the top
{
  const body = modal.querySelector('.m-body');
  const markStuck = () => {
    const top = body.getBoundingClientRect().top;
    modal.querySelectorAll('.group').forEach(g => {
      const head = g.querySelector('.g-head');
      const stuck = g.classList.contains('open') && body.scrollTop > 0 && Math.abs(head.getBoundingClientRect().top - top) < 1;
      head.classList.toggle('stuck', stuck);
    });
  };
  body.addEventListener('scroll', markStuck, { passive: true });
  body.addEventListener('click', () => setTimeout(markStuck));
}

// ---------- Open / close ----------
// Embedded (the v47 tracker), the page talks to its host with two messages:
//   out: { type: 'invite:sent', count, names }   once Send succeeds
//   out: { type: 'invite:closed', sent }  every time the popup closes (sent = invites sent, 0 if none yet)
//   in:  { type: 'invite:open' }          reopen it
const host = window.parent !== window ? window.parent : null;
const tell = msg => host && host.postMessage(msg, location.origin);
const overlay = $('overlay');
const setOpen = open => {
  overlay.classList.toggle('hidden', !open);
  modal.hidden = !open;
  // Once invites are sent the popup stays on the success screen. It animates the first time only.
  if (!open && modal.classList.contains('is-done')) modal.classList.add('done-seen');
  if (!open) tell({ type: 'invite:closed', sent: api.sent() });
};
window.addEventListener('message', e => {
  if (e.origin === location.origin && e.data?.type === 'invite:open') setOpen(true);
});
modal.querySelector('.m-close').addEventListener('click', () => setOpen(false));
overlay.addEventListener('click', () => setOpen(false));
$('openModal').addEventListener('click', () => setOpen(true));
approveBtn.addEventListener('click', () => openSummary(approveBtn));
// Done on the success screen closes the popup
document.addEventListener('click', e => { if (e.target.closest('.m-done .done-btn')) setOpen(false); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (fitOpen()) closeFit();
  else if (summaryOpen()) closeSummary();
  else setOpen(false);
});

// ---------- Invite summary pop-up ("Good to go?") ----------
// Read-only: says who gets invited. Cancel keeps every selection.
const sum = $('sum');
const sumDlg = sum.querySelector('.sum-dlg');
let sumOpener = null;
let sumCloseT;
const summaryOpen = () => !sum.hidden;
const invites = n => plural(n, 'invite', 'invites');

function summaryData() {
  const all = api.groups().flatMap(g => g.creators);
  const kept = all.filter(c => !c.notFit);
  const rest = kept.filter(c => !c.priority);
  return {
    prio: kept.filter(c => c.priority),   // prioritized and then removed counts only as Not a fit
    rest,
    nofit: all.filter(c => c.notFit),
  };
}

// "We'll invite **73 creators** to this campaign, including **16 previously approved** and **57 new**.
//  **2 prioritized creators** get the first chance to accept."
// When everyone left is in one group, name it instead: "We'll invite **56 new creators** to this campaign."
// The prioritized sentence only shows once they've prioritized someone, and not when everyone is
// prioritized (then nobody goes first).
function inviteLine(d) {
  const kept = [...d.prio, ...d.rest];
  const prev = kept.filter(c => c.source === 'approved').length;
  const fresh = kept.length - prev;
  const who = n => plural(n, 'creator', 'creators');
  const line = !prev || !fresh
    ? `We'll invite <b>${kept.length} ${prev ? 'previously approved' : 'new'} ${who(kept.length).replace(/^\d+ /, '')}</b> to this campaign.`
    : `We'll invite <b>${who(kept.length)}</b> to this campaign, including <b>${prev} previously approved</b> and <b>${fresh} new</b>.`;
  const p = d.prio.length;
  return p && d.rest.length ? `${line} <b>${plural(p, 'prioritized creator', 'prioritized creators')}</b> ${p === 1 ? 'gets' : 'get'} the first chance to accept.` : line;
}

// Compact confirm (Figma 15372:8161): the sentence carries the breakdown, Send sits above Cancel
function summaryHtml(d, error) {
  const n = d.prio.length + d.rest.length;
  return `
  <div class="sum-view">
    <div class="sum-head">
      <span class="sum-icon" aria-hidden="true"><img src="assets/confirm-send-48.png" alt="" width="40" height="40"></span>
      <div class="sum-copy">
        <h2 class="sum-title" id="sumTitle">${n ? 'Good to go?' : 'Nobody to invite yet'}</h2>
        <p class="sum-sub">${n ? inviteLine(d) : 'You marked everyone as Not a fit. Go back and keep at least one creator.'}</p>
      </div>
    </div>
    ${error ? `<p class="sum-error" role="alert">${error}</p>` : ''}
    <div class="sum-foot">
      <button class="sum-send" data-sum="send"${n ? '' : ' disabled'}>${n ? `Send ${invites(n)}` : 'Send invites'}</button>
      <button class="sum-back" data-sum="back">Cancel</button>
    </div>
  </div>`;
}

function doneHtml(n) {
  return `
  <div class="sum-view">
    <div class="sum-done">
      <span class="done-check" aria-hidden="true">
        <span class="done-ring"></span>
        <svg width="64" height="64" viewBox="0 0 64 64"><circle class="done-disc" cx="32" cy="32" r="32"/><path class="done-tick" d="M21 33.5l7.5 7.5L43.5 25" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <h2 class="sum-done-title" id="sumTitle">${plural(n, 'creator', 'creators')} approved</h2>
      <p class="sum-done-body">Invites are going out now. Most creators answer within a few days, some take up to 3 business days.</p>
      <button class="done-btn" data-sum="close">Done</button>
    </div>
  </div>`;
}

// A short confetti burst from a point, in brand colors. Canvas-only, removed when the last piece settles.
function confetti(x, y) {
  if (reduceMotion) return;
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.className = 'confetti';
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#7a5cfa', '#a48bff', '#c9bdfd', '#cdff5a', '#ffb547', '#ff7eb6'];
  const bits = Array.from({ length: 110 }, () => {
    const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.1;   // mostly upward, fanned out
    const v = 6 + Math.random() * 9;
    return {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 5 + Math.random() * 5, h: 8 + Math.random() * 6,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .4,
      flip: Math.random() * Math.PI, vf: .1 + Math.random() * .2,
      c: colors[(Math.random() * colors.length) | 0], round: Math.random() < .3,
    };
  });
  const start = performance.now(), LIFE = 2200;
  setTimeout(() => cv.remove(), LIFE + 400);   // safety net if frames are paused (background tab)
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - LIFE * .6) / (LIFE * .4));   // fade out over the last 40%
    bits.forEach(b => {
      b.vx *= .985; b.vy = b.vy * .985 + .32;   // air drag + gravity
      b.x += b.vx; b.y += b.vy; b.r += b.vr; b.flip += b.vf;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.scale(1, Math.cos(b.flip));   // tumble
      ctx.fillStyle = b.c;
      if (b.round) { ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    });
    if (t < LIFE) requestAnimationFrame(frame); else cv.remove();
  })(start);
}

function focusPrimary() {
  const el = sumDlg.querySelector('.done-btn, .sum-send:not(:disabled)') || sumDlg.querySelector('.sum-back');
  if (el) el.focus({ preventScroll: true });
}

function openSummary(opener) {
  clearTimeout(sumCloseT);
  sumOpener = opener;
  sumDlg.innerHTML = summaryHtml(summaryData());
  sum.hidden = false;
  void sum.offsetWidth;   // start from the hidden pose so the enter transition runs
  sum.classList.add('in');
  focusPrimary();
}

function closeSummary() {
  if (!summaryOpen()) return;
  sum.classList.remove('in');
  clearTimeout(sumCloseT);
  sumCloseT = setTimeout(() => { sum.hidden = true; sumDlg.innerHTML = ''; }, 260);
  if (sumOpener && !sumOpener.disabled) sumOpener.focus();
}

async function sendInvites(btn) {
  const d = summaryData();
  const ids = [...d.prio, ...d.rest].map(c => c.id);   // invite order: prioritized first
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    await api.sendInvites(ids);
  } catch {
    // Keep the summary on screen, with a clear error above the footer
    sumDlg.innerHTML = summaryHtml(d, "We couldn't send the invites. Check your connection and try again.");
    focusPrimary();
    return;
  }
  tell({ type: 'invite:sent', count: ids.length, names: [...d.prio, ...d.rest].map(c => c.name) });
  // The summary closes and the big popup itself turns into the success screen
  closeSummary();
  setTimeout(() => showSuccess(ids.length), 180);
}

// Success screen inside the Invite Creators popup: the list and footer fade out, the check/confetti/text rise in.
// settled: reopened after a reload, so it's simply there and nothing replays.
function showSuccess(n, settled = false) {
  approveBtn.disabled = true;
  approveBtn.querySelector('.js-approve').textContent = `${invites(n)} sent`;
  let done = modal.querySelector('.m-done');
  if (!done) { done = document.createElement('div'); done.className = 'm-done'; modal.appendChild(done); }
  done.innerHTML = doneHtml(n);
  modal.classList.add('is-done');
  modal.classList.toggle('done-seen', settled);
  if (settled) return;
  done.querySelector('.done-btn').focus({ preventScroll: true });
  // Burst from the check as the disc lands
  setTimeout(() => {
    const r = done.querySelector('.done-check').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2);
  }, 380);
}

sum.addEventListener('click', e => {
  if (e.target === sum) return closeSummary();   // backdrop = Cancel
  const act = e.target.closest('[data-sum]')?.dataset.sum;
  if (act === 'back' || act === 'close') closeSummary();
  else if (act === 'send') sendInvites(e.target.closest('[data-sum]'));
});
// Keep Tab inside the dialog: it only moves between its buttons
sum.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const btns = [...sumDlg.querySelectorAll('button:not(:disabled)')];
  if (!btns.length) return;
  const i = btns.indexOf(document.activeElement);
  e.preventDefault();
  btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
});

// ---------- Not a fit feedback (Figma 15343:68271), opened from "Tell us why?" on a Not a Fit row ----------
// The creator is already Not a Fit; this only collects the optional reason. Benable only, creators never see it.
const fit = $('fit');
const fitDlg = fit.querySelector('.fit-dlg');
const fitInput = $('fitWhy');
const fitSend = fitDlg.querySelector('[data-fit=send]');
let fitId = null, fitCloseT;
const fitOpen = () => !fit.hidden;

function openFit(id) {
  const c = api.get(id);
  fitId = id;
  fitDlg.querySelector('.fit-av img').src = `assets/${c.avatar}.jpg`;
  fitDlg.querySelector('.fit-name').textContent = c.name;
  fitDlg.querySelector('.fit-handle').textContent = c.handle;
  fitInput.value = '';
  fitSend.disabled = true;
  clearTimeout(fitCloseT);
  fit.hidden = false;
  void fit.offsetWidth;   // start from the hidden pose so the enter transition runs
  fit.classList.add('in');
  fitInput.focus();
}

function closeFit(sent) {
  if (!fitOpen()) return;
  const id = fitId;
  fit.classList.remove('in');
  clearTimeout(fitCloseT);
  fitCloseT = setTimeout(() => { fit.hidden = true; }, 260);
  if (!sent) return;
  api.notFitFeedback(id, fitInput.value.trim());
  modal.querySelectorAll(`.nc.row[data-id="${id}"] .r-why`)
    .forEach(b => { b.outerHTML = '<span class="r-sent">Feedback sent</span>'; });
}

fitInput.addEventListener('input', () => { fitSend.disabled = !fitInput.value.trim(); });
fit.addEventListener('click', e => {
  if (e.target === fit) return closeFit();   // backdrop = Cancel
  const act = e.target.closest('[data-fit]')?.dataset.fit;
  if (act === 'cancel') closeFit();
  else if (act === 'send' && !fitSend.disabled) closeFit(true);
});
// Keep Tab inside the dialog
fit.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const els = [...fitDlg.querySelectorAll('button:not(:disabled), textarea')];
  const i = els.indexOf(document.activeElement);
  e.preventDefault();
  els[(i + (e.shiftKey ? -1 : 1) + els.length) % els.length].focus();
});

// ---------- Start ----------
if (api.sent()) showSuccess(api.sent(), true);   // saved as sent: reopens on the success screen
setOpen(true);
