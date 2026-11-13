import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { PHOTOS } from './pulseData.js';
import { assetsOf } from './review.jsx';
import '../../styles/reviewModal.css';

/* REVIEW UI · Modal, v45 SHELL (Julia's mock, Aug 18) — the review becomes a
   three-pane workspace instead of Amine's two-pane modal: a CREATORS sidebar
   (who's in the queue + per-creator progress — the fix for "confusing to go
   from one creator to another"), a gradient stage with a "Draft n of N ·
   {kind}" pill + the 9:16 player + a caption card, and a white right panel
   ("Pre-approved, ready for your final review" + Katie's-team pre-checks +
   the approve/flag footnote + CTAs). Every prior element carries over: the
   real player (badge/sound/scrub), pre-check card, Tony's flag-an-issue
   sheet (v43.2 copy — notes go to the Benable team), decided status rails,
   feedback list, end-of-queue confetti.

   Decisions: same model — asset.state / asset.notes, module-persisted, the
   tracker derives. On Approve (or flag-send) a check FLASH plays over the
   stage (~1.1s), the draft SLIDES OUT left, and the next undecided draft
   slides in from the right — this creator's next draft first, then the next
   creator with drafts waiting, else the celebration. The sidebar counts
   tick live. Amine's 1s skeletons retired here — the slide is the seam. */

const B = import.meta.env.BASE_URL;
const A = (p) => `${B}review/${p}`;

/* stage transition timing (ms) — flash holds long enough to read, the
   slide is quick enough to feel like momentum */
const FLASH_MS = 1150;
const SLIDE_MS = 320;

/* ---- caption tones: @mentions blue, #hashtags purple (from capLines) ---- */
const capSegs = (line) =>
  line.split(/([@#][\w.]+)/g).filter(Boolean).map((text) => ({
    text,
    tone: text[0] === '@' ? 'mention' : text[0] === '#' ? 'hashtag' : undefined,
  }));

/* ---- tiny pub/sub video clock (videoTime.ts port) ----------------------- */
class VideoTimeStore {
  snapshot = { time: 0, duration: 0, playing: false };
  listeners = new Set();
  subscribe = (l) => { this.listeners.add(l); return () => this.listeners.delete(l); };
  getSnapshot = () => this.snapshot;
  publish(next) {
    const m = { ...this.snapshot, ...next };
    if (m.time === this.snapshot.time && m.duration === this.snapshot.duration && m.playing === this.snapshot.playing) return;
    this.snapshot = m;
    this.listeners.forEach((l) => l());
  }
}
const useVideoTime = (store) => useSyncExternalStore(store.subscribe, store.getSnapshot);
const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/* ---- video player: badge, sound, play overlay, scrubbable control bar --- */
function VideoPane({ clip, store }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    let raf = 0;
    const publish = () => store.publish({
      time: video.currentTime,
      duration: video.duration || 8,
      playing: !video.paused && !video.ended,
    });
    const loop = () => { publish(); raf = requestAnimationFrame(loop); };
    const onPlay = () => { setPlaying(true); cancelAnimationFrame(raf); loop(); };
    const onStop = () => { setPlaying(false); cancelAnimationFrame(raf); publish(); };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onStop);
    video.addEventListener('ended', onStop);
    video.addEventListener('loadedmetadata', publish);
    video.addEventListener('seeked', publish);
    store.publish({ time: 0, duration: 8, playing: false });
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onStop);
      video.removeEventListener('ended', onStop);
      video.removeEventListener('loadedmetadata', publish);
      video.removeEventListener('seeked', publish);
    };
  }, [clip.id, store]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) void video.play();
    else video.pause();
  };

  return (
    <div className="rvm-video-frame">
      <video
        ref={videoRef}
        className="rvm-video-el"
        src={clip.src}
        poster={clip.poster}
        preload="auto"
        playsInline
        muted={muted}
        onClick={togglePlay}
      />
      <div className="rvm-video-badge">
        {/* per-type icons from Figma "Content video tags" (12328:2118) */}
        {clip.kind === 'TikTok' ? (
          <span className="rvm-ig-icon">
            <img src={A('assets/icons/tiktok-inner.svg')} alt="" className="rvm-ig-icon-inner" />
            <img src={A('assets/icons/tiktok-outer.svg')} alt="" className="rvm-tiktok-icon-outer" />
          </span>
        ) : clip.kind === 'IG Story' ? (
          <span className="rvm-ig-icon">
            <img src={A('assets/icons/instagram-story.svg')} alt="" className="rvm-ig-icon-outer" />
          </span>
        ) : (
          <span className="rvm-ig-icon">
            <img src={A('assets/icons/instagram-outer.svg')} alt="" className="rvm-ig-icon-outer" />
            <img src={A('assets/icons/instagram-inner.svg')} alt="" className="rvm-ig-icon-inner" />
          </span>
        )}
        {clip.kind}
      </div>
      <button
        type="button"
        className={`rvm-video-sound${muted ? ' is-muted' : ''}`}
        title={muted ? 'Unmute' : 'Mute'}
        onClick={() => setMuted((m) => !m)}
      >
        <img src={A('assets/video/sound-btn.svg')} alt="" />
      </button>
      {!playing && (
        <button type="button" className="rvm-video-play-overlay" title="Play" onClick={togglePlay}>
          <img src={A('assets/video/play-btn.svg')} alt="" />
        </button>
      )}
      <ControlBar store={store} playing={playing} onToggle={togglePlay} videoRef={videoRef} />
    </div>
  );
}

