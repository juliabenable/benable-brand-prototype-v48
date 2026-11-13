import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useNavigate, useParams } from 'react-router-dom';
import { NF_SHELL, NF_STATES } from '../data/newFlowHtml.js';
import NfForkBar from './NfForkBar.jsx';
import { forks } from '../components/pulse/forks.js';
import { monthsRev } from '../months/monthsEngine.js';
import { setPulseDay } from '../components/pulse/CampaignPulse.jsx';
import NpsAsk from '../components/nps/NpsAsk.jsx';
import NpsCorner from '../components/nps/NpsCorner.jsx';
import { nps } from '../components/nps/npsStore.js';
import '../styles/newflow-extra.css';
import '../styles/newflow-production.css';
import '../styles/variants.css';
import '../styles/productHooks.css';
import { enhanceVariants } from '../variants/briefVariants.js';
import { enhanceProductHooks } from '../variants/productHooks.js';

/**
 * First-part flow on the NEW production chrome (Aug 18 2026 capture).
 *
 * Architecture (round 2, after Julia's interactivity feedback):
 * - Each route renders a BASE PAGE (captured <main>) + optionally a MODAL
 *   overlay (captured body-tail fragment). Opening a modal never swaps the
 *   page behind it.
 * - A live-interaction layer (enhance*) attaches real behavior by mutating
 *   the captured DOM directly: product selection, variant chips, the sets
 *   builder (data-driven from LIVE.sets), who-gets menus, steppers, tier
 *   cards, inline brief editing. Templates are lifted at runtime from the
 *   captured states themselves, so every pixel stays production.
 * - The router click-handler only handles NAVIGATION; interactive elements
 *   stop propagation in their own listeners.
 */

/* ---------------- captured-fragment helpers ---------------- */

const parseCache = new Map();
function frag(stateKey, part = 'main') {
  const cacheKey = stateKey + ':' + part;
  if (!parseCache.has(cacheKey)) {
    const html = (NF_STATES[stateKey] || {})[part] || '';
    const doc = new DOMParser().parseFromString('<div id="__w">' + html + '</div>', 'text/html');
    parseCache.set(cacheKey, doc.getElementById('__w'));
  }
  return parseCache.get(cacheKey);
}
const pick = (stateKey, sel, part = 'main') => frag(stateKey, part).querySelector(sel);
const pickAll = (stateKey, sel, part = 'main') => [...frag(stateKey, part).querySelectorAll(sel)];

/* ---------------- live prototype state (module-level, survives navigation) ---------------- */

function seedProducts(stateKey, setIndex = 0) {
  const cards = pickAll(stateKey, '.product-set-card');
  const card = cards[setIndex];
  if (!card) return [];
  return [...card.querySelectorAll('.product-set-card__product-entry')]
    .filter((e) => !e.querySelector('.product-set-card__add-products'))
    .map((e) => ({
      name: (e.querySelector('article > p') || e).textContent.trim(),
      html: e.outerHTML,
    }));
}

const LIVE = (typeof window !== 'undefined' ? (window.__nfLive = {}) : {});
Object.assign(LIVE, {
  sets: null,          // [{mode:'all'|'choose', pick:1, products:[{name, html}]}]
  addTarget: 0,        // which set an open Add Products modal fills
  modalSel: null,      // Map(name -> {variants}) while the add modal is open
  gridSel: new Map(),  // simple-grid selection
  variantSel: {},      // productName -> Set(active values)
  optionsFor: null,    // product ctx while the options modal is open {name, price, img, from}
  tier: 0,
  count: 10,
  briefEdits: {},      // data-edit-section -> edited text (kept across toggles)
  variants: null,      // creator variants on the brief: [{name, creators, platform, posts, ideas[], talking[]}]
  variantActive: 0,    // which variant tab is open
  productHooks: null,  // hooks + instructions per product on the brief: [{product, hooks[], instructions[]}]
  productHooksActive: 0, // which product tab is open
  gcMode: false,       // true while walking the gift-card flow (entered via gc-overview)
  gcLocation: null,    // 'Tokyo Restaurant' | 'Paris Restaurant'
  gcAmount: 100,       // 50 | 100 | 150 | number typed under "Other"
});

function ensureSets(alias) {
  if (LIVE.sets) return;
  if (alias === 'adv-set1') {
    LIVE.sets = [{ mode: 'all', pick: 1, products: seedProducts('11-advanced-set1-populated', 0) }];
  } else if (alias === 'adv-2sets') {
    LIVE.sets = [
      { mode: 'all', pick: 1, products: seedProducts('13-advanced-2sets-choose-pickcount', 0) },
      { mode: 'choose', pick: 1, products: seedProducts('13-advanced-2sets-choose-pickcount', 1) },
    ];
  } else {
    LIVE.sets = [{ mode: 'all', pick: 1, products: [] }];
  }
}

/* Variant data. Sunlit + Moonmilk are the real production option sets; the
   rest are plausible demo values (production's demo catalog wasn't walked
   product-by-product — flagged for a later capture pass if needed). */
