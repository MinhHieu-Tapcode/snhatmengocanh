import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { rng } from './textures'

/**
 * Nhân vật mẹ: tóc ngắn hơi xoăn ôm sát đầu, đuôi tóc uốn nhẹ quanh gáy,
 * áo len hồng dáng suông, quần ống đứng màu be, giày búp bê nâu, vòng ngọc trai.
 * Dựng bằng khối cơ bản để nhẹ và tự điều khiển được dáng đi.
 */

const SKIN = '#f0c6a4'
const SKIN_SHADE = '#e2ad8c'
const SWEATER = '#d98c8a'
const SWEATER_RIB = '#c97b7a'
const PANTS = '#e2d2b6'
const SHOES = '#7a5240'
const HAIR = '#46322a'
const HAIR_LIGHT = '#5a4234'

export type MomHandle = {
  animate: (t: number, speed: number, action: number) => void
}

const mat = (color: string, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness })

function useMaterials() {
  return useMemo(
    () => ({
      skin: mat(SKIN, 0.75),
      skinShade: mat(SKIN_SHADE, 0.8),
      sweater: mat(SWEATER, 1),
      rib: mat(SWEATER_RIB, 1),
      pants: mat(PANTS, 0.95),
      shoes: mat(SHOES, 0.6),
      hair: new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.7, side: THREE.DoubleSide }),
      hairLight: mat(HAIR_LIGHT, 0.65),
      eye: mat('#2a1c17', 0.4),
      brow: mat('#3a2922', 0.9),
      lip: mat('#c0676a', 0.6),
      pearl: new THREE.MeshStandardMaterial({ color: '#f6efe4', roughness: 0.25, metalness: 0.1 }),
      blush: new THREE.MeshStandardMaterial({ color: '#f09c98', transparent: true, opacity: 0.45, roughness: 1 }),
    }),
    [],
  )
}

