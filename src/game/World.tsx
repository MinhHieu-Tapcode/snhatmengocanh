import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BUSHES, HOUSE, LANTERNS, TREES, Vec2 } from './layout'
import { grassTexture, rng, stoneTexture } from './textures'
import { Blob, crownGeometry, foliageMaterial } from './foliage'
import { Props } from './Props'
import { world } from './runtime'
import { useGame, collectedCount } from '../store'

const tmp = new THREE.Object3D()
const col = new THREE.Color()

/** Mức tiến trình dùng để bật đèn: số hoa đã nhặt, 4 khi đã mở khoá quà. */
export const lightLevel = () => {
  const s = useGame.getState()
  if (s.quest === 'gift' || s.quest === 'done') return 4
  if (s.quest === 'flowers') return collectedCount(s.collected)
  return 0
}

// ---------------- Mặt đất ----------------

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[220, 220]} />
      <meshStandardMaterial map={grassTexture()} roughness={1} color="#f4f0c8" />
    </mesh>
  )
}

function PathStones() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const stones = useMemo(() => {
    const r = rng(11)
    const list: { x: number; z: number; s: number; rot: number }[] = []
    // con đường chính từ cổng đến hiên nhà
    for (let z = 16.8; z > -3.2; z -= 0.78) {
      list.push({ x: -0.48 + (r() - 0.5) * 0.12, z: z + (r() - 0.5) * 0.15, s: 0.85 + r() * 0.2, rot: r() * 3 })
      list.push({ x: 0.48 + (r() - 0.5) * 0.12, z: z - 0.38 + (r() - 0.5) * 0.15, s: 0.85 + r() * 0.2, rot: r() * 3 })
    }
    // lối đá nhỏ đến hiên gỗ
    const from: Vec2 = [1.6, -1.6]
    const to: Vec2 = [8.6, -7.6]
    for (let i = 0; i <= 9; i++) {
      const k = i / 9
      list.push({
        x: from[0] + (to[0] - from[0]) * k + Math.sin(k * 6) * 0.3,
        z: from[1] + (to[1] - from[1]) * k,
        s: 0.7 + r() * 0.15,
        rot: r() * 3,
      })
    }
    return list
  }, [])

  useLayoutEffect(() => {
    const r = rng(5)
    stones.forEach((st, i) => {
      tmp.position.set(st.x, 0.02, st.z)
      tmp.rotation.set(0, st.rot, 0)
      tmp.scale.set(st.s * 0.95, 1, st.s * 0.8)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
      ref.current.setColorAt(i, col.set('#d8ccb6').multiplyScalar(0.85 + r() * 0.2))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [stones])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, stones.length]} receiveShadow>
      <cylinderGeometry args={[0.42, 0.45, 0.06, 7]} />
      <meshStandardMaterial map={stoneTexture()} roughness={0.95} />
    </instancedMesh>
  )
}

/** Có nằm trên đường đi / nhà / hiên không (để không mọc cỏ lên đó). */
const blocked = (x: number, z: number) =>
  (Math.abs(x) < 1.3 && z > -4 && z < 17.5) ||
  (Math.abs(x - HOUSE.x) < HOUSE.w / 2 + 0.4 && Math.abs(z - HOUSE.z) < HOUSE.d / 2 + 1.8) ||
  (x > 7.6 && x < 14.4 && z > -12.6 && z < -6.4)