const VARIANTS = {
  'Sunlit Skin Tint SPF 40': { group: 'Shade', values: ['Fair', 'Light', 'Medium', 'Deep'], unavailable: ['Deep'] },
  'Moonmilk Lip Treatment': { group: 'Tint', values: ['Clear', 'Rose', 'Cocoa'] },
  'Riviera Linen Blazer': { group: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
  'Column Knit Dress': { group: 'Size', values: ['XS', 'S', 'M', 'L'] },
  'Studio Silk Scarf': { group: 'Colorway', values: ['Sage', 'Terracotta', 'Slate'] },
  'Sculpt Mini Shoulder Bag': { group: 'Color', values: ['Butter', 'Espresso', 'Crimson'] },
};
const hasVariants = (name) => !!VARIANTS[name];

/* ---------------- screens ---------------- */

const PAGES = {
  overview: '01-campaigns-overview',
  'overview-completed': '20-campaigns-overview-completed-tab',
  'overview-after': '26-overview-after-launch',
  step1: '02-create-step1-intro',
  step2: '36-step2-new-setup', // Aug 19 layout (UGC for Your Brand + Hybrid cards); 03 = the Aug 18 original
  'gc-overview': '46-overview-locations-grouped',
  'gc-overview-tokyo': '48-overview-tokyo-filter',
  'gc-step2': '37-step2-giftcard-enabled',
  'gc-location': '38-giftcard-location',
  'gc-amount': '40-giftcard-amount',
  'gc-brief': '44-giftcard-brief',
  step3: '04-create-step3-products',
  adv: '05-create-advanced-default',
  'adv-set1': '05-create-advanced-default',
  'adv-2sets': '05-create-advanced-default',
  'adv-who': '05-create-advanced-default',
  brief: '15-brief-review-full',
  'brief-edit-about': '15-brief-review-full',
  'brief-edit-note': '15-brief-review-full',
  'draft-resume': '21-draft-resume-92',
  match: '18-find-creators-prefs',
  'match-how': '19-find-creators-howwork-open',
  'launch-t0': '22-launch-t0',
  launched: '23-launch-t1',
  'launched-content': '25-launched-content-tab',
  settings: '31-settings',
  generating: null,
};
// modal overlay routes -> which captured tail supplies the overlay
const MODALS = {
  'm-add': '07-addproducts-modal',
  'm-add2': '08-addproducts-2selected',
  'm-opts': '09-available-options-modal',
  'm-add3': '10-addproducts-3selected-variantpill',
  'm-add-dim': '12-addproducts-alreadyinset',
};
const ADV_FAMILY = new Set(['adv', 'adv-set1', 'adv-2sets', 'adv-who']);
const GC_FAMILY = new Set(['gc-overview', 'gc-overview-tokyo', 'gc-step2', 'gc-location', 'gc-amount', 'gc-brief']);
const LAUNCHED_FAMILY = new Set(['launched', 'launched-content', 'overview-after', 'launch-t0']);

/* ---------------- months mode (directions A + C, Sep 8 study) ----------------
   When the MODEL fork is 'months', the captured wizard keeps its screens and
   changes its clock: the intro stops promising "content in days", the setup
   screen names the month being planned, and the launch confirmation carries the
   two pace dates. The month comes from the /nf/months overview (LIVE.monthsTarget). */
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/* URL overrides (?model= ?embed= ?mmonth= ?mnum= ?mtoday=) let the handoff page frame the wizard
   and the launch screen in both versions side by side without touching the shared forks store */
const qs = () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const isEmbed = () => qs().has('embed');
const monthsMode = () => (qs().get('model') ? qs().get('model') === 'months' : forks.get('model') === 'months');
function enhanceMonthsCopy(root, screen) {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('nf-embed', isEmbed());
  // "Prod today" on the Months page (rev = before) leaves the captured production screens untouched
  if (!root || !monthsMode() || monthsRev() === 'before') return;
  const q = qs();
  const month = LIVE.monthsTarget || q.get('mmonth') || 'November';
  const number = LIVE.monthsNumber || Number(q.get('mnum')) || 1;
  const todayISO = LIVE.monthsToday || q.get('mtoday');
  // the campaign is 8 weeks in total and first content is expected at 6 (Julia, Oct 2): 42 days after launch, shown as the week's Monday;
  // dated from the Months page's "Today is" day when launched from there, else the real clock
  const d = todayISO ? new Date(todayISO + 'T12:00:00') : new Date(); d.setDate(d.getDate() + 42); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const firstWeek = `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getDate()}`;
  if (screen === 'step1') {
    // the intro is skipped in the new design (the overview tile is the start); kept honest if reached directly
    const feat = [...root.querySelectorAll('.intro-feature strong')].find((s) => /Content in days/.test(s.textContent));
    if (feat) {
      feat.textContent = 'First content in about six weeks';
      const p = feat.parentElement && feat.parentElement.querySelector('p');
      if (p) p.textContent = 'A campaign runs about eight weeks in all. Your first-content date is on your campaign page from the day you launch.';
    }
  }
  // setup (step2) is exactly production's: no heading or sentence change (Julia, Oct 2)
  if (screen === 'launched' && !root.querySelector('.nf-months-launchpace')) {
    const hero = root.querySelector('.sourcing-queue-confirmation-hero');
    if (!hero) return;
    const copy = hero.querySelector('.sourcing-queue-confirmation-copy p');
    if (copy && !/content ·/.test(copy.textContent)) copy.textContent = `Campaign ${number} | ${month} content · ${copy.textContent}`;
    const el = document.createElement('section');
    el.className = 'nf-months-launchpace';
    el.setAttribute('aria-label', 'Campaign timeline');
    /* Julia, Sep 24: production's white card; the first-content date leads, the 8 weeks are
       segments with the phases under them, and a tip names the one thing the brand controls */
    const PHASES = [['Match', 1], ['Ship', 2], ['Film', 2], ['Review', 1], ['Post', 2]];
    const BULB = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 12.4h3.6M6.7 14.4h2.6"/><path d="M8 1.6a4.4 4.4 0 0 0-2.5 8c.4.3.6.7.6 1.2v.1h3.8v-.1c0-.5.2-.9.6-1.2A4.4 4.4 0 0 0 8 1.6z"/></svg>';
    el.innerHTML = `<div class="lp-head"><div><div class="lp-k">First content expected</div><div class="lp-v">Week of ${firstWeek}</div></div><span class="lp-pill">Week 1 of 8</span></div>`
      + `<div class="lp-track" aria-hidden="true">${Array.from({ length: 8 }, (_, i) => `<span${i === 0 ? ' class="on"' : ''}></span>`).join('')}</div>`
      + `<div class="lp-phases">${PHASES.map(([label, weeks], i) => `<span style="grid-column: span ${weeks}"${i === 0 ? ' class="now"' : ''}>${label}</span>`).join('')}</div>`
      + `<div class="lp-tip"><span class="lp-bulb" aria-hidden="true">${BULB}</span><p><b>Quick tip:</b> the biggest thing that speeds up your campaign is approving creators and content as soon as we send them over.</p></div>`;
    hero.insertAdjacentElement('afterend', el);
  }
}

/* ---------------- brand NPS, moment 1 (Tony's Sep 21 proposal) ----------------
   "When the campaign launches and we're actively in sourcing": the one moment
   the brand is guaranteed to be in the portal, so the ask rides on the launch
   confirmation itself. A card in the confirmation column, never a pop-up.
   Same React component as the tracker's rail asks, mounted into an injected
   host (the captured DOM is not React's); the root is dropped on screen change. */
let npsRoot = null;
let npsHost = null;
function LaunchNps() {
  const [, tick] = useState(0);
  useEffect(() => forks.sub(() => tick((t) => t + 1)), []);
  if (forks.get('nps') === 'off') return null;
  /* Airtable's corner slide-up (Sep 24) portals to body; the host stays empty and hides itself */
  return forks.get('npsui') === 'corner' ? <NpsCorner moment="launch" /> : <NpsAsk moment="launch" skin="nf" />;
}
function mountLaunchNps(root) {
  if (root.querySelector('[data-nf-nps]')) return;
  const next = root.querySelector('.sourcing-queue-confirmation-next-card');
  if (!next) return;
  const host = document.createElement('div');
  host.setAttribute('data-nf-nps', '1');
  host.style.cssText = 'width:100%;box-sizing:border-box;text-align:left';
  /* ABOVE "What happens next": that list reads as the end of the page, and this
     is the one moment the brand is guaranteed to be in the portal. On an 800px
     laptop the card's head and question peek over the fold as the scroll cue. */
  next.insertAdjacentElement('beforebegin', host);
  npsHost = host;
  npsRoot = createRoot(host);
  npsRoot.render(<LaunchNps />);
}
/* the host leaves with its root, so a re-run of the enhancement pass (StrictMode
   double effects, or coming back to the screen) always builds a fresh pair */
function unmountLaunchNps() {
  if (!npsRoot) return;
  const r = npsRoot;
  const h = npsHost;
  npsRoot = null;
  npsHost = null;
  if (h) h.remove();
  setTimeout(() => r.unmount(), 0);
}

/* ---------------- generic DOM helpers ---------------- */

function on(el, fn) {
  if (!el || el.__nfWired) return;
  el.__nfWired = true;
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(e); });
}

const CHECK_ICON = () =>
  pick('08-addproducts-2selected', '.product-selection-indicator--selected', 'modal')?.innerHTML || '';

function setCardSelected(card, selected, summaryText) {
  card.classList.toggle('selected', selected);
  card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  const ind = card.querySelector('.product-selection-indicator');
  if (ind) {
    ind.classList.toggle('product-selection-indicator--selected', selected);
    ind.classList.toggle('product-selection-indicator--idle', !selected);
    ind.innerHTML = selected ? CHECK_ICON() : '';
  }
  const summary = card.querySelector('.product-card-variant-summary');
  if (summary && summaryText !== undefined) summary.textContent = summaryText;
}

function cardInfo(card) {
  return {
    name: card.querySelector('.product-card-copy strong')?.textContent.trim() || '',
    price: card.querySelector('.product-card-price span')?.textContent.trim() || '',
    img: card.querySelector('.product-card-media img')?.getAttribute('src') || '',
  };
}

function variantSummary(name) {
  const v = VARIANTS[name];
  const sel = LIVE.variantSel[name];
  if (!v) return undefined;
  const available = v.values.filter((x) => !(v.unavailable || []).includes(x));
  const n = sel ? sel.size : available.length;
  return n >= available.length ? 'All variants' : `${n} variant${n === 1 ? '' : 's'}`;
}

/* ================= enhancement layers ================= */

/* ---- product pickers (step3 grid + add-products modal) ---- */
function enhancePicker(root, ctx, api) {
  // selection model for this surface
  const sel = ctx.sel;
  root.querySelectorAll('.product-card').forEach((card) => {
    const { name } = cardInfo(card);
    if (ctx.already && ctx.already.has(name)) {
      // production's "Already in another set" treatment, lifted from capture 12
      if (!card.textContent.includes('Already in another set')) {
        const dimTpl = [...frag('12-addproducts-alreadyinset', 'modal').querySelectorAll('.product-card')]
          .find((c) => c.textContent.includes('Already in another set'));
        if (dimTpl) {
          card.className = dimTpl.className;
          const flag = [...dimTpl.querySelectorAll('*')].find((el) => el.children.length === 0 && el.textContent.trim() === 'Already in another set');
          const media = card.querySelector('.product-card-media');
          if (flag && media) media.appendChild(flag.cloneNode(true));
          card.setAttribute('disabled', '');
        }
      }
      return;
    }
    setCardSelected(card, sel.has(name), sel.has(name) ? variantSummary(name) : hasVariants(name) ? 'Choose options' : undefined);
    on(card, () => {
      if (hasVariants(name)) {
        // fresh pick opens the chooser; clicking a SELECTED variant product
        // REOPENS it in edit mode (Remove product / Save footer — capture 35)
        api.openOptions({ ...cardInfo(card), editing: sel.has(name) }, ctx.kind);
        return;
      }
      if (sel.has(name)) sel.delete(name);
      else sel.set(name, {});
      setCardSelected(card, sel.has(name), undefined);
      syncPickerFooter(root, ctx);
    });
  });

  // live search filter (grid: "Search products…" / modal: "Product Name…")
  const search = root.querySelector('input[placeholder*="Search products"], input[placeholder*="Product Name"]');
  const applyFilter = () => {
    const q = (search?.value || '').trim().toLowerCase();
    let visible = 0;
    root.querySelectorAll('.product-card').forEach((card) => {
      const show = !q || cardInfo(card).name.toLowerCase().includes(q);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    const shown = [...root.querySelectorAll('strong, span, div')].find((el) => el.children.length === 0 && /^\d+ products shown$/.test(el.textContent.trim()));
    if (shown) shown.textContent = `${visible} products shown`;
  };
  if (search && !search.__nfWired) {
    search.__nfWired = true;
    search.addEventListener('input', applyFilter);
    search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilter(); } });
    search.addEventListener('click', (e) => e.stopPropagation());
  }
  const submitBtn = root.querySelector('.product-searchbar-submit');
  if (submitBtn) on(submitBtn, applyFilter);

  // "Select all shown" (modal toolbar)
  const selAll = root.querySelector('.product-results-select-all');
  if (selAll) on(selAll, () => {
    root.querySelectorAll('.product-card').forEach((card) => {
      if (card.style.display === 'none') return;
      const { name } = cardInfo(card);
      if (ctx.already && ctx.already.has(name)) return;
      if (!sel.has(name)) {
        if (hasVariants(name)) {
          const v = VARIANTS[name];
          LIVE.variantSel[name] = new Set(v.values.filter((x) => !(v.unavailable || []).includes(x)));
        }
        sel.set(name, {});
        setCardSelected(card, true, variantSummary(name));
      }
    });
    syncPickerFooter(root, ctx);
  });

  syncPickerFooter(root, ctx);
}

