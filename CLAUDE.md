# benable-brand-prototype-v48 — hooks and instructions by product, both sides (Caraway ask)

**v48 (Nov 13) — fresh iteration base, copy of v47 + variants on the /nf brief.** Dev: launch `brand-prototype-v48`
(root launch.json) or `npm run dev`, port 5226. Base path `/benable-brand-prototype-v48/`. v47 stays frozen.
First shipped Nov 13 (Julia: "push the web version so i can share"): repo
https://github.com/juliabenable/benable-brand-prototype-v48 (public, like v47), live
https://juliabenable.github.io/benable-brand-prototype-v48/ . Deploy: `bash scripts/ship.sh "msg"`.
`_to_delete/` (leftover archives from the session that assembled v48) is gitignored, never upload it.
- Brand side: `/nf/brief` (the dashed row) or `/nf/brief?hooks=demo` (opens with two products filled in, for sharing).
  Live: https://juliabenable.github.io/benable-brand-prototype-v48/nf/brief?hooks=demo (HTTP 404 = SPA fallback, renders fine)
- Creator side: `/creator-brief.html#hooks`. Live: https://juliabenable.github.io/benable-brand-prototype-v48/creator-brief.html#hooks
  (noindex; it shows the founder card from the Figma frame, name and photo included).
- ⚠ node_modules: this folder was first installed in a Linux sandbox, so it arrived with Linux-only native binaries
  and vite died with "Cannot find native binding". The three Mac packages (`@rolldown/binding-darwin-arm64`,
  `lightningcss-darwin-arm64`, `fsevents`) were copied in from v47 (same pinned versions). If it happens again:
  `npm install` on the Mac.

## Hooks & Instructions by Product, brand side (Nov 13 2026, Julia's direction, same evening)

Julia, Nov 13 (dictated): "keep what creators will do as a separate section that doesn't have a variant. We're
going to create a new variant thing, another section where they can click 'Add specific hooks or instructions per
product.' They're able, in the variant, to choose a product with a dropdown menu from the products that exist
above. They're able to have bullet points for specific instructions for this product and specific hooks. This is
the place where they should be able to click '+' and add variants according to the different products. There can
only be one variant per product, and that variant should be called the name of the product, I think."
This REPLACES the creator-count variants below as the default. Visual model: the Caraway demo's variant card
(she called it "a bit neater, but still needs cleaning"), cleaned.

- `src/variants/productHooks.js` + `src/styles/productHooks.css`. Mounted from NewFlow's enhancement pass on
  `brief` only (a gift-card brief has no products), BEFORE `enhanceBrief`, as a host `div.nfp[data-nf-phooks]`
  right after the What Creators Will Do card. That card is untouched: production's captured card and editor.
- Nothing added: one dashed row, "Add specific hooks or instructions per product" (AGREED, her wording).
- After the click: a card "Hooks & Instructions by Product" with one tab per product (thumbnail + product name),
  a + after the last tab, and one panel. Read mode = production bullets under Hook Ideas / Instructions. Edit = a
  Product dropdown (products read from What Creators Receive) + production's own list-editor rows (cloned from
  capture 28) + "+ Add a hook" / "+ Add an instruction". Enter adds a line, Backspace on an empty line removes it.
- One tab per product: the + leaves when every product has a tab, and the dropdown only offers products without one.
- Done drops tabs that hold nothing; with none left the card folds back to the dashed row.
- State: `LIVE.productHooks` [{product, hooks[], instructions[]}] + `LIVE.productHooksActive` (survives navigation,
  not reloads). Every keystroke writes through.
- JULIA'S RULINGS on the first build (Nov 13, all applied):
  - "fix the weird gap at the left of the tab" → the first tab sits flush with the panel's left edge, and the
    panel drops its top-left corner while that tab is open.
  - "a bit weird to get the remove at the bottom" → no Remove link; an x on the open tab, only while editing.
  - "shouldn't have their weird purple highlight, or black highlight just on the tab top" → no ring on click.
    The black one was the captured CSS: `.nf button:focus{border-color:#666}` (0,2,1) and
    `.nf button:not(:disabled):active{background:#ddd}` (0,3,1) reach EVERY new button under .nf. Rules here ride
    at `.nf .nfp .x` (0,3,0) and state rules at (0,4,0). Keyboard focus keeps a quiet cue (`[data-nfp-kbd]`).
  - "Creators only see these for the product they get. That's not true as they see this in their brief" → that
    line is gone and nothing may claim it: creators see every product's hooks.
- Copy: `COPY` at the top of productHooks.js. Copywriter pass queued as q-20261113-202116-01 to -09. AGREED: the
  entry row (her wording) and the list label "Hook Ideas" (Julia, Nov 13: she renamed the creator's label to HOOK
  IDEAS, then answered "Yes, rename it" to matching it here; production pairs Content Ideas with CONTENT IDEAS the
  same way). The rest is PROPOSED: the title "Hooks & Instructions by Product" ("&" like "Usage & Permissions"),
  "Instructions", "+ Add a hook", the "Add a hook" placeholder and the x tooltip all still say "hook(s)".
- OPEN (not built): a campaign with ONE product (hide the row?), what a creator sees per product when they get
  several, and nothing downstream reads the hooks yet (matching, launch, tracker).
- Fork `variants`: `product` (default, on the bar as "By product") | `creators` (drawer only, the first version
  below) | `off`. A stored `on` from before the change lands on `product`.

## Hooks & Instructions by Product, creator side (Nov 13 2026, PROPOSED)

Julia, Nov 13: "this is the current mobile flow for creators - can you design the creator side of that tile,
ideal is that they would be able to swipe right/left for each varient" + Figma Design Labs 9160:50962.

- `public/creator-brief.html` (self-contained, built) ← `creator-brief/src/creator-brief.src.html` +
  `creator-brief/assets/` via `python3 creator-brief/build.py`. Edit the src, never the output.
- The page is the creator's whole mobile brief rebuilt from that Figma frame (values, copy and exported icons /
  photos are Figma's, its long dashes included) with ONE new card, `#hooks`, between Campaign Brief and Brand
  Guidelines. Desktop shows a 375x812 phone plus a rail; under 520px wide the page IS the app, so it can be opened
  on a real phone.
- The new section (round 2, Julia Nov 13: "could you makke the whole tile swippable? Instead of the tile in the
  tile"): each product is a WHOLE brief tile (the same card as its neighbours: 44px photo + name, then HOOK IDEAS
  and INSTRUCTIONS in the Campaign Brief label / bullet styles; NO title, see the copy line below) and the tile
  itself swipes. No card inside a card. `.hk-row` is a horizontal scroll-snap row that runs edge to edge
  across the screen (`container-type: inline-size` on `.scroll` gives it `100cqw`); a tile is 24px narrower than
  its neighbours, so the next product's tile peeks 28px at the screen edge. First tile rests left (aligned with
  the brief's cards), last rests right, middle ones centred. Dots sit on the page under the tile and jump on tap;
  arrow keys and mouse drag work on desktop; touch uses native scrolling. One product = one plain full-width tile.
  Round 1 (small cards inside one card) is in git history, commit b9247ca.
- TWO SWIPE STYLES, same tiles (round 3, Julia Nov 13 picked "Show the deck" when offered):
  `?swipe=deck` or the "Swipe style" switch in the desktop rail. DEFAULT is still side by side; which one wins is
  OPEN, hers to call.
  - Side by side (default): the row above, native scroll + snap.
  - Stacked deck: the pattern from the favorite-things deck she liked (`../favorite-things-asks-study`, `.stack`
    + `.edge`). The open tile is on top at FULL width (it lines up with its neighbours on both sides); the other
    products sit behind it, each 7% narrower and 12px higher, only their top edges showing (two edges at most).
    Pull the top tile left for the next product, right for the one before (the right tile is slipped underneath
    as soon as the pull has a direction), 80px or a quick flick commits, it tilts, flies off and joins the back.
    Up / down still scrolls the page (`touch-action: pan-y`). Dots and arrow keys work the same.
  - One script, two small controllers (`side`, `deck`) that share the dots; `setStyle()` cleans up after the
    other one. The script lives in the src html; edit it there.
