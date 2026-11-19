import { DEFAULT_DESIGN, normalizeDesign, type Design } from '@shop/design'

// POTORY API (관리자용). 토큰은 브라우저 탭을 닫으면 사라지는 sessionStorage에만 보관
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || `${location.protocol}//${location.hostname}:3000`

export type OrderStatus = 'RECEIVED' | 'MAKING' | 'SHIPPED' | 'CANCELED'

export interface AdminOrder {
  id: number
  no: string
  name: string
  phone: string // 숫자만 (01012345678)
  design: Design
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  events: { id: number; status: OrderStatus; note: string | null; createdAt: string }[]
}

export interface StockItem {
  sku: string
  name: string
  qty: number
  threshold: number
  updatedAt: string
}

const KEY = 'potory.adminToken'
export const getToken = () => {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}
export const setToken = (t: string | null) => {
  try {
    if (t) sessionStorage.setItem(KEY, t)
    else sessionStorage.removeItem(KEY)
  } catch {
    /* 저장 불가 환경 */
  }
}

export class AuthError extends Error {}

async function call<T>(path: string, init?: RequestInit, token = getToken()): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_URL + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token ?? '', ...init?.headers },
    })
  } catch {
    throw new Error('API 서버에 연결할 수 없어요')
  }
  if (res.status === 401) throw new AuthError('관리자 토큰이 맞지 않아요')
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const m = body?.message
    throw new Error(Array.isArray(m) ? m[0] : m || '요청 실패')
  }
  return body as T
}

const fix = (o: AdminOrder): AdminOrder => ({ ...o, design: normalizeDesign({ ...DEFAULT_DESIGN, ...o.design }) })

export const api = {
  login: (token: string) => call<{ ok: true }>('/admin/orders/ping', undefined, token),
  // 예전 모양(classic·square)으로 들어온 주문도 새 모양으로 보정해서 표시
  orders: () => call<AdminOrder[]>('/admin/orders').then((l) => l.map(fix)),
  setStatus: (no: string, status: OrderStatus, note?: string) =>
    call<AdminOrder>(`/admin/orders/${encodeURIComponent(no)}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }).then(fix),
  stock: () => call<StockItem[]>('/admin/stock'),
  adjustStock: (sku: string, delta: number) => call<StockItem>(`/admin/stock/${encodeURIComponent(sku)}`, { method: 'PATCH', body: JSON.stringify({ delta }) }),
}

export const STATUS: Record<OrderStatus, { label: string; next?: OrderStatus; action?: string; tone: string }> = {
  RECEIVED: { label: '접수', next: 'MAKING', action: '제작 시작', tone: 'bg-lime text-forest' },
  MAKING: { label: '제작 중', next: 'SHIPPED', action: '출고 처리', tone: 'bg-amber-100 text-amber-900' },
  SHIPPED: { label: '출고 완료', tone: 'bg-forest text-white' },
  CANCELED: { label: '취소', tone: 'bg-muted text-muted-foreground' },
}

export const fmtPhone = (p: string) => p.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
