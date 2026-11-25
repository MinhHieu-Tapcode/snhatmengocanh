import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BELL_SPOT, FLOWERS, GIFT_DECK, GIFT_SPOT, Vec2 } from './layout'
import { beamTexture, dotTexture } from './textures'
import { player } from './runtime'
import { useGame, TargetId } from '../store'
import { texts } from '../content/texts'

const ease = (dt: number, k: number) => 1 - Math.exp(-dt * k)

/** Vòng sáng dưới đất + cột sáng mờ để mẹ nhìn thấy từ xa. */
function Beacon({
  active,
  at,
  color = '#ffd27a',
  radius = 1.1,
}: {
  active: () => boolean
  at: Vec2
  color?: string
  radius?: number
}) {
  const group = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!)
  const beamMat = useRef<THREE.MeshBasicMaterial>(null!)
  const v = useRef(0)
  useFrame(({ clock }, dt) => {
    v.current += ((active() ? 1 : 0) - v.current) * ease(dt, 3)
    group.current.visible = v.current > 0.01
    const t = clock.elapsedTime
    const pulse = 1 + Math.sin(t * 2.4) * 0.08
    ring.current.scale.setScalar(pulse)
    ringMat.current.opacity = v.current * (0.75 + Math.sin(t * 2.4) * 0.2)
    // cột sáng mờ đi khi mẹ đã đến gần để không che nhân vật
    const d = Math.hypot(at[0] - player.pos.x, at[1] - player.pos.z)
    beamMat.current.opacity = v.current * 0.34 * THREE.MathUtils.smoothstep(d, 1.2, 4.5)
  })
  return (
    <group ref={group}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.05}>
        <ringGeometry args={[radius * 0.82, radius, 48]} />
        <meshBasicMaterial ref={ringMat} color={color} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position-y={3.5}>
        <cylinderGeometry args={[radius * 0.55, radius * 0.7, 7, 24, 1, true]} />
        <meshBasicMaterial
          ref={beamMat}
          color={color}
          map={beamTexture()}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/** Hạt lấp lánh bay quanh vật thể. */
function Sparkles({ count = 14, radius = 0.8, height = 1.6, color = '#ffe6a8', active }: {
  count?: number
  radius?: number
  height?: number
  color?: string
  active: () => number
}) {
  const ref = useRef<THREE.Points>(null!)
  const mat = useRef<THREE.PointsMaterial>(null!)
  const seeds = useMemo(() => Array.from({ length: count }, () => [Math.random() * 6.28, Math.random(), Math.random()]), [count])
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    seeds.forEach(([a, h, s], i) => {
      const ang = a + t * (0.4 + s * 0.5)
      const y = ((h + t * 0.15 * (0.5 + s)) % 1) * height
      positions[i * 3] = Math.cos(ang) * radius * (0.6 + s * 0.4)
      positions[i * 3 + 1] = 0.2 + y
      positions[i * 3 + 2] = Math.sin(ang) * radius * (0.6 + s * 0.4)
    })
    ref.current.geometry.attributes.position.needsUpdate = true
    mat.current.opacity = active()
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.16}
        map={dotTexture()}
        color={color}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

// ---------------- Bông hoa kỷ niệm ----------------

function MemoryFlower({ index, p }: { index: number; p: Vec2 }) {
  const group = useRef<THREE.Group>(null!)
  const bloom = useRef<THREE.Group>(null!)
  const petalMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f7a9bd', emissive: '#ff8fae', emissiveIntensity: 0, roughness: 0.6 }),
    [],
  )
  const centerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffd76e', emissive: '#ffc04a', emissiveIntensity: 0 }),
    [],
  )
  const collectedAt = useRef<number | null>(null)
  const glowing = () => {
    const s = useGame.getState()
    return s.quest === 'flowers' && !s.collected[index]
  }

  useFrame(({ clock }, dt) => {
    const s = useGame.getState()
    const t = clock.elapsedTime
    const isCollected = s.collected[index]
    if (isCollected && collectedAt.current === null) collectedAt.current = t
    if (!isCollected) collectedAt.current = null

    const g = glowing() ? 1 : 0
    petalMat.emissiveIntensity += (g * (0.9 + Math.sin(t * 2.2) * 0.35) - petalMat.emissiveIntensity) * ease(dt, 4)
    centerMat.emissiveIntensity = petalMat.emissiveIntensity * 1.3

    bloom.current.rotation.y += dt * 0.5
    bloom.current.position.y = 0.95 + Math.sin(t * 1.6 + index) * 0.06

    if (collectedAt.current !== null) {
      const k = Math.min(1, (t - collectedAt.current) / 1.4)
      group.current.position.y = k * 1.4
      const sc = k < 0.4 ? 1 + k * 1.2 : Math.max(0, 1.48 * (1 - (k - 0.4) / 0.6))
      group.current.scale.setScalar(sc)
      group.current.visible = k < 1
    } else {
      group.current.position.y = 0
      group.current.scale.setScalar(1)
      group.current.visible = true
    }
  })

  return (
    <group position={[p[0], 0, p[1]]}>
      <Beacon active={glowing} at={p} color="#ffc6d3" />
      <Sparkles active={() => (glowing() ? 0.9 : 0)} color="#ffd9e3" />
      <group ref={group}>
       <group scale={1.4}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.04, 0.9, 6]} />
          <meshStandardMaterial color="#4f7a2e" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.14, 0.35, 0]} rotation-z={s * -0.9} scale={[1, 0.35, 0.6]} castShadow>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#5d8a35" />
          </mesh>
        ))}
        <group ref={bloom} position-y={0.95}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17]}
                rotation={[0, -a, 0.35]}
                scale={[1, 0.35, 0.62]}
                material={petalMat}
                castShadow
              >
                <sphereGeometry args={[0.17, 12, 8]} />
              </mesh>
            )
          })}
          <mesh material={centerMat} position-y={0.04}>
            <sphereGeometry args={[0.09, 12, 8]} />
          </mesh>
        </group>
       </group>
      </group>
    </group>
  )
}

