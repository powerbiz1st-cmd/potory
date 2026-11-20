// POTORY API (운영 콘솔용). 관리자 토큰은 탭을 닫으면 사라지는 sessionStorage에만 보관
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || `${location.protocol}//${location.hostname}:3000`

export interface Stats {
  rangeDays: number
  today: { date: string; orders: number; revenue: number }
  period: { orders: number; revenue: number; canceled: number }
  avgOrderValue: number
  byDay: { date: string; orders: number; revenue: number }[]
  byStatus: Record<'RECEIVED' | 'MAKING' | 'SHIPPED' | 'CANCELED', number>
  byShape: { shape: string; count: number }[]
  leadTimeMin: { avg: number; count: number } | null
  lowStock: { sku: string; name: string; qty: number; threshold: number }[]
}

export interface SystemInfo {
  at: string
  api: { ok: boolean; uptimeSec: number; node: string; memoryMb: number; heapUsedMb: number }
  db: { ok: boolean; latencyMs: number; sizeMb?: number; connections?: number }
  host: { cpus: number; load1: number; memFreeMb: number; memTotalMb: number }
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
export class DownError extends Error {} // 서버에 아예 연결이 안 됨 (장애)

async function call<T>(path: string, token = getToken()): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000) // 4초 안에 답이 없으면 장애로 봄
  let res: Response
  try {
    res = await fetch(API_URL + path, { headers: { 'x-admin-token': token ?? '' }, signal: ctrl.signal })
  } catch {
    throw new DownError('API 서버에 연결할 수 없어요')
  } finally {
    clearTimeout(timer)
  }
  if (res.status === 401) throw new AuthError('관리자 토큰이 맞지 않아요')
  if (res.status >= 500) throw new DownError(`API 오류 (${res.status})`)
  if (!res.ok) throw new Error(`요청 실패 (${res.status})`)
  return res.json() as Promise<T>
}

export const api = {
  login: (token: string) => call<{ ok: true }>('/admin/orders/ping', token),
  stats: (days: number) => call<Stats>(`/admin/console/stats?days=${days}`),
  system: () => call<SystemInfo>('/admin/console/system'),
}

// ---- 장애 시연 (API의 /admin/chaos) ----
export interface ChaosState {
  enabled: boolean
  slow: { ms: number; leftSec: number }
  dbDown: { leftSec: number }
  errors: { rate: number; leftSec: number }
}
export type ChaosAction = 'slow' | 'db-down' | 'errors' | 'crash' | 'stock-low' | 'reset'

export async function chaosState(): Promise<ChaosState> {
  const res = await fetch(`${API_URL}/admin/chaos`, { headers: { 'x-admin-token': getToken() ?? '' }, signal: AbortSignal.timeout(3000) })
  if (!res.ok) throw new Error(`chaos ${res.status}`)
  return res.json()
}

export async function chaosRun(action: ChaosAction, body: Record<string, number> = {}) {
  const res = await fetch(`${API_URL}/admin/chaos/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() ?? '' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message ?? `실패 (${res.status})`)
  return json
}

// ---- watchdog (서비스 감시 · 메일 알림 · 백업) ----
export const WATCHDOG_URL = (import.meta.env.VITE_WATCHDOG_URL as string | undefined) || `${location.protocol}//${location.hostname}:3100`

export interface WatchStatus {
  at: string
  intervalSec: number
  mail: { mode: string; to: string }
  targets: { id: string; name: string; status: 'up' | 'down' | 'unknown'; lastMs: number | null; lastError: string | null; since: string | null }[]
  incidents: { id: string; name: string; type: 'up' | 'down'; at: string; error?: string; downForMs?: number }[]
  mails: { at: string; subject: string; to: string; ok: boolean; error: string | null }[]
  backup: { file: string; at: string; sizeKb: number; count: number } | null
}

// 1순위: API가 대신 받아다 주는 경로 (배포 시 외부에 열린 건 API 하나뿐)
// 2순위: 같은 네트워크에서 watchdog 직접 (API가 죽어 있을 때도 로컬에선 볼 수 있게)
export async function watchStatus(): Promise<WatchStatus> {
  try {
    const res = await fetch(`${API_URL}/admin/console/watch`, { headers: { 'x-admin-token': getToken() ?? '' }, signal: AbortSignal.timeout(3000) })
    if (res.ok) return res.json()
  } catch {
    /* API가 응답 없음 → 아래로 */
  }
  const res = await fetch(`${WATCHDOG_URL}/status`, { signal: AbortSignal.timeout(2000) })
  if (!res.ok) throw new Error(`watchdog ${res.status}`)
  return res.json()
}

export const won = (n: number) => n.toLocaleString('ko-KR') + '원'
export const fmtUptime = (s: number) => {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d ? `${d}일 ${h}시간` : h ? `${h}시간 ${m}분` : `${m}분 ${s % 60}초`
}
