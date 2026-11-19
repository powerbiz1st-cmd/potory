// 고객이 만드는 "화분 디자인" 한 개의 모양. API(apps/api/src/orders/pricing.ts)와 값을 맞춰야 합니다.
export type Shape = 'cylinder' | 'tapered' | 'round' | 'glass'
export type Pattern = 'none' | 'stripe' | 'dots' | 'wave' | 'check'
export type Plant = 'monstera'

export interface Design {
  shape: Shape
  color: string
  accent: string
  pattern: Pattern
  text: string
  textColor: string
  plant: Plant
}

export const SHAPES: { id: Shape; label: string; desc: string; price: number }[] = [
  { id: 'cylinder', label: '실린더', desc: '곧게 뻗은 기본형', price: 13900 },
  { id: 'tapered', label: '테이퍼', desc: '아래로 좁아지는 실루엣', price: 14900 },
  { id: 'round', label: '라운드', desc: '둥근 볼 형태', price: 15900 },
  { id: 'glass', label: '글라스', desc: '투명 유리 · 흙층이 보여요', price: 19900 },
]

// 유약 느낌의 차분한 색 위주 + 브랜드 라임 하나
export const COLORS: { hex: string; name: string; dark?: boolean }[] = [
  { hex: '#F2F0EB', name: '화이트' },
  { hex: '#DCD3C3', name: '샌드' },
  { hex: '#C46A43', name: '테라코타' },
  { hex: '#A3B19A', name: '세이지' },
  { hex: '#8FA9BF', name: '포그 블루' },
  { hex: '#2F4A3A', name: '포레스트', dark: true },
  { hex: '#2A2A2A', name: '차콜', dark: true },
  { hex: '#B8FF00', name: '라임' },
]

export const PATTERNS: { id: Pattern; label: string; price: number }[] = [
  { id: 'none', label: '민무늬', price: 0 },
  { id: 'stripe', label: '라인', price: 2000 },
  { id: 'dots', label: '도트', price: 2000 },
  { id: 'wave', label: '웨이브', price: 2000 },
  { id: 'check', label: '체크', price: 2000 },
]

// 식물은 몬스테라 하나로 고정 (모든 화분에 기본 포함)
export const PLANT = { id: 'monstera' as Plant, label: '몬스테라', price: 12000 }

export const TEXT_PRICE = 3000
export const TEXT_MAX = 10

export const DEFAULT_DESIGN: Design = {
  shape: 'cylinder',
  color: '#F2F0EB',
  accent: '#2F4A3A',
  pattern: 'none',
  text: '',
  textColor: '#2F4A3A',
  plant: 'monstera',
}

export function priceOf(d: Design) {
  const shape = SHAPES.find((s) => s.id === d.shape)!.price
  const pattern = PATTERNS.find((p) => p.id === d.pattern)!.price
  const plant = PLANT.price
  const text = d.text.trim() ? TEXT_PRICE : 0
  return { shape, pattern, plant, text, total: shape + pattern + plant + text }
}

export const won = (n: number) => n.toLocaleString('ko-KR') + '원'
export const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 110
}

// 예전 링크(없어진 모양·식물)도 열리도록 보정
const OLD_SHAPES: Record<string, Shape> = { classic: 'tapered', square: 'cylinder' }
export function normalizeDesign(d: Design): Design {
  const shape = (OLD_SHAPES[d.shape] ?? d.shape) as Shape
  return {
    ...d,
    shape: SHAPES.some((s) => s.id === shape) ? shape : DEFAULT_DESIGN.shape,
    pattern: PATTERNS.some((p) => p.id === d.pattern) ? d.pattern : 'none',
    plant: 'monstera',
  }
}

// 디자인을 URL에 담아 공유. URL에 그대로 넣을 수 있게 base64url(+→-, /→_, = 제거) 사용
export function encodeDesign(d: Design) {
  return btoa(encodeURIComponent(JSON.stringify(d))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function decodeDesign(s: string | null): Design | null {
  if (!s) return null
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    return normalizeDesign({ ...DEFAULT_DESIGN, ...JSON.parse(decodeURIComponent(atob(b64))) })
  } catch {
    return null
  }
}

export function randomDesign(): Design {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
  const color = pick(COLORS)
  let accent = pick(COLORS)
  while (accent.hex === color.hex) accent = pick(COLORS)
  const pattern = Math.random() < 0.5 ? 'none' : pick(PATTERNS).id
  return {
    shape: pick(SHAPES).id,
    color: color.hex,
    accent: accent.hex,
    pattern,
    text: Math.random() < 0.6 ? '' : pick(['MONSTERA', 'GREEN', 'HOME', '초록', 'LEAF']),
    textColor: isDark(color.hex) ? '#F2F0EB' : '#2F4A3A',
    plant: 'monstera',
  }
}