/** Thân áo len dáng suông: vai tròn, eo nhẹ, gấu áo hơi loe. */
function useTorsoGeometry() {
  return useMemo(() => {
    const pts = [
      [0.0, -0.07],
      [0.188, -0.07],
      [0.196, -0.01],
      [0.182, 0.13],
      [0.174, 0.21],
      [0.188, 0.32],
      [0.184, 0.41],
      [0.152, 0.485],
      [0.075, 0.535],
      [0.0, 0.545],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const g = new THREE.LatheGeometry(pts, 24)
    g.scale(1.05, 1, 0.74)
    return g
  }, [])
}

function useHipGeometry() {
  return useMemo(() => {
    const pts = [
      [0.0, -0.12],
      [0.11, -0.11],
      [0.16, -0.06],
      [0.17, 0.0],
      [0.16, 0.04],
      [0.0, 0.04],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const g = new THREE.LatheGeometry(pts, 20)
    g.scale(1.05, 1, 0.74)
    return g
  }, [])
}

function Hair({ m }: { m: ReturnType<typeof useMaterials> }) {
  // các lọn xoăn nhỏ nằm bết sát da đầu: chỉ nhô lên rất ít để tạo vân tóc
  const curls = useMemo(() => {
    const r = rng(42)
    const list: { p: [number, number, number]; s: number; light: boolean }[] = []
    for (let i = 0; i < 64; i++) {
      const theta = 0.1 + r() * 1.8
      const phi = r() * Math.PI * 2
      // chừa khuôn mặt (phía +z)
      if (Math.sin(phi) > 0.15 && theta > 0.8) continue
      const rad = 0.162
      list.push({
        p: [-rad * Math.cos(phi) * Math.sin(theta) * 1.02, rad * Math.cos(theta) + 0.004, rad * Math.sin(phi) * Math.sin(theta) - 0.004],
        s: 0.017 + r() * 0.01,
        light: r() > 0.7,
      })
    }
    return list
  }, [])

  // đuôi tóc uốn cụp nhẹ, ôm sát gáy và vành tai
  const ends = useMemo(() => {
    const list: { p: [number, number, number]; s: number; rz: number }[] = []
    const n = 18
    for (let i = 0; i <= n; i++) {
      const a = THREE.MathUtils.lerp(-0.05 * Math.PI, 1.05 * Math.PI, i / n)
      const back = Math.max(0, Math.sin(a))
      const x = Math.cos(a) * (0.152 - back * 0.03)
      const z = -Math.sin(a) * (0.137 - back * 0.02) - 0.008
      const y = -0.04 - back * 0.07
      list.push({ p: [x, y, z], s: 0.024 + (i % 2) * 0.004, rz: a })
    }
    return list
  }, [])

  return (
    <group>
      {/* chỏm tóc ôm đầu */}
      <mesh material={m.hair} castShadow scale={[1.0, 1, 1.0]}>
        <sphereGeometry args={[0.168, 28, 18, 0, Math.PI * 2, 0, 1.1]} />
      </mesh>
      {/* phần tóc hai bên và sau gáy */}
      <mesh material={m.hair} castShadow scale={[1.02, 1, 1.0]}>
        <sphereGeometry args={[0.165, 28, 18, Math.PI * 0.8, Math.PI * 1.4, 0.9, 1.42]} />
      </mesh>
      {curls.map((c, i) => (
        <mesh key={i} position={c.p} material={c.light ? m.hairLight : m.hair} scale={[1, 0.7, 1]}>
          <icosahedronGeometry args={[c.s, 1]} />
        </mesh>
      ))}
      {ends.map((e, i) => (
        <mesh key={`e${i}`} position={e.p} material={i % 3 === 0 ? m.hairLight : m.hair} rotation-y={e.rz} scale={[0.75, 0.9, 1.1]}>
          <sphereGeometry args={[e.s, 12, 8]} />
        </mesh>
      ))}
      {/* mái chải lệch sang một bên */}
      <mesh material={m.hair} position={[0.03, 0.105, 0.105]} rotation={[0.55, 0, -0.45]} scale={[2.1, 0.55, 0.9]}>
        <sphereGeometry args={[0.055, 14, 10]} />
      </mesh>
      <mesh material={m.hairLight} position={[-0.06, 0.12, 0.09]} rotation={[0.5, 0, 0.35]} scale={[1.6, 0.5, 0.9]}>
        <sphereGeometry args={[0.05, 14, 10]} />
      </mesh>
      <mesh material={m.hair} position={[0.1, 0.06, 0.1]} rotation={[0.3, 0.4, -1.0]} scale={[1.4, 0.5, 0.8]}>
        <sphereGeometry args={[0.045, 12, 8]} />
      </mesh>
    </group>
  )
}

function Face({ m }: { m: ReturnType<typeof useMaterials> }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* mắt cười nhẹ */}
          <mesh position={[s * 0.052, 0.005, 0.138]} scale={[1.2, 0.8, 0.6]} material={m.eye}>
            <sphereGeometry args={[0.014, 10, 8]} />
          </mesh>
          {/* lông mày */}
          <mesh position={[s * 0.054, 0.04, 0.138]} rotation-z={s * -0.12} scale={[1, 0.25, 0.4]} material={m.brow}>
            <sphereGeometry args={[0.024, 10, 6]} />
          </mesh>
          {/* má hồng */}
          <mesh position={[s * 0.078, -0.035, 0.122]} scale={[1, 0.6, 0.35]} material={m.blush}>
            <sphereGeometry args={[0.03, 10, 8]} />
          </mesh>
          {/* tai và bông tai ngọc trai */}
          <mesh position={[s * 0.148, -0.005, 0.0]} scale={[0.5, 1, 0.8]} material={m.skinShade}>
            <sphereGeometry args={[0.032, 10, 8]} />
          </mesh>
          <mesh position={[s * 0.153, -0.04, 0.01]} material={m.pearl}>
            <sphereGeometry args={[0.012, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* mũi */}
      <mesh position={[0, -0.018, 0.152]} scale={[0.8, 1.1, 0.9]} material={m.skinShade}>
        <sphereGeometry args={[0.018, 10, 8]} />
      </mesh>
      {/* môi cười */}
      <mesh position={[0, -0.065, 0.135]} rotation-z={Math.PI} scale={[1, 0.6, 0.6]} material={m.lip}>
        <torusGeometry args={[0.022, 0.006, 6, 12, Math.PI]} />
      </mesh>
    </group>
  )
}

export const Mom = forwardRef<MomHandle>(function Mom(_, ref) {
  const m = useMaterials()
  const torsoGeo = useTorsoGeometry()
  const hipGeo = useHipGeometry()

  const body = useRef<THREE.Group>(null!)
  const torso = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const kneeL = useRef<THREE.Group>(null!)
  const kneeR = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const elbowR = useRef<THREE.Group>(null!)
  const elbowL = useRef<THREE.Group>(null!)
  const stride = useRef(0)
  const lastT = useRef(0)

  useImperativeHandle(ref, () => ({
    animate(t, speed, action) {
      const dt = Math.min(0.05, Math.max(0, t - lastT.current))
      lastT.current = t
      const walk = Math.min(1, speed / 2.6)
      stride.current += speed * dt * 3.3
      const s = stride.current
      const swing = Math.sin(s)

      legL.current.rotation.x = swing * 0.5 * walk
      legR.current.rotation.x = -swing * 0.5 * walk
      kneeL.current.rotation.x = Math.max(0, -Math.cos(s)) * 0.65 * walk
      kneeR.current.rotation.x = Math.max(0, Math.cos(s)) * 0.65 * walk

      const idle = 1 - walk
      armL.current.rotation.x = -swing * 0.42 * walk
      armR.current.rotation.x = swing * 0.42 * walk
      armL.current.rotation.z = -0.14 - idle * Math.sin(t * 1.3) * 0.015
      armR.current.rotation.z = 0.14 + idle * Math.sin(t * 1.3) * 0.015
      elbowL.current.rotation.x = -0.2 - walk * 0.25
      elbowR.current.rotation.x = -0.2 - walk * 0.25

      // vẫy tay khi tương tác
      if (action > 0) {
        const a = Math.sin(Math.min(1, action) * Math.PI)
        armR.current.rotation.x = -2.4 * a + armR.current.rotation.x * (1 - a)
        armR.current.rotation.z = 0.14 + a * 0.25
        elbowR.current.rotation.x = -0.4 - a * 0.5 + Math.sin(t * 14) * 0.25 * a
      }

      body.current.position.y = Math.abs(Math.cos(s)) * 0.035 * walk + Math.sin(t * 1.6) * 0.005 * idle
      torso.current.rotation.y = swing * 0.07 * walk
      torso.current.rotation.x = 0.04 * walk
      torso.current.scale.set(1, 1 + Math.sin(t * 1.6) * 0.008 * idle, 1)
      head.current.rotation.y = -swing * 0.05 * walk + Math.sin(t * 0.4) * 0.15 * idle
      head.current.rotation.x = -0.03 * walk + 0.04
    },
  }))

  return (
    <group ref={body}>
      {/* chân: quần ống đứng, giày búp bê */}
      {[
        [legL, kneeL, -0.09],
        [legR, kneeR, 0.09],
      ].map(([leg, knee, x], i) => (
        <group key={i} ref={leg as any} position={[x as number, 0.84, 0]}>
          <mesh position={[0, -0.21, 0]} material={m.pants} castShadow>
            <cylinderGeometry args={[0.09, 0.08, 0.44, 14]} />
          </mesh>
          <group ref={knee as any} position={[0, -0.42, 0]}>
            <mesh position={[0, -0.19, 0]} material={m.pants} castShadow>
              <cylinderGeometry args={[0.078, 0.084, 0.38, 14]} />
            </mesh>
            {/* cổ chân */}
            <mesh position={[0, -0.39, 0]} material={m.skin}>
              <cylinderGeometry args={[0.035, 0.035, 0.04, 8]} />
            </mesh>
            {/* giày */}
            <mesh position={[0, -0.405, 0.045]} scale={[0.9, 0.42, 1.55]} material={m.shoes} castShadow>
              <sphereGeometry args={[0.072, 14, 10]} />
            </mesh>
          </group>
        </group>
      ))}

      <group ref={torso} position={[0, 0.84, 0]}>
        {/* hông (quần) */}
        <mesh geometry={hipGeo} material={m.pants} castShadow />
        {/* áo len */}
        <mesh geometry={torsoGeo} material={m.sweater} position-y={0.02} castShadow />
        {/* gấu áo bo len (ôm theo thân áo dẹt) */}
        <mesh position={[0, -0.045, 0]} scale={[1.05, 0.74, 1]} rotation-x={Math.PI / 2} material={m.rib}>
          <torusGeometry args={[0.188, 0.018, 8, 28]} />
        </mesh>
        {/* cổ áo tròn */}
        <mesh position={[0, 0.555, 0]} rotation-x={Math.PI / 2} scale={[1, 0.85, 1]} material={m.rib}>
          <torusGeometry args={[0.068, 0.02, 8, 18]} />
        </mesh>
        {/* vòng ngọc trai */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 13) * Math.PI * 1.1 - Math.PI * 0.05
          return (
            <mesh key={i} position={[Math.cos(a) * 0.075, 0.53 - Math.sin(a) * 0.035, Math.sin(a) * 0.072 + 0.012]} material={m.pearl}>
              <sphereGeometry args={[0.01, 8, 6]} />
            </mesh>
          )
        })}

        {/* tay: vai tròn liền thân áo */}
        {[
          [armL, elbowL, -0.172],
          [armR, elbowR, 0.172],
        ].map(([arm, elbow, x], i) => (
          <group key={i} ref={arm as any} position={[x as number, 0.45, 0]}>
            <mesh material={m.sweater} castShadow scale={[1, 0.9, 0.95]}>
              <sphereGeometry args={[0.068, 14, 10]} />
            </mesh>
            <mesh position={[0, -0.13, 0]} material={m.sweater} castShadow>
              <capsuleGeometry args={[0.06, 0.15, 4, 12]} />
            </mesh>
            <group ref={elbow as any} position={[0, -0.255, 0]}>
              <mesh material={m.sweater}>
                <sphereGeometry args={[0.058, 12, 10]} />
              </mesh>
              <mesh position={[0, -0.1, 0]} material={m.sweater} castShadow>
                <cylinderGeometry args={[0.058, 0.05, 0.2, 12]} />
              </mesh>
              {/* cổ tay áo */}
              <mesh position={[0, -0.205, 0]} material={m.rib}>
                <cylinderGeometry args={[0.055, 0.055, 0.03, 12]} />
              </mesh>
              {/* bàn tay */}
              <mesh position={[0, -0.255, 0.005]} scale={[0.75, 1.1, 0.55]} material={m.skin} castShadow>
                <sphereGeometry args={[0.046, 12, 10]} />
              </mesh>
            </group>
          </group>
        ))}

        {/* cổ và đầu */}
        <mesh position={[0, 0.59, 0]} material={m.skin}>
          <cylinderGeometry args={[0.048, 0.054, 0.09, 12]} />
        </mesh>
        <group ref={head} position={[0, 0.73, 0.005]}>
          <mesh castShadow scale={[0.93, 1.06, 0.97]} material={m.skin}>
            <sphereGeometry args={[0.155, 28, 20]} />
          </mesh>
          {/* cằm thon */}
          <mesh position={[0, -0.075, 0.05]} scale={[0.9, 0.7, 0.9]} material={m.skin}>
            <sphereGeometry args={[0.085, 16, 12]} />
          </mesh>
          <Face m={m} />
          <Hair m={m} />
        </group>
      </group>
    </group>
  )
})