function ControlBar({ store, playing, onToggle, videoRef }) {
  const { time, duration } = useVideoTime(store);
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const pct = duration > 0 ? Math.min(1, time / duration) : 0;

  const scrubTo = (clientX) => {
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video) return;
    const rect = track.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = p * (video.duration || 8);
  };

  return (
    <div className="rvm-video-controls">
      <button type="button" className="rvm-video-controls-toggle" onClick={onToggle} title={playing ? 'Pause' : 'Play'}>
        {playing ? (
          <span className="rvm-pause-glyph"><span /><span /></span>
        ) : (
          <img src={A('assets/video/play-triangle.svg')} alt="" className="rvm-play-triangle" />
        )}
      </button>
      <div
        ref={trackRef}
        className="rvm-video-track"
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); scrubTo(e.clientX); }}
        onPointerMove={(e) => { if (dragging.current) scrubTo(e.clientX); }}
        onPointerUp={(e) => { dragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
      >
        <div className="rvm-video-track-bg">
          <div className="rvm-video-track-fill" style={{ width: `${Math.max(4, pct * 171)}px` }} />
        </div>
        <img src={A('assets/video/scrub-dot.svg')} alt="" className="rvm-video-track-dot" style={{ left: `${pct * (171 - 6)}px` }} />
      </div>
      <span className="rvm-video-time">{formatTime(time)} / {formatTime(duration || 8)}</span>
    </div>
  );
}

