import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { debug, player } from './runtime'
import { GIFT_SPOT } from './layout'
import { useGame } from '../store'

const desired = new THREE.Vector3()
const lookTarget = new THREE.Vector3()

/**
 * Camera theo sau nhân vật với hướng nhìn cố định về phía ngôi nhà.
 * Không xoay theo nhân vật để "kéo lên = đi tới" luôn đúng, mẹ không bị rối.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const look = useRef(new THREE.Vector3(0, 1, 0))
  const finaleDone = useRef(false)

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = useGame.getState()
    const t = clock.elapsedTime
    // Màn hình dọc hẹp: lùi camera xa hơn một chút để thấy đủ cảnh
    const portrait = size.height > size.width
    const back = portrait ? 1.18 : 1
    let k = 2.6

    if (debug.inspect) {
      const { yaw, dist, h } = debug.inspect
      camera.position.set(player.pos.x + Math.sin(yaw) * dist, h, player.pos.z + Math.cos(yaw) * dist)
      camera.lookAt(player.pos.x, h, player.pos.z)
      return
    }

    if (s.phase === 'title') {
      const a = -0.35 + Math.sin(t * 0.08) * 0.35
      desired.set(Math.sin(a) * 24, 9 + Math.sin(t * 0.13) * 1.2, 6 + Math.cos(a) * 18)
      lookTarget.set(0, 2.5, -4)
      k = 0.8
    } else if (s.phase === 'finale' || s.phase === 'letter') {
      const ft = (performance.now() - s.finaleAt) / 1000
      if (s.phase === 'finale' && ft < 2.6) {
        // cận cảnh hộp quà
        desired.set(GIFT_SPOT[0] - 2.4, 2.1, GIFT_SPOT[1] + 4.2)
        lookTarget.set(GIFT_SPOT[0], 0.9, GIFT_SPOT[1])
        k = 1.6
      } else {
        // từ từ nâng lên, nhìn bầu trời pháo hoa phía trên ngôi nhà
        const drift = Math.sin(t * 0.1) * 0.8
        desired.set(13 + drift, 2.4, -1)
        lookTarget.set(3, 9.5, -20)
        k = 0.55
      }
      if (s.phase === 'letter') k = 0.4
      if (!finaleDone.current && ft > 6.2 && s.phase === 'finale') {
        finaleDone.current = true
        s.setFinaleReady()
      }
    } else {
      finaleDone.current = false
      const close = s.phase === 'memory' ? 0.72 : 1
      desired.set(player.pos.x * 0.92, 5.0 * close * back, player.pos.z + 8.0 * close * back)
      lookTarget.set(player.pos.x * 0.96, 1.0, player.pos.z - 2.6)
      k = s.phase === 'guide' ? 1.4 : 3
    }

    const f = 1 - Math.exp(-k * dt)
    camera.position.lerp(desired, f)
    look.current.lerp(lookTarget, f)
    camera.lookAt(look.current)
  })
  return null
}
