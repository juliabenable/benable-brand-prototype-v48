/* Creator variants on the brief (Nov 13 2026, from the Oct 6 Caraway ask).
 *
 * Tony, Oct 6: "they can click Create variant, and create endless variants
 * where they edit the brief and pick how many creators are seeing that
 * version." The Caraway demo (demo.benable.com/d/caraway-2-y3qd) put that on
 * the brief as tabs; this ports it onto the captured /nf brief.
 *
 * What it does, on the "What Creators Will Do" card only:
 * - a tab strip (Variant 1, Variant 2, ... with an x each, + at the right)
 * - per variant: a name, a creator count (production's count-stepper),
 *   the platform, the number of posts, content ideas and talking points
 * - products, About, the note and guidelines stay campaign-level
 * - a total line under the heading ("25 creators across 2 variants")
 * - Edit on this card toggles in-place editing of the ACTIVE variant's lists
 *
 * State lives in LIVE.variants (module-level, survives navigation within the
 * session) so walking back from Find Creators keeps the tabs.
 * Fork: `variants` on|off (bar + drawer). Off = the captured card, untouched.
 */

const PLATFORMS = [
  ['primary', 'their primary platform (TikTok or Instagram)'],
  ['tiktok', 'TikTok'],
  ['reels', 'Instagram Reels'],
  ['stories', 'Instagram Stories'],
];

const MAX_CREATORS = 100;

function readList(section, field) {
  return [...section.querySelectorAll(`ul[data-edit-field="${field}"] li`)]
    .map((li) => li.textContent.trim())
    .filter(Boolean);
}

function seed(section) {
  return {
    name: 'Variant 1',
    creators: 10,
    platform: 'primary',
    posts: 1,
    ideas: readList(section, 'content_ideas'),
    talking: readList(section, 'talking_points'),
  };
}

