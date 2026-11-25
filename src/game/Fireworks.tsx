import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { dotTexture } from './textures'
import { useGame } from '../store'
import { audio } from '../audio/audio'

const PER_BURST = 150
const BURSTS = 7
const PALETTES = [
  ['#ffd48a', '#fff2cf', '#ffb35c'],
  ['#ff9fb6', '#ffd9e2', '#ffffff'],
  ['#ffc0a0', '#ffe9b0', '#ff8f7a'],
  ['#d8c2ff', '#fff0ff', '#ffc6e0'],
  ['#9fe0ff', '#ffffff', '#ffe8a8'],
]

type Burst = {
  age: number
  life: number
  rocket: number // thời gian bay lên
  origin: THREE.Vector3
  start: THREE.Vector3
  vel: Float32Array
  popped?: boolean
}

/** Pháo hoa mềm mại, màu ấm, rơi chậm và lấp lánh. */
export function Fireworks() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BURSTS * PER_BURST * 3), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(BURSTS * PER_BURST * 3), 3))
    return g
  }, [])
  const bursts = useRef<(Burst | null)[]>(Array(BURSTS).fill(null))
  const nextAt = useRef(0)
  const base = useRef(new Float32Array(BURSTS * PER_BURST * 3))
  const c = useMemo(() => new THREE.Color(), [])

  const spawn = (slot: number) => {
    const origin = new THREE.Vector3(-8 + Math.random() * 18, 12 + Math.random() * 8, -30 + Math.random() * 10)
    const vel = new Float32Array(PER_BURST * 3)
    const speed = 5.5 + Math.random() * 3
    for (let i = 0; i < PER_BURST; i++) {
      const u = Math.random() * 2 - 1
      const th = Math.random() * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      const sp = speed * (0.85 + Math.random() * 0.15)
      vel[i * 3] = r * Math.cos(th) * sp
      vel[i * 3 + 1] = u * sp
      vel[i * 3 + 2] = r * Math.sin(th) * sp
    }
    const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)]
    const col = base.current
    for (let i = 0; i < PER_BURST; i++) {
      c.set(pal[i % pal.length])
      const o = (slot * PER_BURST + i) * 3
      col[o] = c.r * 2.2
      col[o + 1] = c.g * 2.2
      col[o + 2] = c.b * 2.2
    }
    bursts.current[slot] = {
      age: 0,
      life: 2.8,
      rocket: 0.9,
      origin,
      start: new THREE.Vector3(origin.x + (Math.random() - 0.5) * 2, 0, origin.z + 4),
      vel,
    }
  }

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = useGame.getState()
    const active =
      (s.phase === 'finale' && (performance.now() - s.finaleAt) / 1000 > 2.2) || s.phase === 'letter'
    const now = performance.now() / 1000

    if (active && now > nextAt.current) {
      const slot = bursts.current.findIndex((b) => b === null)
      if (slot >= 0) spawn(slot)
      nextAt.current = now + (s.phase === 'letter' ? 1.6 + Math.random() * 1.6 : 0.45 + Math.random() * 0.7)
    }

    const pos = geo.attributes.position.array as Float32Array
    bursts.current.forEach((b, slot) => {
      const base = slot * PER_BURST * 3
      if (!b) {
        for (let i = 0; i < PER_BURST * 3; i += 3) pos[base + i + 1] = -100
        return
      }
      b.age += dt
      if (b.age < b.rocket) {
        // tia pháo bay lên
        const k = b.age / b.rocket
        const e = 1 - Math.pow(1 - k, 2)
        for (let i = 0; i < PER_BURST; i++) {
          const o = base + i * 3
          const trail = (i % 12) * 0.05
          pos[o] = b.start.x + (b.origin.x - b.start.x) * e
          pos[o + 1] = b.origin.y * e - trail * (1 - k) * 2
          pos[o + 2] = b.start.z + (b.origin.z - b.start.z) * e
          if (i > 12) pos[o + 1] = -100
        }
        return
      }
      if (!b.popped) {
        b.popped = true
        audio.sfx('firework')
      }
      const t = b.age - b.rocket
      const drag = (1 - Math.exp(-1.6 * t)) / 1.6
      for (let i = 0; i < PER_BURST; i++) {
        const o = base + i * 3
        pos[o] = b.origin.x + b.vel[i * 3] * drag
        pos[o + 1] = b.origin.y + b.vel[i * 3 + 1] * drag - 0.9 * t * t
        pos[o + 2] = b.origin.z + b.vel[i * 3 + 2] * drag
      }
      if (t > b.life) bursts.current[slot] = null
    })
    geo.attributes.position.needsUpdate = true

    // Mờ dần và lấp lánh theo tuổi
    const col = geo.attributes.color.array as Float32Array
    const baseCol = base.current
    bursts.current.forEach((b, slot) => {
      if (!b) return
      const t = Math.max(0, b.age - b.rocket)
      const fade = b.age < b.rocket ? 1 : Math.pow(Math.max(0, 1 - t / b.life), 0.7)
      const o = slot * PER_BURST * 3
      for (let i = 0; i < PER_BURST; i++) {
        const tw = t > 1.2 ? 0.55 + Math.random() * 0.45 : 1
        for (let j = 0; j < 3; j++) col[o + i * 3 + j] = baseCol[o + i * 3 + j] * fade * tw
      }
    })
    geo.attributes.color.needsUpdate = true
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.95}
        map={dotTexture()}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        fog={false}
      />
    </points>
  )
}
