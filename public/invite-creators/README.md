# Invite Creators popup (engineering copy)

Amine's v2 popup (AmineBenjil/invite-creators-prototype-v2 @2cd968a, Oct 22), **V1 layout only**
(Figma 15309:22677), cleaned for engineering. Plain HTML/CSS/JS, fake backend in `mock-api.js`.
In the v47 tracker: Day 3 "Review Creators" (first round) and Day 11 "Review matches" (rematch).

## Changed from Amine's build (Julia, Oct 22)

- **V1 only.** V2, V3, V4, the version switch and the deck code are gone.
- **Not a Fit is Inline.** The card collapses to its row right away; "Tell us why?" on the row
  opens the feedback box for an optional reason. No popup first.
- **No crash on small groups.** A group with no creators is left out (a brand's first campaign has
  no previously approved creators). Names read "Emma", "Emma and Maya", "Emma, Maya and 1 other".
- **Counts.** "1 creator" everywhere; with nobody left, Approve is disabled.
- **Under-50 warning removed.** When we selected 40% or less above the spots, the footer says
  "Approve as many creators as possible to fit your N spots." instead.
- **Spots come from the campaign** (`?spots=`), never hardcoded.
- **Prioritize is capped at one per spot.** At the cap the other Prioritize buttons grey out, with
  the tooltip "You've prioritized N, one per spot. Turn one off to swap." If every creator left
  is prioritized, the summary drops "get the first chance to accept" (nobody goes first).
- **No empty profile fields.** A missing bio, fit list, stat or content row is left out.
- **Saves as the brand goes.** Prioritize, Not a Fit, reasons and the sent state persist (here in
  sessionStorage, in production on the server). Closing or reloading keeps them; after Send it
  reopens on the success screen.
- **Fits the screen.** Up to 1024 x 820 with 16px around it; on a narrow popup the stats stack.
- **After Send** the dashboard shows the creators table (in v47 the tracker moves on a day). The
  "N creators approved" dashboard card from Amine's page is gone.

## Rules for production (decided Oct 22, Julia)

- No invite cap shown to the brand: they approve as many as they want.
- The Not a Fit reason is Benable only; creators never see it, or that someone was prioritized.
- Previously approved = creators the brand worked with, plus creators the brand approved last
  time whose invite never went out because the campaign filled before their turn (DECIDED,
  Julia, Oct 22). The demo shows both (15 + 3 of 18), each with what happened last time.
- Previously approved order (DECIDED, Julia, Oct 22): creators tagged Favorite or Would work again
  first, then those approved last time but never invited (the campaign filled), then creators the
  brand worked with before whom Katie's team picked by hand. Each card's line says which.
  OPEN for Nisarg (copywriter, Oct 22): the third tier must leave out creators the brand marked
  "one and done"; the second tier only holds for invites that expired when the campaign filled
  (not ones ops revoked by hand) and for the most recent campaign; a creator with both a Favorite
  and a Would work again answer shows the Favorite line.
- Acceptance rate stays a fixed 50% assumption.

## URL options

Six creators on the list wear the v47 tracker's handles and photos (Maya, Nia, Sofia, Jade, Priya, Lena),
so the popup and the tracker show the same people.


`?spots=25` · `?mode=rematch` (4 new creators who weren't in the first round, 1 spot) · `?pool=7` (we only
found 7: the v47 tracker's six plus one) · `?amara=1` (Amara is on the first-round list) · `?prev=18&new=57`
(try 0, 1, 2) · `?notfit=26` · `?sparse=1` (gaps in the first new profile) · `?sendfail=1` ·
`?fresh=1` (forget saved choices).

## Messages (when embedded)

Out: `invite:sent { count, names }`, `invite:closed { sent }`. In: `invite:open`.