function syncPickerFooter(root, ctx) {
  const n = ctx.sel.size;
  // footer count ("0 selected") — same markup on grid + modal
  const count = [...root.querySelectorAll('span, strong, div')].find((el) =>
    el.children.length === 0 && /^\d+ selected$/.test(el.textContent.trim())
  );
  if (count) count.textContent = `${n} selected`;
  // Clear link appears next to the count once something is selected (per
  // capture 10); inject/remove it to match, and never touch page-level Clears.
  if (ctx.kind === 'modal' && count) {
    let clearEl = [...root.querySelectorAll('[data-nf-clear]')][0];
    if (n > 0 && !clearEl) {
      const tpl = [...frag('10-addproducts-3selected-variantpill', 'modal').querySelectorAll('button, a, span')]
        .find((el) => el.children.length === 0 && el.textContent.trim() === 'Clear');
      clearEl = tpl ? tpl.cloneNode(true) : Object.assign(document.createElement('button'), { textContent: 'Clear', type: 'button' });
      clearEl.setAttribute('data-nf-clear', '1');
      count.after(clearEl);
      on(clearEl, () => {
        ctx.sel.clear();
        root.querySelectorAll('.product-card').forEach((c) => {
          const nm = cardInfo(c).name;
          if (ctx.already && ctx.already.has(nm)) return;
          setCardSelected(c, false, hasVariants(nm) ? 'Choose options' : undefined);
        });
        syncPickerFooter(root, ctx);
      });
    }
    if (n === 0 && clearEl) clearEl.remove();
  }
  const cta = [...root.querySelectorAll('button')].find((el) => {
    const t = el.textContent.trim();
    return ctx.kind === 'grid' ? t.includes('Create My Campaign') : t === 'Add';
  });
  if (cta) {
    cta.disabled = n === 0;
    if (n > 0) cta.removeAttribute('disabled');
    else cta.setAttribute('disabled', '');
  }
}

/* ---- options modal (variant chips) ---- */
function buildOptionsOverlay(product) {
  // template: fresh pick = the Sunlit dialog from capture 09's stack;
  // editing an already-selected product = capture 35 (Remove product / Save)
  let tpl;
  if (product.editing && NF_STATES['35-options-reopen-selected']?.modal) {
    tpl = frag('35-options-reopen-selected', 'modal').firstElementChild;
  } else {
    const wraps = pickAll('09-available-options-modal', '.brand-portal-modal', 'modal');
    tpl = wraps[wraps.length - 1];
  }
  const node = tpl.cloneNode(true);
  // populate product identity
  const img = node.querySelector('.brand-portal-modal__content img');
  if (img) { img.src = product.img; img.alt = product.name; }
  const title = [...node.querySelectorAll('h1,h2,h3,strong,p')].find((el) => el.textContent.trim() === 'Sunlit Skin Tint SPF 40');
  if (title) title.textContent = product.name;
  const price = [...node.querySelectorAll('*')].find((el) => el.children.length === 0 && el.textContent.trim() === '$38');
  if (price) price.textContent = product.price;
  // rebuild the option group
  const v = VARIANTS[product.name] || { group: 'Options', values: ['Default'] };
  const group = node.querySelector('.variant-option-group');
  if (group) {
    const legend = group.querySelector('legend');
    if (legend) legend.textContent = v.group;
    const valuesWrap = group.querySelector('.variant-option-group__values');
    const activeTpl = valuesWrap.querySelector('.variant-option-chip.active');
    const disabledTpl = [...valuesWrap.querySelectorAll('.variant-option-chip')].find((c) => !c.classList.contains('active'));
    valuesWrap.innerHTML = '';
    const current = LIVE.variantSel[product.name];
    v.values.forEach((val) => {
      const un = (v.unavailable || []).includes(val);
      const chip = (un && disabledTpl ? disabledTpl : activeTpl).cloneNode(true);
      const label = [...chip.querySelectorAll('span')].find((s) => !s.className.includes('__check'));
      if (label) label.textContent = val;
      chip.title = val;
      const isActive = !un && (current ? current.has(val) : true);
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      let checkSpan = chip.querySelector('.variant-option-chip__check');
      if (!isActive && checkSpan) checkSpan.remove();
      if (isActive && !checkSpan) {
        const src = activeTpl.querySelector('.variant-option-chip__check');
        if (src) chip.insertBefore(src.cloneNode(true), chip.firstChild);
      }
      valuesWrap.appendChild(chip);
    });
  }
  return node;
}

function enhanceOptionsOverlay(node, product, api) {
  const v = VARIANTS[product.name] || { values: [] };
  const avail = v.values.filter((x) => !(v.unavailable || []).includes(x));
  // chips mutate a WORKING COPY — production only commits on Save/Add,
  // closing the dialog discards
  const temp = new Set(LIVE.variantSel[product.name] ? [...LIVE.variantSel[product.name]] : avail);
  node.querySelectorAll('.variant-option-chip').forEach((chip) => {
    const val = chip.title;
    if ((v.unavailable || []).includes(val) || chip.disabled) return;
    on(chip, () => {
      const isActive = temp.has(val);
      if (isActive && temp.size === 1) return; // production keeps ≥1 option
      if (isActive) temp.delete(val); else temp.add(val);
      chip.classList.toggle('active', !isActive);
      chip.setAttribute('aria-pressed', !isActive ? 'true' : 'false');
      let check = chip.querySelector('.variant-option-chip__check');
      if (isActive && check) check.remove();
      if (!isActive && !check) {
        const src = node.querySelector('.variant-option-chip.active .variant-option-chip__check') || pick('09-available-options-modal', '.variant-option-chip__check', 'modal');
        if (src) chip.insertBefore(src.cloneNode(true), chip.firstChild);
      }
    });
  });
  [...node.querySelectorAll('button')].forEach((b) => {
    const t = b.textContent.trim();
    if (t === 'Add to campaign' || t === 'Save') on(b, () => api.commitOptions(product, temp));
    else if (t === 'Remove product') on(b, () => api.removeProduct(product));
    else if (t === 'Cancel' || (b.getAttribute('aria-label') || '').includes('Close')) on(b, () => api.closeOptions());
  });
  // scrim click (outside the dialog content) closes
  if (!node.__nfScrim) {
    node.__nfScrim = true;
    node.addEventListener('click', (e) => {
      if (!e.target.closest('.brand-portal-modal__content')) { e.stopPropagation(); api.closeOptions(); }
    });
  }
}

