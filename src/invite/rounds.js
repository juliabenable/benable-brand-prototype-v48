/* The demo campaign's first Invite Creators round: one source for the tracker
   (Day 3 card "We Found 75 creators", Day 4 table "75 invited") and the popup
   it opens (18 previously approved + 57 new, Amine's demo list in
   public/invite-creators/mock-api.js; names and faces copied from there). */
const B = import.meta.env.BASE_URL;
const face = (f) => `${B}invite-creators/assets/${f}.jpg`;

export const FIRST_ROUND = { prev: 18, fresh: 57 };
export const FIRST_ROUND_TOTAL = FIRST_ROUND.prev + FIRST_ROUND.fresh;

const PREV = ['Emma Wilson', 'Maya Brooks', 'Chloe Martin', 'Zoe Parker', 'Sofia Patel', 'Nora Bennett',
  'Olivia Chen', 'Isabel Rivera', 'Hazel Moore', 'Lucy Grant', 'Stella Price', 'Violet Hayes', 'Audrey Cole',
  'Piper Lane', 'Elena Ruiz', 'Margot Fields', 'Daisy Holt', 'June Carter'];
const PREV_FACES = ['avatar-1', 'approved-1', 'approved-2', 'approved-3', 'avatar-5', 'avatar-9', 'avatar-8',
  'avatar-2', 'avatar-3', 'avatar-4', 'avatar-6', 'jordan', 'avatar-7', 'avatar-0', 'new-1', 'new-2', 'new-3', 'new-0'];
const NEW = ['Jordan Blake', 'Eva Thompson', 'Lena Ortiz', 'Priya Shah', 'Mia Laurent', 'Hannah Kim', 'Camila Reyes',
  'Grace Okafor', 'Ella Novak', 'Ruby Castillo', 'Ivy Mitchell', 'Naomi Brooks', 'Sienna Hart', 'Layla Haddad',
  'Aria Bennett', 'Jade Moreno', 'Leah Fischer', 'Tessa Ward', 'Nina Alvarez', 'Clara Dubois', 'Nia Singh',
  'Willow Grant', 'Iris Nakamura', 'Freya Lund', 'Dahlia Cruz', 'Ruben Vega', 'Adaeze Okoye', 'Celine Fontaine',
  'Bianca Rossi', 'Talia Cohen', 'Noor Rahman', 'Paige Sullivan', 'Esme Walker', 'Gia Romano', 'Harper Quinn',
  'Kira Petrova', 'Lila Ahmed', 'Mila Kowalski', 'Nadia Farah', 'Opal Jensen', 'Quinn Harper', 'Rosa Delgado',
  'Sasha Ivanova', 'Thea Morgan', 'Uma Patel', 'Vera Lindqvist', 'Wren Callahan', 'Xena Park', 'Yara Haddad',
  'Zara Malik', 'Alba Serrano', 'Bea Lawson', 'Cora Whitfield', 'Dina Mansour', 'Elise Moreau', 'Fiona Byrne',
  'Gemma Lowe'];
const NEW_FACES = ['new-0', 'new-1', 'new-2', 'new-3', 'jordan', 'avatar-0', 'avatar-2', 'avatar-3', 'avatar-4',
  'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'approved-1', 'approved-2', 'approved-3', 'avatar-1'];

/* The tracker's six wear their tracker photos in the popup too (mock-api.js does the same) */
const STORY_FACE = { 'Maya Brooks': 'story-maya', 'Sofia Patel': 'story-sofia', 'Lena Ortiz': 'story-lena',
  'Priya Shah': 'story-priya', 'Jade Moreno': 'story-jade', 'Nia Singh': 'story-nia' };
/* Previously approved in the popup's order (Julia, Oct 22): Favorite and Would work again first,
   then approved-but-never-invited, then Katie's team's picks (same tiers as mock-api.js) */
const KIND = { 'Emma Wilson': 0, 'Maya Brooks': 0, 'Chloe Martin': 0, 'Audrey Cole': 0, 'Sofia Patel': 1, 'Zoe Parker': 1,
  'Nora Bennett': 1, 'Elena Ruiz': 1, 'Olivia Chen': 2, 'Isabel Rivera': 2, 'Stella Price': 2 };
const tier = (n) => KIND[n] ?? 3;
const all = [
  ...PREV.map((n, i) => ({ full: n, face: STORY_FACE[n] || PREV_FACES[i % PREV_FACES.length] }))
    .sort((a, b) => tier(a.full) - tier(b.full)),
  ...NEW.map((n, i) => ({ full: n, face: STORY_FACE[n] || NEW_FACES[i % NEW_FACES.length] })),
];
const firstName = (full) => full.split(' ')[0];

/* Day 3 card: the first four faces of the popup's list, blurred. All 75: Emma, Maya, Chloe, Zoe.
   Only 7 (the tracker's six plus one): Maya, Sofia, then the new ones. */
export const FOUND_FACES = all.slice(0, 4).map((c) => face(c.face));
export const FOUND_FACES_7 = all.filter((c) => STORY_FACE[c.full]).slice(0, 4).map((c) => face(c.face));

/* Day 4: the tracker follows its own six creators (Maya, Nia, Sofia, Jade, Priya,
   Lena); the popup list has six people with those first names, so they stand in
   for them and the other 69 are invited alongside: 75 in all. Full names, as in
   the popup, so nobody collides with the tracker's own creators (PHOTOS and
   TIMELINES are keyed by name; pulseData gives them Lena's Day 4 history). */
const STORY = ['Maya', 'Nia', 'Sofia', 'Jade', 'Priya', 'Lena'];
const others = all.filter((c) => !STORY.includes(firstName(c.full)));
export const MORE_INVITED = others.map((c) => ({
  name: c.full,
  handle: '@' + c.full.replace(' ', '_'),
  stage: 0,
  status: { type: 'facts', phrases: ['Invite sent this morning'] },
}));
export const MORE_PHOTOS = Object.fromEntries(others.map((c) => [c.full, face(c.face)]));

/* Amara (@amara.gold) takes the open spot from Day 11 on. Under the OPEN SPOT
   switch she is either one of the first round's invites ("From invites": she
   stands in for Adaeze Okoye on the popup list and Day 4) or a new match the
   brand reviews on Day 11 ("New matches", with three others). */
const row = (name, handle) => ({ name, handle, stage: 0, status: { type: 'facts', phrases: ['Invite sent this morning'] } });
export const AMARA_INVITE = row('Amara Gold', '@amara.gold');
export const SWAPPED_FOR_AMARA = 'Adaeze Okoye';
export const REMATCH_OTHERS = [row('Simone Clarke', '@Simone_Clarke'), row('Keira Dunn', '@Keira_Dunn'), row('Ava Morales', '@Ava_Morales')];
Object.assign(MORE_PHOTOS, {
  'Amara Gold': face('amara'),
  'Simone Clarke': face('avatar-6'),
  'Keira Dunn': face('new-2'),
  'Ava Morales': face('approved-3'),
});