// ---------------- Hiên gỗ và hộp quà ----------------

function StringLights({ from, to, on }: { from: THREE.Vector3; to: THREE.Vector3; on: THREE.Material }) {
  const pts = useMemo(() => {
    const out: THREE.Vector3[] = []
    for (let i = 0; i <= 10; i++) {
      const k = i / 10
      const p = from.clone().lerp(to, k)
      p.y -= Math.sin(k * Math.PI) * 0.35
      out.push(p)
    }
    return out
  }, [from, to])
  const wire = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: '#2a2420' }),
      ),
    [pts],
  )
  return (
    <group>
      <primitive object={wire} />
      {pts.slice(1, -1).map((p, i) => (
        <mesh key={i} position={[p.x, p.y - 0.07, p.z]} material={on}>
          <sphereGeometry args={[0.055, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

function GiftDeck() {
  const bulbs = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#fff2d2', emissive: '#ffc46b', emissiveIntensity: 0 }),
    [],
  )
  const lightRef = useRef<THREE.PointLight>(null!)
  const v = useRef(0)
  useFrame((_, dt) => {
    const q = useGame.getState().quest
    const target = q === 'gift' || q === 'done' ? 1 : 0
    v.current += (target - v.current) * ease(dt, 2)
    bulbs.emissiveIntensity = v.current * 4
    lightRef.current.intensity = v.current * 6
  })
  const { x, z, w, d } = GIFT_DECK
  const h = 2.7
  const corners: [number, number][] = [
    [-w / 2 + 0.2, -d / 2 + 0.2],
    [w / 2 - 0.2, -d / 2 + 0.2],
    [-w / 2 + 0.2, d / 2 - 0.2],
    [w / 2 - 0.2, d / 2 - 0.2],
  ]
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[w, 0.12, d]} />
        <meshStandardMaterial color="#a8774f" roughness={0.9} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + (i + 0.5) * (w / 11), 0.125, 0]}>
          <boxGeometry args={[0.02, 0.01, d]} />
          <meshStandardMaterial color="#7d5638" />
        </mesh>
      ))}
      {corners.map(([cx, cz], i) => (
        <mesh key={i} position={[cx, h / 2, cz]} castShadow>
          <boxGeometry args={[0.16, h, 0.16]} />
          <meshStandardMaterial color="#f3ece0" />
        </mesh>
      ))}
      {[-d / 2 + 0.2, d / 2 - 0.2].map((cz) => (
        <mesh key={cz} position={[0, h, cz]} castShadow>
          <boxGeometry args={[w + 0.3, 0.14, 0.14]} />
          <meshStandardMaterial color="#f3ece0" />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + 0.4 + i * ((w - 0.8) / 5), h + 0.1, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, d + 0.3]} />
          <meshStandardMaterial color="#f3ece0" />
        </mesh>
      ))}
      <StringLights from={new THREE.Vector3(-w / 2 + 0.2, h - 0.05, -d / 2 + 0.2)} to={new THREE.Vector3(w / 2 - 0.2, h - 0.05, d / 2 - 0.2)} on={bulbs} />
      <StringLights from={new THREE.Vector3(w / 2 - 0.2, h - 0.05, -d / 2 + 0.2)} to={new THREE.Vector3(-w / 2 + 0.2, h - 0.05, d / 2 - 0.2)} on={bulbs} />
      <StringLights from={new THREE.Vector3(-w / 2 + 0.2, h - 0.05, d / 2 - 0.2)} to={new THREE.Vector3(w / 2 - 0.2, h - 0.05, d / 2 - 0.2)} on={bulbs} />
      <pointLight ref={lightRef} position={[0, 2.2, 0]} color="#ffbe6e" distance={9} decay={1.6} intensity={0} />

      {/* bàn và hai ghế nhỏ */}
      <group position={[2.2, 0.12, 1.4]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 18]} />
          <meshStandardMaterial color="#f3ece0" />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.7, 8]} />
          <meshStandardMaterial color="#3a332e" />
        </mesh>
        <mesh position={[0.08, 0.8, 0.05]}>
          <cylinderGeometry args={[0.07, 0.06, 0.14, 10]} />
          <meshStandardMaterial color="#d9e8ef" transparent opacity={0.6} />
        </mesh>
      </group>
      {/* chậu hoa ở góc */}
      {[
        [-2.6, -2.3],
        [2.6, -2.3],
        [-2.6, 2.3],
      ].map(([px, pz], i) => (
        <group key={i} position={[px, 0.12, pz]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.17, 0.4, 10]} />
            <meshStandardMaterial color="#c97f5a" />
          </mesh>
          {Array.from({ length: 6 }, (_, j) => (
            <mesh key={j} position={[Math.cos(j) * 0.15, 0.5 + (j % 2) * 0.08, Math.sin(j) * 0.15]}>
              <icosahedronGeometry args={[0.09, 0]} />
              <meshStandardMaterial color={['#f39bb2', '#fff4e6', '#f7b6c8'][j % 3]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Gift() {
  const root = useRef<THREE.Group>(null!)
  const lid = useRef<THREE.Group>(null!)
  const burst = useRef<THREE.Mesh>(null!)
  const burstMat = useRef<THREE.MeshBasicMaterial>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const appear = useRef(0)
  const unlocked = () => {
    const q = useGame.getState().quest
    return q === 'gift' || q === 'done'
  }
  useFrame(({ clock }, dt) => {
    const s = useGame.getState()
    appear.current += ((unlocked() ? 1 : 0) - appear.current) * ease(dt, 2.5)
    const a = appear.current
    root.current.visible = a > 0.01
    root.current.scale.setScalar(Math.max(0.001, a))
    root.current.rotation.y = s.phase === 'finale' || s.phase === 'letter' ? 0 : Math.sin(clock.elapsedTime * 0.8) * 0.15

    let open = 0
    if (s.phase === 'finale' || s.phase === 'letter') {
      const t = (performance.now() - s.finaleAt) / 1000
      open = s.phase === 'letter' ? 1 : THREE.MathUtils.smoothstep(t, 1.0, 2.2)
    }
    lid.current.position.y = 0.72 + open * 1.1
    lid.current.rotation.z = open * 0.6
    lid.current.position.x = open * 0.5
    // quầng sáng loé lên rồi dịu lại
    const flash = open * (s.phase === 'letter' ? 0.25 : 1 - 0.7 * THREE.MathUtils.smoothstep(open, 0.6, 1))
    burst.current.scale.setScalar(0.3 + open * 0.7)
    burstMat.current.opacity = flash * 0.45
    light.current.intensity = open * 10
  })
  return (
    <group position={[GIFT_SPOT[0], 0.12, GIFT_SPOT[1]]}>
      <Beacon active={() => useGame.getState().quest === 'gift'} at={GIFT_SPOT} color="#ffd27a" radius={1.3} />
      <group ref={root}>
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.72, 0.8]} />
          <meshStandardMaterial color="#f4dcab" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[0.82, 0.72, 0.14]} />
          <meshStandardMaterial color="#c8323a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[0.14, 0.72, 0.82]} />
          <meshStandardMaterial color="#c8323a" roughness={0.5} />
        </mesh>
        <group ref={lid} position-y={0.72}>
          <mesh position={[0, 0.07, 0]} castShadow>
            <boxGeometry args={[0.9, 0.14, 0.9]} />
            <meshStandardMaterial color="#f7e3b8" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[0.92, 0.15, 0.14]} />
            <meshStandardMaterial color="#c8323a" />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[0.14, 0.15, 0.92]} />
            <meshStandardMaterial color="#c8323a" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.15, 0.24, 0]} rotation={[0, 0, s * 0.5]} scale={[1.3, 1, 0.7]} castShadow>
              <torusGeometry args={[0.11, 0.04, 8, 16]} />
              <meshStandardMaterial color="#c8323a" />
            </mesh>
          ))}
        </group>
        <mesh ref={burst} position-y={0.9}>
          <sphereGeometry args={[0.6, 20, 14]} />
          <meshBasicMaterial
            ref={burstMat}
            color="#ffd9a0"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <pointLight ref={light} position={[0, 1.2, 0]} color="#ffcf8a" distance={10} intensity={0} />
        <Sparkles active={() => (unlocked() ? 1 : 0)} radius={1} height={2} />
      </group>
    </group>
  )
}

