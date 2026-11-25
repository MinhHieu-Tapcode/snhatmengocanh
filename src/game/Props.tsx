import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PORCH, PROPS } from './layout'
import { rng } from './textures'

const WOOD = '#8a5e3f'
const IRON = '#2f2b29'
const tmp = new THREE.Object3D()
const col = new THREE.Color()

/** Ghế gỗ chân sắt dưới gốc cây. */
function Bench() {
  const { x, z, ry } = PROPS.bench
  return (
    <group position={[x, 0, z]} rotation-y={ry}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.45, -0.12 + i * 0.13]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.11]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={`b${i}`} position={[0, 0.66 + i * 0.16, -0.24]} rotation-x={-0.18} castShadow>
          <boxGeometry args={[1.5, 0.1, 0.04]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
      ))}
      {[-0.65, 0.65].map((sx) => (
        <group key={sx} position={[sx, 0, 0]}>
          <mesh position={[0, 0.22, 0.12]} castShadow>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
            <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.45, -0.2]} rotation-x={-0.1} castShadow>
            <boxGeometry args={[0.05, 0.9, 0.05]} />
            <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.6, -0.02]}>
            <boxGeometry args={[0.05, 0.04, 0.4]} />
            <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* chiếc khăn len vắt trên ghế */}
      <mesh position={[0.35, 0.49, 0.02]} rotation-y={0.3} scale={[1, 0.25, 1]} castShadow>
        <boxGeometry args={[0.4, 0.12, 0.3]} />
        <meshStandardMaterial color="#e9d9b6" roughness={1} />
      </mesh>
    </group>
  )
}

/** Hộp thư cạnh cổng. */
function Mailbox() {
  const { x, z } = PROPS.mailbox
  return (
    <group position={[x, 0, z]} rotation-y={Math.PI}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.09, 1.1, 0.09]} />
        <meshStandardMaterial color="#f3ece0" />
      </mesh>
      <group position={[0, 1.18, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.2, 0.5]} />
          <meshStandardMaterial color="#5f7f6f" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 16, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#5f7f6f" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        {/* cờ báo thư (đang dựng lên: có thư cho mẹ) */}
        <mesh position={[0.18, 0.18, -0.05]}>
          <boxGeometry args={[0.02, 0.28, 0.03]} />
          <meshStandardMaterial color="#c8323a" />
        </mesh>
        <mesh position={[0.18, 0.3, -0.1]}>
          <boxGeometry args={[0.02, 0.07, 0.1]} />
          <meshStandardMaterial color="#c8323a" />
        </mesh>
      </group>
      {/* bụi hoa nhỏ dưới chân hộp thư */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i) * 0.25, 0.12, Math.sin(i) * 0.25]}>
          <icosahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color={['#f6c7d2', '#fff4e6', '#ffd98a'][i % 3]} />
        </mesh>
      ))}
    </group>
  )
}

/** Bồn tắm chim, có một chú chim nhỏ thỉnh thoảng nhún nhảy. */
function Birdbath() {
  const { x, z } = PROPS.birdbath
  const bird = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const hop = Math.max(0, Math.sin(t * 2.2)) ** 8
    bird.current.position.y = 0.95 + hop * 0.08
    bird.current.rotation.y = Math.sin(t * 0.35) * 1.2
    bird.current.rotation.x = Math.max(0, Math.sin(t * 1.3 + 1)) ** 10 * 0.6 // cúi xuống uống nước
  })
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.12, 16]} />
        <meshStandardMaterial color="#cfc6b6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.7, 12]} />
        <meshStandardMaterial color="#cfc6b6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.2, 0.14, 24]} />
        <meshStandardMaterial color="#d8cfbf" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.925, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.4, 24]} />
        <meshStandardMaterial color="#8fb3c4" roughness={0.08} metalness={0.3} />
      </mesh>
      <group ref={bird} position={[0.38, 0.95, 0]}>
        <mesh position={[0, 0.06, 0]} scale={[1, 0.85, 1.3]} castShadow>
          <sphereGeometry args={[0.06, 12, 10]} />
          <meshStandardMaterial color="#8a6a52" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.06, 0.04]} scale={[0.8, 0.7, 0.9]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#e08a5a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.13, 0.05]}>
          <sphereGeometry args={[0.042, 10, 8]} />
          <meshStandardMaterial color="#8a6a52" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.125, 0.1]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[0.012, 0.035, 6]} />
          <meshStandardMaterial color="#e8b04a" />
        </mesh>
        <mesh position={[0, 0.08, -0.09]} rotation-x={-0.5} scale={[0.6, 0.2, 1]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color="#6a4e3c" />
        </mesh>
      </group>
    </group>
  )
}