function nextName(vs) {
  let n = vs.length + 1;
  const taken = new Set(vs.map((v) => v.name));
  while (taken.has(`Variant ${n}`)) n++;
  return `Variant ${n}`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function postLine(v) {
  const label = PLATFORMS.find(([k]) => k === v.platform)?.[1] || PLATFORMS[0][1];
  return `${v.posts} post${v.posts === 1 ? '' : 's'} on ${label}`;
}

const X_ICON = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const PLUS_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

/**
 * @param {HTMLElement} root  the brief page's <main>
 * @param {object} LIVE       NewFlow's live state object
 */
export function enhanceVariants(root, LIVE) {
  const section = root.querySelector('section.draft-card[data-edit-section="postRequirements"]');
  if (!section || section.__nfVariants) return;
  section.__nfVariants = true;

  if (!LIVE.variants) LIVE.variants = [seed(section)];
  if (LIVE.variantActive == null || LIVE.variantActive >= LIVE.variants.length) LIVE.variantActive = 0;

  // the card's own Edit: claimed here so enhanceBrief's capture swap skips it
  const editBtn = section.querySelector('button.draft-card-edit');
  if (editBtn) editBtn.dataset.nfVariants = '1';

  // keep the Benable group (campaign-level, "Included in every campaign")
  const benable = [...section.querySelectorAll('.draft-detail-group')]
    .find((g) => g.textContent.includes('Included in every campaign'));
  const benableHtml = benable ? benable.outerHTML : '';

  // strip the captured body, keep the header
  const header = section.querySelector('.draft-card-header');
  [...section.children].forEach((c) => { if (c !== header) c.remove(); });

  const total = document.createElement('p');
  total.className = 'nfv-total';
  header.after(total);

  const tabs = document.createElement('div');
  tabs.className = 'nfv-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Creator variants');
  total.after(tabs);

  const panel = document.createElement('div');
  panel.className = 'nfv-panel';
  panel.setAttribute('role', 'tabpanel');
  tabs.after(panel);

  let editing = false;

  const stop = (el, type, fn) => el.addEventListener(type, (e) => { e.stopPropagation(); if (type === 'click') e.preventDefault(); fn(e); });

  function renderTotal() {
    const n = LIVE.variants.reduce((a, v) => a + v.creators, 0);
    const k = LIVE.variants.length;
    total.textContent = k === 1
      ? `${n} creator${n === 1 ? '' : 's'}. Add a variant to give some of them a different brief.`
      : `${n} creators across ${k} variants`;
  }

  function renderTabs() {
    tabs.innerHTML = '';
    LIVE.variants.forEach((v, i) => {
      const t = document.createElement('div');
      t.className = 'nfv-tab' + (i === LIVE.variantActive ? ' nfv-tab--active' : '');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nfv-tab-label';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === LIVE.variantActive ? 'true' : 'false');
      b.innerHTML = `<span>${esc(v.name)}</span><span class="nfv-tab-count">${v.creators}</span>`;
      stop(b, 'click', () => { commitEdits(); LIVE.variantActive = i; editing = false; render(); });
      t.appendChild(b);
      if (LIVE.variants.length > 1) {
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'nfv-tab-x';
        x.setAttribute('aria-label', `Remove ${v.name}`);
        x.innerHTML = X_ICON;
        stop(x, 'click', () => {
          commitEdits();
          LIVE.variants.splice(i, 1);
          if (LIVE.variantActive >= LIVE.variants.length) LIVE.variantActive = LIVE.variants.length - 1;
          else if (LIVE.variantActive > i) LIVE.variantActive--;
          editing = false;
          render();
        });
        t.appendChild(x);
      }
      tabs.appendChild(t);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'nfv-add';
    add.setAttribute('aria-label', 'Add variant');
    add.innerHTML = `${PLUS_ICON}<span>Add variant</span>`;
    stop(add, 'click', () => {
      commitEdits();
      const from = LIVE.variants[LIVE.variantActive];
      LIVE.variants.push({ ...from, name: nextName(LIVE.variants), creators: 5, ideas: [...from.ideas], talking: [...from.talking] });
      LIVE.variantActive = LIVE.variants.length - 1;
      editing = false;
      render();
      const nameEl = panel.querySelector('.nfv-name');
      if (nameEl) { nameEl.focus(); nameEl.select(); }
    });
    tabs.appendChild(add);
  }

  function listHtml(field, items) {
    const lis = items.map((t) => `<li class="svelte-vviyw7 nfv-li"${editing ? ' contenteditable="true"' : ''}>${esc(t)}</li>`).join('');
    const addRow = editing ? `<button type="button" class="nfv-li-add" data-add="${field}">+ Add one</button>` : '';
    return `<ul class="draft-bullet-list svelte-vviyw7 nfv-list" data-nfv="${field}">${lis}</ul>${addRow}`;
  }

  function renderPanel() {
    const v = LIVE.variants[LIVE.variantActive];
    panel.innerHTML = `
      <div class="nfv-head">
        <label class="nfv-name-wrap">
          <span class="nfv-kicker">Variant name</span>
          <input class="nfv-name" type="text" value="${esc(v.name)}" maxlength="40" aria-label="Variant name">
        </label>
        <div class="nfv-count">
          <span class="nfv-kicker">Creators</span>
          <div class="count-stepper svelte-5dh8le" role="group" aria-label="Creators on this variant">
            <button type="button" class="count-stepper-button svelte-5dh8le" data-step="-1" aria-label="Fewer creators">−</button>
            <span class="svelte-5dh8le" data-count>${v.creators}</span>
            <button type="button" class="count-stepper-button svelte-5dh8le" data-step="1" aria-label="More creators">+</button>
          </div>
        </div>
      </div>
      <div class="draft-detail-group svelte-vviyw7">
        <span class="draft-subsection-label svelte-vviyw7">Post</span>
        <div class="nfv-post">
          <select class="nfv-select" aria-label="Platform">
            ${PLATFORMS.map(([k, l]) => `<option value="${k}"${k === v.platform ? ' selected' : ''}>${k === 'primary' ? 'Their primary platform (TikTok or Instagram)' : l + ' only'}</option>`).join('')}
          </select>
          <div class="count-stepper svelte-5dh8le" role="group" aria-label="Posts per creator">
            <button type="button" class="count-stepper-button svelte-5dh8le" data-posts="-1" aria-label="Fewer posts">−</button>
            <span class="svelte-5dh8le" data-posts-count>${v.posts}</span>
            <button type="button" class="count-stepper-button svelte-5dh8le" data-posts="1" aria-label="More posts">+</button>
          </div>
        </div>
        <p class="svelte-vviyw7 nfv-postline">${esc(postLine(v))}</p>
      </div>
      ${benableHtml}
      <div class="draft-detail-group svelte-vviyw7">
        <span class="draft-subsection-label svelte-vviyw7">Content Ideas</span>
        ${listHtml('ideas', v.ideas)}
      </div>
      <div class="draft-detail-group svelte-vviyw7">
        <span class="draft-subsection-label svelte-vviyw7">Talking Point Suggestions</span>
        ${listHtml('talking', v.talking)}
      </div>`;

    const nameEl = panel.querySelector('.nfv-name');
    nameEl.addEventListener('click', (e) => e.stopPropagation());
    nameEl.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') nameEl.blur(); });
    nameEl.addEventListener('input', () => {
      v.name = nameEl.value || `Variant ${LIVE.variantActive + 1}`;
      const label = tabs.querySelectorAll('.nfv-tab-label span:first-child')[LIVE.variantActive];
      if (label) label.textContent = v.name;
    });

    const countEl = panel.querySelector('[data-count]');
    const minus = panel.querySelector('[data-step="-1"]');
    const plus = panel.querySelector('[data-step="1"]');
    const syncCount = () => {
      countEl.textContent = String(v.creators);
      minus.disabled = v.creators <= 1;
      plus.disabled = v.creators >= MAX_CREATORS;
      const c = tabs.querySelectorAll('.nfv-tab-count')[LIVE.variantActive];
      if (c) c.textContent = String(v.creators);
      renderTotal();
    };
    stop(minus, 'click', () => { if (v.creators > 1) { v.creators--; syncCount(); } });
    stop(plus, 'click', () => { if (v.creators < MAX_CREATORS) { v.creators++; syncCount(); } });
    syncCount();

    const sel = panel.querySelector('.nfv-select');
    const line = panel.querySelector('.nfv-postline');
    sel.addEventListener('click', (e) => e.stopPropagation());
    sel.addEventListener('change', () => { v.platform = sel.value; line.textContent = postLine(v); });

    const pCount = panel.querySelector('[data-posts-count]');
    const pMinus = panel.querySelector('[data-posts="-1"]');
    const pPlus = panel.querySelector('[data-posts="1"]');
    const syncPosts = () => {
      pCount.textContent = String(v.posts);
      pMinus.disabled = v.posts <= 1;
      pPlus.disabled = v.posts >= 5;
      line.textContent = postLine(v);
    };
    stop(pMinus, 'click', () => { if (v.posts > 1) { v.posts--; syncPosts(); } });
    stop(pPlus, 'click', () => { if (v.posts < 5) { v.posts++; syncPosts(); } });
    syncPosts();

    panel.querySelectorAll('[contenteditable]').forEach((el) => {
      el.addEventListener('click', (e) => e.stopPropagation());
      el.addEventListener('keydown', (e) => e.stopPropagation());
    });
    panel.querySelectorAll('.nfv-li-add').forEach((b) => {
      stop(b, 'click', () => {
        const ul = b.previousElementSibling;
        const li = document.createElement('li');
        li.className = 'svelte-vviyw7 nfv-li';
        li.contentEditable = 'true';
        li.addEventListener('click', (e) => e.stopPropagation());
        li.addEventListener('keydown', (e) => e.stopPropagation());
        ul.appendChild(li);
        li.focus();
      });
    });
  }

  function commitEdits() {
    if (!editing) return;
    const v = LIVE.variants[LIVE.variantActive];
    const read = (f) => [...panel.querySelectorAll(`ul[data-nfv="${f}"] li`)].map((li) => li.textContent.trim()).filter(Boolean);
    v.ideas = read('ideas');
    v.talking = read('talking');
  }

  function render() {
    renderTotal();
    renderTabs();
    renderPanel();
    if (editBtn) editBtn.textContent = editing ? 'Done' : 'Edit';
  }

  if (editBtn) {
    stop(editBtn, 'click', () => {
      if (editing) commitEdits();
      editing = !editing;
      render();
    });
  }

  render();
}
