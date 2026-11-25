import { Suspense, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
  N8AO,
  HueSaturation,
  BrightnessContrast,
  TiltShift2,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Atmosphere } from './Atmosphere'
import { World } from './World'
import { House } from './House'
import { Objectives } from './Objectives'
import { Player } from './Player'
import { CameraRig } from './CameraRig'
import { Fireworks } from './Fireworks'
import { Sky3D } from './SkyDetails'

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

/**
 * Ánh sáng môi trường dựng bằng các tấm sáng (không tải file HDR nào),
 * cho vật liệu có ánh phản chiếu ấm áp của buổi hoàng hôn.
 */
function SoftEnvironment() {
  return (
    <Environment resolution={64} frames={1} background={false}>
      <color attach="background" args={['#6d5f68']} />
      {/* bầu trời phía trên */}
      <Lightformer form="rect" intensity={1.2} color="#bcc6e6" position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
      {/* phía mặt trời lặn: cam ấm */}
      <Lightformer form="rect" intensity={3.2} color="#ffb070" position={[-12, 3, -9]} rotation-y={Math.PI / 3} scale={[16, 5, 1]} />
      {/* phía đối diện: hồng tím dịu */}
      <Lightformer form="rect" intensity={1.1} color="#e9a7b7" position={[12, 3, 9]} rotation-y={-Math.PI * 0.7} scale={[16, 6, 1]} />
      {/* phản xạ từ mặt cỏ */}
      <Lightformer form="rect" intensity={0.5} color="#8fa262" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[30, 30, 1]} />
    </Environment>
  )
}

export function Scene() {
  const [dpr, setDpr] = useState<number>(Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 1.75))
  // Chất lượng cao (bóng mờ tiếp xúc AO). Tự tắt nếu máy chạy không mượt.
  const [hq, setHq] = useState(true)

  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      dpr={dpr}
      camera={{ fov: 50, near: 0.3, far: 500, position: [18, 10, 24] }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          if (hq) setHq(false)
          else setDpr((d) => Math.max(1, d - 0.25))
        }}
        onIncline={() => setDpr((d) => Math.min(isMobile ? 2 : 1.75, d + 0.25))}
      />
      <AdaptiveDpr pixelated={false} />
      <SoftEnvironment />
      <Suspense fallback={null}>
        <Atmosphere />
        <Sky3D />
        <World />
        <House />
        <Objectives />
        <Player />
        <Fireworks />
        <CameraRig />
      </Suspense>
      {hq ? (
        <EffectComposer key="hq" multisampling={isMobile ? 2 : 4}>
          <N8AO halfRes aoRadius={0.9} intensity={1.3} distanceFalloff={0.4} color="#4a3038" quality="performance" />
          <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.88} luminanceSmoothing={0.2} radius={0.72} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <HueSaturation saturation={0.12} />
          <BrightnessContrast brightness={0.01} contrast={0.07} />
          {/* mép trên và dưới hơi nhoè: cảm giác một thế giới thu nhỏ */}
          <TiltShift2 blur={0.07} taper={0.32} start={[0, 0.45]} end={[1, 0.45]} samples={8} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      ) : (
        <EffectComposer key="lq" multisampling={0}>
          <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.88} luminanceSmoothing={0.2} radius={0.72} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <HueSaturation saturation={0.12} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
