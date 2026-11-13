import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/nps.css';
import NpsAsk from '../components/nps/NpsAsk.jsx';
import { nps, MOMENTS } from '../components/nps/npsStore.js';
import { askFor, reads } from '../components/nps/npsCopy.js';
import { forks } from '../components/pulse/forks.js';
import { setPulseDay } from '../components/pulse/CampaignPulse.jsx';

/*
 * The email twin of the brand NPS asks (Sep 21 2026, study at brand-nps-study/).
 * Brands rarely log in, so the question RIDES ON NEWS: each ask sits at the
 * bottom of a milestone email the brand wants to open anyway (campaign live,
 * creators confirmed, campaign wrapped). One tap on a number opens a login-free
 * answer page with that number already selected; the page, not the link, banks
 * the score (mail scanners pre-open links), then offers the optional follow-up.
 *
 *   /nf/nps-mail            the three emails, as they would land in an inbox
 *   /nf/nps-answer/:moment  the login-free answer page behind the email's numbers
 *
 * PROPOSED copy and flow. None of these emails exist in production today: the
 * only brand emails are "next campaign is ready" and "a post is ready for review".
 */

const closedLate = () => forks.get('late') === 'one';

const MAILS = {
  launch: {
    subject: 'Your campaign is live',
    when: 'Mon 9:04 AM',
    body: () => (
      <>
        <p className="npm-p">Hi Tony,</p>
        <p className="npm-p"><b>Cloudveil Barrier Cream</b> is live. Creator matching has started, and your creators are usually ready to review within one business day.</p>
        <p className="npm-p">We will email you the moment they are ready. Nothing needs you until then.</p>
      </>
    ),
    cta: 'Open your campaign',
  },
  cast: {
    subject: 'All 6 creators accepted',
    when: 'Tue 10:12 AM',
    body: () => (
      <>
        <p className="npm-p">Hi Tony,</p>
        {forks.get('type') === 'local' ? (
          <p className="npm-p">Every spot on <b>Cloudveil Barrier Cream</b> is filled. All 6 creators accepted and 5 of 6 visits are confirmed: 3 creators have already visited.</p>
        ) : (
          <p className="npm-p">Every spot on <b>Cloudveil Barrier Cream</b> is filled. All 6 creators accepted and every order is placed: 5 packages are delivered and the last one arrives tomorrow.</p>
        )}
        <p className="npm-p">You should start seeing content next week. Nothing needs you.</p>
      </>
    ),
    cta: 'See your creators',
  },
  close: {
    subject: () => (closedLate() ? '5 of 6 creators posted: your campaign is closed' : 'All 6 creators posted: your wrap-up is ready'),
    when: 'Thu 9:30 AM',
    body: () => (closedLate() ? (
      <>
        <p className="npm-p">Hi Tony,</p>
        <p className="npm-p"><b>Cloudveil Barrier Cream</b> closed today, one week after the posting deadline. 5 of 6 creators posted, and your wrap-up is ready.</p>
        <p className="npm-p">Katie’s team is still following up with Amara. If Amara posts, it lands in your Content tab and we will email you. Your campaign is closed either way, so you can start your next one whenever you are ready.</p>
      </>
    ) : (
      <>
        <p className="npm-p">Hi Tony,</p>
        <p className="npm-p">All 6 creators on <b>Cloudveil Barrier Cream</b> posted. Your wrap-up is ready.</p>
      </>
    )),
    cta: 'See your wrap-up',
  },
};

const LABEL = { launch: '1 · Campaign live', cast: '2 · Cast set', close: '3 · Campaign closed' };

function openCampaign(navigate, moment) {
  if (moment === 'launch') { navigate('/nf/launched'); return; }
  setPulseDay(moment === 'cast' ? 13 : closedLate() ? 37 : 30);
  navigate('/nf/track');
}

