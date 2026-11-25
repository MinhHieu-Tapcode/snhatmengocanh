import { useEffect, useMemo, useState } from 'react'
import { useGame, collectedCount } from '../store'
import { texts } from '../content/texts'
import { memories } from '../content/memories'
import letterRaw from '../content/letter.md?raw'
import { ActionButton, Joystick } from './Controls'

const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

// ---------------- Biểu tượng nhỏ ----------------

export const FlowerIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    {Array.from({ length: 6 }, (_, i) => (
      <ellipse key={i} cx="12" cy="6.5" rx="3.4" ry="5" fill="#f4a3b8" transform={`rotate(${i * 60} 12 12)`} />
    ))}
    <circle cx="12" cy="12" r="3.2" fill="#ffd36b" />
  </svg>
)

const SoundIcon = ({ muted }: { muted: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
    {muted ? (
      <path d="M17 9l5 6M22 9l-5 6" />
    ) : (
      <>
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 6a8.5 8.5 0 0 1 0 12" />
      </>
    )}
  </svg>
)

function SoundToggle() {
  const muted = useGame((s) => s.muted)
  const toggle = useGame((s) => s.toggleMute)
  return (
    <button className="icon-btn sound-btn" onClick={toggle} aria-label={muted ? texts.soundOn : texts.soundOff}>
      <SoundIcon muted={muted} />
    </button>
  )
}

// ---------------- Màn mở đầu ----------------

export function TitleScreen() {
  const start = useGame((s) => s.start)
  return (
    <div className="screen title-screen">
      <header className="title-block">
        <h1 className="title-script">
          <span className="t1">{texts.titleTop}</span>
          <span className="t2">{texts.titleBottom}</span>
        </h1>
        <svg className="title-flourish" viewBox="0 0 220 20" aria-hidden>
          <path d="M4 14 C 60 2, 150 2, 216 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="title-sub">{texts.subtitle}</p>
      </header>
      <div className="title-bottom">
        <button className="primary-btn big" onClick={start}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M7 4l13 8-13 8z" fill="currentColor" />
          </svg>
          {texts.startButton}
        </button>
        <p className="title-note">Nên bật âm thanh để nghe nhạc nhẹ nhàng</p>
      </div>
    </div>
  )
}

// ---------------- Hướng dẫn ----------------

export function GuideScreen() {
  const begin = useGame((s) => s.beginPlay)
  return (
    <div className="screen guide-screen">
      <div className="guide-center">
        <p className="guide-eyebrow">Cách chơi</p>
        <p className="guide-lead">Chỉ cần hai ngón tay thôi mẹ nhé</p>
        {!isTouch && <p className="guide-keys">{texts.guideKeyboard}</p>}
        <button className="primary-btn big" onClick={begin}>
          {texts.guideOk}
        </button>
      </div>
      <div className="callout callout-left">
        <span className="callout-num">1</span>
        {texts.guideJoystick}
      </div>
      <div className="callout callout-right">
        <span className="callout-num">2</span>
        {texts.guideAction}
      </div>
      <Joystick demo />
      <ActionButton demo />
    </div>
  )
}

// ---------------- Giao diện khi chơi ----------------

export function Hud() {
  const bubble = useGame((s) => s.bubble)
  const bubbleKey = useGame((s) => s.bubbleKey)
  const quest = useGame((s) => s.quest)
  const collected = useGame((s) => s.collected)
  const n = collectedCount(collected)
  const [pop, setPop] = useState(-1)

  useEffect(() => {
    setPop(n)
    const id = window.setTimeout(() => setPop(-1), 700)
    return () => window.clearTimeout(id)
  }, [n])

  return (
    <div className="hud">
      <div className="hud-top">
        <div className={`counter ${quest === 'bell' ? 'is-hidden' : ''} ${pop === n && n > 0 ? 'is-pop' : ''}`}>
          <FlowerIcon />
          <span>
            {n} / 3
          </span>
        </div>
        <SoundToggle />
      </div>
      {bubble && (
        <div key={bubbleKey} className="quest-bubble">
          {bubble}
        </div>
      )}
      <Joystick />
      <ActionButton />
    </div>
  )
}

// ---------------- Thẻ kỷ niệm ----------------

export function MemoryCard() {
  const index = useGame((s) => s.activeMemory)
  const collected = useGame((s) => s.collected)
  const close = useGame((s) => s.closeMemory)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(false)
    const id = window.setTimeout(() => setReady(true), 900)
    return () => window.clearTimeout(id)
  }, [index])
  if (index === null) return null
  const m = memories[index] ?? memories[0]
  return (
    <div className="screen memory-screen">
      <div className="polaroid">
        <div className="photo">
          {m.photo ? (
            <img src={m.photo} alt={m.title} />
          ) : (
            <div className="photo-placeholder">
              <FlowerIcon size={64} />
            </div>
          )}
        </div>
        <p className="polaroid-count">{texts.memoryCount(collectedCount(collected))}</p>
        <h2 className="polaroid-title">{m.title}</h2>
        {m.caption && <p className="polaroid-caption">{m.caption}</p>}
      </div>
      <button className={`primary-btn big ${ready ? '' : 'is-waiting'}`} onClick={() => ready && close()}>
        {texts.memoryContinue}
      </button>
    </div>
  )
}

