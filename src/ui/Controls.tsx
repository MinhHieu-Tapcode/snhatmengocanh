import { useEffect, useRef, useState } from 'react'
import { input, player } from '../game/runtime'
import { useGame } from '../store'
import { texts } from '../content/texts'

const BASE = 150 // đường kính vòng joystick (px)
const KNOB = 64
const MAX = (BASE - KNOB) / 2

/**
 * Joystick cố định ở góc trái dưới. Vùng chạm rộng hơn vòng tròn
 * để mẹ đặt tay hơi lệch vẫn điều khiển được.
 */
export function Joystick({ demo = false }: { demo?: boolean }) {
  const baseRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)
  const pointerId = useRef<number | null>(null)
  const [moved, setMoved] = useState(player.hasMoved)

  useEffect(() => {
    if (moved) return
    const id = window.setInterval(() => player.hasMoved && setMoved(true), 400)
    return () => window.clearInterval(id)
  }, [moved])

  const update = (cx: number, cy: number) => {
    const r = baseRef.current!.getBoundingClientRect()
    let dx = cx - (r.left + r.width / 2)
    let dy = cy - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > MAX) {
      dx = (dx / d) * MAX
      dy = (dy / d) * MAX
    }
    setKnob({ x: dx, y: dy })
    // vùng chết nhỏ để tay run nhẹ không làm nhân vật nhúc nhích
    const nx = dx / MAX
    const ny = -dy / MAX
    const m = Math.hypot(nx, ny)
    const k = m < 0.15 ? 0 : (m - 0.15) / 0.85 / m
    input.x = nx * k
    input.y = ny * k
  }

  const end = () => {
    pointerId.current = null
    setActive(false)
    setKnob({ x: 0, y: 0 })
    input.x = 0
    input.y = 0
    input.joystickActive = false
  }

  return (
    <div
      className="joy-zone"
      onPointerDown={(e) => {
        if (demo || pointerId.current !== null) return
        pointerId.current = e.pointerId
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        setActive(true)
        input.joystickActive = true
        update(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => e.pointerId === pointerId.current && update(e.clientX, e.clientY)}
      onPointerUp={(e) => e.pointerId === pointerId.current && end()}
      onPointerCancel={(e) => e.pointerId === pointerId.current && end()}
    >
      <div ref={baseRef} className={`joy-base ${active ? 'is-active' : ''}`} style={{ width: BASE, height: BASE }}>
        <span className="joy-tick t" />
        <span className="joy-tick r" />
        <span className="joy-tick b" />
        <span className="joy-tick l" />
        <div
          className={`joy-knob ${!moved && !active ? 'is-hinting' : ''}`}
          style={{ width: KNOB, height: KNOB, transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
        {!moved && !active && <div className="joy-finger" aria-hidden />}
      </div>
    </div>
  )
}

const labelFor = (id: string | null) => {
  if (!id) return ''
  if (id === 'bell') return texts.actionBell
  if (id === 'gift') return texts.actionGift
  return texts.actionFlower
}

const iconFor = (id: string | null) => {
  if (id === 'bell') return '🔔'
  if (id === 'gift') return '🎁'
  return '🌸'
}

export function ActionButton({ demo = false }: { demo?: boolean }) {
  const near = useGame((s) => s.nearTarget)
  const interact = useGame((s) => s.interact)
  const shown = demo || !!near
  const id = demo ? 'flower-0' : near
  return (
    <button
      className={`action-btn ${shown ? 'is-shown' : ''}`}
      aria-label={labelFor(id)}
      onPointerDown={(e) => {
        e.preventDefault()
        if (demo) return
        player.actionAt = performance.now()
        interact()
      }}
    >
      <span className="action-icon">{iconFor(id)}</span>
      <span className="action-label">{labelFor(id)}</span>
    </button>
  )
}

/** Bàn phím trên máy tính. */
export function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      input.keys.add(e.code)
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        const s = useGame.getState()
        if (s.phase === 'play' && s.nearTarget) {
          player.actionAt = performance.now()
          s.interact()
          e.preventDefault()
        }
      }
    }
    const up = (e: KeyboardEvent) => input.keys.delete(e.code)
    const blur = () => input.keys.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
}
