import type { Design } from './design'

// 주문 저장/조회 → POTORY API
// 휴대폰에는 "내가 한 주문번호"만 저장해 두고(localStorage), 진행 상태는 매번 서버에서 받아옵니다.

export type OrderStatus = 'RECEIVED' | 'MAKING' | 'SHIPPED' | 'CANCELED'

export interface Order {
  no: string
  name: string // 서버에서 가려서 내려옴 (홍*동)
  phone: string // 010-****-5678
  design: Design
  total: number
  status: OrderStatus
  createdAt: string
  events: { status: OrderStatus; at: string }[]
}

// VITE_API_URL 이 없으면 "지금 접속한 주소의 3000번 포트" → 같은 와이파이 휴대폰에서도 동작
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || `${location.protocol}//${location.hostname}:3000`

// 갤러리 사진: 개발 중엔 public 폴더, 배포본(Pages)에선 API 로드밸런서가 이 PC 폴더에서 내보냄 (git에 안 올림)
export const galleryImg = (n: number) =>
  import.meta.env.PROD ? `${API_URL}/gallery/monstera-${n}.jpg` : `${import.meta.env.BASE_URL}gallery/monstera-${n}.jpg`

const KEY = 'potory.myOrders'
export const ORDERS_CHANGED = 'potory:orders-changed'

export class ApiError extends Error {}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_URL + path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  } catch {
    throw new ApiError('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const m = body?.message
    throw new ApiError(Array.isArray(m) ? m[0] : m || '요청을 처리하지 못했어요')
  }
  return body as T
}

// ---- 이 휴대폰에 저장된 주문번호 ----
export function myOrderNos(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function rememberNo(no: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([no, ...myOrderNos().filter((n) => n !== no)].slice(0, 50)))
    dispatchEvent(new Event(ORDERS_CHANGED))
  } catch {
    /* 사생활 보호 모드 등 저장 불가 → 이름+번호 조회로 찾으면 됨 */
  }
}

export const myOrderCount = () => myOrderNos().length

// ---- API ----
// key: 주문 시도 1번마다 고유값 (Idempotency-Key). 같은 키로 두 번 와도 서버는 주문을 하나만 만듦
export async function createOrder(input: { name: string; phone: string; design: Design }, key?: string) {
  const order = await api<Order>('/orders', { method: 'POST', body: JSON.stringify(input), headers: key ? { 'Idempotency-Key': key } : undefined })
  rememberNo(order.no)
  return order
}

export async function findOrder(no: string): Promise<Order | null> {
  try {
    return await api<Order>(`/orders/${encodeURIComponent(no.trim().toUpperCase())}`)
  } catch (e) {
    if (e instanceof ApiError && /찾을 수 없/.test(e.message)) return null
    throw e
  }
}

export async function myOrders(): Promise<Order[]> {
  const nos = myOrderNos()
  if (!nos.length) return []
  return api<Order[]>(`/orders?${nos.map((n) => `no=${encodeURIComponent(n)}`).join('&')}`)
}

// 주문번호를 잊었을 때: 이름 + 휴대폰 번호. 찾은 주문은 이 휴대폰 목록에도 추가
export async function lookupOrders(name: string, phone: string): Promise<Order[]> {
  const list = await api<Order[]>('/orders/lookup', { method: 'POST', body: JSON.stringify({ name, phone }) })
  list.forEach((o) => rememberNo(o.no))
  return list
}

export const STATUS_STEPS: { id: OrderStatus; label: string; desc: string }[] = [
  { id: 'RECEIVED', label: '주문 접수', desc: '제작지시서가 공방에 전달됐어요' },
  { id: 'MAKING', label: '제작 중', desc: '성형 · 유약 · 소성을 하고 있어요' },
  { id: 'SHIPPED', label: '출고 완료', desc: '택배사로 넘어갔어요' },
]

export const statusLabel = (s: OrderStatus) => (s === 'CANCELED' ? '주문 취소' : STATUS_STEPS.find((x) => x.id === s)!.label)
