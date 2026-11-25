import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { HOUSE, PORCH } from './layout'
import { world } from './runtime'
import { plasterTexture, roofTexture } from './textures'

const TRIM = '#fbf6ec'
const ROOF = '#b5563b'
const WOOD = '#6b4430'

/** Mái chóp 4 mặt. */
function HipRoof({ w, d, h, y }: { w: number; d: number; h: number; y: number }) {
  const map = useMemo(() => {
    const t = roofTexture().clone()
    t.repeat.set(Math.round(w * 1.1), Math.round(h * 3.2))
    t.needsUpdate = true
    return t
  }, [w, h])
  return (
    <mesh position={[0, y + h / 2, 0]} scale={[w, h, d]} rotation-y={Math.PI / 4} castShadow receiveShadow>
      <coneGeometry args={[Math.SQRT1_2, 1, 4, 1]} />
      <meshStandardMaterial map={map} color="#e6cfc2" roughness={0.75} flatShading />
    </mesh>
  )
}

function useWallMaterial() {
  return useMemo(() => {
    const t = plasterTexture().clone()
    t.repeat.set(2, 1)
    t.needsUpdate = true
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 })
  }, [])
}

function Window({
  pos,
  size,
  ry = 0,
  glass,
  flowerBox = false,
}: {
  pos: [number, number, number]
  size: [number, number]
  ry?: number
  glass: THREE.Material
  flowerBox?: boolean
}) {
  const [w, h] = size
  return (
    <group position={pos} rotation-y={ry}>
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[w + 0.22, h + 0.22, 0.1]} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.075]} material={glass}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[0.06, h, 0.03]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>
      <mesh position={[0, h * 0.1, 0.09]}>
        <boxGeometry args={[w, 0.06, 0.03]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>
      {/* cửa chớp */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 + 0.32), 0, 0.05]} castShadow>
          <boxGeometry args={[0.36, h + 0.1, 0.05]} />
          <meshStandardMaterial color="#7e9a8a" roughness={0.8} />
        </mesh>
      ))}
      {flowerBox && (
        <group position={[0, -h / 2 - 0.2, 0.2]}>
          <mesh castShadow>
            <boxGeometry args={[w + 0.2, 0.22, 0.3]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[-w / 2 + (i / 6) * w, 0.17, (i % 2) * 0.06 - 0.03]}>
              <icosahedronGeometry args={[0.1 + (i % 3) * 0.02, 0]} />
              <meshStandardMaterial color={['#f39bb2', '#fff4e6', '#f7b6c8'][i % 3]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

export function House() {
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3d4a5a',
        emissive: '#ffbf73',
        emissiveIntensity: 0.15,
        roughness: 0.2,
        metalness: 0.1,
      }),
    [],
  )
  const wallMat = useWallMaterial()
  const porchLamp = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffb050', emissiveIntensity: 0.4 }),
    [],
  )

  useFrame(() => {
    const n = THREE.MathUtils.smoothstep(world.t, 0.15, 0.85)
    glass.emissiveIntensity = 0.12 + n * 2.4
    glass.color.setRGB(0.24 + n * 0.3, 0.29 + n * 0.2, 0.35)
    porchLamp.emissiveIntensity = 0.6 + n * 4
  })

  const { w, d, wallH } = HOUSE
  const front = d / 2
  const upW = 7.2
  const upD = 5.6
  const upH = 2.6

  return (
    <group position={[HOUSE.x, 0, HOUSE.z]}>
      {/* nền móng */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.3, 0.24, d + 0.3]} />
        <meshStandardMaterial color="#cbbba0" roughness={1} />
      </mesh>
      {/* tầng 1 */}
      <mesh position={[0, wallH / 2, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[w, wallH, d]} />
      </mesh>
      <mesh position={[0, wallH - 0.05, 0]} castShadow>
        <boxGeometry args={[w + 0.25, 0.18, d + 0.25]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>
      <HipRoof w={w + 1.2} d={d + 1.2} h={1.5} y={wallH + 0.05} />

      {/* tầng 2 */}
      <mesh position={[0, wallH + upH / 2, -0.4]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[upW, upH, upD]} />
      </mesh>
      <group position={[0, 0, -0.4]}>
        <HipRoof w={upW + 1.1} d={upD + 1.1} h={2.1} y={wallH + upH} />
      </group>
      {/* ống khói */}
      <mesh position={[2.3, wallH + upH + 1.3, -1.8]} castShadow>
        <boxGeometry args={[0.6, 1.8, 0.6]} />
        <meshStandardMaterial color="#c9a98a" roughness={1} />
      </mesh>

      {/* cửa chính */}
      <group position={[0, 0, front]}>
        <mesh position={[0, 1.2, 0.03]} castShadow>
          <boxGeometry args={[1.5, 2.5, 0.1]} />
          <meshStandardMaterial color={TRIM} />
        </mesh>
        <mesh position={[0, 1.15, 0.09]}>
          <boxGeometry args={[1.2, 2.2, 0.06]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
        <mesh position={[0.42, 1.1, 0.14]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color="#d8b45a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* đèn hiên */}
        <mesh position={[-0.95, 2.05, 0.18]} material={porchLamp}>
          <boxGeometry args={[0.16, 0.26, 0.16]} />
        </mesh>
        <mesh position={[0.95, 2.05, 0.18]} material={porchLamp}>
          <boxGeometry args={[0.16, 0.26, 0.16]} />
        </mesh>
      </group>

      {/* cửa sổ tầng 1 */}
      <Window pos={[-3.4, 1.75, front]} size={[1.4, 1.5]} glass={glass} flowerBox />
      <Window pos={[3.4, 1.75, front]} size={[1.4, 1.5]} glass={glass} flowerBox />
      <Window pos={[w / 2, 1.75, -1.5]} ry={Math.PI / 2} size={[1.3, 1.4]} glass={glass} />
      <Window pos={[w / 2, 1.75, 1.8]} ry={Math.PI / 2} size={[1.3, 1.4]} glass={glass} />
      <Window pos={[-w / 2, 1.75, -1.5]} ry={-Math.PI / 2} size={[1.3, 1.4]} glass={glass} />
      <Window pos={[-w / 2, 1.75, 1.8]} ry={-Math.PI / 2} size={[1.3, 1.4]} glass={glass} />
      {/* cửa sổ tầng 2 */}
      {[-2.2, 0, 2.2].map((x) => (
        <Window key={x} pos={[x, wallH + 1.35, -0.4 + upD / 2]} size={[1, 1.2]} glass={glass} />
      ))}
      <Window pos={[upW / 2, wallH + 1.35, -0.4]} ry={Math.PI / 2} size={[1, 1.2]} glass={glass} />
      <Window pos={[-upW / 2, wallH + 1.35, -0.4]} ry={-Math.PI / 2} size={[1, 1.2]} glass={glass} />

      {/* hiên trước */}
      <group position={[PORCH.x - HOUSE.x, 0, PORCH.z - HOUSE.z]}>
        <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
          <boxGeometry args={[PORCH.w, 0.32, PORCH.d]} />
          <meshStandardMaterial color="#b58a63" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.08, PORCH.d / 2 + 0.25]} receiveShadow castShadow>
          <boxGeometry args={[2.2, 0.16, 0.5]} />
          <meshStandardMaterial color="#c6a07a" roughness={0.9} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * (PORCH.w / 2 - 0.2), 0, PORCH.d / 2 - 0.2]}>
            <mesh position-y={1.45} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 2.3, 10]} />
              <meshStandardMaterial color={TRIM} />
            </mesh>
            {/* hoa hồng leo quấn quanh cột */}
            {Array.from({ length: 22 }, (_, i) => {
              const a = i * 0.9 + (s > 0 ? 1 : 0)
              const y = 0.4 + i * 0.1
              const leaf = i % 3 !== 0
              return (
                <mesh key={i} position={[Math.cos(a) * 0.13, y, Math.sin(a) * 0.13]} castShadow={!leaf}>
                  <icosahedronGeometry args={[leaf ? 0.07 : 0.06, leaf ? 0 : 1]} />
                  <meshStandardMaterial color={leaf ? '#5b7f35' : '#e86f86'} roughness={0.9} flatShading={leaf} />
                </mesh>
              )
            })}
          </group>
        ))}
        <mesh position={[0, 2.68, 0.05]} castShadow>
          <boxGeometry args={[PORCH.w + 0.4, 0.16, PORCH.d + 0.4]} />
          <meshStandardMaterial color={TRIM} />
        </mesh>
        <mesh position={[0, 2.92, 0.05]} rotation-x={-0.18} castShadow>
          <boxGeometry args={[PORCH.w + 0.6, 0.12, PORCH.d + 0.6]} />
          <meshStandardMaterial color={ROOF} roughness={0.85} />
        </mesh>
        {/* chậu cây hai bên cửa */}
        {[-1.6, 1.6].map((x) => (
          <group key={x} position={[x, 0.32, -0.3]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.18, 0.44, 10]} />
              <meshStandardMaterial color="#c97f5a" />
            </mesh>
            <mesh position={[0, 0.62, 0]} castShadow>
              <icosahedronGeometry args={[0.36, 1]} />
              <meshStandardMaterial color="#5f8236" flatShading />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
