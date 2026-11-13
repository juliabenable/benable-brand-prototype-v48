// Fake backend for the prototype. Choices save as the brand goes: sessionStorage stands in for the
// server, so closing the popup or reloading the page keeps them (a new tab starts fresh).
//
// URL options, all optional (the v47 tracker passes spots and mode):
//   ?spots=25          the campaign's spots (default 25; a rematch defaults to 1)
//   ?mode=rematch      a second round to refill open spots: 4 new creators (default 1 spot)
//   ?pool=7            we only found 7: the tracker's six plus one
//   ?amara=1           Amara is on the first-round list (she takes the open spot from the invites)
//   ?prev=18&new=57    how many previously approved / new creators we selected (try 0, 1, 2)
//   ?notfit=26         start with that many new creators marked Not a Fit
//   ?sparse=1          the first new creator has gaps in their profile (no bio, fits, stats, content)
//   ?sendfail=1        Send fails, to see the error
//   ?fresh=1           forget saved choices

const mockApi = (() => {
  const q = new URLSearchParams(location.search);
  const num = (k, d) => { const v = parseInt(q.get(k), 10); return Number.isFinite(v) && v >= 0 ? v : d; };
  const mode = q.get('mode') === 'rematch' ? 'rematch' : 'first';
  const campaign = { mode, spots: Math.max(1, num('spots', mode === 'rematch' ? 1 : 25)) };

  // ---------- Previously approved: creators the brand has worked with or approved before ----------
  const approvedNames = ['Emma Wilson', 'Maya Brooks', 'Chloe Martin', 'Zoe Parker', 'Sofia Patel', 'Nora Bennett',
    'Olivia Chen', 'Isabel Rivera', 'Hazel Moore', 'Lucy Grant', 'Stella Price', 'Violet Hayes', 'Audrey Cole',
    'Piper Lane', 'Elena Ruiz', 'Margot Fields', 'Daisy Holt', 'June Carter'];
  // Placeholder faces; the first four match the collapsed bar's avatar stack
  const approvedFaces = ['avatar-1', 'approved-1', 'approved-2', 'approved-3', 'avatar-5', 'avatar-9', 'avatar-8',
    'avatar-2', 'avatar-3', 'avatar-4', 'avatar-6', 'jordan', 'avatar-7', 'avatar-0', 'new-1', 'new-2', 'new-3', 'new-0'];
  // Why each one is back (Julia, Oct 22), which also sets the group's order:
  //   fav / again  the brand tagged them Favorite or Would work again after a campaign
  //   missed       approved last time, but the campaign filled before their turn (never invited)
  //   picked       worked together before, no tag; Katie's team picked them for this campaign
  const kinds = {
    'Emma Wilson': 'fav', 'Maya Brooks': 'fav', 'Chloe Martin': 'fav', 'Audrey Cole': 'fav',
    'Sofia Patel': 'again', 'Zoe Parker': 'again', 'Nora Bennett': 'again', 'Elena Ruiz': 'again',
    'Olivia Chen': 'missed', 'Isabel Rivera': 'missed', 'Stella Price': 'missed',
  };
  const kindOf = name => kinds[name] || 'picked';
  const KIND_ORDER = ['fav', 'again', 'missed', 'picked'];
  // What happened last time, shown next to the "Previously approved" tag (copywriter, PROPOSED)
  const together = n => `${n} campaign${n === 1 ? '' : 's'}`;
  const HISTORY = {
    fav: n => `You've done ${together(n)} together and added them to your favorites.`,
    again: n => `You've done ${together(n)} together and said you'd work with them again.`,
    missed: () => 'You approved them last time, but the campaign filled before their turn.',
    picked: n => `You've done ${together(n)} together. Katie's team picked them for this one.`,
  };
  const history = (name, i) => HISTORY[kindOf(name)](1 + (i % 3));

  // ---------- New creators: hand-selected profiles ----------
  const newNames = ['Jordan Blake', 'Eva Thompson', 'Lena Ortiz', 'Priya Shah', 'Mia Laurent', 'Hannah Kim', 'Camila Reyes',
    'Grace Okafor', 'Ella Novak', 'Ruby Castillo', 'Ivy Mitchell', 'Naomi Brooks', 'Sienna Hart', 'Layla Haddad',
    'Aria Bennett', 'Jade Moreno', 'Leah Fischer', 'Tessa Ward', 'Nina Alvarez', 'Clara Dubois', 'Nia Singh',
    'Willow Grant', 'Iris Nakamura', 'Freya Lund', 'Dahlia Cruz', 'Ruben Vega', 'Adaeze Okoye', 'Celine Fontaine',
    'Bianca Rossi', 'Talia Cohen', 'Noor Rahman', 'Paige Sullivan', 'Esme Walker', 'Gia Romano', 'Harper Quinn',
    'Kira Petrova', 'Lila Ahmed', 'Mila Kowalski', 'Nadia Farah', 'Opal Jensen', 'Quinn Harper', 'Rosa Delgado',
    'Sasha Ivanova', 'Thea Morgan', 'Uma Patel', 'Vera Lindqvist', 'Wren Callahan', 'Xena Park', 'Yara Haddad',
    'Zara Malik', 'Alba Serrano', 'Bea Lawson', 'Cora Whitfield', 'Dina Mansour', 'Elise Moreau', 'Fiona Byrne',
    'Gemma Lowe'];
  // Placeholder faces until real ones are added; the first four match the collapsed bar's avatar stack
  const faces = ['new-0', 'new-1', 'new-2', 'new-3', 'jordan', 'avatar-0', 'avatar-2', 'avatar-3', 'avatar-4',
    'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'approved-1', 'approved-2', 'approved-3', 'avatar-1'];
  const bios = [
    '📍seattle 📖 journaling | self study | lifestyle design ✨ hope core for your 20s',
    '📍austin ☕ slow mornings | skincare that actually works | honest reviews only',
    '📍brooklyn 🍳 easy weeknight meals | pantry hacks | cozy cooking for one or two',
    '📍toronto 🧘 wellness on a budget | pilates girlie | gut health and good habits',
    '📍los angeles 💄 clean beauty | GRWM | everyday makeup for busy mornings',
    '📍chicago 🏃 run club | high protein snacks | busy-girl routines that stick',
    '📍miami 🌴 beach days | sunscreen nerd | travel light and eat well everywhere',
    '📍denver 🏔️ trail runs | camp cooking | outdoorsy girl with a soft life',
  ];
  const fits = [
    'Tech-forward creator with a polished, lifestyle-friendly personal brand.',
    'Creator-native voice suits routine, demo, and first-impression content.',
    'Engagement is 2× the category median for this follower band.',
    'Audience skews 25–35 and over-indexes on wellness purchases.',
    'Posts consistent morning-routine content where the product fits naturally.',
    'Strong save rate on recipe and how-to videos.',
  ];
  const places = ['USA', 'USA', 'Canada', 'USA', 'UK', 'USA'];
  const ages = ['25-35', '18-24', '25-35', '35-44'];
  const content = ['content-0', 'content-1', 'content-2', 'content-3', 'content-4', 'content-5', 'content-6'];

  const profile = (name, i, source, avatar) => ({
    id: (source === 'new' ? 'nc' : 'ap') + i,
    source,
    name,
    handle: '@' + name.replace(' ', '_'),
    avatar,
    bio: bios[i % bios.length],
    fits: [0, 1, 2].map(k => fits[(i + k) % fits.length]),
    followers: (8 + (i * 37) % 90 + ((i * 7) % 10) / 10).toFixed(1) + 'K',
    engagement: (3 + (i * 13) % 12 + ((i * 3) % 10) / 10).toFixed(1) + '%',
    location: places[i % places.length],
    age: ages[i % ages.length],
    gender: 'Female',
    content: content.map((_, k) => content[(k + i) % content.length]),
    priority: false,
    notFit: false,
    feedback: false,
  });

  // The v47 tracker follows six creators (Maya, Nia, Sofia, Jade, Priya, Lena): in this list they keep
  // their names but wear the tracker's handles and photos, so the popup and the tracker are the same people.
  const story = {
    'Maya Brooks': ['@maya.skin', 'story-maya'], 'Sofia Patel': ['@sofia.films', 'story-sofia'],
    'Lena Ortiz': ['@lena.lately', 'story-lena'], 'Priya Shah': ['@priyacreates', 'story-priya'],
    'Jade Moreno': ['@jadebythesea', 'story-jade'], 'Nia Singh': ['@niaglow', 'story-nia'],
  };
  // Amara (@amara.gold) takes the open spot in the tracker from Day 11 on: ?amara=1 puts her on this
  // first-round list (in place of Adaeze Okoye); otherwise she's one of the rematch's new creators.
  const amara = { name: 'Amara Gold', handle: '@amara.gold', avatar: 'amara' };
  const rematchPeople = [amara,
    { name: 'Simone Clarke', avatar: 'avatar-6' },
    { name: 'Keira Dunn', avatar: 'new-2' },
    { name: 'Ava Morales', avatar: 'approved-3' },
  ];
  const person = (name, avatar) => (story[name] ? { name, handle: story[name][0], avatar: story[name][1] }
    : q.get('amara') && name === 'Adaeze Okoye' ? amara : { name, avatar });
  let prevPeople = approvedNames.map((name, i) => person(name, approvedFaces[i % approvedFaces.length]));
  let newPeople = mode === 'rematch' ? rematchPeople : newNames.map((name, i) => person(name, faces[i % faces.length]));
  // ?pool=7: we only found 7, the tracker's six plus one (Emma Wilson, or Amara with ?amara=1)
  if (mode !== 'rematch' && num('pool', 0) === 7) {
    prevPeople = prevPeople.filter(p => story[p.name] || (!q.get('amara') && p.name === 'Emma Wilson'));
    newPeople = [...newPeople.filter(p => story[p.name]), ...(q.get('amara') ? [amara] : [])];
  }
  const prevN = Math.min(num('prev', mode === 'rematch' ? 0 : prevPeople.length), prevPeople.length);
  const newN = Math.min(num('new', newPeople.length), newPeople.length);
  const build = (p, k, source) => {
    const c = profile(p.name, (mode === 'rematch' ? 30 : source === 'approved' ? 3 : 0) + k, source, p.avatar);
    return p.handle ? { ...c, handle: p.handle } : c;
  };
  const newCreators = newPeople.slice(0, newN).map((p, k) => build(p, k, 'new'));
  const approvedCreators = prevPeople.slice(0, prevN)
    .map((p, i) => ({ ...build(p, i, 'approved'), id: 'ap' + i, kind: kindOf(p.name), history: history(p.name, i) }))
    // Favorite and Would work again first, then approved-but-never-invited, then the team's picks
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  if (q.get('sparse') && newCreators[0]) Object.assign(newCreators[0], { bio: '', fits: [], followers: '', engagement: '', content: [] });

  const groups = [
    {
      id: 'approved',
      title: 'Previously approved creators',
      sub: "Creators you've worked with before or approved for past campaigns.",
      creators: approvedCreators,
    },
    {
      id: 'new',
      title: 'New creators',
      sub: 'Hand-selected from your brief and campaign details.',
      creators: newCreators,
    },
  ];
  const all = () => groups.flatMap(g => g.creators);
  const find = id => all().find(c => c.id === id);

  // ---------- Save as you go ----------
  const KEY = `invite-creators:${mode}:${campaign.spots}:${prevN}:${newN}:${num('pool', 0)}:${q.get('amara') ? 1 : 0}`;
  let sent = 0;
  const save = () => {
    const choices = {};
    all().forEach(c => { if (c.priority || c.notFit || c.feedback) choices[c.id] = [+c.priority, +c.notFit, +c.feedback]; });
    try { sessionStorage.setItem(KEY, JSON.stringify({ choices, sent })); } catch {}
  };
  let saved = null;
  try {
    if (q.get('fresh')) sessionStorage.removeItem(KEY);
    saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {}
  if (saved) {
    sent = saved.sent || 0;
    Object.entries(saved.choices || {}).forEach(([id, [p, n, f]]) => {
      const c = find(id);
      if (c) Object.assign(c, { priority: !!p, notFit: !!n, feedback: !!f });
    });
  } else {
    // Demo shortcut: ?notfit=26 starts with that many new creators marked Not a Fit
    newCreators.slice(0, num('notfit', 0)).forEach(c => { c.notFit = true; });
  }

  const clone = g => ({ ...g, creators: g.creators.map(c => ({ ...c })) });
  // Sends the invites. Resolves like a network call; ?sendfail=1 makes it fail, to try the error state.
  const sendInvites = ids => new Promise((resolve, reject) => setTimeout(() => {
    if (q.get('sendfail')) return reject(new Error('send failed'));
    console.log('[mock api] send invites', ids);
    sent = ids.length;
    save();
    resolve({ sent: ids.length });
  }, 700));

  // Why a creator isn't a fit; feeds the recommendations. Benable only: creators never see it.
  const notFitFeedback = (id, text) => {
    console.log('[mock api] not a fit feedback', id, text);
    find(id).feedback = true;
    save();
    return Promise.resolve();
  };

  return {
    campaign,
    sendInvites,
    notFitFeedback,
    sent: () => sent,
    groups: () => groups.map(clone),
    get: id => ({ ...find(id) }),
    // Creators still headed for approval: everyone minus the ones marked Not a Fit
    approvedCount: () => all().filter(c => !c.notFit).length,
    prioritizedCount: () => all().filter(c => c.priority && !c.notFit).length,
    setPriority: (id, on) => { find(id).priority = on; save(); },
    setNotFit: (id, on) => { const c = find(id); c.notFit = on; if (on) c.priority = false; save(); },
  };
})();
