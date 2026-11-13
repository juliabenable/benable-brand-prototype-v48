/* Hooks and instructions per product, on the /nf brief (Nov 13 2026).
 *
 * Julia, Nov 13 (dictated): "keep what creators will do as a separate section
 * that doesn't have a variant. We're going to create a new variant thing,
 * another section where they can click 'Add specific hooks or instructions
 * per product.' They're able, in the variant, to choose a product with a
 * dropdown menu from the products that exist above. They're able to have
 * bullet points for specific instructions for this product and specific
 * hooks. This is the place where they should be able to click '+' and add
 * variants according to the different products. There can only be one
 * variant per product, and that variant should be called the name of the
 * product, I think."
 *
 * So What Creators Will Do stays the captured production card, and this
 * module adds ONE section right after it:
 * - nothing added yet: a quiet dashed row (her label, word for word)
 * - after the click: a card with a tab per product (the tab IS the product
 *   name), a + after the last tab, and one panel
 * - read mode: the open product's hooks and instructions as production bullets
 * - Edit: a Product dropdown (products are read from What Creators Receive;
 *   a product that already has a tab is not offered), production's list-editor
 *   rows for the two lists, and an x on the open tab that removes it
 *   (Julia, Nov 13: a Remove link at the bottom of the panel read as weird)
 * - one tab per product: the + leaves once every product has one
 * - the first tab sits flush with the panel's left edge (Julia, Nov 13: an
 *   inset tab left a "weird gap" at its left)
 *
 * Visual model: the Caraway demo's variant card (a tab attached to a panel),
 * cleaned up. One container level instead of three, no repeated variant
 * title, the + next to the tabs, one label style, controls only while editing.
 *
 * State: LIVE.productHooks = [{product, hooks[], instructions[]}] and
 * LIVE.productHooksActive (module-level in NewFlow, survives navigation, not
 * reloads). Every keystroke writes through; Done and a fresh mount drop tabs
 * that hold nothing.
 * Fork: variants = 'product' (default) | 'creators' (the first Nov 13
 * version, briefVariants.js, drawer only) | 'off'.
 */

/* Every brand-facing string of the section, from the copywriter agent's pass
   (Nov 13, queued for the Copy Desk as q-20261113-202116-01 to -09). Only the
   entry row is AGREED (Julia's wording); the rest are PROPOSED until she rules.
   No long dashes, and no "variant" in anything a brand reads. */
export const COPY = {
  entry: 'Add specific hooks or instructions per product',
  title: 'Hooks & Instructions by Product', // "&" as in "Usage & Permissions"
  tablist: 'Products',
  // no line under the title: "Creators only see these for the product they get." was
  // wrong (Julia, Nov 13: creators see all of this in their brief)
  product: 'Product',
  lists: {
    // "Hook Ideas", not "Hooks": AGREED (Julia, Nov 13). She renamed the creator's label to HOOK IDEAS, then
    // said "Yes, rename it" to matching it here, the way production pairs Content Ideas with CONTENT IDEAS.
    // The add link and the placeholder keep "a hook" (production's "+ Add an idea" does not repeat its label either).
    hooks: { label: 'Hook Ideas', add: '+ Add a hook', placeholder: 'Add a hook' },
    instructions: { label: 'Instructions', add: '+ Add an instruction', placeholder: 'Add an instruction' },
  },
  addProduct: 'Add another product',
  remove: (product) => `Remove hooks and instructions for ${product}`, // tooltip + label of the x on the open tab
  removeRow: 'Remove this line',
};

/* ?hooks=demo opens the brief with two products already filled in, so a shared
   link lands on the card instead of the dashed row. Sample lines only, written
   for the demo brand's first two products. */
const DEMO = [
  { hooks: ['Start with one side of your face bare', 'Show the texture on the back of your hand first'], instructions: ['Say the product name out loud in the first 5 seconds'] },
  { hooks: ['Open on the bottle catching the light'], instructions: ['Film in daylight so the texture shows'] },
];

