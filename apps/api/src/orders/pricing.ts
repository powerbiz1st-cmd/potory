// 가격표. 화면(apps/shop/src/design.ts)과 같은 값이어야 합니다.
// 금액은 서버에서 다시 계산합니다 (화면에서 보낸 금액은 믿지 않음).
export const SHAPES = { classic: 13900, round: 15900, cylinder: 12900, square: 14900 } as const
export const PATTERNS = { none: 0, stripe: 2000, dots: 2000, wave: 2000, check: 2000 } as const
export const PLANTS = { sprout: 0, succulent: 4000, flower: 6000, monstera: 12000 } as const
export const TEXT_PRICE = 3000
export const TEXT_MAX = 10

export type Shape = keyof typeof SHAPES
export type Pattern = keyof typeof PATTERNS
export type Plant = keyof typeof PLANTS

export function priceOf(d: { shape: Shape; pattern: Pattern; plant: Plant; text: string }) {
  return SHAPES[d.shape] + PATTERNS[d.pattern] + PLANTS[d.plant] + (d.text.trim() ? TEXT_PRICE : 0)
}