export function NfNpsAnswer() {
  const navigate = useNavigate();
  const { moment } = useParams();
  const [, tick] = useState(0);
  useEffect(() => nps.sub(() => tick((t) => t + 1)), []);
  if (!MOMENTS.includes(moment)) return null;
  const a = nps.get(moment);
  return (
    <div className="npm-page npm-page--answer">
      <div className="npm-answer">
        <p className="npm-brandline"><img src={`${import.meta.env.BASE_URL}benable-logo.svg`} alt="Benable" /></p>
        {a?.status === 'dismissed' ? (
          <p className="npm-p">No problem. This question is dismissed.</p>
        ) : (
          <NpsAsk moment={moment} skin="page" closedLate={closedLate()} />
        )}
        <p className="npm-foot">
          You can close this tab.{' '}
          <button type="button" className="npm-link" onClick={() => openCampaign(navigate, moment)}>Open your campaign</button>
        </p>
      </div>
      <p className="npm-demo">
        <button type="button" className="npm-link" onClick={() => navigate('/nf/nps-mail')}>Back to the three emails</button>
      </p>
    </div>
  );
}

export default function NfNpsMail() {
  const navigate = useNavigate();
  const [sel, setSel] = useState('cast');
  const [, tick] = useState(0);
  useEffect(() => nps.sub(() => tick((t) => t + 1)), []);
  useEffect(() => forks.sub(() => tick((t) => t + 1)), []);
  const m = MAILS[sel];
  const ask = askFor(sel);
  const subject = typeof m.subject === 'function' ? m.subject() : m.subject;

  /* the email's number is a link to the answer page with that number selected */
  const tap = (n) => {
    nps.score(sel, n, 'email');
    navigate(`/nf/nps-answer/${sel}`);
  };

  return (
    <div className="npm-page">
      <div className="npm-bar" role="group" aria-label="Demo controls">
        <span className="npm-bar-tag">NPS EMAIL TWIN</span>
        {MOMENTS.map((k) => (
          <button key={k} type="button" className={k === sel ? 'npm-bar-btn npm-bar-btn--on' : 'npm-bar-btn'} onClick={() => setSel(k)}>{LABEL[k]}</button>
        ))}
        <span className="npm-bar-sep" aria-hidden />
        <button type="button" className="npm-bar-btn" title="Same recommend question at all three moments, or one question per moment" onClick={() => forks.set('npsq', forks.get('npsq') === 'recommend' ? 'moment' : 'recommend')}>
          Question: {forks.get('npsq') === 'recommend' ? 'same ×3' : 'by moment'}
        </button>
        <button type="button" className={closedLate() ? 'npm-bar-btn npm-bar-btn--on' : 'npm-bar-btn'} onClick={() => forks.set('late', closedLate() ? 'none' : 'one')}>One creator late</button>
        <button type="button" className="npm-bar-btn" onClick={() => nps.reset()}>Reset answers</button>
        <button type="button" className="npm-bar-btn" onClick={() => openCampaign(navigate, sel)}>Portal view ↗</button>
      </div>

      <div className="npm-client">
        <div className="npm-client-top">
          <span className="npm-dot" /><span className="npm-dot" /><span className="npm-dot" />
          <span className="npm-client-title">Inbox</span>
        </div>
        <div className="npm-mail">
          <h1 className="npm-subject">{subject}</h1>
          <div className="npm-from">
            <img className="npm-avatar" src={`${import.meta.env.BASE_URL}benable-mark.png`} alt="" />
            <div>
              {/* automated brand emails read as automated and do not come from Katie (Tony, Aug 6, per the copywriter's corpus); OPEN ASK Tony */}
              <p className="npm-from-name">Benable <span>&lt;team@benable.com&gt;</span></p>
              <p className="npm-from-to">to Tony · {m.when}</p>
            </div>
          </div>
          <div className="npm-body">
            {m.body()}
            <p className="npm-p">
              <button type="button" className="npm-cta" onClick={() => openCampaign(navigate, sel)}>{m.cta}</button>
            </p>

            <p className="npm-sign">Team Benable</p>

            <div className="npm-ask">
              <p className="npm-ask-k">One quick question. Pick a number to answer.</p>
              <p className="npm-ask-q">{ask.q}</p>
              <div className="npm-scale" role="group" aria-label="0 to 10">
                {Array.from({ length: 11 }, (_, n) => (
                  <button key={n} type="button" className={nps.get(sel)?.score === n ? 'npm-n npm-n--on' : 'npm-n'} onClick={() => tap(n)}>{n}</button>
                ))}
              </div>
              <div className="npm-poles"><span>{ask.poles[0]}</span><span>{ask.poles[1]}</span></div>
              <p className="npm-reads">{reads(sel)}</p>
            </div>

            <p className="npm-legal">You are getting this email because you have a live campaign on Benable. <u>Email settings</u></p>
          </div>
        </div>
      </div>
    </div>
  );
}
