/* Shared demo-fork store for the whole /nf experience (creation flow +
   tracker). The tracker's black cp-mode bar and the /nf ForkBar both read
   and write here, so a fork flipped anywhere holds everywhere.
   Julia's plan (Aug 19): this registry grows one entry per fork until the
   prototype can play every configuration; richer logic lands per-fork as
   she specs it. */

const state = {
  type: 'product',   // 'product' | 'local' — collab type, switches the entire flow
  review: 'benable', // 'benable' | 'brand' — who reviews content
  declined: false,   // declined invites hidden|shown (Katie's admin switch)
  rui: 'modal',      // review UI direction: 'modal' | 'chat'
  fulfill: 'csv',    // product fulfillment: 'shopify' auto-orders | 'csv' the brand ships
  model: 'campaigns', // what the brand buys: 'campaigns' (runs, today) | 'roster' (direction E, always-on)
  nps: 'on',         // brand NPS asks (Tony, Sep 21): 'on' | 'off', one question at launch, cast set, close
  npsq: 'moment',    // what the asks say: 'moment' one question per moment (confidence / creators / recommend) | 'recommend' the recommend question at all three
  npsui: 'card',     // where the in-portal ask lives: 'card' in the page flow (rail, launch screen) | 'corner' bottom-right slide-up, Airtable's pattern (Sep 24)
  variants: 'product', // variants on the brief: 'product' hooks + instructions per product in their own section (Julia, Nov 13) | 'creators' the first Nov 13 version, tabs with a creator count on What Creators Will Do (Caraway ask, Oct 6) | 'off' one brief for everyone, as production
  late: 'none',      // how the campaign ends: 'none' everyone posted by the deadline | 'one' a straggler is still late when it closes at deadline + 7 days
};
try { Object.assign(state, JSON.parse(localStorage.getItem('nfForks') || '{}')); } catch { /* fresh */ }
// 'on' was the creator-count version's value before the Nov 13 change of direction: land on the new default
if (!['product', 'creators', 'off'].includes(state.variants)) state.variants = 'product';

const subs = new Set();

export const forks = {
  get: (k) => state[k],
  all: () => ({ ...state }),
  set(k, v) {
    if (state[k] === v) return;
    state[k] = v;
    try { localStorage.setItem('nfForks', JSON.stringify(state)); } catch { /* private mode */ }
    subs.forEach((f) => f(state));
  },
  sub(f) { subs.add(f); return () => subs.delete(f); },
};

export const FORK_DEFS = [
  { key: 'model', label: 'Model', hint: 'What the brand buys: campaigns as today, months of content (directions A + C: same screens, new clock + the pace line), or an always-on creator roster (direction E)', options: [['campaigns', 'Campaigns'], ['months', 'Months'], ['roster', 'Roster']] },
  { key: 'variants', label: 'Variants', hint: 'By product (Julia, Nov 13): What Creators Will Do stays one section, and a new section holds hooks and instructions per product, one tab per product. By creator count: the first Nov 13 version from the Caraway ask (Tony, Oct 6), tabs on What Creators Will Do, each with its own creator count. Off = one brief for everyone, as production', options: [['product', 'By product'], ['creators', 'By creator count'], ['off', 'Off']], barHide: ['creators'] },
  { key: 'type', label: 'Collab type', hint: 'Product shipping vs local gift-card visit — forks the wizard, brief and tracker', options: [['product', 'Product'], ['local', 'Local']] },
  { key: 'review', label: 'Who reviews', hint: 'Content pre-check owner: Benable team vs the brand (Trilogy model)', options: [['benable', 'Benable'], ['brand', 'Brand']] },
  { key: 'fulfill', label: 'Fulfillment', hint: 'Product campaigns: Shopify places orders automatically vs the brand ships from a CSV order sheet (Day-10 machinery)', options: [['shopify', 'Shopify'], ['csv', 'CSV']] },
  { key: 'declined', label: 'Declined invites', hint: 'Katie’s per-brand admin switch — whether brands see declines', options: [[false, 'Hidden'], [true, 'Shown']] },
  { key: 'nps', label: 'NPS asks', hint: 'Tony, Sep 21: one 0 to 10 question at three moments (campaign live, cast set, campaign closed). First tap banks the score, the note is optional', options: [['on', 'On'], ['off', 'Off']] },
  { key: 'npsq', label: 'NPS question', hint: 'The one real choice for Tony: a question the brand can judge at each moment (confidence at launch, the creators at cast set, recommend at close), or the recommend question word for word at all three', options: [['moment', 'By moment'], ['recommend', 'Same ×3']] },
  { key: 'npsui', label: 'NPS surface', hint: 'Where the in-portal ask lives: a card in the page flow (launch screen, tracker rail) or a bottom-right slide-up in the Airtable pattern (eleven chips with gaps, Submit as a second click, one generic follow-up). Same store either way', options: [['card', 'Card'], ['corner', 'Corner']] },
  { key: 'late', label: 'Stragglers', hint: 'How the campaign ends: everyone posts by the deadline, or one creator is still late and the campaign closes anyway at deadline + 7 days', options: [['none', 'None'], ['one', 'One late']] },
  { key: 'rui', label: 'Review UI', hint: 'Review direction: Amine’s modal vs the conversation', options: [['modal', 'Modal'], ['chat', 'Chat']] },
];
