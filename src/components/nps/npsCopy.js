/* Every brand-facing NPS string lives here (PROPOSED copy, Sep 21 2026, not yet
   reviewed by Tony). House rules: no em or en dashes, "Katie's team" for
   operational claims, never promise what we cannot know.

   THE ONE REAL CHOICE FOR TONY (fork `npsq`, study section "Which question"):
     'moment'    = one 0 to 10 tap per moment, each asking what the brand can
                   actually judge right then: confidence at launch, the creators
                   once the cast is set, and the canonical recommend question at
                   the close. Only the close is "the NPS". The field's preference.
     'recommend' = the recommend question, word for word, at all three moments.
                   Tony's literal ask (Sep 21): one metric name, clean comparison,
                   weak at launch ("how would I know yet"). */
import { forks } from '../pulse/forks.js';

const RECOMMEND = {
  q: 'How likely are you to recommend Benable to another brand?',
  poles: ['Not at all likely', 'Extremely likely'],
};

const BY_MOMENT = {
  launch: {
    q: 'How confident are you that this campaign will get you the content you want?',
    poles: ['Not at all confident', 'Extremely confident'],
    follow: {
      detractor: 'What is making you unsure?',
      passive: 'What would make you more confident?',
      promoter: 'What gave you that confidence?',
    },
  },
  cast: {
    q: 'How happy are you with the creators on this campaign?',
    poles: ['Not at all happy', 'Extremely happy'],
    follow: {
      detractor: 'What were you hoping for instead?',
      passive: 'What would have made it a 10?',
      promoter: 'What do you like most about these creators?',
    },
  },
  close: {
    ...RECOMMEND,
    follow: {
      detractor: 'What is the main thing we should fix?',
      passive: 'What would have made this campaign a 10?',
      promoter: 'What was the best part of this campaign?',
    },
  },
};

const SAME_X3_FOLLOW = {
  launch: {
    detractor: 'What got in the way while setting up?',
    passive: 'What would have made setup a 10?',
    promoter: 'What worked best while setting up?',
  },
  cast: {
    detractor: 'What has not gone well so far?',
    passive: 'What would make this a 10 from here?',
    promoter: 'What has stood out so far?',
  },
  close: BY_MOMENT.close.follow,
};

/* the head carries the milestone, the sub carries the label (one label at all
   three moments: "last" reads as goodbye to a brand with monthly campaigns).
   Brand-surface words: never "cast", "wrapped" or "shortlist" (Tony, Katie and
   Julia's earlier copy rulings, per the copywriter's corpus). */
const FRAME = {
  launch: { title: 'Your campaign is live', lead: 'One quick question' },
  cast: { title: 'Every spot is filled', lead: 'One quick question' },
  close: { title: 'Your campaign is complete', lead: 'One quick question' },
};
/* the close that happened with someone still out says closed, not complete */
export const CLOSED_TITLE = 'Your campaign is closed';

/* what a moment asks, under the current QUESTION fork */
export const askFor = (moment) => {
  const same = forks.get('npsq') === 'recommend';
  const src = same ? { ...RECOMMEND, follow: SAME_X3_FOLLOW[moment] } : BY_MOMENT[moment];
  return { ...FRAME[moment], q: src.q, poles: src.poles, follow: src.follow };
};

export const CALL_ME = "Ask Katie's team to contact me about this";
export const SAVED = 'Score saved';
export const OPTIONAL = 'Optional. Your score is already saved.';
export const SEND = 'Send';
export const DONE = 'Done';
/* say who reads it; at the one moment the brand rates people, say who does not */
export const reads = (moment) => `Your answer goes to the Benable team.${moment === 'cast' ? ' Creators never see it.' : ''}`;

export const THANKS = {
  /* contact is promised only when asked for, and with no clock until someone owns one (OPEN: who, by when) */
  detractor: { head: 'Thank you for telling us straight.', body: "Katie's team reads every answer.", bodyCall: "Katie's team will contact you about this." },
  passive: { head: 'Thank you, that helps.', body: "Katie's team reads every answer." },
  promoter: { head: 'Thank you, that made our day.', body: "Katie's team reads every answer." },
};

export const receipt = (score) => `Your score: ${score} out of 10.`;
export const CHANGE = 'Change';