/** Chú mèo cam cuộn tròn ngủ trên hiên nhà. */
function Cat() {
  const { x, z } = PROPS.cat
  const body = useRef<THREE.Mesh>(null!)
  const tail = useRef<THREE.Group>(null!)
  const ear = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    body.current.scale.set(1.15, 0.62 + Math.sin(t * 1.4) * 0.025, 1)
    tail.current.rotation.y = Math.sin(t * 0.8) * 0.25
    ear.current.rotation.z = Math.max(0, Math.sin(t * 0.5)) ** 30 * 0.4 // thỉnh thoảng giật tai
  })
  const orange = '#e39a5a'
  return (
    <group position={[x, 0.32, z]} rotation-y={-0.6}>
      <mesh ref={body} position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 12]} />
        <meshStandardMaterial color={orange} roughness={0.95} />
      </mesh>
      <group position={[0.15, 0.1, 0.08]}>
        <mesh castShadow>
          <sphereGeometry args={[0.095, 14, 10]} />
          <meshStandardMaterial color={orange} roughness={0.95} />
        </mesh>
        <mesh position={[0.04, -0.02, 0.06]} scale={[1, 0.7, 0.8]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#f8e8d4" roughness={1} />
        </mesh>
        {/* mắt nhắm */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.06, 0.02, s * 0.035 + 0.05]} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.012, 0.003, 4, 8, Math.PI]} />
            <meshStandardMaterial color="#3a2a22" />
          </mesh>
        ))}
        <group ref={ear}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[-0.01, 0.085, s * 0.05]} rotation-x={s * 0.25}>
              <coneGeometry args={[0.035, 0.07, 4]} />
              <meshStandardMaterial color={orange} />
            </mesh>
          ))}
        </group>
      </group>
      <group ref={tail} position={[-0.15, 0.04, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.02, 0, 0.12]}>
          <torusGeometry args={[0.14, 0.03, 8, 16, Math.PI * 0.9]} />
          <meshStandardMaterial color="#d9874a" roughness={0.95} />
        </mesh>
      </group>
      {/* tấm nệm nhỏ */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.03, 20]} />
        <meshStandardMaterial color="#b6c7d6" roughness={1} />
      </mesh>
    </group>
  )
}

/** Hai luống oải hương tím dọc hàng rào trước. */
function Lavender() {
  const stems = useRef<THREE.InstancedMesh>(null!)
  const tips = useRef<THREE.InstancedMesh>(null!)
  const plants = useMemo(() => {
    const r = rng(83)
    const list: { x: number; z: number }[] = []
    PROPS.lavender.forEach((row) => {
      for (let x = row.x0 + 0.3; x < row.x1; x += 0.55) list.push({ x: x + (r() - 0.5) * 0.2, z: row.z + (r() - 0.5) * 0.25 })
    })
    return list
  }, [])
  const PER = 9
  useLayoutEffect(() => {
    const r = rng(84)
    let k = 0
    plants.forEach((p) => {
      for (let i = 0; i < PER; i++) {
        const lean = 0.15 + r() * 0.25
        const a = r() * Math.PI * 2
        const h = 0.45 + r() * 0.25
        tmp.position.set(p.x + Math.cos(a) * 0.05, h / 2, p.z + Math.sin(a) * 0.05)
        tmp.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
        tmp.scale.set(1, h, 1)
        tmp.updateMatrix()
        stems.current.setMatrixAt(k, tmp.matrix)
        // ngọn hoa ở đầu thân
        const top = new THREE.Vector3(0, 0.5, 0).applyMatrix4(tmp.matrix)
        tmp.position.copy(top)
        tmp.scale.set(1, 1, 1)
        tmp.updateMatrix()
        tips.current.setMatrixAt(k, tmp.matrix)
        tips.current.setColorAt(k, col.setHSL(0.74 + (r() - 0.5) * 0.04, 0.45, 0.58 + r() * 0.12))
        k++
      }
    })
    stems.current.instanceMatrix.needsUpdate = true
    tips.current.instanceMatrix.needsUpdate = true
    if (tips.current.instanceColor) tips.current.instanceColor.needsUpdate = true
  }, [plants])
  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, plants.length * PER]}>
        <cylinderGeometry args={[0.008, 0.012, 1, 4]} />
        <meshStandardMaterial color="#7d9a5a" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={tips} args={[undefined, undefined, plants.length * PER]} castShadow>
        <capsuleGeometry args={[0.028, 0.14, 2, 6]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      {/* gốc bụi xanh xám */}
      {plants.map((p, i) => (
        <mesh key={i} position={[p.x, 0.12, p.z]} scale={[1, 0.6, 1]}>
          <icosahedronGeometry args={[0.2, 1]} />
          <meshStandardMaterial color="#7b9168" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** Băng cờ nhỏ nhiều màu treo ngang hiên nhà, như một buổi tiệc sinh nhật. */
function Bunting() {
  const flags = useMemo(() => {
    const out: { p: THREE.Vector3; c: string }[] = []
    const colors = ['#f2a7b8', '#ffd98a', '#fff4e6', '#a9cbe0', '#f4b6c4']
    const from = new THREE.Vector3(-PORCH.w / 2 + 0.2, 2.45, PORCH.z + PORCH.d / 2 + 0.1)
    const to = new THREE.Vector3(PORCH.w / 2 - 0.2, 2.45, PORCH.z + PORCH.d / 2 + 0.1)
    const n = 13
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n
      const p = from.clone().lerp(to, k)
      p.y -= Math.sin(k * Math.PI) * 0.3
      out.push({ p, c: colors[i % colors.length] })
    }
    return out
  }, [])
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.11, 0)
    s.lineTo(0.11, 0)
    s.lineTo(0, -0.22)
    s.closePath()
    return s
  }, [])
  const group = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    group.current.children.forEach((c, i) => {
      c.rotation.x = Math.sin(clock.elapsedTime * 1.6 + i * 0.7) * 0.15
    })
  })
  return (
    <group ref={group}>
      {flags.map((f, i) => (
        <mesh key={i} position={f.p}>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color={f.c} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export function Props() {
  return (
    <group>
      <Bench />
      <Mailbox />
      <Birdbath />
      <Cat />
      <Lavender />
      <Bunting />
    </group>
  )
}