- Deviations from the Figma frame, on purpose: both products are named "Big Dulce" there (placeholder), here they
  carry the pack names so the pages can be told apart; the affiliate confetti banner is a 1x render, not a rebuild.
- Copy, JULIA'S RULING (Nov 13, after seeing the tiles): "remove the title "Hooks"" and "rename the "Hook"
  subtext as Hook idea". So the creator tile has NO title (it opens on the product's photo and name) and the first
  list is HOOK IDEAS (plural + caps like CONTENT IDEAS). That answers the copywriter's open ask (creator lane,
  queue q-20261113-204313-01 to -04): hooks are ideas, not a must. INSTRUCTIONS unchanged, still PROPOSED.
  The Brand Portal list label followed the same evening ("Hook Ideas", see the brand section); its card title
  still says "Hooks & Instructions by Product", nobody asked to change that.
- Verified Nov 13 in headless Chromium: dot tap settles in about 350ms, a swipe released part-way snaps to the
  nearest page, 37 images and none broken. Proof shots in `creator-brief/shots/`.

## Creator variants, FIRST VERSION (Nov 13 2026, superseded the same evening, kept behind the `creators` fork)

Tony, Oct 6: one campaign, "create endless variants where they edit the brief and pick how many creators are
seeing that version". Model: the Caraway demo (demo.benable.com/d/caraway-2-y3qd), which put variants on the
brief as tabs.
- `src/variants/briefVariants.js` + `src/styles/variants.css` (rules at `.nf .nfv-*`, (0,2,0)).
- Mounted from NewFlow's enhancement pass on `brief` and `gc-brief`, BEFORE `enhanceBrief`; it claims the
  "What Creators Will Do" card's Edit (`data-nf-variants`) so enhanceBrief's capture swap skips it.
- Per variant: name, creators (production count-stepper, 1 to 100), platform, posts (1 to 5), content ideas,
  talking points. Products, About, the note, guidelines and the Benable post stay campaign-level.
- Tabs: + Add variant copies the active variant (count 5), x removes (hidden on the last one). A total line
  sits under the heading. Edit / Done toggles in-place editing of the active variant's two lists.
- State: `LIVE.variants` / `LIVE.variantActive` (module-level, survives navigation, not reloads).
- Fork `variants` = `creators` (drawer only since the change of direction). The page's main is keyed by the
  fork, and NewFlow subscribes to forks, so the switch is live.
- Not wired yet: matching / tracker / launch do not read the variants (Find Creators still recommends up
  to LIVE.count).

# benable-brand-prototype-v47 — Campaign Pulse + months (A + C) + the roster (E) + brand NPS asks

**v47 (Sep 8) — fresh iteration base, snapshot of v46 + directions A + C at /nf/months and E at /nf/roster.** Dev: launch
`brand-prototype-v47`, port 5225. Live:
https://juliabenable.github.io/benable-brand-prototype-v47/
Deploy: `bash scripts/ship.sh "msg"`. v46 stays frozen at its own URL.

## Brand NPS asks + the straggler close-out (Sep 21 2026, PROPOSED, from Tony's Slack ask)

