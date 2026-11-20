import type { NextFunction, Request, Response } from 'express'

// 이 API 서버가 몇 호기인지 (이중화: api-1, api-2). 응답 헤더 X-Instance 와 콘솔 표시에 사용
export const INSTANCE = process.env.INSTANCE_ID || 'api'
export const STARTED_AT = Date.now()

// 장애 시연 스위치. 이중화된 두 서버가 같은 상태를 보도록 DB(ChaosFlag)에 저장하고,
// 각 서버가 1초마다 읽어 와 이 객체에 반영합니다 (chaos.sync.ts). 정해진 시간이 지나면 저절로 꺼짐.
export const chaos = {
  slowMs: 0,
  slowUntil: 0,
  dbDownUntil: 0,
  errorRate: 0,
  errorUntil: 0,
  crashTarget: '', // ④ 특정 호기 다운: 이 이름의 서버가 스스로 종료
  crashAt: 0,
}
export type ChaosData = typeof chaos

export const chaosEnabled = () => (process.env.CHAOS_ENABLED ?? '').toLowerCase() === 'true'
const active = (until: number) => until > Date.now()
export const isDbDown = () => active(chaos.dbDownUntil)

export function chaosSnapshot() {
  const left = (until: number) => (active(until) ? Math.ceil((until - Date.now()) / 1000) : 0)
  return {
    enabled: chaosEnabled(),
    instance: INSTANCE,
    slow: { ms: chaos.slowMs, leftSec: left(chaos.slowUntil) },
    dbDown: { leftSec: left(chaos.dbDownUntil) },
    errors: { rate: chaos.errorRate, leftSec: left(chaos.errorUntil) },
  }
}


// 실제 장애처럼 보이도록 고객에게는 평범한 오류 문구만 보냄
const fail = (res: Response, status: number, message: string) => res.status(status).json({ statusCode: status, message })

// 모든 요청 앞에서 동작. /admin/chaos 는 항상 정상(되돌리기 버튼이 먹히도록)
export function chaosMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Instance', INSTANCE) // 어느 호기가 처리했는지 (로드밸런싱 확인용)
  const p = req.path
  if (req.method === 'OPTIONS' || p.startsWith('/admin/chaos') || !chaosEnabled()) return next()

  const touchesDb = p === '/health' || p.startsWith('/orders') || p.startsWith('/admin/orders') || p.startsWith('/admin/stock')

  const go = () => {
    // ② DB 장애: DB를 쓰는 요청은 503 (콘솔 통계·서버 상태는 그대로 보여서 "DB만 빨간불"이 됨)
    if (isDbDown() && touchesDb && !p.startsWith('/admin/console')) {
      return fail(res, 503, '일시적인 서버 문제로 처리하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
    // ③ 일부 요청 실패: 주문·조회 요청의 일부를 500으로
    if (active(chaos.errorUntil) && (p.startsWith('/orders') || p.startsWith('/admin/orders')) && Math.random() < chaos.errorRate) {
      return fail(res, 500, '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
    }
    next()
  }

  // ① 응답 지연: 모든 요청을 일정 시간 늦게 처리
  if (active(chaos.slowUntil)) setTimeout(go, chaos.slowMs)
  else go()
}