/* ---- advanced options: data-driven sets builder ---- */
function renderSets(root) {
  const list = root.querySelector('.product-set-card')?.parentElement;
  if (!list) return;
  const emptyTpl = pick('05-create-advanced-default', '.product-set-card');
  const fullTpl = pick('11-advanced-set1-populated', '.product-set-card');
  const chooseBtnTpl = pickAll('13-advanced-2sets-choose-pickcount', '.product-set-mode-select')[1];
  const allBtnTpl = pick('05-create-advanced-default', '.product-set-mode-select');
  const ruleTpl = pick('13-advanced-2sets-choose-pickcount', '.product-set-card__choice-rule');
  const menuTpl = pick('06-create-advanced-whogets-open', '.product-set-mode-select__menu');

  // wipe current set cards (keep the "New Product Set" button + siblings after)
  [...list.querySelectorAll(':scope > .product-set-card, :scope > [class*="product-set-card"]')]
    .filter((el) => el.classList.contains('product-set-card'))
    .forEach((el) => el.remove());
  const anchor = [...list.children].find((el) => el.textContent.trim().includes('New Product Set')) || null;

  LIVE.sets.forEach((set, i) => {
    const card = (set.products.length ? fullTpl : emptyTpl).cloneNode(true);
    const title = card.querySelector('h1,h2,h3,strong,[class*="__title"]');
    if (title && /Product Set/.test(title.textContent)) title.textContent = `Product Set ${i + 1}`;

    // mode select button
    const modeHost = card.querySelector('.product-set-mode-select')?.parentElement;
    if (modeHost) {
      const oldBtn = card.querySelector('.product-set-mode-select');
      const btn = (set.mode === 'choose' && chooseBtnTpl ? chooseBtnTpl : allBtnTpl).cloneNode(true);
      btn.querySelector('.product-set-mode-select__chevron')?.classList.remove('product-set-mode-select__chevron--open');
      oldBtn.replaceWith(btn);
      on(btn, () => toggleWhoMenu(root, card, i));
    }

    // choice rule (pick count) for choose mode
    card.querySelector('.product-set-card__choice-rule')?.remove();
    if (set.mode === 'choose' && ruleTpl) {
      const rule = ruleTpl.cloneNode(true);
      const stepSpan = rule.querySelector('.count-stepper > span');
      const [minus, plus] = rule.querySelectorAll('.count-stepper-button');
      const max = Math.max(set.products.length, 1);
      set.pick = Math.min(Math.max(set.pick, 1), max);
      const syncRule = () => {
        stepSpan.textContent = String(set.pick);
        if (set.pick <= 1) minus.setAttribute('disabled', ''); else minus.removeAttribute('disabled');
        if (set.pick >= max) plus.setAttribute('disabled', ''); else plus.removeAttribute('disabled');
      };
      on(minus, () => { if (set.pick > 1) { set.pick--; syncRule(); syncRail(root); } });
      on(plus, () => { if (set.pick < max) { set.pick++; syncRule(); syncRail(root); } });
      syncRule();
      const header = card.querySelector('header') || card.firstElementChild;
      header.after(rule);
    }

    // product entries — NOTE: the "Add Products" tile is itself an
    // __product-entry wrapping a .product-set-card__add-products button,
    // so entry wipes must skip it.
    const productsWrap = card.querySelector('.product-set-card__products');
    if (productsWrap) {
      [...productsWrap.querySelectorAll('.product-set-card__product-entry')]
        .filter((el) => !el.querySelector('.product-set-card__add-products'))
        .forEach((el) => el.remove());
      const addEntry = [...productsWrap.children].find((el) => el.querySelector?.('.product-set-card__add-products'));
      set.products.forEach((p) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = p.html;
        const entry = tmp.firstElementChild;
        const x = entry.querySelector('button[aria-label*="Remove"], .product-set-card__product-remove, button');
        if (x) on(x, () => { set.products = set.products.filter((q) => q !== p); renderSets(root); });
        productsWrap.insertBefore(entry, addEntry || null);
      });
      const addBtn = productsWrap.querySelector('.product-set-card__add-products');
      if (addBtn) on(addBtn, () => nfNav.openAddModal(i));
    }

    // trash = delete set (keep at least one)
    const trash = card.querySelector('button[aria-label*="elete"], button[aria-label*="emove set"], header button:last-of-type');
    if (trash && trash.textContent.trim() === '') {
      on(trash, () => {
        if (LIVE.sets.length > 1) { LIVE.sets.splice(i, 1); renderSets(root); }
        else { LIVE.sets[0] = { mode: 'all', pick: 1, products: [] }; renderSets(root); }
      });
    }

    list.insertBefore(card, anchor);
  });

  syncRail(root);
}

function toggleWhoMenu(root, card, i) {
  const existing = card.querySelector('.product-set-mode-select__menu');
  root.querySelectorAll('.product-set-mode-select__menu').forEach((m) => m.remove());
  root.querySelectorAll('.product-set-mode-select__chevron--open').forEach((c) => c.classList.remove('product-set-mode-select__chevron--open'));
  if (existing) return; // was open -> now closed
  const menuTpl = pick('06-create-advanced-whogets-open', '.product-set-mode-select__menu');
  if (!menuTpl) return;
  const menu = menuTpl.cloneNode(true);
  const btn = card.querySelector('.product-set-mode-select');
  btn.querySelector('.product-set-mode-select__chevron')?.classList.add('product-set-mode-select__chevron--open');
  btn.parentElement.appendChild(menu);
  // mark the current mode's check
  const items = [...menu.querySelectorAll('[role="menuitem"], button')];
  items.forEach((item) => {
    const isAll = item.textContent.includes('Creators get all');
    const isChoose = item.textContent.includes('Creators choose');
    if (!isAll && !isChoose) return;
    on(item, () => {
      LIVE.sets[i].mode = isChoose ? 'choose' : 'all';
      renderSets(root);
    });
  });
}

function syncRail(root) {
  // Creator's view rail = aside.product-set-preview; rows live in
  // .product-set-preview__sets as .product-set-preview__set entries.
  const rail = root.querySelector('aside.product-set-preview');
  if (!rail) return;
  const emptyAside = pick('05-create-advanced-default', 'aside.product-set-preview');
  const rowAll = pick('11-advanced-set1-populated', '.product-set-preview__set');
  const rowChoose = pickAll('13-advanced-2sets-choose-pickcount', '.product-set-preview__set')
    .find((r) => r.textContent.includes('Pick')) || rowAll;
  const setsWrapTpl = pick('11-advanced-set1-populated', '.product-set-preview__sets');

  const anyProducts = LIVE.sets.some((s) => s.products.length);
  if (!anyProducts) {
    if (emptyAside) rail.innerHTML = emptyAside.innerHTML;
    return;
  }
  // header stays; swap the body for a fresh __sets list
  const header = rail.querySelector('header');
  rail.innerHTML = '';
  if (header) rail.appendChild(header);
  else if (emptyAside?.querySelector('header')) rail.appendChild(emptyAside.querySelector('header').cloneNode(true));
  const setsWrap = (setsWrapTpl || document.createElement('div')).cloneNode(false);
  LIVE.sets.forEach((set) => {
    if (!set.products.length) return;
    // row anatomy: .__set-heading > strong("Get all 3") + span("Everyone"|"Choose"), then p > spans(names)
    const row = (set.mode === 'choose' ? rowChoose : rowAll).cloneNode(true);
    const headEl = row.querySelector('.product-set-preview__set-heading strong');
    if (headEl) headEl.textContent = set.mode === 'choose' ? `Pick ${set.pick} of ${set.products.length}` : `Get all ${set.products.length}`;
    const nameEl = row.querySelector('p');
    if (nameEl) nameEl.textContent = set.products.map((p) => p.name).join(', ');
    setsWrap.appendChild(row);
  });
  rail.appendChild(setsWrap);
}

/* ---- matching preferences ---- */
function enhanceMatching(root) {
  const tiers = [...root.querySelectorAll('.draft-creator-tier-option')];
  const apply = () => {
    tiers.forEach((b, i) => {
      const selWanted = i === LIVE.tier;
      b.classList.toggle('draft-creator-tier-option--selected', selWanted);
      b.setAttribute('aria-pressed', selWanted ? 'true' : 'false');
      const radio = b.querySelector('.draft-creator-tier-radio');
      if (radio) radio.classList.toggle('draft-creator-tier-radio--selected', selWanted);
    });
  };
  tiers.forEach((b, i) => on(b, () => { LIVE.tier = i; apply(); }));
  apply();

  const stepper = root.querySelector('.count-stepper');
  if (stepper) {
    const span = stepper.querySelector('span');
    const [minus, plus] = stepper.querySelectorAll('.count-stepper-button');
    const helper = root.querySelector('.draft-creator-matching-helper');
    const sync = () => {
      span.textContent = String(LIVE.count);
      if (LIVE.count <= 1) minus.setAttribute('disabled', ''); else minus.removeAttribute('disabled');
      if (LIVE.count >= 10) plus.setAttribute('disabled', ''); else plus.removeAttribute('disabled');
      if (helper) helper.textContent = `We'll recommend up to ${LIVE.count} creators for you to review`;
    };
    on(minus, () => { if (LIVE.count > 1) { LIVE.count--; sync(); } });
    on(plus, () => { if (LIVE.count < 10) { LIVE.count++; sync(); } });
    sync();
  }
}

/* ---- brief inline editing ----
   Every section's Edit maps to production behavior (Aug 19 capture round):
   about/note swap to captures 16/17 (brief page only — their content is that
   campaign's), postRequirements/guidelines swap to captures 28/29 (content is
   campaign-neutral, shared by brief AND draft-resume), receive NAVIGATES to
   the product picker (that's what production does). Done restores the
   ORIGINAL live node, so each page keeps its own content. */
