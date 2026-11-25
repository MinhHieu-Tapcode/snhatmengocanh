import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { rng } from './textures'

export type Blob = { pos: [number, number, number]; r: number }

/**
 * Tán lá kiểu tranh vẽ: gộp nhiều khối cầu thành một khối, rồi cho pháp tuyến
 * toả ra từ trục giữa tán. Cả tán được chiếu sáng như một khối mềm mại
 * (phong cách phim hoạt hình Ghibli) thay vì từng khối đa giác rời rạc.
 */
export function crownGeometry(
  blobs: Blob[],
  seed: number,
  bottom = '#4e6e2c',
  top = '#a6c160',
  detail = 2,
) {
  const parts = blobs.map((b) => {
    const g = new THREE.IcosahedronGeometry(b.r, detail)
    g.translate(b.pos[0], b.pos[1], b.pos[2])
    g.deleteAttribute('uv')
    return g
  })
  const geo = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())

  const pos = geo.attributes.position as THREE.BufferAttribute
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  const minY = bb.min.y
  const maxY = bb.max.y
  const cx = (bb.min.x + bb.max.x) / 2
  const cz = (bb.min.z + bb.max.z) / 2
  const halfW = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2
  // trục giữa tán: từ đáy đến đỉnh, chừa nửa bề ngang để pháp tuyến đỉnh tròn trịa
  const axisLo = minY + Math.min(halfW, (maxY - minY) / 2)
  const axisHi = maxY - Math.min(halfW, (maxY - minY) / 2)

  const r = rng(seed)
  const normals = new Float32Array(pos.count * 3)
  const colors = new Float32Array(pos.count * 3)
  const cBottom = new THREE.Color(bottom)
  const cTop = new THREE.Color(top)
  const c = new THREE.Color()
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  // cùng một đỉnh xuất hiện nhiều lần (lưới không đánh chỉ số): nhớ độ lệch theo vị trí
  const jitterCache = new Map<string, number>()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const ay = THREE.MathUtils.clamp(v.y, axisLo, axisHi)
    n.set(v.x - cx, v.y - ay, v.z - cz).normalize()

    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`
    let j = jitterCache.get(key)
    if (j === undefined) {
      j = (r() - 0.5) * 0.09
      jitterCache.set(key, j)
    }
    v.addScaledVector(n, j)
    pos.setXYZ(i, v.x, v.y, v.z)
    normals.set([n.x, n.y, n.z], i * 3)

    const k = THREE.MathUtils.clamp((v.y - minY) / (maxY - minY), 0, 1)
    c.copy(cBottom).lerp(cTop, Math.pow(k, 0.8))
    // mặt hướng lên sáng hơn một chút, như nắng rọi tán lá
    c.multiplyScalar(0.9 + Math.max(0, n.y) * 0.15)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  pos.needsUpdate = true
  return geo
}

let foliageMat: THREE.MeshStandardMaterial | null = null
export function foliageMaterial() {
  if (foliageMat) return foliageMat
  foliageMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })
  return foliageMat
}
