import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { useGame, collectedCount } from '../store'
import { world } from './runtime'
import { audio } from '../audio/audio'

/** Mốc ánh sáng theo tiến trình: hoàng hôn vàng → hoàng hôn đỏ → chạng vạng → đêm. */
const KEYS = [
  {
    sunElev: 13, sun: '#ffd9a3', sunI: 3.6, sky: '#ffe6c4', ground: '#8a7448', hemiI: 1.35, fog: '#f2c99a',
    zenith: '#6f9bd2', mid: '#c9c4cf', horizon: '#ffd296', glow: '#fff1c9',
  },
  {
    sunElev: 8, sun: '#ffc283', sunI: 3.3, sky: '#ffd6ad', ground: '#7d6544', hemiI: 1.2, fog: '#efb688',
    zenith: '#6a86c4', mid: '#d6b3b5', horizon: '#ffb67a', glow: '#ffe0a8',
  },
  {
    sunElev: 3.5, sun: '#ffa165', sunI: 2.7, sky: '#f0b39b', ground: '#64503e', hemiI: 1.0, fog: '#d68c78',
    zenith: '#4f5d9e', mid: '#b98aa2', horizon: '#f78c62', glow: '#ffc27e',
  },
  {
    sunElev: -1, sun: '#e0846e', sunI: 1.4, sky: '#9a8db4', ground: '#3e3446', hemiI: 0.75, fog: '#6f6488',
    zenith: '#262f66', mid: '#5c4f84', horizon: '#c0717a', glow: '#e88a7a',
  },
  {
    sunElev: -8, sun: '#93a2de', sunI: 0.7, sky: '#5868a0', ground: '#24202f', hemiI: 0.6, fog: '#232745',
    zenith: '#080c26', mid: '#161b40', horizon: '#2c2f58', glow: '#2c2f58',
  },
]

const ca = new THREE.Color()
const cb = new THREE.Color()
const lerpColor = (out: THREE.Color, a: string, b: string, t: number) =>
  out.copy(ca.set(a)).lerp(cb.set(b), t)

export function targetTime() {
  const s = useGame.getState()
  if (s.phase === 'title' || s.phase === 'guide') return 0
  if (s.quest === 'bell') return 0
  if (s.quest === 'flowers') return 0.08 + collectedCount(s.collected) * 0.2
  if (s.quest === 'gift') return 0.78
  return 1
}

/** Vòm trời vẽ tay: chân trời vàng cam, đỉnh trời xanh dịu, quầng sáng mặt trời. */
function useSkyMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: {
          zenith: { value: new THREE.Color() },
          mid: { value: new THREE.Color() },
          horizon: { value: new THREE.Color() },
          glow: { value: new THREE.Color() },
          sunDir: { value: new THREE.Vector3(0, 0.2, -1) },
          sunVis: { value: 1 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 zenith; uniform vec3 mid; uniform vec3 horizon; uniform vec3 glow;
          uniform vec3 sunDir; uniform float sunVis;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, h));
            col = mix(col, zenith, smoothstep(0.15, 0.65, h));
            col = mix(col, horizon * 0.55, smoothstep(0.0, -0.25, h));
            float s = max(dot(d, normalize(sunDir)), 0.0);
            col += glow * (pow(s, 6.0) * 0.55 + pow(s, 40.0) * 0.6) * sunVis;
            col += glow * smoothstep(0.9993, 0.9997, s) * 1.6 * sunVis; // đĩa mặt trời
            // chút nhiễu để gradient không bị vằn
            float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
            col += (n - 0.5) / 255.0;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  )
}

export function Atmosphere() {
  const sunRef = useRef<THREE.DirectionalLight>(null!)
  const hemiRef = useRef<THREE.HemisphereLight>(null!)
  const scene = useThree((s) => s.scene)
  const phase = useGame((s) => s.phase)
  const sky = useSkyMaterial()
  const skyMesh = useRef<THREE.Mesh>(null!)

  if (!scene.fog) scene.fog = new THREE.Fog('#f2c99a', 45, 150)

  useFrame(({ camera }, dt) => {
    const target = targetTime()
    world.t += (target - world.t) * (1 - Math.exp(-dt * 0.6))
    audio.setNight(world.t)

    const f = world.t * (KEYS.length - 1)
    const i = Math.min(KEYS.length - 2, Math.floor(f))
    const k = f - i
    const A = KEYS[i]
    const B = KEYS[i + 1]

    const elev = THREE.MathUtils.degToRad(A.sunElev + (B.sunElev - A.sunElev) * k)
    const azim = THREE.MathUtils.degToRad(-128)
    const u = sky.uniforms
    u.sunDir.value.set(Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim))
    u.sunVis.value = THREE.MathUtils.smoothstep(elev, -0.08, 0.04)
    lerpColor(u.zenith.value, A.zenith, B.zenith, k)
    lerpColor(u.mid.value, A.mid, B.mid, k)
    lerpColor(u.horizon.value, A.horizon, B.horizon, k)
    lerpColor(u.glow.value, A.glow, B.glow, k)
    skyMesh.current.position.copy(camera.position)

    // Ánh sáng chính: sau khi mặt trời lặn chuyển thành ánh trăng ở trên cao
    const lightElev = Math.max(elev, THREE.MathUtils.degToRad(28) * Math.min(1, world.t * 1.6))
    const L = sunRef.current
    L.position.set(
      Math.cos(lightElev) * Math.sin(azim) * 40,
      Math.max(6, Math.sin(lightElev) * 40),
      Math.cos(lightElev) * Math.cos(azim) * 40,
    )
    lerpColor(L.color, A.sun, B.sun, k)
    L.intensity = A.sunI + (B.sunI - A.sunI) * k

    const H = hemiRef.current
    lerpColor(H.color, A.sky, B.sky, k)
    lerpColor(H.groundColor, A.ground, B.ground, k)
    H.intensity = (A.hemiI + (B.hemiI - A.hemiI) * k) * 0.7
    // ánh sáng môi trường dịu dần khi trời tối
    ;(scene as any).environmentIntensity = 0.6 - world.t * 0.4

    const fog = scene.fog as THREE.Fog
    lerpColor(fog.color, A.fog, B.fog, k)
  })

  return (
    <>
      <mesh ref={skyMesh} material={sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[400, 32, 16]} />
      </mesh>
      {(phase === 'finale' || phase === 'letter') && (
        <Stars radius={120} depth={40} count={1400} factor={4} saturation={0} fade speed={0.4} />
      )}
      <hemisphereLight ref={hemiRef} intensity={0.8} />
      <directionalLight
        ref={sunRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
    </>
  )
}