function enhanceBrief(root, opts = {}) {
  const aboutNoteCaptured = opts.aboutNoteCaptured !== false;
  root.querySelectorAll('button').forEach((btn) => {
    if (btn.textContent.trim() !== 'Edit') return;
    if (btn.dataset.nfVariants) return; // owned by the creator-variants card
    on(btn, () => {
      const section = btn.closest('section.draft-card');
      if (!section) return;
      const key = ['about', 'note', 'receive', 'postRequirements', 'guidelines']
        .find((k) => section.querySelector(`[data-edit-section="${k}"]`)) || '';
      if (key === 'receive') {
        // production: products → reopen the picker; gift card → in-place modal (capture 45)
        if (opts.gift) openGiftModal(root);
        else nfNav.go('step3');
        return;
      }
      const captured = opts.gift ? null : {
        about: aboutNoteCaptured ? '16-brief-about-editing' : null,
        note: aboutNoteCaptured ? '17-brief-note-editing' : null,
        postRequirements: '28-brief-edit-postreq',
        guidelines: '29-brief-edit-guidelines',
      }[key];
      let replacement = null;
      if (captured) {
        // the edit-state capture has exactly one card carrying a Done button
        replacement = pickAll(captured, 'section.draft-card').find((s) =>
          [...s.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Done')
        );
      }
      if (replacement) {
        const node = replacement.cloneNode(true);
        const original = section;
        section.replaceWith(node);
        wireEditingSection(root, node, key, original);
      } else {
        // sections without a captured edit state: toggle editability in place
        const editing = btn.textContent.trim() === 'Edit';
        if (editing) {
          btn.textContent = 'Done';
          section.querySelectorAll('p, li, blockquote').forEach((p) => { p.contentEditable = 'true'; });
        } else {
          btn.textContent = 'Edit';
          section.querySelectorAll('[contenteditable]').forEach((p) => p.removeAttribute('contenteditable'));
        }
      }
    });
  });
}

function wireEditingSection(root, node, key, original) {
  const FIELD = key === 'about' ? 'about_brand' : 'note_text';
  node.querySelectorAll('span[style*="font-family"], [contenteditable]').forEach((s) => { s.contentEditable = 'true'; });

  // note photo ✕
  const photoX = node.querySelector('button[aria-label*="Remove custom note photo"]');
  if (photoX) on(photoX, () => { (photoX.closest('figure, [class*="photo"], [class*="avatar"]') || photoX.parentElement).remove(); });

  // list-row dismiss ✕ (ideas / suggestions / dos / don'ts): icon-only buttons in text rows
  [...node.querySelectorAll('button')].forEach((b) => {
    if (b.textContent.trim() !== '' || !b.querySelector('svg') || b === photoX) return;
    if (b.closest('.draft-post-platform-option, .draft-post-platform-chip')) return;
    const row = b.parentElement;
    if (row && row.textContent.trim()) on(b, () => row.remove());
  });

  // "+ Add an idea / a suggestion / a do / a don't"
  [...node.querySelectorAll('button.draft-list-add')].forEach((add) => {
    on(add, () => {
      const rowTpl = add.previousElementSibling;
      if (!rowTpl) return;
      const row = rowTpl.cloneNode(true);
      const textEl = [...row.querySelectorAll('*')].find((el) => el.children.length === 0 && el.textContent.trim());
      if (textEl) { textEl.textContent = ''; textEl.contentEditable = 'true'; }
      const x = [...row.querySelectorAll('button')].find((bb) => bb.textContent.trim() === '' && bb.querySelector('svg'));
      if (x) { x.__nfWired = false; on(x, () => row.remove()); }
      add.before(row);
      if (textEl) textEl.focus();
    });
  });

  // platform choice (Creator's choice / TikTok only / Instagram only)
  const platforms = [...node.querySelectorAll('.draft-post-platform-option, .draft-post-platform-chip')];
  platforms.forEach((card) => {
    on(card, () => {
      platforms.forEach((c) => {
        const selected = c === card;
        [...c.classList].filter((cl) => cl.endsWith('--selected')).forEach((cl) => c.classList.remove(cl));
        c.querySelectorAll('[class*="draft-post-platform-radio"]').forEach((r) => {
          [...r.classList].filter((cl) => cl.endsWith('--selected')).forEach((cl) => r.classList.remove(cl));
        });
        if (selected) {
          c.classList.add((c.classList.contains('draft-post-platform-chip') ? 'draft-post-platform-chip' : 'draft-post-platform-option') + '--selected');
          const r = c.querySelector('[class*="draft-post-platform-radio"]');
          if (r) r.classList.add('draft-post-platform-radio--selected');
        }
        c.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    });
  });

  // "Add post" tile → production's Add-a-post modal (capture 30)
  const addTile = node.querySelector('.draft-recent-post-add-tile, button[aria-label="Add post"]');
  if (addTile) on(addTile, () => openAddPostModal(root));

  const applyEdits = () => {
    const span = node.querySelector(`[data-edit-field="${FIELD}"] span[contenteditable], [data-edit-field="${FIELD}"][contenteditable]`)
      || node.querySelector('span[contenteditable]');
    if (span && (key === 'about' || key === 'note')) LIVE.briefEdits[key] = span.textContent;
  };
  [...node.querySelectorAll('button')].forEach((b) => {
    if (b.textContent.trim() === 'Done') {
      on(b, () => {
        applyEdits();
        if (LIVE.briefEdits[key] && original) {
          const body = original.querySelector(`[data-edit-field="${FIELD}"] p`)
            || original.querySelector(`[data-edit-field="${FIELD}"]`)
            || original.querySelector('p');
          if (body) body.textContent = LIVE.briefEdits[key];
        }
        node.replaceWith(original);
      });
    }
  });
}

function openAddPostModal(root) {
  document.querySelectorAll('[data-nf-addpost]').forEach((el) => el.remove());
  const html = (NF_STATES['30-brief-about-addpost'] || {}).modal;
  if (!html) return;
  const holder = document.createElement('div');
  holder.setAttribute('data-nf-addpost', '1');
  holder.innerHTML = html;
  (root.closest('.nf') || document.body).appendChild(holder);
  const close = () => holder.remove();
  [...holder.querySelectorAll('button')].forEach((b) => {
    const t = b.textContent.trim();
    const aria = b.getAttribute('aria-label') || '';
    if (t === 'Cancel' || /close/i.test(aria)) on(b, close);
    else if (t === 'Add post') on(b, close); // prototype: adding closes without persisting
  });
  const input = holder.querySelector('input');
  const addBtn = [...holder.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Add post');
  if (input && addBtn && !input.__nfWired) {
    input.__nfWired = true;
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('input', () => {
      if (input.value.trim()) addBtn.removeAttribute('disabled');
      else addBtn.setAttribute('disabled', '');
    });
  }
  const wrap = holder.querySelector('.brand-portal-modal') || holder.firstElementChild;
  if (wrap && !wrap.__nfScrim) {
    wrap.__nfScrim = true;
    wrap.addEventListener('click', (e) => {
      if (!e.target.closest('.brand-portal-modal__content, [role="dialog"]')) { e.stopPropagation(); close(); }
    });
  }
}

/* ---- gift-card flow (captures 36-48, Aug 19) ---- */
function enhanceGcOverview(root) {
  // location filter pills route between the captured filter states
  [...root.querySelectorAll('.location-filters button')].forEach((pill) => {
    const t = pill.textContent.trim();
    on(pill, () => {
      if (t === 'Tokyo Restaurant') nfNav.go('gc-overview-tokyo');
      else if (t === 'All locations') nfNav.go('gc-overview');
      else if (t === 'Brand-wide') {
        // filter to brand-wide campaigns (same treatment as the Tokyo pill,
        // synthesized from the grouped page — the state wasn't captured)
        [...root.querySelectorAll('.location-filters button')].forEach((p) => {
          const active = p === pill;
          p.classList.toggle('active', active);
          p.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        [...root.querySelectorAll('section')].forEach((sec) => {
          const head = [...sec.querySelectorAll('*')].find((el) => el.children.length === 0 && /^(Tokyo Restaurant|Brand-wide)$/.test(el.textContent.trim()));
          if (!head) return;
          const isTokyoGroup = head.textContent.trim() === 'Tokyo Restaurant';
          if (sec.querySelector('.location-filters')) return; // never hide the page wrapper
          sec.style.display = isTokyoGroup ? 'none' : '';
        });
      }
    });
  });
  // group headers expand/collapse (aria-expanded + hidden panel)
  [...root.querySelectorAll('button[aria-expanded]')].forEach((btn) => {
    on(btn, () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      const panel = btn.closest('section')?.querySelector(':scope > div, :scope > ul') || btn.nextElementSibling;
      if (panel) panel.style.display = open ? 'none' : '';
      const chev = btn.querySelector('[class*="chevron"], svg');
      if (chev) chev.style.transform = open ? 'rotate(-90deg)' : '';
    });
  });
}

function enhanceGcLocation(root) {
  const cards = [...root.querySelectorAll('.location-card')];
  const apply = () => {
    cards.forEach((c) => {
      const selected = c.textContent.includes(LIVE.gcLocation || '');
      c.classList.toggle('location-card--selected', !!LIVE.gcLocation && selected);
      c.setAttribute('aria-pressed', !!LIVE.gcLocation && selected ? 'true' : 'false');
    });
    // the captured CTA is disabled until a location is picked (production gate)
    const cta = [...root.querySelectorAll('button')].find((b) => b.textContent.includes('Choose Gift Card Amount'));
    if (cta) {
      if (LIVE.gcLocation) cta.removeAttribute('disabled');
      else cta.setAttribute('disabled', '');
    }
  };
  cards.forEach((c) => on(c, () => {
    LIVE.gcLocation = c.textContent.includes('Tokyo') ? 'Tokyo Restaurant' : 'Paris Restaurant';
    apply();
  }));
  apply();
}

/* both the wizard page (.gift-card-option) and the brief's gift modal
   (.draft-gift-card-option) share this logic; the modal styles selection via
   aria-checked, the wizard via --selected */
const GC_OPT_SEL = '.gift-card-option, .draft-gift-card-option';
const gcOptValue = (o) => parseInt((o.textContent.match(/\d+/) || [0])[0], 10);

function gcPatchAmounts(scope, amt) {
  const label = `$${amt}.00`;
  [...scope.querySelectorAll('*')].forEach((el) => {
    if (el.children.length > 0 || el.closest(GC_OPT_SEL)) return;
    const t = el.textContent.trim();
    if (/^\$[\d,.]+$/.test(t)) el.textContent = label;
    else if (/^\$[\d,.]+ per creator$/.test(t)) el.textContent = `${label} per creator`;
    else if (/\$[\d,.]+ (Benable Collab Studio )?gift card/i.test(t)) el.textContent = t.replace(/\$[\d,.]+/, `$${amt}`);
  });
}

function enhanceGcAmount(root, scope) {
  const area = scope || root;
  const options = [...area.querySelectorAll(GC_OPT_SEL)];
  const customTpl = () => pick('42-giftcard-amount-other', '.gift-card-option--custom');
  const isCustomOpt = (o) => [...o.classList].some((c) => c.endsWith('--custom'));
  const applySel = () => {
    options.forEach((o) => {
      const val = isCustomOpt(o) ? 'other' : gcOptValue(o);
      const selected = LIVE.gcAmount === val || (isCustomOpt(o) && typeof LIVE.gcAmount === 'number' && ![50, 100, 150].includes(LIVE.gcAmount));
      o.classList.toggle('gift-card-option--selected', selected && o.classList.contains('gift-card-option'));
      if (o.getAttribute('role') === 'radio') o.setAttribute('aria-checked', selected ? 'true' : 'false');
    });
  };
  options.forEach((o) => {
    if (isCustomOpt(o)) {
      o.__nfOrig = o.innerHTML; // restore target when a preset is re-picked
      on(o, () => {
        // selecting Other swaps the label content for the $-input (capture 42)
        if (!o.querySelector('input')) {
          const tpl = customTpl();
          if (tpl) o.innerHTML = tpl.innerHTML;
        }
        if (o.classList.contains('gift-card-option')) o.classList.add('gift-card-option--selected');
        o.setAttribute('aria-checked', 'true');
        options.filter((x) => x !== o).forEach((x) => { x.classList.remove('gift-card-option--selected'); if (x.getAttribute('role') === 'radio') x.setAttribute('aria-checked', 'false'); });
        const inp = o.querySelector('input');
        if (inp && !inp.__nfWired) {
          inp.__nfWired = true;
          inp.addEventListener('click', (e) => e.stopPropagation());
          inp.addEventListener('input', () => {
            inp.style.width = Math.max(1, inp.value.length) + 'ch';
            const n = parseInt(inp.value.replace(/[^\d]/g, ''), 10);
            if (n) { LIVE.gcAmount = n; gcPatchAmounts(area, n); }
          });
        }
        if (inp) inp.focus();
      });
    } else {
      on(o, () => {
        LIVE.gcAmount = gcOptValue(o) || 100;
        // restore the "Other" label if the custom input was open
        const custom = options.find(isCustomOpt);
        if (custom && custom.querySelector('input') && custom.__nfOrig) custom.innerHTML = custom.__nfOrig;
        applySel();
        gcPatchAmounts(area, LIVE.gcAmount);
      });
    }
  });
  applySel();
  if (typeof LIVE.gcAmount === 'number') gcPatchAmounts(area, LIVE.gcAmount);
}

function openGiftModal(root) {
  document.querySelectorAll('[data-nf-gift]').forEach((el) => el.remove());
  const html = (NF_STATES['45-giftcard-receive-edit'] || {}).modal;
  if (!html) return;
  const holder = document.createElement('div');
  holder.setAttribute('data-nf-gift', '1');
  holder.innerHTML = html;
  (root.closest('.nf') || document.body).appendChild(holder);
  const close = () => holder.remove();
  enhanceGcAmount(root, holder);
  [...holder.querySelectorAll('button')].forEach((b) => {
    const t = b.textContent.trim();
    const aria = b.getAttribute('aria-label') || '';
    if (t === 'Update') on(b, () => {
      if (typeof LIVE.gcAmount === 'number') gcPatchAmounts(root, LIVE.gcAmount);
      close();
    });
    else if (/close/i.test(aria)) on(b, close);
  });
  const wrap = holder.querySelector('.brand-portal-modal') || holder.firstElementChild;
  if (wrap && !wrap.__nfScrim) {
    wrap.__nfScrim = true;
    wrap.addEventListener('click', (e) => {
      if (!e.target.closest('.brand-portal-modal__content, [role="dialog"]')) { e.stopPropagation(); close(); }
    });
  }
}

/* ---- completed campaign (the captured tab only had the empty state) ---- */
function enhanceCompletedTab(root) {
  const panel = root.querySelector('#campaign-panel-completed, .overview-stack--completed');
  if (!panel || panel.querySelector('[data-nf-completed]')) return;
  const tpl = pick('01-campaigns-overview', 'a[aria-label*="Open Campaign 1"]');
  if (!tpl) return;
  const card = tpl.cloneNode(true);
  card.setAttribute('data-nf-completed', '1');
  card.setAttribute('aria-label', 'Open Campaign 0, Spring Collection');
  card.removeAttribute('href');
  // "Launched" is a bare text node beside the date element — walk text nodes
  const tw = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const t = n.nodeValue.trim();
    if (t === 'Launched') n.nodeValue = n.nodeValue.replace('Launched', 'Completed');
    else if (t === 'August 6') n.nodeValue = 'August 2';
    else if (t === 'Campaign 1') n.nodeValue = 'Campaign 0';
    else if (t === 'Fall Campaign') n.nodeValue = 'Spring Collection';
    else if (t === '29%') n.nodeValue = '100%';
  }
  card.querySelectorAll('[style*="width"]').forEach((el) => { el.style.width = '100%'; });
  const empty = panel.querySelector('.completed-empty');
  if (empty) empty.replaceWith(card);
  else panel.appendChild(card);
  on(card, () => {
    try { sessionStorage.setItem('nfTrackTitle', 'Spring Collection'); } catch { /* ok */ }
    setPulseDay(forks.get('late') === 'one' ? 37 : 30); // completed campaigns open the tracker on the wrap state
    nfNav.go('track');
  });
}

/* ---- shell: sidebar active state + account menu (captures 31/32) ---- */
function syncSidebarActive(rootEl, screen) {
  const live = rootEl.querySelector('aside');
  if (!live) return;
  const srcHtml = screen === 'settings' ? (NF_STATES['31-settings'] || {}).sidebar : NF_SHELL.sidebar;
  if (!srcHtml) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = srcHtml;
  ['campaigns', 'settings', 'ugc', 'alerts', 'intelligence'].forEach((seg) => {
    const src = tmp.querySelector(`a[href$="/${seg}"]`);
    const dst = live.querySelector(`a[href$="/${seg}"]`);
    if (src && dst) dst.className = src.className;
  });
}

function toggleNfAccountMenu(rootEl) {
  const live = rootEl.querySelector('aside');
  if (!live) return;
  const existing = live.querySelector('[data-nf-acctmenu]');
  if (existing) { existing.remove(); return; }
  const sb = (NF_STATES['32-account-menu-open'] || {}).sidebar;
  if (!sb) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = sb;
  const brandCard = tmp.querySelector('.sidebar-brand-card');
  const menu = brandCard ? brandCard.previousElementSibling : null;
  if (!menu) return;
  const clone = menu.cloneNode(true);
  clone.setAttribute('data-nf-acctmenu', '1');
  const liveCard = live.querySelector('.sidebar-brand-card');
  if (!liveCard) return;
  liveCard.before(clone);
  const out = [...clone.querySelectorAll('button')].find((b) => b.textContent.includes('Log out'));
  if (out) on(out, () => clone.remove()); // log out stays inert in the prototype
}

/* ================= the component ================= */

let nfNav = {}; // filled per-render with navigation callbacks (module-level for enhancers)

function Generating({ onDone }) {
  const [lit, setLit] = useState(1);
  useEffect(() => {
    const t1 = setTimeout(() => setLit(2), 900);
    const t2 = setTimeout(() => setLit(3), 1800);
    const t3 = setTimeout(onDone, 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);
  return (
    <main className="workspace-content svelte-187rxgr" aria-busy="true" style={{ position: 'relative' }}>
      <div className="nf-generating">
        <div className="nf-dots"><span /><span /><span /></div>
        <p className={'nf-line' + (lit >= 1 ? ' on' : '')}>🔍 Analyzing your products...</p>
        <p className={'nf-line' + (lit >= 2 ? ' on' : '')}>👋 Understanding your brand and category...</p>
        <p className={'nf-line' + (lit >= 3 ? ' on' : '')}>✍️ Drafting your campaign brief...</p>
      </div>
    </main>
  );
}

export default function NewFlow() {
  const navigate = useNavigate();
  const { screen: screenParam } = useParams();
  const screen = PAGES[screenParam] !== undefined || MODALS[screenParam] ? screenParam : 'overview';
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const overlayRef = useRef(null);
  const [, force] = useState(0);
  /* the variants fork remounts the captured page so the brief card can switch live */
  useEffect(() => forks.sub(() => force((x) => x + 1)), []);

  const isModal = !!MODALS[screen];
  const pageScreen = isModal ? (LIVE.lastPage && ADV_FAMILY.has(LIVE.lastPage) ? LIVE.lastPage : 'adv') : screen;
  if (!isModal && screen !== 'generating') LIVE.lastPage = screen;
  if (ADV_FAMILY.has(pageScreen)) ensureSets(pageScreen);
  // track which campaign type the user is walking (gift flow vs product flow);
  // kept in lockstep with the shared fork store the tracker also reads
  if (GC_FAMILY.has(pageScreen)) { LIVE.gcMode = true; forks.set('type', 'local'); }
  else if (['overview', 'overview-completed', 'overview-after', 'step2', 'step3', 'brief', 'draft-resume'].includes(pageScreen) || ADV_FAMILY.has(pageScreen)) { LIVE.gcMode = false; forks.set('type', 'product'); }

  const go = (next) => navigate('/nf/' + next);

  nfNav = {
    go,
    openAddModal: (setIndex) => {
      LIVE.addTarget = setIndex;
      LIVE.modalSel = new Map(LIVE.sets[setIndex].products.map((p) => [p.name, {}]));
      go('m-add');
    },
    openOptions: (product, from) => {
      LIVE.optionsFor = { ...product, from };
      force((x) => x + 1);
    },
    closeOptions: () => { LIVE.optionsFor = null; force((x) => x + 1); },
    commitOptions: (product, temp) => {
      const from = LIVE.optionsFor?.from;
      const sel = from === 'grid' ? LIVE.gridSel : LIVE.modalSel;
      if (temp) LIVE.variantSel[product.name] = temp;
      if (sel) sel.set(product.name, { variants: true });
      LIVE.optionsFor = null;
      force((x) => x + 1);
    },
    removeProduct: (product) => {
      const from = LIVE.optionsFor?.from;
      const sel = from === 'grid' ? LIVE.gridSel : LIVE.modalSel;
      if (sel) sel.delete(product.name);
      delete LIVE.variantSel[product.name];
      LIVE.optionsFor = null;
      force((x) => x + 1);
    },
  };

  /* the launch-screen NPS root dies with its screen (the innerHTML swap orphans the host) */
  useEffect(() => unmountLaunchNps, [screen]);
  /* a fresh launch gets a fresh ask (answers persist in localStorage otherwise) */
  useEffect(() => { if (screen === 'launch-t0') nps.reset('launch'); }, [screen]);

  /* auto-advance transition frame */
  useEffect(() => {
    if (screen !== 'launch-t0') return;
    const t = setTimeout(() => go('launched'), 900);
    return () => clearTimeout(t);
  }, [screen]);

  /* enhancement pass after each render */
  useEffect(() => {
    const rootEl = rootRef.current;
    const mainEl = mainRef.current;
    if (!rootEl || screen === 'generating') return;

    if (ADV_FAMILY.has(pageScreen) && mainEl) renderSets(mainEl);
    if (pageScreen === 'step3' && mainEl) {
      enhancePicker(mainEl, { kind: 'grid', sel: LIVE.gridSel, api: nfNav }, nfNav);
    }
    if ((pageScreen === 'match' || pageScreen === 'match-how') && mainEl) {
      enhanceMatching(mainEl);
      enhanceBrief(mainEl, { aboutNoteCaptured: false }); // the Target-creator card's Edit → in-place editing
    }
    // variants fork: 'product' = hooks + instructions per product in their own section (Julia, Nov 13;
    // What Creators Will Do stays production's card) | 'creators' = the first Nov 13 version, tabs with a
    // creator count on What Creators Will Do | 'off' = production. Both mount BEFORE enhanceBrief.
    if ((pageScreen === 'brief' || pageScreen === 'gc-brief') && mainEl && forks.get('variants') === 'creators') enhanceVariants(mainEl, LIVE);
    if (pageScreen === 'brief' && mainEl && forks.get('variants') === 'product') {
      enhanceProductHooks(mainEl, LIVE, { rowTpl: () => pick('28-brief-edit-postreq', '.draft-list-editor-row') });
    }
    if (pageScreen === 'brief' && mainEl) enhanceBrief(mainEl);
    // draft-resume: different campaign's about/note text — those two stay
    // in-place-editable, but postreq/guidelines/receive use the real captures
    if (pageScreen === 'draft-resume' && mainEl) enhanceBrief(mainEl, { aboutNoteCaptured: false });
    if (LAUNCHED_FAMILY.has(pageScreen) && mainEl) {
      const sw = mainEl.querySelector('.sourcing-queue-fulfillment-toggle');
      if (sw) on(sw, () => {
        const isOn = sw.getAttribute('aria-checked') === 'true';
        sw.setAttribute('aria-checked', isOn ? 'false' : 'true');
        sw.classList.toggle('is-enabled', !isOn);
      });
    }
    if (pageScreen === 'overview-completed' && mainEl) enhanceCompletedTab(mainEl);
    if (mainEl) enhanceMonthsCopy(mainEl, pageScreen);
    if (pageScreen === 'launched' && !isModal && mainEl) mountLaunchNps(mainEl);
    if ((pageScreen === 'gc-overview' || pageScreen === 'gc-overview-tokyo') && mainEl) enhanceGcOverview(mainEl);
    if (pageScreen === 'gc-location' && mainEl) enhanceGcLocation(mainEl);
    if (pageScreen === 'gc-amount' && mainEl) enhanceGcAmount(mainEl);
    if (pageScreen === 'gc-brief' && mainEl) enhanceBrief(mainEl, { aboutNoteCaptured: false, gift: true });
    // demo crossover: the other reward type's card is disabled on the captured
    // page (per-account in production) — re-enable it so both flows are walkable
    if ((pageScreen === 'step2' || pageScreen === 'gc-step2') && mainEl) {
      const other = [...mainEl.querySelectorAll('.choice-card')].find((c) =>
        c.textContent.includes(pageScreen === 'step2' ? 'Gift Card' : 'Gifted Product'));
      if (other) {
        other.removeAttribute('disabled');
        other.classList.remove('choice-card--disabled');
        [...other.querySelectorAll('*')].find((el) => el.children.length === 0 && el.textContent.trim() === 'Coming soon')?.remove();
        on(other, () => nfNav.go(pageScreen === 'step2' ? 'gc-step2' : 'step2'));
      }
    }
    if (!isModal) syncSidebarActive(rootEl, pageScreen);

    const overlayEl = overlayRef.current;
    if (isModal && overlayEl) {
      if (screen.startsWith('m-add')) {
        const already = new Set(
          LIVE.sets.flatMap((s, i) => (i === LIVE.addTarget ? [] : s.products.map((p) => p.name)))
        );
        // strip captured selection state; live layer re-applies from LIVE.modalSel
        enhancePicker(overlayEl, { kind: 'modal', sel: LIVE.modalSel || new Map(), already, api: nfNav }, nfNav);
        // scrim click closes without committing
        const wrap = overlayEl.querySelector('.brand-portal-modal');
        if (wrap && !wrap.__nfScrim) {
          wrap.__nfScrim = true;
          wrap.addEventListener('click', (e) => {
            if (!e.target.closest('.brand-portal-modal__content')) { e.stopPropagation(); go(pageScreen); }
          });
        }
        [...overlayEl.querySelectorAll('button')].forEach((b) => {
          const t = b.textContent.trim();
          if (t === 'Cancel' || b.getAttribute('aria-label') === 'Cancel adding products') on(b, () => go(pageScreen));
          else if (t === 'Add') on(b, () => {
            const setRef = LIVE.sets[LIVE.addTarget];
            const entryTpl = pick('11-advanced-set1-populated', '.product-set-card__product-entry');
            setRef.products = [...(LIVE.modalSel || new Map()).keys()].map((name) => {
              const kept = setRef.products.find((p) => p.name === name);
              if (kept) return kept;
              // build an entry from the modal card
              const card = [...overlayEl.querySelectorAll('.product-card')].find((c) => cardInfo(c).name === name);
              const info = card ? cardInfo(card) : { name, price: '', img: '' };
              // entry anatomy: article > [__product-image > img + span.__price + button.__remove] + p(name)
              const node = entryTpl.cloneNode(true);
              const nm = node.querySelector('article > p');
              if (nm) nm.textContent = info.name;
              const pr = node.querySelector('.product-set-card__price');
              if (pr) pr.textContent = info.price;
              const im = node.querySelector('img');
              if (im) { im.src = info.img; im.alt = info.name; }
              const rm = node.querySelector('.product-set-card__remove');
              if (rm) rm.setAttribute('aria-label', `Remove ${info.name} from Product Set ${LIVE.addTarget + 1}`);
              return { name: info.name, html: node.outerHTML };
            });
            go(pageScreen === 'adv' && setRef.products.length ? 'adv' : pageScreen);
          });
        });
      }
    }
  });

  /* options overlay (built imperatively so it can float over grid OR modal) */
  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    rootEl.querySelectorAll('[data-nf-options]').forEach((el) => el.remove());
    if (LIVE.optionsFor) {
      const node = buildOptionsOverlay(LIVE.optionsFor);
      node.setAttribute('data-nf-options', '1');
      rootEl.appendChild(node);
      enhanceOptionsOverlay(node, LIVE.optionsFor, nfNav);
    }
  });

  /* navigation-only click routing */
  const handleClick = (e) => {
    const el = e.target.closest('a, button, [role="tab"], [role="link"]');
    if (!el || !rootRef.current) return;
    if (el.closest('[data-nf-options]')) return; // options overlay handles itself
    if (el.closest('[data-nf-nps]')) return; // the NPS card is React's, never a navigation
    // external links (shop domain chips etc.) keep their real behavior
    const href = el.getAttribute && el.getAttribute('href');
    if (href && /^https?:\/\//.test(href)) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener');
      return;
    }
    e.preventDefault();
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
    const aria = el.getAttribute('aria-label') || '';

    // sidebar / logo
    if (el.closest('aside') || el.closest('.mobile-header')) {
      if (txt === 'Campaigns' || aria.toLowerCase().includes('home')) {
        if (monthsMode()) { go('months'); return; }
        go(LAUNCHED_FAMILY.has(screen) ? 'overview-after' : LIVE.gcMode ? 'gc-overview' : 'overview');
      } else if (txt === 'Settings') {
        go('settings');
      } else if (aria.toLowerCase().includes('account menu')) {
        toggleNfAccountMenu(rootRef.current);
      }
      return;
    }

    const NAV = {
      overview: [
        [() => txt === 'Completed', 'overview-completed'],
        [() => txt === 'Launch now', 'step1'],
        [() => txt === 'Finish setup', 'draft-resume'],
        [() => /Open Campaign/i.test(aria), 'track'],
      ],
      'overview-completed': [[() => txt === 'Active', LIVE.lastPage === 'overview-after' ? 'overview-after' : 'overview']],
      'overview-after': [
        [() => txt === 'Completed', 'overview-completed'],
        [() => /Open Campaign|Cloudveil/i.test(aria), 'track'],
        [() => txt === 'Finish setup', 'draft-resume'],
        [() => txt === 'Launch now', 'step1'],
      ],
      step1: [
        [() => txt.includes('Get Started'), () => go(LIVE.gcMode ? 'gc-step2' : 'step2')],
        [() => txt.includes('Back to Campaigns'), () => go(monthsMode() ? 'months' : LIVE.gcMode ? 'gc-overview' : 'overview')],
      ],
      'gc-overview': [
        [() => txt === 'Completed', 'overview-completed'],
        [() => txt === 'Finish setup', 'gc-brief'],
        [() => /Open Campaign/i.test(aria), 'track'],
        [() => txt === 'Launch now', 'step1'],
      ],
      'gc-step2': [
        [() => txt.includes('Choose Gift Card Amount'), 'gc-location'],
        [() => txt === 'Back', 'step1'],
      ],
      'gc-location': [
        [() => txt.includes('Choose Gift Card Amount') && LIVE.gcLocation, 'gc-amount'],
        [() => txt === 'Back', 'gc-step2'],
      ],
      'gc-amount': [
        [() => txt.includes('Create My Campaign'), 'generating'],
        [() => txt === 'Back', 'gc-location'],
      ],
      'gc-brief': [
        [() => txt.includes('Find Creators'), 'match'],
        [() => txt.includes('Back to Gift Card'), 'gc-amount'],
      ],
      step2: [
        [() => txt.includes('Choose Your Product'), 'step3'],
        [() => txt === 'Back', 'step1'],
      ],
      step3: [
        [() => txt.includes('See Advanced Options'), 'adv'],
        [() => txt === 'Back', 'step2'],
        [() => txt.includes('Create My Campaign') && !el.disabled, 'generating'],
      ],
      adv: [
        [() => txt.includes('New Product Set'), () => { LIVE.sets.push({ mode: 'all', pick: 1, products: [] }); renderSets(mainRef.current); }],
        [() => txt === 'Clear', () => { LIVE.sets = [{ mode: 'all', pick: 1, products: [] }]; LIVE.variantSel = {}; renderSets(mainRef.current); }],
        [() => txt.includes('Create My Campaign'), 'generating'],
        [() => txt === 'Back', 'step3'],
      ],
      brief: [
        [() => txt.includes('Find Creators'), 'match'],
        [() => txt.includes('Back to Product Selection'), 'adv'],
      ],
      'draft-resume': [
        [() => txt.includes('Find Creators'), 'match'],
        [() => txt.includes('Back to Product Selection'), 'overview'],
      ],
      match: [
        [() => txt.includes('How we find your creators'), 'match-how'],
        [() => txt.includes('Launch Campaign'), 'launch-t0'],
        [() => txt.includes('Back to Campaign Brief'), 'brief'],
      ],
      'match-how': [
        [() => txt.includes('How we find your creators'), 'match'],
        [() => txt.includes('Launch Campaign'), 'launch-t0'],
        [() => txt.includes('Back to Campaign Brief'), 'brief'],
      ],
      launched: [
        [() => txt === 'Content', 'launched-content'],
        [() => txt === 'Campaigns', () => go(monthsMode() ? 'months' : 'overview-after')],
        [() => txt.includes('Edit Campaign'), 'brief'], // production behavior unverified (login lost) — brief is the sensible target
      ],
      'launched-content': [
        [() => txt === 'Dashboard', 'launched'],
        [() => txt === 'Campaigns', () => go(monthsMode() ? 'months' : 'overview-after')],
        [() => txt.includes('Edit Campaign'), 'brief'],
      ],
    };
    NAV['gc-overview-tokyo'] = NAV['gc-overview'];
    NAV['adv-set1'] = NAV.adv;
    NAV['adv-2sets'] = NAV.adv;
    NAV['adv-who'] = NAV.adv;
    NAV['brief-edit-about'] = NAV.brief;
    NAV['brief-edit-note'] = NAV.brief;

    for (const [pred, target] of NAV[isModal ? pageScreen : screen] || []) {
      if (pred()) {
        // opening a campaign card: carry its name into the tracker header
        if (target === 'track') {
          const m = aria.match(/Open (.+?)(?:, (.+))?$/);
          try { sessionStorage.setItem('nfTrackTitle', (m && (m[2] || m[1])) || ''); } catch { /* ok */ }
        }
        if (typeof target === 'function') target();
        else go(target);
        return;
      }
    }
  };

  const pageKey = PAGES[pageScreen];
  const state = pageKey ? NF_STATES[pageKey] : null;
  const modalHtml = isModal ? (NF_STATES[MODALS[screen]] || {}).modal : null;

  return (
    <>
    <div className="nf" ref={rootRef} onClick={handleClick}>
      <div className="brand-dashboard svelte-187rxgr">
        <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.header }} />
        <div className="dashboard-body svelte-187rxgr">
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.sidebar }} />
          {screen === 'generating' ? (
            <Generating onDone={() => go(LIVE.gcMode ? 'gc-brief' : 'brief')} />
          ) : state ? (
            <div key={'v-' + forks.get('variants')} ref={mainRef} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: state.main }} />
          ) : (
            <main className="workspace-content svelte-187rxgr" style={{ padding: 40 }}>Unknown screen: {String(screen)}</main>
          )}
        </div>
        <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.backdrop }} />
      </div>
      {modalHtml && (
        <div ref={overlayRef} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: modalHtml }} />
      )}
    </div>
      {/* fork switchboard — OUTSIDE .nf so the captured chrome's resets
          never restyle the pulse pill */}
      {!isEmbed() && <NfForkBar go={go} />}
    </>
  );
}
