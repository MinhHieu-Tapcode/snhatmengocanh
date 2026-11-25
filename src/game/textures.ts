import * as THREE from 'three'

/** Bộ sinh số ngẫu nhiên cố định để thế giới luôn giống nhau mỗi lần mở. */
export const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

let grass: THREE.CanvasTexture | null = null
export function grassTexture() {
  if (grass) return grass
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#7c9a48'
  g.fillRect(0, 0, 256, 256)
  const r = rng(7)
  const tones = ['#86a350', '#6f8c3e', '#91aa58', '#738f43', '#9bb062', '#68853a']
  for (let i = 0; i < 900; i++) {
    g.fillStyle = tones[Math.floor(r() * tones.length)]
    g.globalAlpha = 0.25 + r() * 0.35
    const x = r() * 256
    const y = r() * 256
    const s = 4 + r() * 18
    g.beginPath()
    g.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1
  grass = new THREE.CanvasTexture(c)
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping
  grass.repeat.set(40, 40)
  grass.colorSpace = THREE.SRGBColorSpace
  grass.anisotropy = 4
  return grass
}

let beam: THREE.CanvasTexture | null = null
/** Dải sáng mờ dần lên trên, dùng cho cột sáng chỉ đường. */
export function beamTexture() {
  if (beam) return beam
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0, 0, 0, 128)
  grd.addColorStop(0, 'rgba(255,255,255,0)')
  grd.addColorStop(0.6, 'rgba(255,255,255,0.35)')
  grd.addColorStop(1, 'rgba(255,255,255,1)')
  g.fillStyle = grd
  g.fillRect(0, 0, 4, 128)
  beam = new THREE.CanvasTexture(c)
  return beam
}

let dot: THREE.CanvasTexture | null = null
/** Đốm sáng tròn mềm cho pháo hoa và lấp lánh. */
export function dotTexture() {
  if (dot) return dot
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.8)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  dot = new THREE.CanvasTexture(c)
  return dot
}

let roof: THREE.CanvasTexture | null = null
/** Ngói đất nung xếp lớp. */
export function roofTexture() {
  if (roof) return roof
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#9c442e'
  g.fillRect(0, 0, 256, 256)
  const r = rng(13)
  const rowH = 32
  const tileW = 32
  for (let row = 0; row < 256 / rowH; row++) {
    const off = row % 2 ? tileW / 2 : 0
    for (let x = -tileW; x < 256 + tileW; x += tileW) {
      const tone = 0.85 + r() * 0.3
      const grd = g.createLinearGradient(0, row * rowH, 0, row * rowH + rowH)
      grd.addColorStop(0, `rgb(${170 * tone},${78 * tone},${52 * tone})`)
      grd.addColorStop(0.75, `rgb(${196 * tone},${96 * tone},${64 * tone})`)
      grd.addColorStop(1, `rgb(${110 * tone},${46 * tone},${32 * tone})`)
      g.fillStyle = grd
      g.beginPath()
      g.roundRect(x + off + 1.5, row * rowH, tileW - 3, rowH - 2, [0, 0, 12, 12])
      g.fill()
    }
  }
  roof = new THREE.CanvasTexture(c)
  roof.wrapS = roof.wrapT = THREE.RepeatWrapping
  roof.colorSpace = THREE.SRGBColorSpace
  roof.anisotropy = 4
  return roof
}

let plaster: THREE.CanvasTexture | null = null
/** Tường vữa sơn màu kem, có vệt loang nhẹ. */
export function plasterTexture() {
  if (plaster) return plaster
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#f2e4cb'
  g.fillRect(0, 0, 256, 256)
  const r = rng(29)
  for (let i = 0; i < 260; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(200,170,130,0.06)' : 'rgba(255,255,245,0.08)'
    const s = 6 + r() * 40
    g.beginPath()
    g.arc(r() * 256, r() * 256, s, 0, Math.PI * 2)
    g.fill()
  }
  // vệt mưa mờ phía dưới
  const grd = g.createLinearGradient(0, 180, 0, 256)
  grd.addColorStop(0, 'rgba(150,120,90,0)')
  grd.addColorStop(1, 'rgba(150,120,90,0.12)')
  g.fillStyle = grd
  g.fillRect(0, 180, 256, 76)
  plaster = new THREE.CanvasTexture(c)
  plaster.wrapS = plaster.wrapT = THREE.RepeatWrapping
  plaster.colorSpace = THREE.SRGBColorSpace
  return plaster
}

let stone: THREE.CanvasTexture | null = null
export function stoneTexture() {
  if (stone) return stone
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#cbbda6'
  g.fillRect(0, 0, 64, 64)
  const r = rng(3)
  for (let i = 0; i < 120; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(90,75,60,0.12)' : 'rgba(255,250,235,0.15)'
    g.fillRect(r() * 64, r() * 64, 1 + r() * 3, 1 + r() * 3)
  }
  stone = new THREE.CanvasTexture(c)
  stone.colorSpace = THREE.SRGBColorSpace
  return stone
}
