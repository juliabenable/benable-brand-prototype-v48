import { reviewFor } from './pulseData.js';

/* Brand content review (Aug 10 call + study @4218) — the shared MODEL layer.
   WHO REVIEWS is a per-brand config — the demo pill toggles it:
   'benable' (default — Katie's team approves, the Statusphere-shaped default)
   or 'brand' (the Trilogy model). Decided config for brand mode (v43.2
   Tony's flag model, superseding Aug 10): nudges only — silence never
   approves · the flag note goes to the BENABLE TEAM, never the creator ·
   can't be sent empty · no reject button · no change rounds — Katie's team
   resolves flags with the creator (see the fix beats below).

   Mechanics: rows with `draftIn` have posts in REVIEW[mode]; each ASSET is
   decided on its own (a creator can send reel + story + TikTok). Decisions
   land on the asset objects (module-persisted, like every demo toggle);
   rows/rail/chips DERIVE their presentation — flip the toggle back to
   Benable-reviews and the Katie-checks world returns untouched.

   THE review UI is reviewModal.jsx (the shell). The v42 sheet and the v43
   chat directions are both RETIRED (Julia, Aug 17 + Aug 20 — the
   straight-to-creator one-change-round model is dead; flags go to Katie's
   team). They live on in frozen v42/v43. The login ReviewPopup below was
   removed then brought back (Julia, Aug 17). */

const EMBED = new URLSearchParams(window.location.search).has('embed');

/* states-gallery seed (?flagstate=flagged|agreed|resolved): pre-decides the
   LOCAL day-16 assets so the gallery can frame each flag beat from a bare
   URL (Maya: reel flagged at the given beat + story approved; Jade approved).
   Demo-only — no param, no seeding. */
const seedBeat = new URLSearchParams(window.location.search).get('flagstate');
if (['flagged', 'agreed', 'resolved'].includes(seedBeat)) {
  const seed = reviewFor('local');
  const maya = seed.Maya?.assets ?? [];
  if (maya[0]) {
    maya[0].state = 'changes';
    maya[0].notes = ['Wrong booking link on the end card.'];
    if (seedBeat !== 'flagged') maya[0].fix = seedBeat;
  }
  if (maya[1]) maya[1].state = 'approved';
  (seed.Jade?.assets ?? []).forEach((a) => { a.state = 'approved'; });
}

/* ---- who reviews (module-persisted demo config) ------------------------ */
let reviewMode = new URLSearchParams(window.location.search).get('review') === 'brand' ? 'brand' : 'benable';
export const getReviewMode = () => reviewMode;
export const setReviewMode = (m) => { reviewMode = m; };

/* ---- per-row derivations (all presentation flows from these) ----------- */
export const assetsOf = (c, mode) => reviewFor(mode)[c.name]?.assets ?? [];
export const isReviewRow = (c) => reviewMode === 'brand' && !!c.draftIn;
/* 'pending' | 'partial' | 'approved' | 'changes' | 'resolved'
   A flagged asset can carry `fix`: 'agreed' (Katie's team + creator settled
   on the update) → 'resolved' (issue closed; she publishes directly — the
   brand does NOT re-review, Julia Aug 18). 'resolved' counts like approved
   for forward motion but keeps its own face — a flag never dies quietly. */
export const rowReviewState = (c, mode) => {
  const assets = assetsOf(c, mode);
  const undecided = assets.filter((a) => !a.state).length;
  if (undecided === assets.length) return 'pending';
  if (undecided > 0) return 'partial';
  if (assets.some((a) => a.state === 'changes' && a.fix !== 'resolved')) return 'changes';
  return assets.some((a) => a.state === 'changes') ? 'resolved' : 'approved';
};

/* demo control: step every flagged asset through the resolution beats */
export const setFlagBeat = (mode, beat) => {
  Object.values(reviewFor(mode)).forEach(({ assets }) => assets.forEach((a) => {
    if (a.state === 'changes') {
      if (beat === 'flagged') delete a.fix;
      else a.fix = beat; // 'agreed' | 'resolved'
    }
  }));
};
export const flagBeat = (mode) => {
  const flagged = Object.values(reviewFor(mode)).flatMap(({ assets }) => assets).filter((a) => a.state === 'changes');
  return flagged.length === 0 ? null : (flagged[0].fix ?? 'flagged');
};
export const reviewNeeds = (c, mode) =>
  isReviewRow(c) && ['pending', 'partial'].includes(rowReviewState(c, mode));

/* the derived row face for brand-review mode: status line + action label */
export const reviewRowFace = (c, mode) => {
  const assets = assetsOf(c, mode);
  const n = assets.length;
  const state = rowReviewState(c, mode);
  const kinds = n === 1 ? assets[0].kind : `${n} posts`;
  if (state === 'pending')
    return { status: `✨ Her ${n === 1 ? assets[0].kind : `${n} posts`} ${n === 1 ? 'is' : 'are'} in — waiting on your review`, cta: n === 1 ? 'Review her post' : `Review her ${n} posts`, amber: true };
  if (state === 'partial') {
    const done = assets.filter((a) => a.state).length;
    return { status: `👀 ${done} of ${n} posts reviewed — ${n - done} to go`, cta: 'Finish review', amber: true };
  }
  if (state === 'changes') {
    /* Tony's flag model (v43.2): the note went to KATIE'S TEAM, not the
       creator — the row reads as motion in our hands, never amber (the
       ball isn't with the brand) and never a claim about the creator */
    const flagged = assets.filter((a) => a.state === 'changes' && a.fix !== 'resolved');
    const ok = assets.filter((a) => a.state === 'approved');
    const short = (k) => k.replace(/^IG /, '').toLowerCase();
    /* beat 2 — the team and the creator settled on the update */
    if (flagged.every((a) => a.fix === 'agreed'))
      /* honesty: we KNOW Katie sent the feedback; "agreed" we don't (Julia, Aug 20) */
      return { status: `✅ Feedback sent to ${c.name} — she’s updating it before posting`, cta: null, amber: false };
    if (ok.length > 0 && flagged.length === 1)
      return { status: `🚩 Issue on her ${short(flagged[0].kind)} — ${ok.length === 1 ? `${short(ok[0].kind)} approved` : `${ok.length} approved`}`, cta: null, amber: false };
    return { status: '🚩 Issue flagged — Katie’s team is on it', cta: null, amber: false };
  }
  if (state === 'resolved')
    /* beat 3 — closed loudly, never quietly; she publishes directly */
    return { status: '✅ Issue resolved — updated post going live soon', cta: null, amber: false, approved: true };
  return { status: `🎉 ${n === 1 ? `Her ${kinds} is approved` : `All ${n} posts approved`} — going live soon`, cta: null, amber: false, approved: true };
};

/* ---- arrival auto-open (Julia, Aug 21: no pop-up — go DIRECTLY to review)
   Login or an email deep-link with posts waiting opens the review shell
   itself, once per session, at the first pending creator. Never in ?embed
   (the states gallery must render the tracker, not the shell). */
let autoOpened = false;
export const reviewAutoOpenDue = (scene, rows) =>
  !EMBED && !autoOpened && reviewMode === 'brand' &&
  rows.some((c) => c.draftIn && reviewNeeds(c, scene.mode) && assetsOf(c, scene.mode).length > 0);
export const dismissReviewAutoOpen = () => { autoOpened = true; };
export const firstPendingCreator = (scene, rows) =>
  rows.find((c) => c.draftIn && reviewNeeds(c, scene.mode) && assetsOf(c, scene.mode).length > 0)?.name ?? null;

