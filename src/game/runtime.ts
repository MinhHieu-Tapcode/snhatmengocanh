import * as THREE from 'three'
import { PLAYER_START } from './layout'

/**
 * Trạng thái thay đổi mỗi khung hình. Để ngoài React/zustand
 * cho nhẹ, không gây render lại giao diện.
 */
export const input = {
  x: 0, // -1..1 trái/phải
  y: 0, // -1..1 lên (xa)/xuống (gần)
  joystickActive: false,
  keys: new Set<string>(),
}

export const player = {
  pos: new THREE.Vector3(PLAYER_START[0], 0, PLAYER_START[1]),
  facing: Math.PI, // nhìn về phía ngôi nhà
  speed: 0, // m/s hiện tại
  lastMoveAt: 0,
  hasMoved: false,
  actionAt: -9999, // thời điểm vừa tương tác (để vẫy tay)
}

/** Chỉ dùng khi phát triển: soi cận cảnh nhân vật. */
export const debug = { inspect: null as null | { yaw: number; dist: number; h: number } }

/** Thời gian trong ngày: 0 = hoàng hôn vàng, 1 = đêm. */
export const world = { t: 0 }

export const resetPlayer = () => {
  player.pos.set(PLAYER_START[0], 0, PLAYER_START[1])
  player.facing = Math.PI
  player.speed = 0
  player.lastMoveAt = performance.now()
  player.hasMoved = false
}