const LISTS = ['hooks', 'instructions'];
const HASH = 'svelte-vviyw7'; // the captured brief's scoped-style hash

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ICON = {
  plus: (n) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  tag: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="M3 11.4V4.5A1.5 1.5 0 0 1 4.5 3h6.9a1.5 1.5 0 0 1 1.06.44l8.1 8.1a1.5 1.5 0 0 1 0 2.12l-6.9 6.9a1.5 1.5 0 0 1-2.12 0l-8.1-8.1A1.5 1.5 0 0 1 3 11.4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" fill="currentColor"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

/* the campaign's products, in the order What Creators Receive lists them */
function readProducts(root) {
  const seen = new Set();
  return [...root.querySelectorAll('.draft-product-row')]
    .map((row) => {
      const img = row.querySelector('img');
      return { name: (row.querySelector('strong')?.textContent || '').trim(), img: img ? img.getAttribute('src') || '' : '' };
    })
    .filter((p) => p.name && !seen.has(p.name) && seen.add(p.name));
}

/* Focus cue only while the keyboard is driving: clicks never draw a ring on
   the tabs (Julia, Nov 13). Capture phase, because the section stops its own
   key events from bubbling. Wired once per page. */
let modalityWired = false;
function wireModality() {
  if (modalityWired || typeof document === 'undefined') return;
  modalityWired = true;
  const html = document.documentElement;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || String(e.key).startsWith('Arrow')) html.setAttribute('data-nfp-kbd', '1');
  }, true);
  document.addEventListener('pointerdown', () => html.removeAttribute('data-nfp-kbd'), true);
}

