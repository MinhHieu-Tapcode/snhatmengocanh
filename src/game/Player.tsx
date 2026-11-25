import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Mom, MomHandle } from './Mom'
import { input, player } from './runtime'
import { BOUNDS, GIFT_DECK, GIFT_SPOT, boxColliders, circleColliders } from './layout'
import { useGame } from '../store'

const RADIUS = 0.32
const MAX_SPEED = 3.4 // m/s: đi bộ nhẹ nhàng, không quá nhanh

const keyAxis = () => {
  const k = input.keys
  let x = 0
  let y = 0
  if (k.has('ArrowLeft') || k.has('KeyA')) x -= 1
  if (k.has('ArrowRight') || k.has('KeyD')) x += 1
  if (k.has('ArrowUp') || k.has('KeyW')) y += 1
  if (k.has('ArrowDown') || k.has('KeyS')) y -= 1
  return [x, y]
}

function resolveCollisions(p: THREE.Vector3) {
  for (const c of circleColliders) {
    const dx = p.x - c.x
    const dz = p.z - c.z
    const min = c.r + RADIUS
    const d2 = dx * dx + dz * dz
    if (d2 < min * min && d2 > 1e-6) {
      const d = Math.sqrt(d2)
      p.x = c.x + (dx / d) * min
      p.z = c.z + (dz / d) * min
    }
  }
  for (const b of boxColliders) {
    const cx = Math.max(b.minX, Math.min(p.x, b.maxX))
    const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ))
    const dx = p.x - cx
    const dz = p.z - cz
    const d2 = dx * dx + dz * dz
    if (d2 < RADIUS * RADIUS) {
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2)
        p.x = cx + (dx / d) * RADIUS
        p.z = cz + (dz / d) * RADIUS
      } else {
        // đang ở trong hộp: đẩy ra cạnh gần nhất
        const pushes = [
          [b.minX - RADIUS - p.x, 0],
          [b.maxX + RADIUS - p.x, 0],
          [0, b.minZ - RADIUS - p.z],
          [0, b.maxZ + RADIUS - p.z],
        ]
        pushes.sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1]))
        p.x += pushes[0][0]
        p.z += pushes[0][1]
      }
    }
  }
  p.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, p.x))
  p.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, p.z))
}

const onDeck = (x: number, z: number) =>
  Math.abs(x - GIFT_DECK.x) < GIFT_DECK.w / 2 && Math.abs(z - GIFT_DECK.z) < GIFT_DECK.d / 2

export function Player() {
  const root = useRef<THREE.Group>(null!)
  const mom = useRef<MomHandle>(null!)
  const vel = useRef(new THREE.Vector2())

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = useGame.getState()
    const canMove = s.phase === 'play'

    let ix = 0
    let iy = 0
    if (canMove) {
      const [kx, ky] = keyAxis()
      ix = input.x + kx
      iy = input.y + ky
      const m = Math.hypot(ix, iy)
      if (m > 1) {
        ix /= m
        iy /= m
      }
    }

    // Camera luôn nhìn về phía ngôi nhà, nên "đẩy lên" = đi vào trong (z âm)
    const targetVx = ix * MAX_SPEED
    const targetVz = -iy * MAX_SPEED
    const accel = Math.hypot(ix, iy) > 0.05 ? 8 : 10
    vel.current.x += (targetVx - vel.current.x) * (1 - Math.exp(-accel * dt))
    vel.current.y += (targetVz - vel.current.y) * (1 - Math.exp(-accel * dt))

    const speed = vel.current.length()
    player.speed = speed
    if (speed > 0.15) {
      player.lastMoveAt = performance.now()
      player.hasMoved = true
      const want = Math.atan2(vel.current.x, vel.current.y)
      let diff = want - player.facing
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      player.facing += diff * (1 - Math.exp(-10 * dt))
    }

    player.pos.x += vel.current.x * dt
    player.pos.z += vel.current.y * dt
    resolveCollisions(player.pos)

    // Khi mở quà: quay mặt về phía hộp quà
    if (s.phase === 'finale' || s.phase === 'letter') {
      const want = Math.atan2(GIFT_SPOT[0] - player.pos.x, GIFT_SPOT[1] - player.pos.z)
      let diff = want - player.facing
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      player.facing += diff * (1 - Math.exp(-4 * dt))
    }

    const groundY = onDeck(player.pos.x, player.pos.z) ? 0.12 : 0
    root.current.position.set(player.pos.x, groundY, player.pos.z)
    root.current.rotation.y = player.facing

    const action = (performance.now() - player.actionAt) / 900
    mom.current.animate(clock.elapsedTime, speed, action >= 0 && action <= 1 ? action : 0)
  })

  return (
    <group ref={root}>
      <group scale={0.92}>
        <Mom ref={mom} />
      </group>
      {/* bóng mềm dưới chân để dễ nhìn vị trí */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}