Study: `../brand-nps-study/` ("Three Asks, One Close", port 4292). Tony (Sep 21,
#proj-brand-portal): measure NPS at three points, one question, under 30 seconds,
follow-up depends on the answer, and think through how campaigns close when a
handful of creators are late. Nothing here is decided; the prototype plays the
recommended version so Tony can react to it.
- `src/components/nps/`: `npsStore.js` (module + localStorage `nfNps`, one answer
  per moment `launch | cast | close`; the FIRST tap banks the score, the note is
  optional; deep-link `?nps=<moment>&score=N`, `?nps=reset`), `npsCopy.js` (every
  brand-facing string, no long dashes, "Katie's team"), `NpsAsk.jsx` (one component,
  three skins: `nf` launch-screen card, `rail` tracker rail card, `page` answer
  page). `src/styles/nps.css`: every rule rides at (0,2,0) because BOTH CSS worlds
  carry bare button / label / p rules.
- Moment 1 (campaign live): a card on `/nf/launched`, ABOVE "What happens next"
  (that list reads as the end of the page, and this is the one moment the brand
  is guaranteed to be in the portal), mounted from NewFlow's enhancement pass
  into an injected `[data-nf-nps]` host with its own root; the click router skips
  it; host AND root leave on screen change (StrictMode double effects emptied a
  surviving host); a fresh `launch-t0` resets the launch answer.
- Moment 2 (cast set): new **Day 13 · Cast set** (all 6 spots filled, every order
  placed; LOCAL twin says visits, with Lena still booking so it never claims
  "every visit"), `nps: 'cast'` on the DAYS entry puts the ask at the top of the
  right rail. Moment 3 (close): `nps: 'close'` on Day 30 · Wrap, or on **Day 37 ·
  Closed** under the straggler fork; the close ask sits AFTER the recap card
  (AmineRail's `afterRecap` slot) so the wrap-up door comes before the question.
- The card (review round, same day): ONE joined neutral 0 to 10 control (eleven
  separate chips read as chip soup in the 370px rail), poles with "Score saved"
  between them after the tap, one adaptive pill (Done, or Send once something is
  typed), "Your answer goes to the Benable team." (+ "Creators never see it." at
  cast set), and after sending ONE quiet receipt line with Change and an X. The
  X never loses a banked score (closing after a tap = sent). Arrows move focus
  only; Space / Enter picks. Rail skin wears the rail's locked picks (grey head
  strip, no icon tile, 30px pills); production's checkbox (16px, 4px radius).
- Copy rulings applied from the copywriter's corpus: brand surfaces never say
  "cast", "wrapped" or "shortlist"; "accepted" not "confirmed" (Confirmed is the
  local visit stage); creators are they/them or a first name; no "past due"; no
  chase counts against a named creator; contact is promised only when the box is
  ticked and with no clock until someone owns one; automated emails come from
  "Benable" and sign off "Team Benable" (OPEN ASK Tony). New up-next rows carry
  their own joiner (`sep`) so new copy never renders a long dash.
- Forks (store + drawer; the tracker pill carries LATE None|One + NPS By moment |
  Same ×3 | Off + ↺ reset; both write the store BEFORE the state flips because
  crewFor / pctFor read it at call time):
  `nps` on|off · `npsq` moment|recommend = THE ONE REAL CHOICE FOR TONY (a question
  the brand can judge at each moment: confidence, the creators, recommend; or the
  recommend question word for word at all three) · `late` none|one.
- STRAGGLERS · One late: Amara never posts. Day 30 becomes **Day 30 · Deadline**
  (92%, 5 rows Thanked, her row quiet "Katie's team is following up", up-next says
  the campaign closes in 7 days with or without the last post). **Day 37 · Closed**:
  stat reads "5 of 6 creators posted. Campaign closed.", Completed pill, wrap band
  for the 5 (no party popper on a partial result), Closed pill (not Completed:
  production's completed status is exactly what the close must NOT flip), the rail
  judges "past" on the creators still moving and never says "Campaign complete!",
  her row folds under "Katie's team is still following up with 1 creator"
  (same fold as declined invites), the close ask rides in the rail. `late: true`
  rows skip every wrap shortcut (`isWrapDay` + per-row `wrappedRow`), `folded: true`
  rows leave the main list. No reds, no blame, no charge language on the brand side.
- **Corner slide-up (Sep 24, from Julia's Airtable screenshots):** `src/components/nps/NpsCorner.jsx`
  (npc- CSS in nps.css), fork `npsui` card|corner (tracker pill ASK, drawer "NPS
  surface", deep link `?npsui=corner`). Reproduces Airtable's anatomy and flow on
  purpose so the two surfaces compare: bottom-right slide-up portaled to body,
  eleven separate chips with gaps, Submit as a second click (the number is NOT
  banked on the tap), one generic follow-up ("What's the main reason for your
  score?") with Send Feedback, thanks line that tucks itself away. Same store.
  Rides above the demo scrubber on the tracker (`body:has(.cp-scrubber)`).
- Email twin: `/nf/nps-mail` (three milestone emails with the 0 to 10 scale in the
  body; none of these emails exist in production) and `/nf/nps-answer/:moment`
  (login-free answer page; the page banks the score, not the link, because mail
  scanners pre-open links).
- Deep links: `?day=13`, `?day=37&late=one`, `?npsask=off` (gallery frames under
  `?embed` hide the ask unless `?npsask=on`). `dayList()` now also drops csvOnly
  days, which fixes the old `?day=` index drift under Shopify fulfillment.
- ⚠ Conflicts to settle before any of this ships (see the study): an automatic
  charge at deadline + 7 days reverses Aug 18 "nothing ever auto-charges"; a
  calendar close reverses the Aug 20 "wrap derives from creator states, never the
  calendar"; production `completed` locks out late drafts and thank-yous, so the
  close must NOT simply flip status.

## /nf/months + /nf/months/track — months, not campaigns: PROD TODAY vs NEW DESIGN (Oct 1 2026)

`src/pages/NfMonths.jsx` (shell + fork bar + second black bar), engine
`src/months/monthsEngine.js`, `src/styles/months.css` (`.nf .nf-months`, new classes `nfm-`).
Engineering handoff for Nisarg with both versions side by side, the rule, worked dates,
backend diff, edge cases and open questions: **`public/months-before-after.html`**
(live: /benable-brand-prototype-v47/months-before-after.html). Keep it in step with the engine.

- VERSION switch (`?rev=before|after`): **Prod today** = what production shows now, rebuilt
  from capture 01 (card "Launched September 10 / Campaign 1 / {title} / 54% Complete", ready
  tile "Campaign N / Your next campaign is ready to launch.", locked tile ONLY when nothing is
  ready, campaign page h1 = the title + the shipped Campaign Pulse) and from the backend at
  origin/master (OverviewService, CadenceService, TrackerQuery). **New design** = the change.
  The Sep 24 version Tony saw in the Loom is commit 0ac265a.
- THE RULE (`timeline()` / `monthOf()`): the campaign is 8 weeks in TOTAL (`WEEKS`, "Week 4
  of 8") and first_content_expected = launch + 42 days (`FIRST_CONTENT_WEEKS = 6`; Julia, Oct
  2, from: match about 1 week, ship about 2, 10 days to film, about 1 week to review and
  post. REPLACES Tony's Sep 8 "first content at 8 weeks", so names are a month earlier than
  he has been saying: OPEN with Tony). Shown as "week of {Monday}". content_month = the month
  of WEEK 7 = month of launch + 49 days (`NAME_WEEKS = 7`; Julia, Oct 2: "week 6 will have the
  first content, and most will be on week 7 and 8"). This REPLACED the Oct 1 "last 4 days"
  cut-off (no CUTOFF_DAYS any more): first content in the last 7 days of a month is already
  named for the next month. week = floor(days/7)+1. Phases: Match 1 · Ship 2-3 · Film 4-5 · Review 6 ·
  Post 7-8 (same split on the launch card).
  Ready tile = as if launched today (so it relabels by itself, Tony Sep 29), locked tile = as
  if launched on its unlock date, frozen at launch. Two campaigns may share a month; no
  launch-by line and no slip note on the tile; product campaigns only (all Julia, Oct 1).
- Days: Sep 8 signed / Oct 5 week 4 / **Oct 19 Campaign 2 not launched** (first content the
  week of Nov 30, week 7 ends Dec 7 = December; Campaign 3 unlocks Nov 8 and is December too) / Oct 28 first
  content in (Campaign 1 week 7 with 3 live, Campaign 2 week 3).
- New design, overview: tiles "Campaign 1 | November content" (`title()`, number + hairline +
  month; TILES ONLY, cards keep "Campaign N" with the month in the pill: Julia Oct 1 "he just
  didn't like that before Launching we dropped the Campaign number"), TWO lines of copy in one
  style: "Your next campaign is ready to launch." + "Creator content will start going live in
  {month}." (prod's line + Tony's Sep 29 sentence; Julia Oct 2: "Both lines"), "Launch now" opens setup directly
  (/nf/step2; prod opens /nf/step1), locked tile always shown under a ready one ("Unlocks Oct
  8.", countdown pill aligned to the button's right edge and width). Card: pill "{month} content
  · launched Sep 10", status line from stage counts (`statusLine()`, PROPOSED), then "Week 4 of 8
  · first content expected the week of Nov 2" or "3 of 10 live · first on Nov 4".
- New design, campaign page: month pill + "Campaign N"; the Dashboard is production's Campaign
  Pulse (`pulse()`, ported from content-handoff-study/surface.html; root class `nfm-pulse`,
  NEVER `cp-root`: overrides.css `:has(.cp-root)` unlocks page scroll) plus ONE new card first
  in the right rail: **Campaign timeline** (`timelineCard()`): date at 16px/600, progress
  (TIMELINE BAR switch, `?bar=line|segments`, default Line = five equal phase slots), "See the
  full timeline" expands in place (class flip) into dated phases with a Now marker. It is the
  plan by calendar week, never creator stages. No week pill in the head.
- NewFlow months block: URL overrides `?model= ?embed= ?mmonth= ?mnum= ?mtoday=` (so the
  handoff page can frame the wizard and launch screen in both versions), `monthsRev()`
  ('before' leaves the captured screens untouched), setup (step2) is EXACTLY production's:
  no heading change, no added sentence (Julia, Oct 2: no "Set up Campaign 1", then "remove
  item D", the setup section of the handoff page), only the intro screen before it is skipped,
  launch line "Campaign N | {month} content · {title}", the Sep 24 launch timeline card + tip.
- **Moving timeline card (Oct 6 2026, every rule decided by Julia):** `src/months/movingTimeline.js`,
  ported from the timeline tile study (`../timeline-tile-study/`, public timeline-tile-study-1). The
  first-content date follows the first creator: earlier when an order, draft or post lands early
  (Early tag, old date crossed out), later ONLY for the brand's own delays (approving creators,
  shipping its own orders, reviewing its own drafts), held for creator-side delays; one grey or
  amber line under the date; overlapping phase windows; Now on two phases; completed state. In the
  new design the second bar carries TILE (Moving, default | Fixed = the 8-week card as it shipped
  on Oct 5 in beneble_app#747 + benable-ui#430) and CAMPAIGN 1 (On plan | Early | Brand ships late
  | Brand reviews late | Creators late): a scene other than On plan generates Campaign 1's
  creators, their stage history days and the rail notes from one set of days, so the table agrees
  with the card. BAR (Line | Segments) only applies to the Fixed card. The handoff page frames pin
  `&tile=fixed&scen=plan` so the shipped record does not move. Deep links `?tile= ?scen=`.
- Deep links: `?rev= ?day=signed|week4|slip|landed ?tl=open ?bar= ?embed=1`.
- OPEN (see the handoff page): locked tile next to a ready one (cadence change), status
  sentence vs campaign title, week 9 with nothing live, Tony's Sep 8 "Sep 20 launch =
  December" (the rule says November), which timestamp is "first post live", line vs segments.

## /nf/roster — direction E, the always-on roster (Sep 8 2026)

From the study "October, On Track" (selling-months-study/, Sep 8): no campaigns as
a brand-facing object; the brand holds a monthly creator count, the brief stands,
creators are matched continuously, and creators who delivered can apply to come
back. Hosted in the real captured chrome (NF_SHELL header + sidebar, content
mounted inside production's .workspace-content-shell). Sidebar patched in place:
"Campaigns" -> "Creators" (active), "Content" + "Brief" inserted.
- `src/pages/NfRoster.jsx` = shell + fork bar + a second black bar (six "today"
  snapshots: Sep 8 signed / Sep 10 matching / Sep 26 first month / Dec 12 steady /
  Jan 9 behind / Feb 3 paused). `src/roster/rosterEngine.js` = the vanilla render
  engine, same code as `selling-months-study/proto-e.html` (keep in step).
  `src/styles/roster.css` scoped under `.nf .nf-roster`.
- Fork bar gained MODEL (Campaigns | Roster): Roster routes to /nf/roster, Campaigns
  back to the overview. Stored in the shared forks store as `model`.
- The early-brief queue (Julia, Sep 8: "start their brief for November super early
  in September"): every month tile except the current one carries "Plan {month}"
  (or "Add a note for {month}" once creators are lined up). One click opens an
  inline plan: "Same products as {this month}" on by default, an optional note,
  Save. The tile turns planned (check + "creators see it from {prev month} 1").
  "Plan further ahead" reveals three more months. Plans live in engine state only.
- Working: Set up your brief (advances signed -> matching), Approve / Pass,
  Invite again, Show all, applications switch, Plan / Save / Edit / Cancel.
  Inert with a toast: Content, Brief, product picker in the plan form.

# benable-brand-prototype-v46 — Campaign Pulse

**v46 (Aug 18) — fresh iteration base, snapshot of v45** (three-pane review
shell + all polish rounds + Option-A flagged-row faces, kept in lockstep with
v45 through Julia's review night). v45 stays frozen at its own URL; new work
goes here. Dev: launch `brand-prototype-v46`, port 5224. Live:
https://juliabenable.github.io/benable-brand-prototype-v46/
Deploy: `bash scripts/ship.sh "msg"`. Everything below is inherited history.

## /nf — the NEW brand-portal first-part flow (Aug 18-19 2026 capture)

**What:** production's REDESIGNED brand portal (new chrome: Inter, card
overview, banked "Launch now", create wizard, AI brief, creator matching),
captured live from benable.com as `benable-collab-studio` and rebuilt as a
fully interactive prototype. 26 captured states in `captures/sources-aug18/`
(each `NN-name.html` = full doc; extracted by `scripts/extract_newflow.py`
into `src/data/newFlowHtml.js` NF_SHELL + NF_STATES{main,modal}).
The old-chrome prototype (`/brand/tonypikora/...`) is untouched; `/nf` and
`/nf/:screen` are additive routes. Entry: `/nf` → campaigns overview.

**Gift-card campaign type (Aug 19 evening, captures 35-48):** Julia flipped the
demo account to gift-card mode on production; the wizard becomes Gift Card →
location ("Which location is this for?", Tokyo/Paris demo restaurants) →
amount ($50/$100 Best/$150/Other w/ black card art) → gift brief whose
receive-Edit opens a card-value MODAL (Update; .draft-gift-card-* classes —
NOT the wizard's .gift-card-*), and the campaigns overview grows location
filter pills + location-grouped campaign stacks. Prototype routes: gc-overview
/ gc-overview-tokyo / gc-step2 / gc-location / gc-amount / gc-brief;
LIVE.gcMode steers step1/generating/sidebar between flows. Product step2 was
upgraded to capture 36 (adds "UGC for Your Brand" + "Hybrid" coming-soon
cards). DEMO-ONLY deviation: the other reward type's disabled card on each
step2 is re-enabled as a flow crossover (production enables one per account).
Capture 35 also fixed product options: clicking a SELECTED variant product
REOPENS its modal w/ saved chips + "Remove product"/"Save" footer; chip edits
commit on Save only. Amount parsing gotcha: "$50.00" labels — parse the first
digit group, never strip-all-digits (5000!).

**/nf/track — the v45 tracker merged in (Aug 19 night):** clicking any
campaign card on either /nf overview opens the FULL v45 tracker (Campaign
Pulse: stat row + Amine rail + creators table + review shell + wrap-up)
hosted under the NEW-chrome sidebar. `NfTrack.jsx` = grid of [.nf-scoped
sidebar cell | UNSCOPED old-chrome document] — the tracker content must
never sit inside .nf (both CSS worlds own .workflow-header/.workspace-grid
etc.). Clicked card's name patches the tracker h1 (sessionStorage
nfTrackTitle); back-link + sidebar are intercepted in the capture phase and
route mode-aware (/nf/overview vs /nf/gc-overview). FORK SWITCHBOARD:
`src/components/pulse/forks.js` = shared store (localStorage nfForks) +
FORK_DEFS registry; the pulse's black cp-mode bar now reads/writes it
(collab type, who reviews, declined, review UI), and `NfForkBar.jsx` mirrors
the same bar across all /nf pages with a ⚙ "All forks" admin drawer (one
row per FORK_DEFS entry — the extensible home for every future fork;
Julia will spec richer logic). Collab type = the master fork: flips
overview families, wizard, brief AND tracker stage model (product shipping
vs local Confirmed/Visited). Old-chrome routes untouched (regression-checked).

**Screens:** overview / overview-completed / overview-after · step1 → step2 →
step3 (product grid) · adv (advanced sets builder) + m-add modal + options
modal · generating (interstitial) · brief (AI campaign brief, inline editing)
· draft-resume · match + match-how · launch-t0 → launched / launched-content.

**Architecture (`src/pages/NewFlow.jsx`):** base page (captured `<main>` via
dangerouslySetInnerHTML) + modal overlays (captured body-tail fragments) —
opening a modal never swaps the page behind it. A live-interaction layer
(enhance*) mutates the captured DOM directly: product selection w/ check
indicators, variant chips, LIVE.sets-driven sets builder (cards + rail
templated at runtime from captured fragments via frag()/pick()), who-gets
menus, pick-count + creator-count steppers, tier radios, search filters,
select-all, brief Edit/Done section swaps (capture 15↔16/17) with
contenteditable + persisted text. Router click-handler = NAVIGATION ONLY
(text-matched per-screen tables); interactive elements stopPropagation.
`window.__nfLive` = debug handle. CSS: `newflow-production.css` (~7.1k rules,
20 route files scoped under `.nf` by the extractor) + `newflow-extra.css`
(loads FIRST so production wins specificity ties; kills page-entry animations;
`.nf.nf.nf` structural pins for height/scroll).

**Gotchas:**
- overrides.css's `:has(.draft-review-root)` page-scroll unlock (review-shell
  work) also matches the captured brief page inside .nf — the `.nf.nf.nf`
  !important pins in newflow-extra.css restore the inner-scroll chain
  (dashboard 100vh → body → workspace-content-shell auto → workflow-page 100%
  → workspace-grid scrolls). Don't weaken them.
- The set-card "Add Products" tile is ITSELF a `__product-entry` wrapping
  `.product-set-card__add-products` — entry wipes must skip it.
- Brief sections: `data-edit-section` markers live on SUBsections; always
  anchor swaps on `section.draft-card`, and pick capture-16/17's card by its
  Done button. draft-resume/match use generic in-place editing only (their
  content ≠ capture 15).
- Variant data: Sunlit (Shade) + Moonmilk (Tint) are real production options;
  other products' options in VARIANTS are plausible demo values.
- Aug 19 re-login capture round (states 27–34) CLOSED the inert list:
  postRequirements/guidelines edit modes are the real captured editors
  (platform radio cards, ✕-dismissible idea/do rows, "+ Add" appends),
  receive's Edit navigates to the product picker (that's production's real
  behavior), About-edit "Add post" opens the captured URL modal, Settings is
  a real page (sidebar active-state synced from capture 31), the account
  menu pops from capture 32's sidebar, and the launched "Shopify fulfillment"
  chip is a working visual toggle. Done ALWAYS restores the pre-edit
  original node (never a capture-15 clone), so brief and draft-resume each
  keep their own content. Still inert on purpose: sidebar Soon items
  (production's /ugc etc. just fall through to the consumer site — verified),
  Log out, and Settings' Reconnect/Disconnect buttons.
  ⚠ Capture etiquette learned the hard way: the fulfillment chip on a REAL
  campaign is a live setting — clicking it during capture flipped campaign
  94's fulfillment off for ~1 min (restored + verified). Probe unknown
  controls on drafts, never launched campaigns.
- Captured pages carry `benable-collab-studio` real demo data (Shopify CDN
  product images, brand logo) — remote assets, need network.

**v45 (Aug 18) — fresh iteration base, snapshot of v43 at v43.2** (Amine's
review modal default + Tony's flag-an-issue copy merged). v43 stays frozen at
its own URL as the shared ship; new work goes here. Dev: launch
`brand-prototype-v45`, port 5223. Live: https://juliabenable.github.io/benable-brand-prototype-v45/
Deploy: `bash scripts/ship.sh "msg"`. Everything below is inherited v43 history.

**ENGINEERING DECISIONS (Julia, Aug 20, from the edge-case audit — mirrored
from v45):** (1) Review deadline = SLACK ESCALATION TO KATIE at 2/3/4+
business days unreviewed (ops-side). (2) No undo — approve/flag terminal.
(3) Tony (Slack, Aug 18): don't hard-code the post-flag path — Katie decides
per case whether the creator posts directly or it goes BACK TO THE BRAND for
final approve; schema needs both endings (publish_directly default,
back_to_review = asset returns to pending as a new version). (4) Approved
siblings may publish while a flag is open; the row stays at the laggard's
stage. (5) Stage not renamed — resolved rows wear the stage WORD "Resolved"
(row cell + drawer step 4); rail columns unchanged. (7) CHAT DIRECTION
RETIRED — reviewChat.jsx deleted, REVIEW UI pill gone (the rui fork key is
now unused), QUICK_FIXES removed; "our team"/"Katie's team" voice split
accepted. KATIE'S ADMIN FLOW (Aug 20): flag → Slack ping to Katie + admin
entry; three buttons (send feedback as-is / edit then send / mark resolved);
send = FIX AGREED, mark = RESOLVED, post-detection AUTO-RESOLVES; brand gets
one email at resolved; back-to-brand re-review stays manual per Tony. Stage
word for resolved rows = "Draft Issue Resolved". WRAP RULE for the spec:
the prototype day-30 shortcut is demo scaffolding — in production the wrap
derives from actual creator states, never the calendar (open flags /
unreviewed drafts keep their faces on the wrap roster).

**v45 REVIEW SHELL (Julia's mock, Aug 18) — reviewModal.jsx rebuilt as a
three-pane workspace** (solves "confusing to go from one creator to another
and through one creator's drafts"): header "Approve Content" + live sub ·
CREATORS sidebar (photo rows, per-creator lines "2 drafts to review" → "1 of
2 reviewed" → "Reviewed — issue flagged"/"Reviewed", amber dot → stamp,
active row lavender + accent bar; click = jump to that creator's first
pending draft) · gradient stage with a "Draft n of N · {kind}" glass pill
(‹ › arrows + decision stamp) + the shared 9:16 player + a white CAPTION
card · right panel ("Pre-approved, ready for your final review" / "Approved
🎉" / "Issue flagged" heading variants, pre-check card, "Your note to our
team" feedback list, approve/flag footnote, footer CTAs → decided rails).
DECISION CHOREOGRAPHY: commit → check FLASH over the stage (1.15s, green
approve / amber flag, rvm-flash-*) → draft slides OUT left (320ms) → next
undecided draft slides IN from the right (this creator first, then next
creator w/ pending, wrapping) → else confetti celebration. Amine's 1s
skeletons + drafts thumbnail carousel + creator pager retired in the shell
(sidebar + pill replace them); the old two-pane rvm- classes remain in
reviewModal.css for reference. Flag sheet = Tony's v43.2 copy, anchored
392px over the right panel. Keyboard: Esc (sheet→shell, blocked mid-flash),
←/→ drafts. Entry lands on first undecided; "See what you sent ↗" drawer
door reopens decided states. POLISH ROUND (Julia, Aug 18 night): sidebar
active-row accent bar removed (looked detached), rows tightened 10/12;
flash card enlarged (340–380px, 72px check, 19px title); STAGE RESTRUCTURED
— the player owns a flex slot (flex:1 + aspect-ratio; percentage heights die
in indefinite flex slots, use flex-grow) and the caption a FIXED 118px
reserve, so caption length never resizes or shifts the video; flag sheet
CENTERED over the shell (grid scrim, card position:relative — static sent
the absolute close-✕ to the scrim corner), content-sized, body 46/36/26,
textarea 96px, sub max-width 360. GOTCHA: the Claude browser pane can
collapse to a 0×0 viewport — every 100vw/getBoundingClientRect reads garbage;
verify layout in Playwright at 1512×960 instead. ROUND 2 (Julia, Aug 18
late, after comparing with Tony's second-shot mock): sidebar rows get 6px
air (adjacent highlights collided); TONY-SCALE TYPE — header 21/14, side
names 15/13, panel head 18/14, pre-check card 14 title + 13.5 items (scoped
`.rvm-shell .rvm-precheck*`), footnote 13.5, footer buttons h46; sidebar
stamps rebuilt as SINGLE soft circles (22px #d7f3e3 + brighter #12A150
inline-SVG tick · amber ! for flagged — the ring-in-a-ring draft-approved.svg
read weird) in a fixed 22px slot so tick and amber dot share an axis; flag
sheet now centers in the RIGHT-HAND PANEL BOX (grid scrim align-center
justify-end pr16 + pt76 header offset, card 368px) — not the whole shell —
and the footer rail line/tint before "Send to our team" is gone. ROUND 3
(Julia, Aug 18 latest): header hierarchy fixed (title lh26 + 4px to the
14/18 sub, head 80px, sidebar padding 16 so title/label-text/avatars all sit
on the 28px left axis) · "Every draft reviewed" CELEBRATION REMOVED — the
last decision's flash closes the shell and the table's derived states carry
the ending (celebrate/confetti CSS pruned) · flag sheet rides LOW in the
panel (align-end + 16px insets) · the opening draft appears IN PLACE — the
slide-in is gated behind an rvm-anim class set only on draft/creator changes
(lastKey ref; the first mount arriving from the side read as a loading
state) · media pre-warmed (posters from the dashboard, clips preload=auto on
mount) · self-check extras: pill arrows only render when a creator has >1
draft, and the pill's decision stamp is the same single-circle tick language
as the sidebar (ring-in-ring img retired everywhere). FLAGGED-ROW TRACKER
FACE (Option A, Julia-approved Aug 18): the old "✏️ One tweak sent — she's
re-editing" claimed creator behavior and the wrong recipient under Tony's
flag model — now flagged rows read as motion in KATIE'S TEAM's hands, never
amber, no CTA: all-flagged "🚩 Issue flagged — Katie's team is on it",
mixed "🚩 Issue on her story — reel approved" (reviewRowFace); stage stays
Visited; drawer stage-4 next-hint for flagged rows = "We're resolving your
flag — then she posts" (tableFix); the drawer's "See what you sent ↗" stays
the door. Header light goes green when only flags remain (ball is with
Benable). NOT built: the resolution return-state (new draft back in →
amber review face again) — no demo data for it yet. Tracker speaks
"Katie's team" while Tony's modal says "our team" — flagged to Julia,
left as-is.


**v43.1 (Aug 17) — review direction C: AMINE'S MODAL, the new default.** The
designer redid the review design (private repo `AmineBenjil/brand-portal-review-content`,
his v6.1 Figma build) and Julia asked for it ported wholesale: the demo pill's
REVIEW UI group is now **Modal | Chat | Sheet** (modal = default; deep-links
`?rui=modal|chat|sheet`). `reviewModal.jsx` (`rvm-` CSS in
`src/styles/reviewModal.css`) is a 1:1 JSX port of his ReviewModal + VideoPane +
CelebrationModal — gradient stage, real 8s AI-UGC 9:16 videos (play/scrub/mute),
creator pager ‹ n/N ›, drafts carousel (type labels, lavender selection ring,
decision stamps, >4-drafts paging), toned caption (@mention blue / #hashtag
purple), Katie's-team pre-check grey card, footer CTAs → decided status rails,
slide-up request-changes sheet (chips FILL starter sentences, ⓘ one change
round, Enter sends), 2.5s animated-check overlay, 1s skeletons, end-of-queue
confetti celebration with the approved/changes tally. WIRED TO v43's DATA, not
his: the queue = the table's `draftIn` rows, decisions land on the REVIEW
asset objects (`a.state`, module-persisted) and notes on `a.notes`, so the
tracker/chips/row-faces/partial states derive exactly as for Chat/Sheet.
`pulseData.js` REVIEW assets gained `src`/`poster`/`capLines` (footage +
posters + icons + gradient copied into `public/review/`; Inter self-hosted in
src/styles — the modal is set in Inter per his Figma, the captured chrome stays
National 2). EVERY ported class/keyframe is `rvm-` prefixed and his tokens are
scoped under `.rvm` — the captured production CSS already owns `.panel-footer`
/ `.review-stage`, unprefixed names collide. CampaignPulse's day-scrubber
arrow keys yield while `.rvm` is open (the modal owns arrows for drafts).
Deliberate deltas from his repo: his Dashboard/data stay behind (v43's table
is the dashboard), his 5-draft Emery carousel demo has no v43 data twin (max
2 drafts/creator), celebration counts derive from asset states.

**v43.1 review round (Julia, Aug 17, same day):** the **SHEET direction
REMOVED** — REVIEW UI is now **Modal | Chat** (`?rui=modal|chat`; the v42
sheet lives on in frozen v42). review.jsx keeps the shared MODEL layer
(QUICK_FIXES, who-reviews config, assetsOf/rowReviewState/reviewNeeds/
reviewRowFace) + the login **ReviewPopup** — removed then RESTORED the same
day (Julia); its rv-pop CSS is back in pulse.css. The modal's
request-changes sheet lost ALL its suggestion chips (Julia) — the note box
stands alone, card min-height 532→460; `clip.suggestions` still feed the
Chat composer. Sheet-only rv- CSS stays pruned. Decided rows keep NO cta (unchanged), but
the row drawer's current stage-history step now carries a quiet
**"See what you sent ↗"** tf-histlink (renders once ≥1 asset is decided;
reopens the modal read-only w/ status rails + feedback). Design-QA pass ran
the designer's repo LIVE side-by-side (scratchpad clone, computed-style diff):
three port bugs found + fixed — (1) the scoped element resets (`.rvm button`
etc.) out-ranked component classes and stripped the purple Approve fill, the
sheet textarea border and the chip borders → resets now ride at ZERO
specificity via `.rvm :where(button/img/textarea)`; (2) the captured
production CSS's bare `p { color: rgb(122,64,64); font-size: 13px }`
(production.css:4628) leaked into unclassed modal paragraphs (red captions) →
`.rvm :where(p, span, li, …) { color: inherit; font-size: inherit }` guard;
(3) `.rvm-chev`/`.rvm-chev-left` had no CSS (they live in his dashboard.css,
never ported) → helpers added, prev arrow rotates again. Gradient verified
IDENTICAL to his build (rel -323,-319 @ 1649×1226, natural 3114×2062,
max-width none). Adversarial-review fixes: closes are blocked during the 2.5s
confirm overlay (Esc/scrim would cancel the deferred commit — his original
had the same bug), change notes land at COMMIT time (no orphan notes),
re-entry seeks the first undecided draft, arrow disabled-guards use >=/<=
with an index re-seat effect, `body:has(.rvm)` scroll lock. Modal font stays
Inter (a National 2 Narrow toggle was built and REVERTED same hour — Julia).
The stat row's "🚀 Campaign on schedule, up to 4 weeks faster than industry
average" is v33 Tony copy (Jul 27), not from this round.

**v43.2 (Aug 18) — Tony's FLAG-AN-ISSUE copy (PR #2 from brianbenable,
squash-merged; PR #1 was a duplicate, closed).** The modal's negative path is
no longer a change request to the creator — it's an issue report to Benable:
footer CTA "Flag an issue", sheet title "Sorry about that, let's make it
right", sub says the note goes to the Benable team (NOT the creator) who will
"work out the best solution with the creator directly", CTA "Send to our
team", decided rail "Issue flagged for our team — we'll review and keep you
posted." The ⓘ one-change-round line and the re-film education are gone.
⚠ MODEL CHANGE, flagged to Julia at merge time: this reverses the Aug 10
decided rules "feedback goes straight to the creator · one included change
round" for the modal UI — Chat still speaks the straight-to-her model.

**v43 (Aug 10) — review direction B: THE CONVERSATION.** Iterated from v42 right after its Amine handoff (v42 stays frozen on direction A, the sheet). v43 explores Julia's "Insense-style" idea: the review is a chat with the creator — her post arrives as a message (9:16 card + caption in a creator bubble), Katie's team's brief check is a system line, and **the brand's reply IS the decision**: the composer opens pre-written with a warm acceptance (per-asset `accept` in REVIEW data) — "Approve & send" ships it as-is (editing it just personalizes it); picking a suggestion chip (or "Ask for a change instead") flips the same message into her ONE change round, button becomes "Send to {name}". All decided rules hold (no reject · nudges only · straight to her · can't send empty · edits-not-reshoots via the Katie line). `reviewChat.jsx` (`rvc-` CSS); demo pill gains **REVIEW UI · Chat | Sheet** (chat = v43 default, deep-link `?rui=sheet` for direction A; module-persisted). Thread auto-scrolls; decided posts show the sent purple bubble + status line; per-creator threads chain via "Next: Jade's tiktok →".

**v42 (Aug 10) — fresh iteration base, snapshot of v41.** v41 was the Nisarg handoff pack (docs/HANDOFF.md + spec v2 + v37 migration notes) and stays frozen at its own URL — the docs/ files intentionally keep their v41 links. New work goes here.

**v42 · Brand content review (Aug 10, Trilogy model — study at brand-content-review-study/ port 4218, grounded in the Julia × Amine Aug 10 call + her same-day notes):** Day 16 (BOTH collab types) is the review scene. **WHO REVIEWS is a per-brand config** — demo pill gains a `WHO REVIEWS · Benable | Brand` toggle (module-persisted in review.jsx, deep-link `?review=brand`; default Benable = Katie's team approves, the product default). Decided config for brand mode (Julia): **nudges only** (silence never approves — no auto-approve timer anywhere) · feedback goes **straight to the creator** (the coached composer is the guardrail) · **no reject button** (Katie's team is the escape hatch) · **one included change round** · **edits-first** (quick-fix chips: caption / cover frame / trim / text-on-screen; re-filming is framed as the big ask it is — local: "another visit", product: "re-film from scratch" — and routes to Katie's team personally). **Several posts per creator**: `REVIEW[mode][name].assets[]` in pulseData (local: Maya reel+story, Jade TikTok; product: Jade reel, Priya story) — every asset is **9:16** (player + pop-up tiles use `aspect-ratio: 9/16`), each is decided on its own via a chip filmstrip w/ state dots, the row AGGREGATES (`reviewRowFace`: pending "Her 2 posts are in" → partial "👀 1 of 2 posts reviewed" + Finish review → changes "✏️ One tweak sent" (stays Visited) → approved "🎉 going live soon" (derives stage 4)). **Derivation, not mutation of presentation**: rows carry only `draftIn: true` + Katie-flavored base statuses; decisions land on asset objects (`a.state`); `isReviewRow`/`rowReviewState`/`reviewNeeds` in review.jsx drive stageOf(c, day, mode), amFunnel needs/badges, the header light, and the derived row face — so flipping the toggle back to Benable restores the Katie-checks world untouched. Day-16 recap/upNext are `byReview` containers (benable|brand variants, resolved in CampaignPulse's `pickR`). Pieces: `review.jsx` (`rv-` CSS) — `ReviewSheet` (queue "Post 1 of 3" chained across creators' assets, 9:16 player + caption left, pre-check receipts right, Approve-this-reel = green celebration + optional nice-word note, change composer = "What should change?" head + quick-fix chips + one-line placeholder + full-width send + "Goes straight to her · one change round included" + compressed reshoot-edu footer) + `ReviewPopup` (login pop-up: one blurred 9:16 tile per creator w/ name·kind chip, count CTA "Review the 3 posts", once per session, never in ?embed).

**v40 (Jul 29) — FINAL PICKS LOCKED, switchers removed (Julia):** header tint Grey (#f8f9fa) · ship flow IN the card header · table K (single slot, ghost buttons on the dot axis, moment band folded into the header) · solid green wrap ring. The demo pill keeps only COLLAB TYPE + the day scrubber; deep-links (?table=…&head=…&ship=…&ring=…) still override for the states gallery (public/states.html). The F–K letter exploration lives in v39. Everything below documents the inherited behavior.

**Inherited from v39 (Jul 28), which locked Julia's creators-table picks — no more switchers:** FixedTable only (AmineTable removed from the shell), rail A (split cards), STAGE = ramp dot + word (3A), ACTIONS = calm (4C: gold text + pill, no wash), ICONS off (titles-only cards), no column strip, header tint #f8f9fa on pane #f9fafb, white download button. Undecided dims baked in `F_OPTS` (CampaignPulse.jsx): edu footnote (B) · late quiet (7A) · amber buttons. Two dims stay OPEN as toggles in the demo pill (Julia, Jul 28): HEADER Grey/White + SHIP Band/Header. Also: the download button never swaps to "Get the sheet again" — same button before/after download, only the steps tick — and live (thanks) rows carry NO warm wash (calm everywhere). Demo pill = COLLAB TYPE + HEADER + SHIP + TABLE F/G + day scrubber. The full option exploration lives in v38. **Jul 28 late polish:** tracker empty slabs plain #eef0f1 (no stripes) · badge count centered (border-box+grid) · done stages = lone muted ✓ #7fa892 + hint "All N moved ahead" · invite-day header sub = green dot + "6 invited · 0 of 6 spots filled" · grey HEADER variant tints rail card headers too (.tf-heads-grey) · stage-history aligned to the tracker (labels = stagesFor(mode) names, now-step green #17864f w/ whisper halo, ping ring removed) · **TABLE G letter** = dedicated status column (ramp dot + word, amber dot when the row waits on the brand, 'Match found' on rematch rows) + dedicated action column (white ghost .tf-gbtn buttons — Add tracking / Confirm visit / Review matches / Say thanks —, quiet — when none, 'See her post ↗' at wrap) · ship band/header only renders when the visible rows hold the orders (rows.some(c.ship)) — hidden when focused on e.g. Sourcing. · **TABLE H letter** = G with the two columns swapped (action before status). · **Local stage histories** (`LOCAL.timelines` in pulseData, grounded in the Steph Khalil / Trilogy spas call Jul 28 — Granola ac5470fc): visits, never products — creator emails the brand to book, weekday visits only, massage-or-facial picks, practitioner-consent filming, draft ~7-10 days after the visit; tableFix picks LOCAL.timelines[name] in local mode. · Late-night Jul 28 batch: ship steps band keeps its 3 steps after download (step ① just ticks, black done-text, pale tick chip) · row drawer animates open/close via grid-rows 0fr→1fr (.tf-drawer, always mounted) · stage history has all 7 stages incl. Thanked (synthetic step; states derive from stageOf, wrap = all done) · Live! label + 'See the live post ↗' link once reached · shipped/delivered steps carry arrival ETAs / delivery dates · amber dot lives INSIDE the ghost action button (.tf-btndot; status dot back to ramp fill) · **TABLE I letter** = no action column, the ghost button replaces the status dot in the single slot. TABLE toggle = F/G/H/I/J/K (J = I with button dot/text on the status dot/text axes via .tf-gbtn--flush; K = J with the moment band folded into the header — sub carries the went-live line, faces in head-right, no Send-yours). Say-thanks button wears a pink pulsing ♥ (#e25c74, tf-heartpulse) on the dot axis. Ship CTA = 'Ship and add tracking'; ship modal asks 'Have you shipped …?'. Shipped+arriving live on ONE status line ('Shipped Tuesday — arriving Thursday'); stage-2 timeline details = product pick only. Copy: quality checks only (no disclosure/brand-safety), day-16 statuses reworked knowable-only, NEXT_HINTS[5]='Post goes live — we track how it's doing for you!'. Day-30 wrap band has a green '🎁 See your wrap-up' CTA (.tf-wrapbtn); RING toggle = wrap avatar ring variants Grad/Solid(default)/Soft/Halo/Badge. Spots rule = light ⓘ tooltip beside '0 of 6 spots filled' (.tf-inf/.tf-tip; footnote retired). Needs-you rows: amber dot on BOTH the status and inside the ghost button (.tf-btndot). Row drawers animate via .tf-drawer. · **Timeline honesty rules (Julia, Jul 28):** a step only claims what Benable can KNOW (tracking events, creator confirmations, public posts, deadlines we set) — no creator feelings/quotes, no off-platform scenes; future steps NEVER show past facts — they render `NEXT_HINTS[mode][stage]` (pulseData) or the step's own `next` override.

Brand-portal prototype: captured production HTML + React overlays. v37 = Julia's Jul 27 feedback round (from her Katie calls): **stage renames** (Order shipped / Order delivered / Draft approved — approved only when Katie's team approves, subtitle "Creator will post soon"), **past stages** = pale-green slab + green `✓ N/N` or lone ✓; future = hatched grey slabs (stripes removed Jul 28, restored same day — plain grey blended into the pane), **COLLAB TYPE toggle** (product | local) fixed top-center — local swaps order stages for Confirmed/Visited (visit-date confirm popup, no shipping copy anywhere), **Day 10 · You ship** productOnly scene (non-Shopify CSV: header Download-orders CSV button + per-row Mark-shipped → tracking-number popup), **D11 rematch row** = "New match found / To fill your campaign" + "Review matches" pill replacing stage dashes (never a name), **spots note** in table header while invites await replies, **thank-you nudge** (published-unthanked rows always carry Say-thanks action + header "Deepen the relationship and brand love. Send thank yous!"), **no link metrics anywhere**, views only >1k, comment quotes only >50 likes, top post = likes+comments. Rematch trigger: `invites − creator declines − admin declines < spots`. **Engineer spec: `docs/states-and-logic.md` (for Nisarg) — keep it in sync with every state/logic change.**

## Architecture
- Captured page HTML lives in `src/data/capturedHtml.js` (huge — grep, never read whole).
- Pages render captured HTML via `dangerouslySetInnerHTML`, then mount React overlays into injected host divs with their own `createRoot` + a MutationObserver re-mount (pattern in `CampaignDetailPage.jsx` / `CampaignsListPage.jsx`).
- Campaign page overlay: `src/components/pulse/` — ONE experience (v33's C, the polishing base; the A-D/W/Y/Z/0 exploration lives in v33 + git history):
  - `amine.jsx` — the whole page, values from Amine's build (repo AmineBenjil/benable-cohort-funnel, his V2 "stage rail" Figma 11638:139353). `AmineProgress2` = stat row ("N% through your campaign" green + "🚀 Campaign on schedule, up to 4 weeks faster than industry average"; day 30 = "🎉 Wrapped 37 days ahead of average") + `AmineRailBar` (equal-width 40px slabs, 4px gaps, 74/100px outer corners, his green ramp #b9dfcb→#124a33 w/ AA contrast fixes; label = what happened, hint = what's happening now, empty stages hatched grey w/ muted 0 + forward-looking hint (hatch restored Jul 28); done stages pale-green #eff5f1 w/ green ✓ N/N; leading "Sourcing…" column #dbeee3 while sourcing; 20px amber badge = clickable Needs-you filter; columns click-to-filter — no hover tooltips (Julia removed them, Jul 27)). `AmineTable` = creators card (16px radius, #fafafa column strip, verified badge, 7 purple stage dashes, ⚑ orange flag rows, rows expand to the cp-hist timeline (no Request-more button — removed Jul 27); subtitle "N on this campaign" / "N of M on this campaign" when filtered). `AmineRail` = 370px right rail (While you were away / Up next / The pace w/ #815aff & #c4c4c4 meters + pace-strip.jpg caption strip). `amFunnel` derives every number from CREW; `stageOf` maps crew stage 0-5 (day 30 = Thanked). No banner, no lead headline — the page opens on the progress row; the badge carries attention. Katie's welcome card renders on day 1. Assets in `public/labs/` are Amine's Figma exports.
  - `pulseData.js` — ALL demo content (DAYS day-states w/ recap/upNext/race, CREW per-day rows, TIMELINES w/ calendar dates Jul 16–Aug 6, PCT, SPOTS). Copy tweaks go here. v37: `LOCAL` = local-collab overrides (crew/upNext/recap per day) + `crewFor(day, mode)`; DAYS entries can be `productOnly` (day 10); CREW rows can carry `ship` (CSV Mark-shipped), `confirmEmail` (local Confirm), `action: {cta}` (in-row button), `product` (CSV column).
  - `LiveStatus.jsx` — motion registers: shimmer = machine working now · katie = human present (typing, never a spinner) · heartbeat = watching (breathe, one still sentence) · celebrate = go-live (emoji bounces, words still) · facts/static = quiet. Every animation is a claim — only emit from real signals in production.
  - `CampaignPulse.jsx` — shell: day scrubber (opens Day 9), stage filtering, grey #f9fafb pane (`cp-labs-pane`), scroll unlock lives in overrides.css (`:has(.cp-root)`).
  - Pre-campaign phases (Julia, Jul 27 — "day 1 would never look like a dashboard"): DAYS entries carry `phase`. Day 1 `'sourcing'` = Figma 7199:20453 "Stay Tuned!" (illustration `public/labs/stay-tuned.png`, 22px bold + 18px body, white pane); Day 3 `'review'` = Figma 7199:21448 "We Found N creators who are a great fit" (80px blurred-avatar circle, purple bold count, 48px purple Review Creators pill). During phases the grey pane is skipped (white bg) and the captured header's `.phase-pill` is patched to amber "Recruiting" (#fff0ce/#a85321); Active restores after. Cohort review NEVER renders in the creators table — it's these dedicated states.
  - Day 11 · Rematch found — when a mid-campaign rematch is FOUND it becomes an ACTION ITEM (Julia): CREW row `{ mystery: true, found: true }` → rail's leading column keeps the green #dbeee3 slab — NO orange on the bar, the badge IS the notification (Julia) — label "Matches found · New profiles to review" w/ clickable badge → needs filter; table row = blurred tease photo (`am-avatar--blur`), title "New match found" · subtitle "To fill your campaign" (NEVER a creator name — invites can exceed spots + decline privacy), ⚑ "Review new matches", a purple "Review matches" pill (`am-row-cta`) replaces the stage dashes, no expansion, action rows SORT TO TOP of the table. `amFunnel` counts `found` into `flagged`.
- Brand overview overlay: `BrandPulse.jsx` (lifetime totals, milestone tracker, insight cards) mounted before `.campaigns-section`.
- CSS: `src/styles/pulse.css` only — `cp-` campaign page, `bp-` brand overview. Keep it pruned; don't append dead styles.

**F · Table fixes letter (Jul 28, default):** `tableFix.jsx` (`tf-` CSS) — the creators-table study's picks (creators-table-study/, port 4205) as a switchable TABLE letter (A = AmineTable untouched, F = FixedTable; TABLE A/F group in the demo pill, module-persisted). F: NO column strip (CREATOR/LATEST UPDATE/STAGE removed — double header with the status-light sub, Julia Jul 28); header sub = status light (amber "N waiting on you" — thanks never counts in — / green-dot all-clear sentence); day-4 spots education: the ⓘ chip (2A) was REJECTED (Julia, Jul 28) — an EDU option in the F-options switcher picks B footnote under the table / C dismissable 🎟️ system row / D Katie cursive note in the rail (`KatieSpotsNote`) / E one-time coach mark (dark popover + "Got it", module-persisted dismissals); purple stage dashes → rail chips (exact AM2_RAIL fills, click-to-filter; Sourcing grey); one amber action anatomy (edge+wash+gold status+amber pill in the STAGE slot) worn by Add tracking (renamed from Mark shipped) / Confirm visit / Review matches (purple pill retired); day-10 steps band ① Download order sheet (lone dark button) ② ship ③ add tracking w/ half-strength row pills until `sheetDone`; published-unthanked rows = warm wash + a NORMAL amber "Say thanks" button (postcard rejected, Jul 28) + moment band above the strip (faces + "went live 🎉 — a thank-you lands deepest" education, "Send yours" amber button); day 30 = wrap roster (green band "All 6 live — every thank-you sent", avatar rings, Thanked chips + 💌 Sent stamps — "thank-you sent" stripped from status —, chevron → "See her post ↗"). F-options switcher (second demo row, module-persisted): EDU B/C/D/E · STAGE Chips (3B rail chips) / Dot (3A ramp dot + stage word) · ACTIONS Rows (4A amber anatomy) / Group (4D "Waiting on you" amber band + "Moving on their own" green band, rows calm) · LATE Quiet (7A) / Groups (7B "Still in motion" + "Live this week 🎉" sections). Laws: amber = ball in your court · rail ramp = the one progress language · no red, no purple pills · thanks never counts into the amber light.

## Copy rules
- Operational claims say "Katie's team" (never solo Katie); Katie's first-person voice only in her signed cursive notes.
- No struggle updates; rematches framed as reassurance. Emoji stripped in crew statuses except celebrate.
- A tile row never shows a zero — it shows a sentence about what's happening.

## Dev + ship
- Dev: launch.json name `brand-prototype-v46`, port 5224. Demo page: `/brand/tonypikora/campaigns/46` (campaign) and `/brand/tonypikora/campaigns` (brand overview).
- Deploy: `bash scripts/ship.sh "commit message"` — builds, commits, pushes, watches the Pages run, curls the live URL.
- Live: https://juliabenable.github.io/benable-brand-prototype-v46/