/* ---- the review shell --------------------------------------------------- */
export function ReviewModal({ scene, rows, initial, onClose, onDecide }) {
  const mode = scene.mode;
  /* the queue = the table's review rows, in table order */
  const queue = useMemo(
    () => rows
      .filter((c) => !c.mystery && c.draftIn && assetsOf(c, mode).length)
      .map((c) => ({ name: c.name, handle: c.handle, avatar: PHOTOS[c.name], assets: assetsOf(c, mode) })),
    [rows, mode],
  );

  const initIdx = Math.max(0, queue.findIndex((c) => c.name === initial));
  const [creatorIdx, setCreatorIdx] = useState(initIdx);
  /* entry lands on the first UNDECIDED draft, not draft 1 */
  const [clipIdx, setClipIdx] = useState(() => {
    const j = queue[initIdx]?.assets.findIndex((a) => !a.state) ?? -1;
    return j >= 0 ? j : 0;
  });
  /* stage motion: 'flash' (check over the stage) → 'out' (slide left) →
     advance → fresh key slides in. null = at rest. */
  const [flash, setFlash] = useState(null); // { decision } | null
  const [leaving, setLeaving] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesText, setChangesText] = useState('');
  const changesRef = useRef(null);
  const timers = useRef([]);
  const pendingNote = useRef(null);
  const store = useMemo(() => new VideoTimeStore(), []);

  const creator = queue[Math.min(creatorIdx, queue.length - 1)];
  const clip = creator?.assets[Math.min(clipIdx, (creator?.assets.length ?? 1) - 1)];

  /* the FIRST draft appears in place — only draft/creator changes slide in
     (Julia: the opening post arriving from the side read as a loading state) */
  const lastKey = useRef(null);
  const animRef = useRef(false);
  if (clip && lastKey.current !== clip.id) {
    animRef.current = lastKey.current !== null;
    lastKey.current = clip.id;
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* warm every queued poster + clip up front so nothing pops in later */
  useEffect(() => {
    queue.forEach((c) => c.assets.forEach((a) => {
      if (a.poster) { const i = new Image(); i.src = a.poster; }
      if (a.src) {
        const v = document.createElement('video');
        v.preload = 'auto';
        v.src = a.src;
      }
    }));
  }, [queue]);

  /* fresh clip → fresh composer */
  useEffect(() => { setChangesOpen(false); setChangesText(''); }, [clip?.id]);

  /* if the queue changes under the open shell (demo toggles), re-seat */
  useEffect(() => {
    if (creator && clipIdx >= creator.assets.length) setClipIdx(0);
  }, [creator, clipIdx]);

  const busy = !!flash || leaving;

  /* keyboard: Esc closes sheet → shell; arrows flip drafts when not typing */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (busy) return; // the decision moment owns the stage
        if (changesOpen) { setChangesOpen(false); return; }
        onClose();
        return;
      }
      if (busy || !creator) return;
      if (document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && clipIdx < creator.assets.length - 1) setClipIdx(clipIdx + 1);
      if (e.key === 'ArrowLeft' && clipIdx > 0) setClipIdx(clipIdx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, clipIdx, creator?.assets.length, changesOpen, busy]);

  if (!creator || !clip) return null;

  const decided = clip.state; // 'approved' | 'changes' | undefined — locked once set
  const name = creator.name;
  const undecidedCreators = queue.filter((c) => c.assets.some((a) => !a.state)).length;

  const later = (fn, ms) => { timers.current.push(window.setTimeout(fn, ms)); };

  /* jump helpers — sidebar rows land on the creator's first pending draft */
  const openCreator = (i) => {
    if (busy || i === creatorIdx) return;
    const j = queue[i].assets.findIndex((a) => !a.state);
    setCreatorIdx(i);
    setClipIdx(j >= 0 ? j : 0);
  };

  /* the decision moment: commit → flash the check over the stage → slide the
     draft out → land on the next undecided draft (this creator first, then
     the next creator with drafts waiting, wrapping) → else celebrate */
  const decide = (decision) => {
    if (busy || decided) return;
    if (decision === 'changes' && pendingNote.current) {
      clip.notes = [...(clip.notes ?? []), pendingNote.current];
      pendingNote.current = null;
    }
    clip.state = decision;
    onDecide();
    setFlash({ decision });
    later(() => {
      // find the landing spot before sliding out
      let nextC = -1;
      let nextJ = -1;
      for (let off = 0; off <= queue.length; off++) {
        const i = (creatorIdx + off) % queue.length;
        const j = queue[i].assets.findIndex((a) => !a.state);
        if (j >= 0) { nextC = i; nextJ = j; break; }
      }
      if (nextC < 0) {
        /* queue done — the flash was the closure; the table's derived
           states tell the rest (the confetti screen was retired, Julia) */
        onClose();
        return;
      }
      setLeaving(true);
      later(() => {
        setFlash(null);
        setLeaving(false);
        setCreatorIdx(nextC);
        setClipIdx(nextJ);
      }, SLIDE_MS);
    }, FLASH_MS);
  };

  const submitChanges = () => {
    const text = changesText.trim();
    if (!text) return;
    pendingNote.current = text;
    setChangesOpen(false);
    setChangesText('');
    decide('changes');
  };

  const notes = clip.notes ?? [];

  /* sidebar face per creator — flags walk the resolution beats */
  const sideFace = (c) => {
    const n = c.assets.length;
    const done = c.assets.filter((a) => a.state).length;
    const flagged = c.assets.filter((a) => a.state === 'changes');
    if (done === 0) return { line: `${n} draft${n > 1 ? 's' : ''} to review`, state: 'pending' };
    if (done < n) return { line: `${done} of ${n} reviewed`, state: 'pending' };
    if (flagged.length === 0) return { line: 'Reviewed', state: 'done' };
    if (flagged.every((a) => a.fix === 'resolved')) return { line: 'Issue resolved', state: 'done' };
    if (flagged.every((a) => a.fix === 'agreed')) return { line: 'Feedback sent', state: 'flagged' };
    return { line: 'Reviewed — issue flagged', state: 'flagged' };
  };

  return createPortal(
    <div className="rvm">
      <div className="rvm-shell-overlay">
        <div className="rvm-shell" role="dialog" aria-modal="true" aria-label="Approve content">

          {/* ---- header ---- */}
          <header className="rvm-shell-head">
            <div>
              <p className="rvm-shell-title">Approve Content</p>
              <p className="rvm-shell-sub">
                {undecidedCreators > 0
                  ? `${undecidedCreators} creator${undecidedCreators > 1 ? 's have' : ' has'} drafts ready for your review`
                  : 'All drafts reviewed'}
              </p>
            </div>
            <button type="button" className="rvm-shell-close" onClick={onClose} title="Close">
              <img src={A('assets/icons/close-16.svg')} alt="" />
            </button>
          </header>

          <div className="rvm-shell-body">

            {/* ---- creators sidebar ---- */}
            <aside className="rvm-shell-side">
              <p className="rvm-side-label">Creators</p>
              {queue.map((c, i) => {
                const face = sideFace(c);
                return (
                  <button
                    key={c.name}
                    type="button"
                    className={`rvm-side-row${i === creatorIdx ? ' is-active' : ''}`}
                    onClick={() => openCreator(i)}
                  >
                    <span className="rvm-side-avatar"><img src={c.avatar} alt="" /></span>
                    <span className="rvm-side-names">
                      <span className="rvm-side-name">
                        {c.name}
                        <img src={A('assets/icons/verified.svg')} alt="" className="rvm-side-verified" />
                      </span>
                      <span className="rvm-side-line">{face.line}</span>
                    </span>
                    {/* one fixed slot so the amber dot and the tick share an axis;
                        single-circle ticks (the ring-in-a-ring stamp read weird) */}
                    <span className="rvm-side-slot">
                      {face.state === 'pending' ? (
                        <span className="rvm-side-dot" aria-label="Waiting on you" />
                      ) : face.state === 'flagged' ? (
                        <span className="rvm-side-tick rvm-side-tick--flag" aria-label="Issue flagged">!</span>
                      ) : (
                        <span className="rvm-side-tick" aria-label="Reviewed">
                          <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path d="M2.4 6.4 5 9l4.6-6" stroke="#12A150" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* ---- stage ---- */}
            <div className="rvm-shell-stage">
              <div className="rvm-stage-gradient-clip" aria-hidden>
                <img src={A('assets/modal/gradient-bg.webp')} alt="" className="rvm-stage-gradient" />
              </div>

              {/* draft pill — the in-creator navigation; arrows only exist
                  when there is somewhere to go */}
              <div className="rvm-stage-pill">
                {creator.assets.length > 1 && (
                  <button
                    type="button"
                    className="rvm-pill-arrow"
                    disabled={busy || clipIdx <= 0}
                    onClick={() => setClipIdx(clipIdx - 1)}
                    title="Previous draft"
                  >
                    <img src={A('assets/icons/chevron-12.svg')} alt="" className="rvm-chev12-left" />
                  </button>
                )}
                <span className="rvm-pill-label">
                  Draft {clipIdx + 1} of {creator.assets.length} · {clip.kind}
                  {decided && (
                    <span className={`rvm-pill-tick${decided === 'changes' ? ' rvm-pill-tick--flag' : ''}`} aria-hidden>
                      {decided === 'changes' ? '!' : (
                        <svg viewBox="0 0 12 12" fill="none">
                          <path d="M2.4 6.4 5 9l4.6-6" stroke="#12A150" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  )}
                </span>
                {creator.assets.length > 1 && (
                  <button
                    type="button"
                    className="rvm-pill-arrow"
                    disabled={busy || clipIdx >= creator.assets.length - 1}
                    onClick={() => setClipIdx(clipIdx + 1)}
                    title="Next draft"
                  >
                    <img src={A('assets/icons/chevron-12.svg')} alt="" />
                  </button>
                )}
              </div>

              {/* the draft itself — keyed so a fresh one slides in. The video
                  owns a flex slot and the caption a FIXED reserve, so caption
                  length never resizes or shifts the player. */}
              <div key={clip.id} className={`rvm-stage-content${animRef.current ? ' rvm-anim' : ''}${leaving ? ' is-leaving' : ''}`}>
                <div className="rvm-stage-video-slot">
                  <VideoPane clip={clip} store={store} />
                </div>
                <div className="rvm-stage-caption-slot">
                  <div className="rvm-stage-caption">
                    <p className="rvm-stage-caption-label">Caption</p>
                    <div className="rvm-stage-caption-body">
                      {(clip.capLines ?? [clip.caption]).map((line, i) => (
                        <p key={i}>
                          {capSegs(line).map((seg, j) => (
                            <span key={j} className={seg.tone ? `rvm-caption-${seg.tone}` : undefined}>{seg.text}</span>
                          ))}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* decision flash — the check pops over the stage, then the slide */}
              {flash && (
                <div className="rvm-stage-flash" aria-hidden>
                  <div className="rvm-flash-card">
                    <svg className="rvm-flash-check" viewBox="0 0 64 64" fill="none">
                      <circle className="rvm-approve-check-circle" cx="32" cy="32" r="29" stroke={flash.decision === 'approved' ? '#3caa70' : '#f0a32e'} strokeWidth="4" />
                      <path className="rvm-approve-check-mark" d="M20 33.5 28.5 42 44 24.5" stroke={flash.decision === 'approved' ? '#3caa70' : '#f0a32e'} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="rvm-flash-title">
                      {flash.decision === 'approved' ? 'Approved' : 'Sent to our team'}
                    </p>
                    <p className="rvm-flash-sub">
                      {flash.decision === 'approved'
                        ? `${name} will post it within days.`
                        : 'We’ll review it and keep you posted.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ---- right panel ---- */}
            <div className="rvm-shell-panel">
              <div className="rvm-panel-copy">
                <h2 className="rvm-panel-h">
                  {decided === 'approved' ? 'Approved 🎉'
                    : decided === 'changes' ? (clip.fix === 'resolved' ? 'Issue resolved ✅' : clip.fix === 'agreed' ? 'Feedback sent' : 'Issue flagged')
                    : 'Pre-approved, ready for your final review'}
                </h2>
                <p className="rvm-panel-hsub">
                  {decided === 'approved' ? `${name} can schedule this post — we’ll track it for you.`
                    : decided === 'changes'
                      ? (clip.fix === 'resolved'
                          ? `We worked it out with ${name} — her updated post goes live soon.`
                          : clip.fix === 'agreed'
                            ? `Katie’s team sent your feedback to ${name} — she’s updating it before posting.`
                            : 'Our team is on it — we’ll review and keep you posted.')
                      : 'Katie’s team checked this draft against your brief before it reached you.'}
                </p>

                <div className="rvm-precheck">
                  <p className="rvm-precheck-title">Katie’s team pre-checked</p>
                  <ul className="rvm-precheck-list">
                    {clip.checks.map((check) => (
                      <li key={check} className="rvm-precheck-item">
                        <img src={A('assets/icons/precheck-tick.svg')} alt="" className="rvm-precheck-tick" />
                        {check}
                      </li>
                    ))}
                  </ul>
                </div>

                {notes.length > 0 && (
                  <>
                    <div className="rvm-panel-feedback-head">
                      <p className="rvm-panel-feedback-title">Your note to our team</p>
                    </div>
                    <div className="rvm-feedback-list">
                      {notes.map((text, i) => (
                        <div key={i} className="rvm-feedback-message">
                          <span className="rvm-feedback-message-text">{text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!decided && (
                  <p className="rvm-panel-footnote">
                    Approving lets {name} schedule this post. Flag an issue and our team will
                    work through it with her.
                  </p>
                )}
              </div>

              {/* footer: CTAs while undecided; a status rail once decided */}
              <div className={`rvm-shell-foot${decided ? ' is-decided' : ''}`}>
                {decided === 'approved' ? (
                  <p className="rvm-footer-status rvm-footer-status-approved"><strong>🎉 </strong>Approved</p>
                ) : decided === 'changes' ? (
                  <p className="rvm-footer-status rvm-footer-status-sent">
                    {clip.fix === 'resolved' ? (
                      <><strong>Issue resolved </strong>— her updated post goes live soon.</>
                    ) : clip.fix === 'agreed' ? (
                      <><strong>Feedback sent </strong>— {name} is updating it before posting.</>
                    ) : (
                      <><strong>Issue flagged </strong>for our team — we’ll review and keep you posted.</>
                    )}
                  </p>
                ) : (
                  <>
                    <button type="button" className="rvm-foot-flag" disabled={busy} onClick={() => setChangesOpen(true)}>
                      Flag an issue
                    </button>
                    <button type="button" className="rvm-foot-approve" disabled={busy} onClick={() => decide('approved')}>
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* flag-an-issue sheet (Tony's v43.2 copy) — slides up over the panel */}
          {changesOpen && (
            <div className="rvm-changes-scrim" onClick={() => setChangesOpen(false)}>
              <div className="rvm-changes-card" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="rvm-changes-close" onClick={() => setChangesOpen(false)} title="Close">
                  <img src={A('assets/icons/close-16.svg')} alt="" />
                </button>
                <div className="rvm-changes-body">
                  <span className="rvm-changes-icon">🖊️</span>
                  <p className="rvm-changes-title">Sorry about that, let's make it right</p>
                  <p className="rvm-changes-sub">
                    Tell us what didn't match your brief or instructions, with as much detail as you can. Your note goes to the Benable team, not to the creator. We'll review and work out the best solution with the creator directly.
                  </p>
                  <textarea
                    ref={changesRef}
                    className="rvm-changes-textarea"
                    placeholder="Describe the issue, the more detail the better"
                    value={changesText}
                    autoFocus
                    onChange={(e) => setChangesText(e.target.value)}
                    onKeyDown={(e) => {
                      const isEnter = e.key === 'Enter' || e.key === 'Return' || e.keyCode === 13;
                      if (isEnter && !e.shiftKey) { e.preventDefault(); submitChanges(); }
                    }}
                  />
                </div>
                <div className="rvm-changes-footer">
                  <button type="button" className="rvm-changes-send" disabled={!changesText.trim()} onClick={submitChanges}>
                    Send to our team
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
