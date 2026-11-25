import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { dotTexture, rng } from './textures'
import { world } from './runtime'

/** Vẽ một đám mây mềm lên canvas (không cần tải ảnh). */
function cloudTexture(seed: number) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')!
  const r = rng(seed)
  for (let i = 0; i < 26; i++) {
    const x = 40 + r() * 176
    const y = 58 + (r() - 0.5) * 30 - Math.sin(((x - 40) / 176) * Math.PI) * 18
    const rad = 18 + r() * 30
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    // mép dưới hơi tối hơn để có khối
    const shade = y > 64 ? 0.86 : 1
    grd.addColorStop(0, `rgba(${255 * shade},${255 * shade},${255 * shade},0.55)`)
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.beginPath()
    g.arc(x, y, rad, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const CLOUD_COLORS = ['#fff0dc', '#ffd0a8', '#f2a08e', '#8a7fa8', '#3c4470']
const ca = new THREE.Color()
const cb = new THREE.Color()

function Clouds() {
  const textures = useMemo(() => [1, 2, 3].map(cloudTexture), [])
  const clouds = useMemo(() => {
    const r = rng(91)
    return Array.from({ length: 11 }, (_, i) => {
      const a = -Math.PI * 0.85 + (i / 10) * Math.PI * 0.75 + (r() - 0.5) * 0.2
      const d = 150 + r() * 60
      return {
        pos: new THREE.Vector3(Math.cos(a) * d, 28 + r() * 34, Math.sin(a) * d),
        scale: 55 + r() * 45,
        tex: i % 3,
        speed: 0.4 + r() * 0.6,
      }
    })
  }, [])
  const mats = useMemo(
    () =>
      clouds.map(
        (c) =>
          new THREE.MeshBasicMaterial({
            map: textures[c.tex],
            transparent: true,
            depthWrite: false,
            fog: false,
            toneMapped: true,
          }),
      ),
    [clouds, textures],
  )
  const refs = useRef<THREE.Mesh[]>([])

  useFrame(({ camera, clock }) => {
    const f = world.t * (CLOUD_COLORS.length - 1)
    const i = Math.min(CLOUD_COLORS.length - 2, Math.floor(f))
    ca.set(CLOUD_COLORS[i]).lerp(cb.set(CLOUD_COLORS[i + 1]), f - i)
    const t = clock.elapsedTime
    refs.current.forEach((m, k) => {
      if (!m) return
      const c = clouds[k]
      m.position.set(c.pos.x + Math.sin(t * 0.01 * c.speed + k) * 8, c.pos.y, c.pos.z)
      m.lookAt(camera.position.x, m.position.y, camera.position.z)
      mats[k].color.copy(ca)
      mats[k].opacity = 0.95 - world.t * 0.45
    })
  })

  return (
    <group>
      {clouds.map((c, k) => (
        <mesh
          key={k}
          ref={(m) => {
            if (m) refs.current[k] = m
          }}
          material={mats[k]}
          scale={[c.scale, c.scale * 0.5, 1]}
          renderOrder={-1}
        >
          <planeGeometry />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Hạt bụi vàng lơ lửng trong nắng chiều, chuyển thành đom đóm khi trời tối.
 */
function Motes() {
  const COUNT = 180
  const data = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: COUNT }, () => ({
      x: (r() - 0.5) * 34,
      y: 0.3 + r() * 3.2,
      z: (r() - 0.5) * 34,
      ph: r() * 10,
      sp: 0.3 + r() * 0.7,
    }))
  }, [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    return g
  }, [])
  const day = useMemo(() => new THREE.Color('#ffd9a0'), [])
  const night = useMemo(() => new THREE.Color('#d6ff8a'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const n = THREE.MathUtils.smoothstep(world.t, 0.45, 0.85)
    const pos = geo.attributes.position.array as Float32Array
    const col = geo.attributes.color.array as Float32Array
    tmp.copy(day).lerp(night, n)
    data.forEach((d, i) => {
      pos[i * 3] = d.x + Math.sin(t * 0.2 * d.sp + d.ph) * 1.2
      pos[i * 3 + 1] = d.y + Math.sin(t * 0.5 * d.sp + d.ph * 2) * 0.35
      pos[i * 3 + 2] = d.z + Math.cos(t * 0.17 * d.sp + d.ph) * 1.2
      // ban ngày lấp lánh nhẹ; ban đêm nhấp nháy như đom đóm
      const blinkDay = 0.35 + 0.25 * Math.sin(t * 1.3 + d.ph * 3)
      const blinkNight = Math.max(0, Math.sin(t * (0.8 + d.sp) + d.ph * 5)) ** 3 * 2.4
      const b = blinkDay * (1 - n) + blinkNight * n
      col[i * 3] = tmp.r * b
      col[i * 3 + 1] = tmp.g * b
      col[i * 3 + 2] = tmp.b * b
    })
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.13}
        map={dotTexture()}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

export function Sky3D() {
  return (
    <>
      <Clouds />
      <Motes />
    </>
  )
}
