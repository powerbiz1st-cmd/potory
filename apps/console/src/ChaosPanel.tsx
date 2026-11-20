import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Database, FlaskConical, Hourglass, Loader2, PackageX, Power, RotateCcw, ServerCrash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chaosRun, chaosState, type ChaosAction, type ChaosState } from '@/api'

const SEC = 30 // 각 시연이 유지되는 시간 (지나면 저절로 정상화)

const ACTIONS: { id: ChaosAction; n: string; title: string; desc: string; icon: typeof Hourglass; body?: Record<string, number | string>; danger?: boolean }[] = [
  { id: 'slow', n: '①', title: '응답 지연', desc: `${SEC}초간 모든 요청 1.5초 지연 → 노란불`, icon: Hourglass, body: { sec: SEC, ms: 1500 } },
  { id: 'db-down', n: '②', title: 'DB 장애', desc: `${SEC}초간 DB 연결 끊김 → 주문 실패 · 장애 메일`, icon: Database, body: { sec: SEC } },
  { id: 'errors', n: '③', title: '일부 요청 실패', desc: `${SEC}초간 주문·조회의 절반이 서버 오류`, icon: FlaskConical, body: { sec: SEC, rate: 0.5 } },
  { id: 'crash', n: '④', title: 'API 1대 다운', desc: '1호기 20초 중지 → 2호기가 주문 처리 · 자동 재시작', icon: ServerCrash, body: { instance: 'api-1' }, danger: true },
  { id: 'stock-low', n: '⑤', title: '재고 소진', desc: '몬스테라 재고 2개로 → 부족 경고', icon: PackageX },
]

// 시연용: 일부러 장애를 일으켜 감지 → 알림 → 복구 흐름을 보여줌
export default function ChaosPanel() {
  const [st, setSt] = useState<ChaosState | null>(null)
  const [busy, setBusy] = useState<ChaosAction | null>(null)

  useEffect(() => {
    const load = () => chaosState().then(setSt).catch(() => {}) // 서버 다운 중엔 마지막 상태 유지
    load()
    const t = setInterval(load, 1000)
    return () => clearInterval(t)
  }, [])

  const run = async (a: (typeof ACTIONS)[number] | { id: 'reset'; title: string; body?: undefined }) => {
    setBusy(a.id)
    try {
      await chaosRun(a.id, a.body)
      toast(a.id === 'reset' ? '모든 시연을 정상으로 되돌렸어요' : `시연 시작: ${a.title}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '실패')
    } finally {
      setBusy(null)
    }
  }

  const left: Partial<Record<ChaosAction, number>> = st ? { slow: st.slow.leftSec, 'db-down': st.dbDown.leftSec, errors: st.errors.leftSec } : {}
  const anyOn = Object.values(left).some((v) => (v ?? 0) > 0)

  return (
    <Card className={cn('border-dashed', anyOn && 'border-warn/60')}>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Power className="size-4" /> 장애 시연
          <span className="rounded bg-warn/15 px-1.5 py-0.5 text-[10px] font-semibold text-warn">DEMO</span>
        </CardTitle>
        <Button size="sm" variant="secondary" onClick={() => run({ id: 'reset', title: '정상화' })} disabled={busy !== null}>
          <RotateCcw /> 즉시 정상화
        </Button>
      </CardHeader>
      <CardContent>
        {st && !st.enabled ? (
          <p className="text-sm text-muted-foreground">
            꺼져 있어요. 시연용 PC의 <code className="rounded bg-muted px-1">.env</code> 에 <code className="rounded bg-muted px-1">CHAOS_ENABLED=true</code> 를 넣고 API를 다시 켜세요.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {ACTIONS.map((a) => {
              const l = left[a.id] ?? 0
              return (
                <button
                  key={a.id}
                  onClick={() => run(a)}
                  disabled={busy !== null || !st}
                  className={cn(
                    'group flex flex-col gap-1.5 rounded-lg border bg-muted/40 p-3 text-left transition-colors hover:border-foreground/30 disabled:opacity-50',
                    l > 0 && 'border-warn bg-warn/10',
                    a.danger && 'hover:border-bad/60',
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <a.icon className={cn('size-4', a.danger ? 'text-bad' : 'text-muted-foreground')} />
                      {a.n} {a.title}
                    </span>
                    {busy === a.id ? <Loader2 className="size-3.5 animate-spin" /> : l > 0 && <span className="text-xs font-bold text-warn tabular-nums">{l}초</span>}
                  </span>
                  <span className="text-xs leading-snug text-muted-foreground">{a.desc}</span>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