function caretToEnd(el) {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * @param {HTMLElement} root  the brief page's <main>
 * @param {object} LIVE       NewFlow's live state object
 * @param {{rowTpl?: () => Element|null}} api  rowTpl = production's captured list-editor row
 */
export function enhanceProductHooks(root, LIVE, api = {}) {
  const anchor = root.querySelector('section.draft-card[data-edit-section="postRequirements"]');
  if (!anchor || root.querySelector('[data-nf-phooks]')) return;
  const products = readProducts(root);
  if (!products.length) return; // gift-card briefs have no products to hang this on
  const byName = new Map(products.map((p) => [p.name, p]));
  wireModality();

  // first visit with ?hooks=demo: seed once (null = never touched; [] = emptied by hand, stays empty)
  let seeded = false;
  if (LIVE.productHooks == null && new URLSearchParams(window.location.search).get('hooks') === 'demo') {
    LIVE.productHooks = products.slice(0, DEMO.length).map((p, i) => ({ product: p.name, hooks: [...DEMO[i].hooks], instructions: [...DEMO[i].instructions] }));
    LIVE.productHooksActive = 0;
    seeded = true;
  }

  const tidy =(list) => (list || []).map((s) => String(s).trim()).filter(Boolean);
  const prune = () => {
    LIVE.productHooks = (LIVE.productHooks || [])
      .map((v) => ({ product: v.product, hooks: tidy(v.hooks), instructions: tidy(v.instructions) }))
      .filter((v) => byName.has(v.product) && (v.hooks.length || v.instructions.length));
    if (!(LIVE.productHooksActive < LIVE.productHooks.length)) LIVE.productHooksActive = Math.max(0, LIVE.productHooks.length - 1);
  };
  prune();

  const all = () => LIVE.productHooks;
  const current = () => all()[LIVE.productHooksActive];
  const unused = () => products.filter((p) => !all().some((v) => v.product === p.name));

  const host = document.createElement('div');
  host.className = 'nfp';
  host.setAttribute('data-nf-phooks', '1');
  anchor.after(host);
  // nothing in here is a navigation: keep it away from NewFlow's click router and any page shortcuts
  host.addEventListener('click', (e) => e.stopPropagation());
  host.addEventListener('keydown', (e) => e.stopPropagation());

  let editing = false;
  let tabsEl = null;
  let panelEl = null;

  function addProduct() {
    const next = unused()[0];
    if (!next) return;
    all().push({ product: next.name, hooks: [], instructions: [] });
    LIVE.productHooksActive = all().length - 1;
    editing = true;
    render(true);
  }

  function removeCurrent() {
    all().splice(LIVE.productHooksActive, 1);
    if (!(LIVE.productHooksActive < all().length)) LIVE.productHooksActive = Math.max(0, all().length - 1);
    render();
  }

  function toggleEdit() {
    if (editing) prune();
    editing = !editing;
    render();
  }

  /* ---- the row before anything is added ---- */
  function renderEntry() {
    host.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nfp-entry';
    b.innerHTML = `<span class="nfp-entry-icon">${ICON.plus(14)}</span><span>${esc(COPY.entry)}</span>`;
    b.addEventListener('click', addProduct);
    host.appendChild(b);
  }

  /* ---- the card ---- */
  function buildHeader() {
    // production's own card header, cloned from What Creators Will Do
    const h = anchor.querySelector('.draft-card-header').cloneNode(true);
    const title = h.querySelector('h3');
    if (title) title.textContent = COPY.title;
    const icon = h.querySelector('.draft-card-icon .icon') || h.querySelector('.draft-card-icon');
    if (icon) icon.innerHTML = ICON.tag;
    h.querySelectorAll('.draft-ai-pill').forEach((el) => el.remove()); // the brand writes these, not the AI
    let btn = h.querySelector('button.draft-card-edit');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `draft-card-edit ${HASH}`;
      (h.querySelector('.draft-card-actions') || h).appendChild(btn);
    }
    btn.dataset.nfVariants = '1'; // enhanceBrief's Edit wiring skips it
    btn.textContent = editing ? 'Done' : 'Edit';
    btn.classList.toggle('draft-card-edit--done', editing);
    btn.addEventListener('click', toggleEdit);
    return h;
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    // the first tab sits flush with the panel's left edge: when it is the open
    // one, the panel drops that corner so the two borders run as one line
    tabsEl.parentElement.classList.toggle('nfp-body--first', LIVE.productHooksActive === 0);
    all().forEach((v, i) => {
      const p = byName.get(v.product);
      const active = i === LIVE.productHooksActive;
      const t = document.createElement('div');
      t.className = 'nfp-tab' + (active ? ' nfp-tab--active' : '');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nfp-tab-btn';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', active ? 'true' : 'false');
      b.tabIndex = active ? 0 : -1;
      b.title = v.product;
      b.innerHTML = `${p && p.img ? `<img class="nfp-thumb" src="${esc(p.img)}" alt="">` : ''}<span class="nfp-tab-name">${esc(v.product)}</span>`;
      const open = (index) => {
        LIVE.productHooksActive = index;
        renderTabs();
        renderPanel();
      };
      b.addEventListener('click', () => { if (!active) open(i); });
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = all().length;
        open((i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n);
        tabsEl.querySelector('.nfp-tab--active .nfp-tab-btn')?.focus();
      });
      t.appendChild(b);
      if (active && editing) {
        // removing lives on the tab it removes, and only while editing
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'nfp-tab-x';
        x.title = COPY.remove(v.product);
        x.setAttribute('aria-label', COPY.remove(v.product));
        x.innerHTML = ICON.x;
        x.addEventListener('click', removeCurrent);
        t.appendChild(x);
      }
      tabsEl.appendChild(t);
    });
    // keep the open tab in view when the strip scrolls (many products, narrow card).
    // Sideways only: scrollIntoView would also pull the PAGE to the card on mount.
    const openTab = tabsEl.querySelector('.nfp-tab--active');
    if (openTab) {
      const left = openTab.offsetLeft;
      const right = left + openTab.offsetWidth;
      if (left < tabsEl.scrollLeft) tabsEl.scrollLeft = left;
      else if (right > tabsEl.scrollLeft + tabsEl.clientWidth) tabsEl.scrollLeft = right - tabsEl.clientWidth;
    }
    if (unused().length) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'nfp-add';
      add.title = COPY.addProduct;
      add.setAttribute('aria-label', COPY.addProduct);
      add.innerHTML = ICON.plus(16);
      add.addEventListener('click', addProduct);
      tabsEl.appendChild(add);
    }
  }

  const group = (label, labelId) => {
    const g = document.createElement('div');
    g.className = `draft-detail-group ${HASH}`;
    g.innerHTML = `<span class="draft-subsection-label ${HASH}"${labelId ? ` id="${labelId}"` : ''}>${esc(label)}</span>`;
    return g;
  };

  function makeRow(key, text) {
    const tpl = api.rowTpl && api.rowTpl();
    let row;
    if (tpl) {
      row = tpl.cloneNode(true);
    } else {
      row = document.createElement('div');
      row.className = `draft-list-editor-row ${HASH}`;
      row.innerHTML = `<span class="draft-list-editor-dot ${HASH}" aria-hidden="true">·</span><span class="text-widget editable-content svelte-myptue" style="font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-size: 13px; line-height: 20.8px;"></span><button type="button" class="draft-list-remove ${HASH}">${ICON.x}</button>`;
    }
    const textEl = row.querySelector('.text-widget, [contenteditable]');
    textEl.textContent = text;
    textEl.contentEditable = 'true';
    textEl.setAttribute('role', 'textbox');
    textEl.setAttribute('placeholder', COPY.lists[key].placeholder);
    textEl.setAttribute('aria-label', COPY.lists[key].placeholder);
    const x = row.querySelector('button');
    if (x) x.setAttribute('aria-label', COPY.removeRow);
    return row;
  }

  function listEditor(v, key) {
    const g = group(COPY.lists[key].label);
    const ed = document.createElement('div');
    ed.className = `draft-list-editor ${HASH}`;
    ed.dataset.nfpList = key;
    const add = document.createElement('button');
    add.type = 'button';
    add.className = `draft-list-add ${HASH}`;
    add.textContent = COPY.lists[key].add;
    ed.appendChild(add);

    const rows = () => [...ed.querySelectorAll('.draft-list-editor-row')];
    const textOf = (row) => row.querySelector('[contenteditable]');
    const save = () => { v[key] = rows().map((r) => textOf(r).textContent.trim()).filter(Boolean); };
    // one place to type next: the add link waits until the last line has words in it
    const syncAdd = () => {
      const last = rows().pop();
      add.hidden = !!last && !textOf(last).textContent.trim();
    };

    const wire = (row) => {
      const el = textOf(row);
      el.addEventListener('input', () => {
        if (!el.textContent.trim() && el.childNodes.length) el.textContent = ''; // a stray <br> would hide the placeholder
        save();
        syncAdd();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (el.textContent.trim()) addRow('', row);
        } else if (e.key === 'Backspace' && !el.textContent && rows().length > 1) {
          e.preventDefault();
          const prev = row.previousElementSibling;
          row.remove();
          save();
          syncAdd();
          caretToEnd(textOf(prev && prev.matches('.draft-list-editor-row') ? prev : rows()[0]));
        }
      });
      el.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\s*\n\s*/g, ' ');
        document.execCommand('insertText', false, text);
      });
      const x = row.querySelector('button');
      if (x) x.addEventListener('click', () => {
        if (rows().length > 1) row.remove();
        else el.textContent = '';
        save();
        syncAdd();
      });
    };

    function addRow(text, after) {
      const row = makeRow(key, text);
      wire(row);
      if (after) after.after(row);
      else add.before(row);
      syncAdd();
      if (!text) caretToEnd(textOf(row));
      return row;
    }

    (v[key].length ? v[key] : ['']).forEach((text) => {
      const row = makeRow(key, text);
      wire(row);
      add.before(row);
    });
    syncAdd();
    add.addEventListener('click', () => addRow(''));
    g.appendChild(ed);
    return g;
  }

  function renderPanel(focusFirst) {
    const v = current();
    panelEl.innerHTML = '';
    if (!editing) {
      LISTS.forEach((key) => {
        if (!v[key].length) return;
        const g = group(COPY.lists[key].label);
        g.insertAdjacentHTML('beforeend', `<ul class="draft-bullet-list ${HASH}">${v[key].map((t) => `<li class="${HASH}">${esc(t)}</li>`).join('')}</ul>`);
        panelEl.appendChild(g);
      });
      return;
    }

    const pick = group(COPY.product, 'nfp-product-label');
    // one tab per product: a product that already has a tab is simply not offered
    // (copywriter, Nov 13: a greyed-out option would need a string to explain itself)
    const offered = products.filter((p) => p.name === v.product || !all().some((o) => o.product === p.name));
    pick.insertAdjacentHTML('beforeend', `<span class="nfp-select-wrap"><select class="nfp-select" aria-labelledby="nfp-product-label">${offered.map((p) => `<option value="${esc(p.name)}"${p.name === v.product ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>${ICON.chevron}</span>`);
    const sel = pick.querySelector('select');
    sel.addEventListener('change', () => { v.product = sel.value; renderTabs(); });
    panelEl.appendChild(pick);

    LISTS.forEach((key) => panelEl.appendChild(listEditor(v, key)));

    if (focusFirst) {
      const first = panelEl.querySelector('[data-nfp-list="hooks"] [contenteditable]');
      if (first) caretToEnd(first);
    }
  }

  function render(focusFirst) {
    if (!all().length) { editing = false; renderEntry(); return; }
    host.innerHTML = '';
    const card = document.createElement('section');
    card.className = `draft-card ${HASH} nfp-card`;
    card.setAttribute('aria-label', COPY.title);

    card.appendChild(buildHeader());

    const body = document.createElement('div');
    body.className = 'nfp-body';
    tabsEl = document.createElement('div');
    tabsEl.className = 'nfp-tabs';
    tabsEl.setAttribute('role', 'tablist');
    tabsEl.setAttribute('aria-label', COPY.tablist);
    panelEl = document.createElement('div');
    panelEl.className = 'nfp-panel';
    panelEl.setAttribute('role', 'tabpanel');
    body.append(tabsEl, panelEl);
    card.appendChild(body);
    host.appendChild(card);

    renderTabs();
    renderPanel(focusFirst);
  }

  render();
  // a shared ?hooks=demo link lands ON the card (it sits four cards down the brief)
  if (seeded) setTimeout(() => host.scrollIntoView({ block: 'center' }), 120);
}
