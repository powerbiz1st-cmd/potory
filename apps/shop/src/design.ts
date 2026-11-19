// 고객이 만드는 "화분 디자인" 한 개의 모양. 나중에 API·관리자 화면과 공유할 타입입니다.
export type Shape = 'classic' | 'round' | 'cylinder' | 'square'
export type Pattern = 'none' | 'stripe' | 'dots' | 'wave' | 'check'
export type Plant = 'sprout' | 'succulent' | 'flower' | 'monstera'

export interface Design {
  shape: Shape
  color: string
  accent: string
  pattern: Pattern
  text: string
  textColor: string
  plant: Plant
}

export const SHAPES: { id: Shape; label: string; price: number }[] = [
  { id: 'classic', label: '클래식', price: 13900 },
  { id: 'round', label: '동글이', price: 15900 },
  { id: 'cylinder', label: '원통', price: 12900 },
  { id: 'square', label: '네모', price: 14900 },
]

export const COLORS: { hex: string; name: string }[] = [
  { hex: '#B8FF00', name: '라임' },
  { hex: '#FF7A1A', name: '오렌지' },
  { hex: '#FFD60A', name: '레몬' },
  { hex: '#4FC8FF', name: '스카이' },
  { hex: '#2F3BA8', name: '인디고' },
  { hex: '#FF6F7D', name: '코랄' },
  { hex: '#F4EEDC', name: '크림' },
  { hex: '#0B4A0A', name: '포레스트' },
]

export const PATTERNS: { id: Pattern; label: string; price: number }[] = [
  { id: 'none', label: '민무늬', price: 0 },
  { id: 'stripe', label: '줄무늬', price: 2000 },
  { id: 'dots', label: '도트', price: 2000 },
  { id: 'wave', label: '물결', price: 2000 },
  { id: 'check', label: '체크', price: 2000 },
]

export const PLANTS: { id: Plant; label: string; desc: string; price: number }[] = [
  { id: 'sprout', label: '새싹 키트', desc: '바질 · 7일이면 싹이 나요', price: 0 },
  { id: 'succulent', label: '다육이', desc: '물은 한 달에 한 번', price: 4000 },
  { id: 'flower', label: '꽃 키트', desc: '데이지 · 선물용 추천', price: 6000 },
  { id: 'monstera', label: '몬스테라', desc: '큼직한 잎 · 인테리어용 인기', price: 12000 },
]

export const TEXT_PRICE = 3000
export const TEXT_MAX = 10

export const DEFAULT_DESIGN: Design = {
  shape: 'classic',
  color: '#FF7A1A',
  accent: '#FFD60A',
  pattern: 'stripe',
  text: 'MY POT',
  textColor: '#0B4A0A',
  plant: 'sprout',
}

export function priceOf(d: Design) {
  const shape = SHAPES.find((s) => s.id === d.shape)!.price
  const pattern = PATTERNS.find((p) => p.id === d.pattern)!.price
  const plant = PLANTS.find((p) => p.id === d.plant)!.price
  const text = d.text.trim() ? TEXT_PRICE : 0
  return { shape, pattern, plant, text, total: shape + pattern + plant + text }
}

export const won = (n: number) => n.toLocaleString('ko-KR') + '원'

// 디자인을 URL에 담아 공유 (flority의 "Send to someone"에서 착안)
// URL에 그대로 넣을 수 있게 base64url(+→-, /→_, = 제거) 사용
export function encodeDesign(d: Design) {
  return btoa(encodeURIComponent(JSON.stringify(d))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function decodeDesign(s: string | null): Design | null {
  if (!s) return null
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    return { ...DEFAULT_DESIGN, ...JSON.parse(decodeURIComponent(atob(b64))) }
  } catch {
    return null
  }
}

export function randomDesign(): Design {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
  const color = pick(COLORS).hex
  let accent = pick(COLORS).hex
  while (accent === color) accent = pick(COLORS).hex
  return {
    shape: pick(SHAPES).id,
    color,
    accent,
    pattern: pick(PATTERNS).id,
    text: pick(['MY POT', '초록이', 'HELLO', '쑥쑥', 'GROW!', '봄이']),
    textColor: pick(['#0B4A0A', '#FFFFFF', '#191919']),
    plant: pick(PLANTS).id,
  }
}
