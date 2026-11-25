/**
 * Bản đồ của khu vườn. Đơn vị: mét. Trục x: trái/phải, trục z: gần/xa
 * (z âm là phía ngôi nhà, xa camera).
 */
export type Vec2 = [number, number]

export const PLAYER_START: Vec2 = [0, 13]

/** Giới hạn đi lại (bên trong hàng rào). */
export const BOUNDS = { minX: -16.6, maxX: 16.6, minZ: -16.6, maxZ: 16.8 }

export const HOUSE = { x: 0, z: -9.5, w: 11, d: 8, wallH: 3.4 }
export const PORCH = { x: 0, z: -4.6, w: 6, d: 2.2 }

/** Vị trí các mục tiêu. */
export const BELL_SPOT: Vec2 = [0, -2.6]
export const FLOWERS: Vec2[] = [
  [-9.5, 8.5],
  [11.5, 3],
  [-11.5, -6],
]
export const GIFT_DECK = { x: 11, z: -9.5, w: 6, d: 5.5 }
export const GIFT_SPOT: Vec2 = [11, -10.2]

/** Cây trong vườn (có va chạm). */
export const TREES: { p: Vec2; s: number; kind: 0 | 1 }[] = [
  { p: [-14, 14], s: 1.15, kind: 0 },
  { p: [14.2, 14.5], s: 1.0, kind: 1 },
  { p: [-14.5, 2], s: 1.25, kind: 0 },
  { p: [15, -1.5], s: 0.95, kind: 1 },
  { p: [-13.5, -14], s: 1.2, kind: 1 },
  { p: [5.5, -15], s: 1.0, kind: 0 },
  { p: [-6, 4.5], s: 0.75, kind: 1 },
  { p: [6.5, 9.5], s: 0.85, kind: 0 },
]

/** Bụi hoa trang trí (có va chạm nhỏ). */
export const BUSHES: { p: Vec2; s: number; color: string }[] = [
  { p: [-3.2, -3.6], s: 0.8, color: '#f2a7b8' },
  { p: [3.4, -3.6], s: 0.8, color: '#f6c7d2' },
  { p: [-6.8, -4.5], s: 1, color: '#e98da5' },
  { p: [6.8, -4.6], s: 1, color: '#fbe3ea' },
  { p: [-8, 11.8], s: 0.9, color: '#f4b6c4' },
  { p: [9.5, 5.2], s: 0.9, color: '#fbe3ea' },
  { p: [12.5, 1.2], s: 0.7, color: '#e98da5' },
  { p: [-12.6, -4.2], s: 0.8, color: '#f6c7d2' },
  { p: [-10.6, 10], s: 0.6, color: '#fff1d6' },
  { p: [4.2, 15.6], s: 0.8, color: '#f2a7b8' },
  { p: [-4.4, 15.6], s: 0.8, color: '#f6c7d2' },
]

/**
 * Đèn lồng. `on` = số bông hoa cần nhặt để đèn sáng
 * (4 = sáng khi mở khoá hiên quà).
 */
export const LANTERNS: { p: Vec2; on: number }[] = [
  { p: [-1.9, 11], on: 1 },
  { p: [1.9, 11], on: 1 },
  { p: [-1.9, 5], on: 2 },
  { p: [1.9, 5], on: 2 },
  { p: [-1.9, -0.5], on: 3 },
  { p: [1.9, -0.5], on: 3 },
  { p: [5, -2.2], on: 3 },
  { p: [8, -5.6], on: 3 },
]

/** Đồ vật cho khu vườn có hơi ấm của một ngôi nhà có người ở. */
export const PROPS = {
  bench: { x: -4.6, z: 6.6, ry: Math.PI / 2 }, // ghế gỗ dưới gốc cây, nhìn ra lối đi
  mailbox: { x: 2.7, z: 16.2 },
  birdbath: { x: 6.2, z: 1.5 },
  cat: { x: 1.9, z: -4.3 }, // mèo ngủ trên hiên
  lavender: [
    { x0: -14.5, x1: -4.5, z: 15.5 },
    { x0: 4.5, x1: 14.5, z: 15.5 },
  ],
}

export type Circle = { x: number; z: number; r: number }
export type Box = { minX: number; maxX: number; minZ: number; maxZ: number }

export const circleColliders: Circle[] = [
  ...TREES.map((t) => ({ x: t.p[0], z: t.p[1], r: 0.55 * t.s })),
  ...BUSHES.map((b) => ({ x: b.p[0], z: b.p[1], r: 0.7 * b.s })),
  ...LANTERNS.map((l) => ({ x: l.p[0], z: l.p[1], r: 0.25 })),
  // hoa kỷ niệm và hộp quà: mẹ đứng cạnh chứ không đứng đè lên
  ...FLOWERS.map((f) => ({ x: f[0], z: f[1], r: 0.35 })),
  { x: GIFT_SPOT[0], z: GIFT_SPOT[1], r: 0.6 },
  { x: PROPS.mailbox.x, z: PROPS.mailbox.z, r: 0.3 },
  { x: PROPS.birdbath.x, z: PROPS.birdbath.z, r: 0.45 },
]

export const boxColliders: Box[] = [
  {
    minX: HOUSE.x - HOUSE.w / 2,
    maxX: HOUSE.x + HOUSE.w / 2,
    minZ: HOUSE.z - HOUSE.d / 2,
    maxZ: HOUSE.z + HOUSE.d / 2,
  },
  {
    minX: PORCH.x - PORCH.w / 2,
    maxX: PORCH.x + PORCH.w / 2,
    minZ: PORCH.z - PORCH.d / 2,
    maxZ: PORCH.z + PORCH.d / 2 - 0.3,
  },
  // Bàn ghế nhỏ trên hiên quà
  { minX: 12.6, maxX: 13.8, minZ: -8.6, maxZ: -7.6 },
  // ghế gỗ trong vườn
  { minX: PROPS.bench.x - 0.35, maxX: PROPS.bench.x + 0.35, minZ: PROPS.bench.z - 0.8, maxZ: PROPS.bench.z + 0.8 },
  // luống oải hương dọc hàng rào trước
  ...PROPS.lavender.map((l) => ({ minX: l.x0, maxX: l.x1, minZ: l.z - 0.35, maxZ: l.z + 0.35 })),
]
