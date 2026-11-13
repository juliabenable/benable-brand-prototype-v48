# Campaign dashboard — states & logic (v2 spec for Nisarg)

Source of truth: **§1–10** = the v40 prototype (https://juliabenable.github.io/benable-brand-prototype-v41/brand/tonypikora/campaigns/46) + Julia's Jul 27–29 sessions; states gallery: https://juliabenable.github.io/benable-brand-prototype-v41/states.html. **§12 (brand review & flags)** = the **v46 prototype**: https://juliabenable.github.io/benable-brand-prototype-v46/brand/tonypikora/campaigns/46?day=16&mode=local&review=brand (flag something, then use the FLAG DEMO pill to walk the resolution beats).

v2 superseded the Jul 27 (v37) spec (creators table locked in v40). **v3 (Aug 20) adds §12** — the brand content-review + flag lifecycle, from Julia's Aug 17–20 rounds with Tony. Where logic is still open it's marked **OPEN**.

---

## 1. Concepts

- **Campaign types.** Every campaign is either a **product collab** (creator receives a product — fulfilled via Shopify *or* manually via CSV) or a **local collab** (creator visits the business — spa, salon, restaurant…). The type changes the middle stages and all copy (see §7). In the prototype this is the COLLAB TYPE toggle; in production it's a campaign attribute.
- **Spots (deliverable).** The contracted number of creators for the campaign. Invites sent may exceed spots. Rule shown to the brand: *the first `spots` creators who reply are matched; extras are **held for the next campaign*** — never auto-invited (the next brief may not fit them).
- **Stages.** One creator is in exactly one stage. Product: `Invited → Accepted → Order shipped → Order delivered → Draft approved → Content published → Thanked`. Local: same with `Confirmed → Visited` replacing the two order stages. The tracker bar also draws a permanent leading **Sourcing** slot (not a creator stage — a system state).
- **Design laws** (hold everywhere): the tracker's green ramp is the page's **one progress language** · **amber = the ball is in the brand's court** — and only that · **"Say thanks" is a gift, not a chore** — it never enters the "N waiting on you" count, but pending thank-yous do light the amber signals (header dot + tracker badge; decided Jul 29) · no red, no purple on progress · every animation is a claim — only real work moves · **honesty**: the UI only asserts what the system can actually know (tracking events, creator confirmations, public posts, deadlines we set).

## 2. Tracker bar — column states

Every column = count slab + stage label + hint (hint = *what's happening now*; label = what has already happened). Columns are click-to-filter for the creators table; amber badges are click-to-filter for "needs you". No hover tooltips.

| State | When | Slab | Count | Hint |
|---|---|---|---|---|
| **Past** | every active creator is *beyond* this stage | pale green `#eff5f1` | a **lone muted ✓** `#7fa892` (no numbers) | **"All N moved ahead"** |
| **Occupied** | ≥1 creator currently here | green ramp fill | count of creators here | stage-specific, e.g. "3 packages in transit", "2 visits booked", "Creator will post soon" |
| **Future (empty)** | stage not reached yet | plain light grey `#eef0f1` — one shade below the `#f9fafb` pane, **no stripes, no outline** | muted grey `0` | forward-looking, e.g. "Once Katie's team approves drafts" |
| **Needs you** | ≥1 creator here needs brand action | as occupied | as occupied | + **amber badge** with the count (centered, 20px); click filters to those creators |

When **every** creator reaches Thanked, the Thanked count reads **`6 ✨`** with hint "Campaign complete!" (distinct from the Sourcing slot's "All done for now"). One amber everywhere: `#f0a32e` (badges, dots, header light).

**Sourcing slot** (always drawn, always leftmost, never more than one — even if several spots are being sourced):

| State | When | Rendering |
|---|---|---|
| **Done / idle** | campaign underway, nothing being sourced | pale-green slab, lone **green ✓**, hint **"All done for now"** |
| **Sourcing…** | rematch in progress | pale green `#dbeee3`, hint "(Re)matching you with creators" — no promises, no names |
| **Matches found** | rematch candidates ready | label "Matches found", hint "New profiles to review", **amber badge** → needs-you filter |

**Badge vs header light (resolved Jul 29):** both agree — published-unthanked creators light the tracker badge AND the header's amber dot (with the went-live message), while the "N waiting on you" count remains reserved for real work actions.

## 3. Sourcing / rematch

Rematch (sourcing) starts **only** when the campaign can no longer be filled from the invites already out:

```
max_possible_fills = invites_sent − creator_declines − admin_declines
start sourcing  ⇔  max_possible_fills < spots
```

- `creator_declines` = creators who declined the invite; `admin_declines` = creators we declined in admin (e.g. ghosted).
- **Slow replies never trigger sourcing** — we nudge instead. There is **no "Request more" button**; we detect the shortfall and source ourselves.

**Rematch found = a brand to-do:**
- Table row (**sorted to the top**): blurred teaser avatar · title **"New match found"** · subtitle **"To fill your campaign"** · amber status "Match found" · ghost **"Review matches"** button (amber dot inside). **Never a creator name** (invites may exceed spots; decline privacy). Row does not expand.
- Bar: "Matches found" + amber badge. While-you-were-away: "Replacement matches found — profiles ready for your review"; Up next: "Pick who you want to add to this campaign — waiting on you"; recap closer CTA "Review matches".
- Clicking review opens the match-review flow (same as initial creator review).

## 4. Creators-table header — the status light

There is **no column header strip** (CREATOR/UPDATE/STAGE removed) and no icon tiles. The card header = title "Creators" + a one-line subtitle that works as a **status light**, priority order:

1. **Filtered** → `{shown} of {cohort} · {filter label}` + a "Show all ✕" button on the right.
2. **N actions waiting** (excluding Say-thanks) → amber dot + amber **"N waiting on you"**.
3. **Invites pending** → green dot + `"{invited} invited · {accepted} of {spots} spots filled"` (bold segment) + an **ⓘ** with a **light tooltip** (white card, border `#e3e3e3`, soft shadow, small arrow): *"First {spots} to reply take the spots — extras are saved for your next campaign."* This tooltip is the spots rule's only home — never a paragraph or footnote in the chrome. **OPEN:** tooltip needs a tap/click affordance for touch devices.
4. **Creators live this week (unthanked)** → **amber dot** + **"Nia, Sofia and Jade went live 🎉 — send your thank-yous now"** (no face stack). Cap the name list: at >3, "Nia, Sofia and 3 more went live 🎉".
5. **Wrapped** → green dot + "Nothing left to do — campaign wrapped".
6. **Default** → green dot + "Nothing needs you — everyone's moving".

The cohort count ("6 on this campaign") never appears as a static subtitle — counts only live inside sentences that use them.

## 5. Creators-table rows (locked layout "K")

Columns: `avatar (36px) · name + verified + handle · latest update (live status) · single right slot · chevron`. Rows are calm — **no washes, no left accents, no flag glyphs** — and click-expand into the stage-history drawer (§8). Action rows sort to the top.

The **single right slot** renders, by priority:
1. **Brand action pending** → white **ghost button** (border `#e3e3e3`, radius 999) with a small **amber dot inside** + label: `Ship and add tracking` (CSV) / `Confirm visit` (local) / `Review matches` (rematch). Ship buttons sit at ~55% opacity until the order sheet is downloaded (§6).
2. **Published, unthanked** → ghost button with a **pink pulsing ♥** (`#e25c74`, gentle 2.2s scale pulse) + "Say thanks". Same ghost anatomy — the heart is the only signal this is joy, not work.
3. **Otherwise** → **ramp dot + stage word** (dot = the stage's exact tracker fill; sentence-case label; click filters the table to that stage). Sourcing rows: grey dot + "Sourcing…".
4. **Wrap day** → green dot + "Thanked" + a small "💌 Sent" stamp; "See her post ↗" rides at the end of the update text. Avatars wear a **solid green ring**.

Button/dot and label sit on the same x-axes as the status dots/words of neighbouring rows (everything aligns vertically).

Status copy on action rows stays short (~25 chars) — it shares the row with the button. Pop-ups overlay the whole screen, never just the card.

## 6. Non-Shopify (CSV) fulfillment — the brand ships

Shopify campaigns skip all of this (shipping is observed automatically). For CSV campaigns, when ≥1 creator has an order waiting:

- The **card header** grows the flow (header placement is the locked pick — no separate band): the two steps **① Download the order sheet → ② Ship, then add tracking below** (two, not three — three wrapped on smaller screens), plus a **white "Download orders" button** (down-arrow icon).
- The steps **never change shape**. Downloading ticks step ① (✓ in a pale green chip, text black) and hands the "now" weight to step ②. The download button stays the **same button** before and after (no "get the sheet again" swap).
- **Visibility rule:** the flow (steps + button) only renders when the **visible rows** contain the waiting orders — i.e. on "See all", the needs-you filter, or the Accepted stage focus. Focused on Sourcing or any other stage: hidden.
- CSV columns: `Creator, Handle, Product, Shipping status` (`needs shipping` / `shipped`), reflecting marks in real time.
- Each waiting row's ghost button **"Ship and add tracking"** → modal *"Have you shipped {name}'s order?"* with a **tracking number** field. With the tracking number, **we** track the delivery and flip Order shipped → Order delivered automatically.
- When a creator reaches Accepted, the brand gets a notification that this creator's product needs to be sent.

## 7. Local collabs

Stages `Order shipped / Order delivered` become **`Confirmed / Visited`**. Nothing anywhere may mention product picks, packages, or shipping.

| Transition | Trigger |
|---|---|
| Accepted → Confirmed | the creator **emails the brand** to arrange the visit. The brand clicks the row's "Confirm visit" ghost button → pop-up prompts for the **visit date** → confirmed. The date is stored for follow-ups |
| Confirmed → Visited | **automatic once the visit date passes** (kicks off follow-up texts + the content countdown) |

Grounding (Trilogy/TSH spas call, Jul 28): creators pick their service (e.g. massage vs facial) when booking; brands prefer **weekday visits** (quiet spa, no guests in frame); practitioners must consent to filming; draft content typically lands **7–10 days after the visit** — often faster. Local stage histories speak this flow ("Emailed you — visit set for Tuesday 2pm", "Visited Tuesday 2pm — deep-tissue massage"), never products.

Copy swaps: bar hints Accepted "N booking visits" · Confirmed "N visits booked" · Visited "N creating content". Up next: "You have 3 creators visiting next week", "First creator to visit — tomorrow". While you were away: "3 creators visited this week", "Sofia emailed you — set her visit date" (closer CTA "Confirm visit").

## 8. Stage-history drawer (expanded row)

Opens/closes with a smooth height animation (no snap). Contents = **all 7 stages**, mirroring the tracker:

- **Labels** = the tracker's stage names for the campaign type — with two renames in the drawer only: stage 6 is **"Live!"**, stage 7 is **"Thanked"**.
- **Step states** derive from the creator's current stage: before = green ✓ chip + date; current = solid green dot (`#2e9e6b`, subtle halo, **no ping/glow animation**) + green label + "right now" + the row's live status underneath; after = dashed circle + "up next". On wrap day, **everything is done** (nothing is "right now").
- **Tense honesty (hard rules):**
  - A **done** step's detail is a fact that stays true forever: "Delivered Jul 24", "Picked SPF 50 Tinted", "Accepted in under 5 hours". Never a forward-looking clause ("shoot confirmed for Saturday" must NOT survive on a passed step).
  - A **current** step may add the forward flavor (a `now` variant): "Delivered Jul 24 — shoot confirmed for Saturday", "Picked SPF 50 Tinted · arriving Thursday".
  - A **future** step only says what's *planned*, from a per-stage default set (`NEXT_HINTS`, per campaign type) or a specific known plan ("Scheduled for delivery Thursday", "Draft due Sunday"). Never a past-tense fact.
  - Only **knowable** facts anywhere: tracking events, creator confirmations relayed by Katie's team, public posts (an unboxing story, a BTS teaser), deadlines we set. No creator feelings/quotes, no off-platform scenes ("filmed at the beach"), no logistics trivia ("cleared the Memphis hub").
- **Order shipped** steps carry the **arrival ETA** when tracking provides one; **Order delivered** carries the delivery date (done) or scheduled delivery (future).
- Once **Live!** is reached (current or done), the step shows a subtle underlined link **"See the live post ↗"** → the creator's post. **OPEN:** creators with multiple posts need a plural treatment (link list or "See her posts").
- Default future hints (product): invite on approval → waiting on reply → product pick + shipping label → delivery (we watch the tracking) → draft + quality pre-checks → **"Post goes live — we track how it's doing for you!"** → "Your thank-you — right after she posts". Local swaps the middle for booking/visit lines.

## 9. Row statuses (latest update) & copy registry

- Motion registers: `shimmer` = machine working now · `katie` = human present · `celebrate` = live 🎉 (emoji bounces, words still) · `facts/static` = quiet truths. Only real work moves; `facts` never rotate.
- Shipping statuses merge shipped + ETA on one line: **"Shipped Tuesday — arriving Thursday"**.
- Vetting language = **quality checks only** ("Reel submitted — checking quality…") — no "brand-safety", no "disclosure" wording in brand-facing copy.
- Draft submission is never a stage move — vetting appears as status; **Draft approved** happens only when Katie's team approves; its subtitle is "Creator will post soon" (no dates — creator delays can't be promised away).
- Nudges we send are always surfaced in While-you-were-away ("4 filming nudges sent — everyone knows their deadline").
- **While you were away / Up next rules** (unchanged from v1): verifiable claims only; count stages, never say "all/last X" unless literally true; declines are reassurance ("we're already sourcing replacements"); views only >1,000 total; comment quotes only when the post has >50 likes (**OPEN:** AI positive-comment classification); top post = **likes + comments**, never views; **no link metrics, ever**; the closer is one CTA when the brand owes an action, otherwise a green all-clear with an honest horizon.
- Voice: operational claims say **"Katie's team"** (never solo Katie); Katie's first person only in her signed cursive notes. Vague-but-honest timing for creator-controlled steps ("usually within 48h", "this weekend"); real dates only for what we control or observe.

## 10. Phases & wrap

- **Day ~1 (sourcing phase):** no dashboard — "Stay Tuned!" empty state; the portal header pill flips to amber **"Recruiting"**.
- **Shortlist ready (review phase):** "We Found N creators who are a great fit" + Review Creators CTA. Cohort review **never** renders inside the creators table.
- **Wrap (campaign complete):**
  - Stat: plain green **100%** + caption "campaign complete!" with a 🎉 that bounces **once** on arrival (no gradient, nothing loops).
  - Green band on the table: "All 6 live — every thank-you sent" + subtitle + a green **"🎁 See your wrap-up"** button → the wrap-up experience.
  - Rows: solid-green avatar rings, "Thanked" status dot (same column as every other day), "💌 Sent" stamp, "See her post ↗", statuses become results ("Top post — 63 likes & comments") with any "thank-you sent" suffix stripped (the stamp carries it).

## 11. Deliberately out of v1 / OPEN

- ~~Brand content-approval step — deferred~~ → **now specified in §12** (per-brand config; default stays Katie's-team approval).
- Delay explanations; draft-submitted as a visible stage; per-creator "Request more"; link/affiliate metrics; sub-1k views; sub-50-like quotes.
- **OPEN:** tracker amber badge must exclude Say-thanks (align with the header light, §2) · **promise-sweeper** — every dated promise on the page ("arriving Thursday", "Draft due Sunday") needs a background job that updates/expires it before it can go stale; prerequisite for real data · multi-post "See her post" plural (§8) · ⓘ tooltip on touch (§4) · header live-list truncation at >3 names (§4) · rollout scope (all campaigns vs new only) · CSV shipped-marking events feeding creator notifications · local visit-date edge cases (creator reschedules).

## 12. Brand content review & flag lifecycle (v3, Aug 20)

**Config.** `who_reviews` is a **per-brand** setting: `benable` (default — Katie's team approves, nothing in this section renders) or `brand` (the Trilogy model). Flipping it mid-campaign is an admin action; recorded decisions keep their provenance (`approved_by`: brand seat user vs Katie's team) — see Mechanics.

**The review surface.** A three-pane shell ("Approve Content"): creators sidebar (per-creator progress) · stage (draft pill "Draft n of N · {kind}", 9:16 player, caption card) · right panel (Katie's-team pre-checks, footnote, **Flag an issue** / **Approve**). Entry: the row's amber ghost CTA ("Review her post" / "Review her N posts" / "Finish review") — and on ARRIVAL (login or email deep-link) with posts waiting, the shell **opens directly** at the first pending creator, once per batch (no interstitial pop-up — removed Aug 21). Decisions are **per asset** (reel and story decided separately). Entry always lands on the creator's first undecided draft.

### 12.1 Asset state machine

```
pending ──approve──▶ approved                      (terminal)
pending ──flag─────▶ flagged (fix: null)
flagged ──Katie sends feedback──────▶ fix: agreed
flagged/agreed ──Katie marks resolved──▶ fix: resolved   (terminal)
flagged/agreed ──post detected──────▶ fix: resolved      (auto)
flagged/agreed ──Katie returns it───▶ back to pending, NEW VERSION (per-case, see 12.3)
```

- **No undo** (decided): approve and flag are terminal for the brand; a mis-click is handled by Katie's team, not a UI reversal.
- The flag's note goes to the **Benable team, never the creator** ("Sorry about that, let's make it right" sheet; can't send empty). One note per flag (one-shot report, not a thread).
- **No reject exists.** No auto-approve exists — **silence never approves**.

### 12.2 Notifications & the review deadline

- **Brand email, per post** (Julia's walkthrough, Aug 21): every time a post lands for review, the brand gets an email. The email deep-links into the tracker and the review shell **opens directly** at the first pending creator (same as the login behavior: ≥1 pending post ⇒ straight into review — no interstitial). Per-post is deliberate — Trilogy's scale is ~3 creators × 3 posts, and V1 wants the brand to see every arrival; **batching is a later option**, not V1.
- **Ops escalation:** unreviewed drafts never rot silently — when a brand hasn't reviewed a draft for **2 business days**, Katie gets a **Slack notification**, again at 3, 4, … (ops-side; the brand UI stays calm — nudges only, no timers shown).

**Pre-checks (the green list in the panel):** pre-generated is fine. Ideally the bullets derive from the **brand's brief dos**; the simplest shippable version is 3–4 generic checks (hashtags present, partnership disclosed — they have #ad, "sounds like her"). Ship the simplest generation that works; per-campaign variety is a nice-to-have, not a gate.

### 12.3 Katie's admin flow (the flag lifecycle owner)

A brand flag fires a **Slack ping to Katie** (the creator-notification channel) and surfaces **on the creator's card in admin**: open Maya's card and the brand's note ("She is missing the product") is right there. Admin **keeps the existing send-feedback-to-the-creator box** — the brand's note renders beside it as a read-only note, and Katie either copy-pastes it or writes her own version. Her actions:

1. **Send the feedback to the creator** (as written) → asset moves to `fix: agreed` (the tracker flips to "Feedback sent to {name}").
2. **Edit the text, then send** → same transition, edited note goes out.
3. **Mark as resolved** — a **new button in admin** → `fix: resolved` (the tracker advances to "Draft Issue Resolved").

Plus: when we **detect the creator's post** (the updated version going live), the asset **auto-resolves**. Per Tony (Slack, Aug 18): the post-flag ending is **Katie's per-case call** — default is the creator **publishes directly** (no re-review), but Katie can route the asset **back to the brand** for a final approve; that returns it to `pending` as a **new version** (the review CTA re-arms). The schema must support both endings.

The brand gets **one email when the flag resolves** (the loud close). Beat changes in between are visible on login, not pushed.

**V1 scope (deliberate):** ONE round of review only — the brand sees the content once and sends one note; everything after is handled by Katie's team, largely **manually over SMS** for the first brand. V1 is a learning vehicle: what kind of feedback brands actually send, and whether multiple rounds are ever needed (**OPEN** until the data says so).

### 12.6 Brand setup & the per-campaign path

- Admin's **brand-page setup** gets the new path selector: **brand reviews** vs Benable reviews (this is the `who_reviews` config's home).
- When a brand-reviews brand **creates a campaign**, the campaign **defaults to brand reviews** — with the option, per campaign, to switch it back to **Benable reviews**.
- If the brand switches a campaign to Benable reviews: fire a **Slack notification to Katie** (so ops knows the path changed) and flip the campaign's tracker to the Benable-review rendering (Katie-checks statuses, no review CTAs — the same world the WHO REVIEWS toggle shows in the prototype).

### 12.4 Tracker derivation (row face · stage · amber)

Row aggregation precedence (per creator, over their assets): `pending > partial > flagged > resolved > approved`.

| Row state | Face (status line) | Right slot | Stage | Amber? |
|---|---|---|---|---|
| pending | "✨ Her {kind} is / Her N posts are in — waiting on your review" | ghost CTA "Review her post(s)" | unchanged (laggard) | **yes** |
| partial | "👀 {done} of {n} posts reviewed — {left} to go" | ghost CTA "Finish review" | unchanged | **yes** |
| flagged (fix null) | "🚩 Issue flagged — Katie's team is on it" · mixed: "🚩 Issue on her {kind} — {other} approved" | — | unchanged | no |
| flagged (agreed) | "✅ Feedback sent to {name} — she's updating it before posting" | — | unchanged | no |
| resolved | "✅ Issue resolved — updated post going live soon" | — | **stage 4**, stage word **"Draft Issue Resolved"** | no |
| approved | "🎉 All N posts approved — going live soon" | — | **stage 4** ("Draft approved") | no |

- **Amber law extension:** review-pending/partial rows count into "N waiting on you" and tracker badges; flagged/agreed/resolved rows **never** do — the ball is with Katie's team, and the header light goes green when only flags remain.
- **Laggard rule** (decided): assets may publish independently — an approved sibling can go live while another asset's flag is open — but the **row stays at the least-advanced asset's stage**.
- **Stage 4 mapping:** `approved` and `resolved` both advance the row to stage 4; the rail column is unchanged (no new stage), but resolved rows wear the **row-cell + drawer stage word "Draft Issue Resolved"** instead of "Draft approved" (a resolved post was never approved — the label must not lie).
- Drawer stage-4 lines: pending-side hint "Your review — then she posts" · flagged "We're resolving your flag — then she posts" · agreed "Feedback sent — she updates it, then posts" · done: "Approved by you ✓" / "Issue resolved with Katie's team ✓". The drawer's current step always carries **"See what you sent ↗"** once ≥1 asset is decided (reopens the shell read-only: rails + the sent note).
- **Wrap rule:** the wrap state derives from **actual creator states, never the calendar** — rows with open flags or unreviewed drafts keep their honest faces on the wrap roster; the all-green band renders only when true. (The prototype's day-30 shortcut is demo scaffolding.)
- Voice: tracker/drawer say **"Katie's team"**; the review shell says **"our team"** (accepted split, Aug 20).

### 12.5 Engineering mechanics (from the Aug 20 edge audit)

- **Identity:** key everything by `campaign_id + creator_id + asset_id` — never display names (the prototype's name-keyed joins are demo shortcuts). Queue addressing by id, not index; define behavior when the staged draft is withdrawn mid-review (toast + advance).
- **Decision integrity:** version token on approve/flag (draft replaced between load and click ⇒ 409 "draft changed, re-review"); idempotency keys (retry ≠ double-record); server-side immutability (approve-after-flag and vice versa rejected); **first-decision-wins** for concurrent seats + live invalidation (no ghost pending drafts for seat B).
- **Optimistic write:** the shell commits, plays a ~1.15s check flash, then advances. Use the flash as latency cover for the server ack; on rejection, revert + toast (the reviewer hasn't moved yet).
- **Notes schema:** `{audience: 'staff'}` today (flag notes never reach the creator verbatim — Katie relays); keep the field so a future creator-visible pipeline can't mis-route.
- **Boundary states:** a submission with zero assets must not derive "review pending" (delete on last withdrawal); a drained queue needs an explicit "all reviewed" close state; pick **one counting unit per surface** (popup counts posts, header light counts rows, shell header counts creators — intentional, but document it).
- **Front-end:** focus trap + `aria-modal` on the shell (the prototype's background stays keyboard-reachable); `prefers-reduced-motion` fallback for the flash/slide; the 3-pane shell is desktop-only — mobile needs a stacked layout; the creators **sidebar needs overflow scroll** for long rosters (not in the prototype — Trilogy won't hit it, real data will).

**OPEN (§12):** admin-side audit trail fields (who/when per fix transition) · email batching cadence once volume grows · whether multiple review rounds are needed (learn from V1) · back-to-review versioning UX (how the returned draft is labeled for the brand) · flagged-at-wrap comms (what the wrap email says when a flag resolved late).