/** Một lá cỏ cong nhẹ, gốc sẫm, ngọn sáng. */
function bladeGeometry() {
  const segs = 3
  const pos: number[] = []
  const colr: number[] = []
  const nrm: number[] = []
  const idx: number[] = []
  const base = new THREE.Color('#5d7d33')
  const tip = new THREE.Color('#d6dc8c')
  for (let i = 0; i <= segs; i++) {
    const k = i / segs
    const w = 0.07 * (1 - k * 0.85)
    const bend = k * k * 0.12
    for (const s of [-1, 1]) {
      pos.push(s * w, k, bend)
      const c = base.clone().lerp(tip, Math.pow(k, 1.3))
      colr.push(c.r, c.g, c.b)
      nrm.push(0, 1, 0) // pháp tuyến hướng lên: cỏ sáng mềm như cảnh hoạt hình điện ảnh
    }
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    // mặt sau dùng chung pháp tuyến hướng lên, để không bị tối khi nhìn từ phía sau
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  g.setIndex(idx)
  return g
}

/** Gió chung cho cỏ và cây. */
export const wind = { uniform: { value: 0 } }

function useWindMaterial(strength: number) {
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = wind.uniform
      shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 wp = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          vec3 wp = vec3(0.0);
        #endif
        float h = position.y * position.y;
        float gust = sin(uTime * 0.7 + wp.x * 0.08 + wp.z * 0.05) * 0.5 + 0.5;
        transformed.x += sin(uTime * 1.9 + wp.x * 0.6 + wp.z * 0.4) * ${strength.toFixed(3)} * h * (0.5 + gust);
        transformed.z += cos(uTime * 1.5 + wp.z * 0.5) * ${(strength * 0.6).toFixed(3)} * h;`,
      )
    }
    return m
  }, [strength])
}

function GrassBlades() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const count = 5200
  const geometry = useMemo(bladeGeometry, [])
  const material = useWindMaterial(0.14)
  useLayoutEffect(() => {
    const r = rng(21)
    let i = 0
    while (i < count) {
      // dày hơn ở ven vườn và quanh gốc cây, thưa ở giữa bãi cỏ
      const x = (r() - 0.5) * 36
      const z = (r() - 0.5) * 36
      if (blocked(x, z)) continue
      const edge = Math.max(Math.abs(x), Math.abs(z)) / 18
      if (r() > 0.3 + edge * 0.8) continue
      const s = 0.14 + r() * 0.2 + edge * 0.18
      tmp.position.set(x, 0, z)
      tmp.rotation.set((r() - 0.5) * 0.3, r() * Math.PI * 2, (r() - 0.5) * 0.3)
      tmp.scale.set(1 + r() * 0.6, s, 1)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
      ref.current.setColorAt(i, col.setHSL(0.2 + r() * 0.06, 0.5 + r() * 0.15, 0.52 + r() * 0.12))
      i++
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [])
  useFrame(({ clock }) => {
    wind.uniform.value = clock.elapsedTime
  })
  return <instancedMesh ref={ref} args={[geometry, material, count]} receiveShadow frustumCulled={false} />
}

/** Luống hoa nhỏ dọc hàng rào và trước nhà. */
function FlowerBeds() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const pts = useMemo(() => {
    const r = rng(31)
    const out: { x: number; z: number; c: string }[] = []
    const colors = ['#f7b6c8', '#fff4e6', '#f39bb2', '#ffd98a', '#d9b8f0', '#ffffff']
    const bed = (cx: number, cz: number, w: number, d: number, n: number) => {
      for (let i = 0; i < n; i++)
        out.push({ x: cx + (r() - 0.5) * w, z: cz + (r() - 0.5) * d, c: colors[Math.floor(r() * colors.length)] })
    }
    bed(-3.8, -3.4, 3, 0.9, 50)
    bed(3.8, -3.4, 3, 0.9, 50)
    bed(-16.6, 0, 0.7, 30, 160)
    bed(16.6, 4, 0.7, 24, 130)
    bed(-9, 16.5, 12, 0.7, 90)
    bed(9, 16.5, 12, 0.7, 90)
    BUSHES.forEach((b) => bed(b.p[0], b.p[1], 2.2 * b.s, 2.2 * b.s, 10))
    return out
  }, [])

  useLayoutEffect(() => {
    const r = rng(9)
    pts.forEach((p, i) => {
      const s = 0.7 + r() * 0.6
      tmp.position.set(p.x, 0.22 + r() * 0.18, p.z)
      tmp.rotation.set(0, 0, 0)
      tmp.scale.set(s, s * 0.8, s)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
      ref.current.setColorAt(i, col.set(p.c))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [pts])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]}>
      <icosahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  )
}

// ---------------- Hàng rào ----------------

function Fence() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const railRef = useRef<THREE.InstancedMesh>(null!)
  const E = 17.4
  const pickets = useMemo(() => {
    const list: { x: number; z: number; ry: number }[] = []
    const step = 0.32
    for (let v = -E; v <= E; v += step) {
      if (Math.abs(v) > 1.7) list.push({ x: v, z: E, ry: 0 }) // phía trước, chừa cổng
      list.push({ x: v, z: -E, ry: 0 })
      list.push({ x: -E, z: v, ry: Math.PI / 2 })
      list.push({ x: E, z: v, ry: Math.PI / 2 })
    }
    return list
  }, [])

  useLayoutEffect(() => {
    pickets.forEach((p, i) => {
      tmp.position.set(p.x, 0.5, p.z)
      tmp.rotation.set(0, p.ry, 0)
      tmp.scale.set(1, 1, 1)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true

    const rails = [
      { x: -(E + 1.7) / 2, z: E, len: E - 1.7, ry: 0 },
      { x: (E + 1.7) / 2, z: E, len: E - 1.7, ry: 0 },
      { x: 0, z: -E, len: E * 2, ry: 0 },
      { x: -E, z: 0, len: E * 2, ry: Math.PI / 2 },
      { x: E, z: 0, len: E * 2, ry: Math.PI / 2 },
    ]
    let k = 0
    rails.forEach((r) =>
      [0.35, 0.75].forEach((y) => {
        tmp.position.set(r.x, y, r.z)
        tmp.rotation.set(0, r.ry, 0)
        tmp.scale.set(r.len, 1, 1)
        tmp.updateMatrix()
        railRef.current.setMatrixAt(k++, tmp.matrix)
      }),
    )
    railRef.current.instanceMatrix.needsUpdate = true
  }, [pickets])

  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, pickets.length]} castShadow>
        <boxGeometry args={[0.09, 1, 0.05]} />
        <meshStandardMaterial color="#f6f1e7" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={railRef} args={[undefined, undefined, 10]} castShadow>
        <boxGeometry args={[1, 0.07, 0.04]} />
        <meshStandardMaterial color="#efe8da" roughness={0.7} />
      </instancedMesh>
      {/* trụ cổng */}
      {[-1.75, 1.75].map((x) => (
        <group key={x} position={[x, 0, E]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.25, 1.4, 0.25]} />
            <meshStandardMaterial color="#f6f1e7" />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <sphereGeometry args={[0.13, 12, 8]} />
            <meshStandardMaterial color="#f6f1e7" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ---------------- Cây ----------------


const ROUND_CROWN: Blob[] = [
  { pos: [0, 1.0, 0], r: 1.3 },
  { pos: [0.85, 0.65, 0.35], r: 0.95 },
  { pos: [-0.75, 0.7, -0.3], r: 1.0 },
  { pos: [0.1, 1.75, 0.1], r: 0.95 },
  { pos: [-0.4, 0.4, 0.8], r: 0.75 },
  { pos: [0.55, 1.35, -0.65], r: 0.85 },
  { pos: [-0.85, 1.4, 0.45], r: 0.7 },
  { pos: [0.45, 0.35, -0.5], r: 0.7 },
]
const TALL_CROWN: Blob[] = [
  { pos: [0, 0.3, 0], r: 0.95 },
  { pos: [0, 1.05, 0], r: 0.82 },
  { pos: [0.1, 1.75, 0.05], r: 0.62 },
  { pos: [0, 2.3, 0], r: 0.4 },
]

export function Tree({ p, s, kind, shadow = true }: { p: Vec2; s: number; kind: 0 | 1; shadow?: boolean }) {
  const seed = Math.floor(Math.abs(p[0] * 131 + p[1] * 71)) + 3
  const crownGeo = useMemo(
    () =>
      kind === 0
        ? crownGeometry(ROUND_CROWN, seed, '#4a6b2a', '#b3c867')
        : crownGeometry(TALL_CROWN, seed, '#3f5f2a', '#94b35a'),
    [kind, seed],
  )
  const crown = useRef<THREE.Group>(null!)
  const phase = p[0] * 0.37 + p[1] * 0.21
  useFrame(({ clock }) => {
    // tán cây lay nhẹ trong gió chiều
    const t = clock.elapsedTime
    crown.current.rotation.z = Math.sin(t * 0.9 + phase) * 0.025
    crown.current.rotation.x = Math.cos(t * 0.7 + phase) * 0.018
  })

  return (
    <group position={[p[0], 0, p[1]]} scale={s}>
      <mesh position={[0, 0.9, 0]} castShadow={shadow}>
        <cylinderGeometry args={[0.11, 0.2, 1.8, 8]} />
        <meshStandardMaterial color="#6b4a33" roughness={1} />
      </mesh>
      {/* cành chĩa ra hai bên */}
      {kind === 0 &&
        [-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.22, 1.55, 0.05]} rotation-z={sd * -0.7} castShadow={shadow}>
            <cylinderGeometry args={[0.05, 0.08, 0.6, 6]} />
            <meshStandardMaterial color="#6b4a33" roughness={1} />
          </mesh>
        ))}
      <group ref={crown} position-y={1.6}>
        <mesh geometry={crownGeo} material={foliageMaterial()} castShadow={shadow} receiveShadow />
      </group>
    </group>
  )
}

function YardTrees() {
  return (
    <>
      {TREES.map((t, i) => (
        <Tree key={i} {...t} />
      ))}
    </>
  )
}

function Bushes() {
  const geo = useMemo(
    () =>
      crownGeometry(
        [
          { pos: [0, 0.42, 0], r: 0.62 },
          { pos: [0.4, 0.33, 0.2], r: 0.45 },
          { pos: [-0.38, 0.3, -0.12], r: 0.45 },
          { pos: [0.05, 0.3, -0.38], r: 0.4 },
        ],
        5,
        '#3f5f27',
        '#93b056',
      ),
    [],
  )
  // bụi cây cẩm tú cầu: điểm những chùm hoa tròn lên trên
  const blooms = useMemo(() => {
    const r = rng(61)
    return BUSHES.map(() =>
      Array.from({ length: 7 }, () => {
        const a = r() * Math.PI * 2
        const rad = 0.3 + r() * 0.3
        return { x: Math.cos(a) * rad, y: 0.55 + r() * 0.35, z: Math.sin(a) * rad, s: 0.12 + r() * 0.06 }
      }),
    )
  }, [])
  return (
    <>
      {BUSHES.map((b, i) => (
        <group key={i} position={[b.p[0], 0, b.p[1]]} scale={b.s}>
          <mesh geometry={geo} material={foliageMaterial()} castShadow receiveShadow />
          {blooms[i].map((f, j) => (
            <mesh key={j} position={[f.x, f.y, f.z]} scale={f.s}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={b.color} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

/** Một dải núi vòng quanh chân trời, sống núi nhấp nhô mềm mại. */
function Ridge({ radius, height, color, seed }: { radius: number; height: number; color: string; seed: number }) {
  const geo = useMemo(() => {
    const segs = 180
    const g = new THREE.CylinderGeometry(radius, radius, height, segs, 1, true)
    const pos = g.attributes.position as THREE.BufferAttribute
    const r = rng(seed)
    const ph = [r() * 6, r() * 6, r() * 6, r() * 6]
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (y < 0) continue
      const a = Math.atan2(pos.getZ(i), pos.getX(i))
      const n =
        0.55 +
        Math.sin(a * 3 + ph[0]) * 0.22 +
        Math.sin(a * 7 + ph[1]) * 0.13 +
        Math.sin(a * 13 + ph[2]) * 0.07 +
        Math.sin(a * 29 + ph[3]) * 0.03
      pos.setY(i, -height / 2 + height * THREE.MathUtils.clamp(n, 0.12, 1))
    }
    g.computeVertexNormals()
    return g
  }, [radius, height, seed])
  return (
    <mesh geometry={geo} position-y={height / 2 - 1.5}>
      <meshLambertMaterial color={color} side={THREE.BackSide} />
    </mesh>
  )
}

/** Rừng cây và đồi ngoài hàng rào để tạo chiều sâu. */
function Surroundings() {
  const trunk = useRef<THREE.InstancedMesh>(null!)
  const leaves = useRef<THREE.InstancedMesh>(null!)
  const trees = useMemo(() => {
    const r = rng(77)
    const list: { x: number; z: number; s: number }[] = []
    while (list.length < 70) {
      const a = r() * Math.PI * 2
      const d = 21 + r() * 26
      const x = Math.cos(a) * d
      const z = Math.sin(a) * d
      if (z > 8) continue // không chắn camera (cả khi camera lượn ở màn mở đầu)
      list.push({ x, z, s: 0.9 + r() * 0.9 })
    }
    return list
  }, [])

  const crownGeo = useMemo(() => crownGeometry(ROUND_CROWN, 99, '#4a6b2a', '#b3c867', 1), [])
  useLayoutEffect(() => {
    const r = rng(78)
    trees.forEach((t, i) => {
      tmp.position.set(t.x, 0.9 * t.s, t.z)
      tmp.rotation.set(0, 0, 0)
      tmp.scale.set(t.s, t.s, t.s)
      tmp.updateMatrix()
      trunk.current.setMatrixAt(i, tmp.matrix)
      tmp.position.set(t.x, 1.6 * t.s, t.z)
      tmp.rotation.set(0, r() * Math.PI * 2, 0)
      tmp.scale.set(t.s * (0.9 + r() * 0.2), t.s * (0.85 + r() * 0.35), t.s * (0.9 + r() * 0.2))
      tmp.updateMatrix()
      leaves.current.setMatrixAt(i, tmp.matrix)
      // mỗi cây một sắc xanh khác nhau
      leaves.current.setColorAt(i, col.setHSL(0.22 + (r() - 0.5) * 0.06, 0.35 + r() * 0.25, 0.85 + r() * 0.15))
    })
    trunk.current.instanceMatrix.needsUpdate = true
    leaves.current.instanceMatrix.needsUpdate = true
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true
  }, [trees])

  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.13, 0.2, 1.8, 5]} />
        <meshStandardMaterial color="#5e4330" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[crownGeo, foliageMaterial(), trees.length]} />
      {/* ba lớp núi đồi xa, càng xa càng nhạt vào sương chiều */}
      <Ridge radius={68} height={13} color="#6d8a55" seed={3} />
      <Ridge radius={98} height={24} color="#7d8d84" seed={7} />
      <Ridge radius={132} height={36} color="#9497ac" seed={11} />
      <City />
    </group>
  )
}

/** Thành phố mờ phía xa, cửa sổ sáng dần khi trời tối. */
function City() {
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 128
    const g = c.getContext('2d')!
    g.fillStyle = '#000'
    g.fillRect(0, 0, 64, 128)
    const r = rng(4)
    for (let y = 4; y < 124; y += 8)
      for (let x = 4; x < 60; x += 8) {
        if (r() < 0.45) {
          g.fillStyle = r() > 0.3 ? '#ffd18a' : '#fff1d0'
          g.fillRect(x, y, 4, 4)
        }
      }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const blocks = useMemo(() => {
    const r = rng(55)
    return Array.from({ length: 26 }, () => ({
      x: -55 + r() * 110,
      z: -76 - r() * 14,
      w: 5 + r() * 7,
      h: 8 + r() * 20,
    }))
  }, [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4a4660',
        roughness: 1,
        emissive: '#ffffff',
        emissiveMap: texture,
        emissiveIntensity: 0,
      }),
    [texture],
  )
  mat.current = material
  const group = useRef<THREE.Group>(null!)
  useFrame(() => {
    material.emissiveIntensity = THREE.MathUtils.smoothstep(world.t, 0.4, 0.9) * 1.6
    // ban ngày thành phố chìm trong sương; chỉ hiện khi đèn bắt đầu sáng
    group.current.visible = world.t > 0.45
  })
  return (
    <group ref={group}>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} material={material}>
          <boxGeometry args={[b.w, b.h, b.w]} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------- Đèn lồng ----------------

function Lantern({ p, on }: { p: Vec2; on: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const glow = useRef(0)
  useFrame((_, dt) => {
    const target = lightLevel() >= on ? 1 : 0
    glow.current += (target - glow.current) * (1 - Math.exp(-dt * 2.5))
    mat.current.emissiveIntensity = 0.05 + glow.current * 3.2
  })
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.4, 6]} />
        <meshStandardMaterial color="#2f2a28" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.26, 0.32, 0.26]} />
        <meshStandardMaterial ref={mat} color="#fff1d0" emissive="#ffb35c" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 1.76, 0]}>
        <coneGeometry args={[0.24, 0.16, 4]} />
        <meshStandardMaterial color="#2f2a28" />
      </mesh>
    </group>
  )
}

function Lanterns() {
  return (
    <>
      {LANTERNS.map((l, i) => (
        <Lantern key={i} {...l} />
      ))}
    </>
  )
}

export function World() {
  return (
    <group>
      <Ground />
      <PathStones />
      <GrassBlades />
      <FlowerBeds />
      <Fence />
      <YardTrees />
      <Bushes />
      <Lanterns />
      <Props />
      <Surroundings />
    </group>
  )
}