// ---------------- Mũi tên chỉ đường dưới chân ----------------

const objectivePos = (): Vec2 | null => {
  const s = useGame.getState()
  if (s.quest === 'bell') return BELL_SPOT
  if (s.quest === 'gift') return GIFT_SPOT
  if (s.quest === 'flowers') {
    let best: Vec2 | null = null
    let bd = Infinity
    FLOWERS.forEach((f, i) => {
      if (s.collected[i]) return
      const d = Math.hypot(f[0] - player.pos.x, f[1] - player.pos.z)
      if (d < bd) {
        bd = d
        best = f
      }
    })
    return best
  }
  return null
}

function GuideArrow() {
  const ref = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0.42)
    s.lineTo(0.34, -0.05)
    s.lineTo(0.14, -0.05)
    s.lineTo(0.14, -0.32)
    s.lineTo(-0.14, -0.32)
    s.lineTo(-0.14, -0.05)
    s.lineTo(-0.34, -0.05)
    s.closePath()
    return s
  }, [])
  const vis = useRef(0)
  useFrame(({ clock }, dt) => {
    const s = useGame.getState()
    const o = objectivePos()
    let show = 0
    if (o && s.phase === 'play') {
      const dx = o[0] - player.pos.x
      const dz = o[1] - player.pos.z
      const d = Math.hypot(dx, dz)
      if (d > 3) {
        show = 1
        const ang = Math.atan2(dx, dz)
        const off = 1.15 + Math.sin(clock.elapsedTime * 3) * 0.12
        ref.current.position.set(player.pos.x + Math.sin(ang) * off, 0.07, player.pos.z + Math.cos(ang) * off)
        ref.current.rotation.set(-Math.PI / 2, 0, ang)
      }
    }
    vis.current += (show - vis.current) * ease(dt, 5)
    mat.current.opacity = vis.current * 0.9
    ref.current.visible = vis.current > 0.02
  })
  return (
    <group ref={ref}>
      <mesh rotation-z={Math.PI}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial ref={mat} color="#ffd88a" transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------------- Logic nhiệm vụ ----------------

function QuestLogic() {
  const nearSince = useRef(0)
  const lastNear = useRef<TargetId | null>(null)
  const lastHint = useRef(0)

  useFrame(() => {
    const s = useGame.getState()
    const now = performance.now()
    if (s.phase !== 'play') {
      if (s.nearTarget) s.setNear(null)
      lastNear.current = null
      return
    }
    const px = player.pos.x
    const pz = player.pos.z
    const dist = (p: Vec2) => Math.hypot(p[0] - px, p[1] - pz)

    let near: TargetId | null = null
    if (s.quest === 'bell' && dist(BELL_SPOT) < 1.9) near = 'bell'
    if (s.quest === 'flowers') {
      FLOWERS.forEach((f, i) => {
        if (!s.collected[i] && dist(f) < 1.9 && !near) near = `flower-${i}`
      })
    }
    if (s.quest === 'gift' && dist(GIFT_SPOT) < 2.3) near = 'gift'

    if (near !== lastNear.current) {
      lastNear.current = near
      nearSince.current = now
      s.setNear(near)
      if (near === 'bell') s.say(texts.questBellNear)
    }

    // Đứng gần quá lâu mà chưa chạm → tự động tương tác cho mẹ
    if (near && now - nearSince.current > 7000) {
      nearSince.current = now
      player.actionAt = now
      s.interact()
    }

    // Đứng yên lâu ở xa mục tiêu → nhắc nhẹ
    if (!near && now - player.lastMoveAt > 14000 && now - lastHint.current > 14000) {
      lastHint.current = now
      s.say(texts.hintIdle)
    }
  })
  return null
}

export function Objectives() {
  return (
    <group>
      <group position={[BELL_SPOT[0], 0, BELL_SPOT[1]]}>
        <Beacon at={BELL_SPOT} active={() => useGame.getState().quest === 'bell' && useGame.getState().phase === 'play'} />
      </group>
      {FLOWERS.map((p, i) => (
        <MemoryFlower key={i} index={i} p={p} />
      ))}
      <GiftDeck />
      <Gift />
      <GuideArrow />
      <QuestLogic />
    </group>
  )
}