// ---------------- Kết thúc ----------------

export function FinaleOverlay() {
  const ready = useGame((s) => s.finaleReady)
  const open = useGame((s) => s.openLetter)
  return (
    <div className={`screen finale-screen ${ready ? 'is-ready' : ''}`}>
      <div className="finale-text">
        <h1 className="finale-title">{texts.finaleTitle}</h1>
        <svg className="title-flourish" viewBox="0 0 220 20" aria-hidden>
          <path d="M4 14 C 60 2, 150 2, 216 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="finale-sub">{texts.finaleSubtitle}</p>
      </div>
      <button className="primary-btn big finale-btn" onClick={open}>
        {texts.finaleButton}
      </button>
    </div>
  )
}

type Block = { kind: 'h' | 'p' | 'sign'; text: string }

const parseLetter = (raw: string): Block[] =>
  raw
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      if (b.startsWith('# ')) return { kind: 'h', text: b.slice(2).trim() }
      if (b.startsWith('—') || b.startsWith('--')) return { kind: 'sign', text: b }
      return { kind: 'p', text: b }
    })

export function LetterScreen() {
  const replay = useGame((s) => s.replay)
  const blocks = useMemo(() => parseLetter(letterRaw), [])
  return (
    <div className="screen letter-screen">
      <div className="letter-scroll">
        <article className="letter-paper">
          <svg className="letter-heart" width="34" height="30" viewBox="0 0 34 30" aria-hidden>
            <path
              d="M17 28C8 21 2 16 2 9.5 2 5 5.5 2 9.5 2c3 0 5.5 1.7 7.5 4.5C19 3.7 21.5 2 24.5 2 28.5 2 32 5 32 9.5 32 16 26 21 17 28z"
              fill="none"
              stroke="#c8323a"
              strokeWidth="2"
            />
          </svg>
          {blocks.map((b, i) =>
            b.kind === 'h' ? (
              <h2 key={i} className="letter-heading">
                {b.text}
              </h2>
            ) : b.kind === 'sign' ? (
              <p key={i} className="letter-sign">
                {b.text}
              </p>
            ) : (
              <p key={i} className="letter-p">
                {b.text.split('\n').map((line, j, arr) => (
                  <span key={j}>
                    {line}
                    {j < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>
            ),
          )}
        </article>
        <div className="letter-actions">
          <button className="ghost-btn" onClick={replay}>
            {texts.letterReplay}
          </button>
          <SoundToggle />
        </div>
      </div>
    </div>
  )
}
