# First-part flow capture — Aug 18, 2026

Production capture of the **create-campaign (first part) flow**, benable.com brand portal,
account `benable-collab-studio` (demo brand), desktop viewport 1440×900.
Each `NN-*.html` is the page's full `document.documentElement.outerHTML` at that state,
pumped out of the Browser pane via localhost link-navigation chunks and verified bit-perfect
against an in-page SHA-256 (see `expected-shas` in the session; every file passed `shasum -c`).

## Flow map (in capture order)

| # | File | URL | State |
|---|------|-----|-------|
| 01 | 01-campaigns-overview.html | /brand/benable-collab-studio/campaigns | Overview, Active tab: 2 launched cards (progress %), 2 Draft "Finish setup" cards, 1 banked "Launch now" card |
| 02 | 02-create-step1-intro.html | /campaigns/new?campaign_number=5 | Wizard step 1 — "Creator campaigns, made easy." intro (99%+/90%+ stats, 4 value props, Get Started) |
| 03 | 03-create-step2-setup.html | same (SPA state) | Step 2 — "Set up your campaign": who posts (Creator Posts ✓ / UGC soon) + reward (Gifted Product ✓ / Gift Card soon / Hybrid soon) |
| 04 | 04-create-step3-products.html | same | Step 3 — simple product grid, 0 selected, disabled CTA (imgs lazy — srcs present in DOM) |
| 05 | 05-create-advanced-default.html | same | Advanced Options — empty Product Set 1 + "Creator's view" rail (empty preview) |
| 06 | 06-create-advanced-whogets-open.html | same | "WHO GETS THIS?" dropdown open: Creators get all ✓ / Creators choose |
| 07 | 07-addproducts-modal.html | same | Add Products modal, default (10 products, Select all shown) |
| 08 | 08-addproducts-2selected.html | same | Add Products modal, 2 selected (ring+check, footer count, Add enabled) |
| 09 | 09-available-options-modal.html | same | "Available options" variant modal (Sunlit: Shade pills Fair/Light/Medium ✓, Deep struck out) |
| 10 | 10-addproducts-3selected-variantpill.html | same | Modal w/ "3 variants" count pill on selected card ("All variants" when every option kept) |
| 11 | 11-advanced-set1-populated.html | same | Set 1 with 3 product cards + Creator's view "Get all 3 · Everyone" |
| 12 | 12-addproducts-alreadyinset.html | same | Add Products for Set 2 — "Already in another set" dimmed overlays |
| 13 | 13-advanced-2sets-choose-pickcount.html | same | 2 sets; Set 2 = Creators choose + "How many can each creator pick?" input; rail shows "Pick 1 of 1 · Choose" |
| 15 | 15-brief-review-full.html | /campaigns/94 | "Review Your Campaign Brief" — draft created (id 94). Sections: About the Brand / Note from the Brand / What Creators Receive (sets summary) / What Creators Will Do / Brand Guidelines (do's+don'ts) / Usage & Permissions (30-day organic rights) / Content Review (Benable Review ACTIVE vs Brand Review coming-soon) + Find Creators footer card |
| 16 | 16-brief-about-editing.html | /campaigns/94 | About section in Edit mode (Done btn, "Add post" dashed tile for recent posts) |
| 17 | 17-brief-note-editing.html | /campaigns/94 | Note-from-brand section in Edit mode |
| 18 | 18-find-creators-prefs.html | /campaigns/94 (matching step) | "Creator Matching" — count stepper (10), Creator tier (Rising ✓ / Established), TARGET CREATOR AI bullets, "Anything else?" textarea, Launch Campaign CTA |
| 19 | 19-find-creators-howwork-open.html | same | "How we find your creators" expanded: 1 AI analyzes → 2 Team reviews → 3 You approve |
| 20 | 20-campaigns-overview-completed-tab.html | /campaigns | Overview, Completed tab empty state ("Your finished campaigns live here.") |
| 21 | 21-draft-resume-92.html | /campaigns/92 | Draft resume: opens straight into that campaign's brief review (Sunlit campaign) |
| 22 | 22-launch-t0.html | /campaigns/94 | LAUNCH transition state (~0.4s after Launch Campaign click) |
| 23 | 23-launch-t1.html | /campaigns/94 | LAUNCHED dashboard: "Your campaign is live! 🎉" — amber Recruiting pill, Dashboard/Content tabs, Shopify fulfillment toggle, "Finding your perfect creators." (1 business day, email when ready), "What happens next" ladder (review/approve → product → quality review). Production's casting-wait state |
| 25 | 25-launched-content-tab.html | /campaigns/94 (Content) | Recruiting-phase Content tab empty state (hourglass, "No content to see yet") |
| 26 | 26-overview-after-launch.html | /campaigns | Overview after launch: launched campaign = "Campaign 3 · Launched August 18 · 0% Complete" (numbering is positional: launched first, then drafts) |

Missing / reconstruct-from-screenshot: the AI brief **generation interstitial** ("Analyzing your
products… / Understanding your brand and category… / Drafting your campaign brief…", purple dots)
— transient, DOM was replaced before stash; session screenshots exist. Post-launch (matching in
progress) state not captured (launch decision pending).

## css/
All stylesheets referenced by the captured pages, downloaded from the immutable asset URLs
(`css-urls.txt` = source list). Load order for rebuild ≈ app → tippy → 22 → Icon →
NotificationToast → BrandAvatar → pageAnimations → ajax → 135 → ErrorState → route CSS
(136, 137, BrandCampaignReviewContent, BrandCampaignDraftReviewPage, editor, file-upload,
LoadingState, close, doka) + Google Fonts Inter (400–800) + Font Awesome 5.12 (all.min.css).
Body font = -apple-system stack via inline `<style>` in `<head>` (captured in the HTML).

## Notes for the rebuild
- SPA = SvelteKit; every page includes full `<head>` with `svelte-*` scoped classes — class
  names are tied to these exact CSS files; don't mix with a newer deploy's CSS.
- Wizard steps 2–13 share the `/campaigns/new` URL (client state); brief + matching live at
  `/campaigns/{id}` (server drafts; campaign_number=5 came from the banked "Launch now" card).
- Product images hotlink Shopify CDN + assets.benable.com; brand logo `/images/biz/logo.svg`
  (download before building if offline fidelity is wanted).
- `#rendered-modals` div at body end is the modal portal — Add Products / Available options
  render there.
- Demo drafts created during capture: campaign 94 (Cloudveil, 2 sets: get-all 3 + choose 1 of 1
  Moonmilk) — plus pre-existing 92/93 drafts and campaign_number=5 banked slot.
