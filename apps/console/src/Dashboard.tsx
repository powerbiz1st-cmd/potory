import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Activity, AlertTriangle, Cpu, Database, LogOut, Package, Server, Timer, TrendingUp, Wallet, ShoppingBag } from 'lucide-react'
import { SHAPES } from '@shop/design'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AuthError, DownError, api, fmtUptime, won, type Stats, type SystemInfo } from '@/api'
import { DailyBars, HBars, Sparkline } from '@/charts'

const POLL_MS = 5000
const HISTORY = 30 // 응답시간 그래프에 남길 측정 횟수 (5초 × 30 = 2분 30초)
const SLOW_MS = 300 // 이보다 느리면 "지연" 경고

type Level = 'ok' | 'warn' | 'bad'
type Incident = { id: number; at: Date; level: Level; text: string }

const LEVEL = {
  ok: { label: '정상', dot: 'bg-ok text-ok', text: 'text-ok' },
  warn: { label: '지연', dot: 'bg-warn text-warn', text: 'text-warn' },
  bad: { label: '장애', dot: 'bg-bad text-bad', text: 'text-bad' },
} as const

function Dot({ level }: { level: Level }) {
  return <span className={cn('dot-live inline-block size-2.5 rounded-full', LEVEL[level].dot)} />
}

function StatusCard({ icon: Icon, title, level, main, sub, children }: { icon: typeof Server; title: string; level: Level; main: string; sub: string; children?: React.ReactNode }) {
  return (
    <Card className={cn('gap-0 py-0', level === 'bad' && 'border-bad/60 bg-bad/5')}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icon className="size-3.5" /> {title}
          </p>
          <p className="flex items-center gap-2 text-lg font-bold">
            <Dot level={level} /> <span className={LEVEL[level].text}>{LEVEL[level].label}</span>
            <span className="text-sm font-medium text-foreground/80">{main}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Wallet; label: string; value: string | null; sub?: string }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </p>
        <div className="mt-1.5 text-2xl font-bold tabular-nums">{value ?? <Skeleton className="h-8 w-24" />}</div>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [days, setDays] = useState(14)
  const [stats, setStats] = useState<Stats | null>(null)
  const [sys, setSys] = useState<SystemInfo | null>(null)
  const [apiMs, setApiMs] = useState<(number | null)[]>([])
  const [dbMs, setDbMs] = useState<(number | null)[]>([])
  const [down, setDown] = useState<{ since: Date; msg: string } | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [updated, setUpdated] = useState<Date | null>(null)
  const [, tick] = useState(0)
  const downRef = useRef<typeof down>(null)
  const seq = useRef(0)
  const lastLevel = useRef<Level>('ok')

  const log = (level: Level, text: string) => setIncidents((l) => [{ id: ++seq.current, at: new Date(), level, text }, ...l].slice(0, 30))

  const poll = useCallback(async () => {
    const t0 = performance.now()
    try {
      const [s, st] = await Promise.all([api.system(), api.stats(days)])
      const rtt = Math.round(performance.now() - t0)
      setSys(s)
      setStats(st)
      setUpdated(new Date())
      setApiMs((h) => [...h, rtt].slice(-HISTORY))
      setDbMs((h) => [...h, s.db.ok ? s.db.latencyMs : null].slice(-HISTORY))
      // 장애에서 복구됨
      if (downRef.current) {
        const mins = Math.max(1, Math.round((Date.now() - downRef.current.since.getTime()) / 60000))
        log('ok', `복구됨 (약 ${mins}분 중단)`)
        toast.success('API 복구됨')
        downRef.current = null
        setDown(null)
      }
      // 상태가 바뀔 때만 기록 (5초마다 같은 경고가 쌓이지 않게)
      const now: Level = !s.db.ok ? 'bad' : rtt > SLOW_MS ? 'warn' : 'ok'
      if (now !== lastLevel.current) {
        if (now === 'bad') log('bad', 'DB 응답 없음')
        else if (now === 'warn') log('warn', `응답 지연 ${rtt}ms`)
        else if (lastLevel.current !== 'ok') log('ok', '응답 정상으로 돌아옴')
        lastLevel.current = now
      }
    } catch (e) {
      if (e instanceof AuthError) return onLogout()
      setApiMs((h) => [...h, null].slice(-HISTORY))
      setDbMs((h) => [...h, null].slice(-HISTORY))
      if (e instanceof DownError && !downRef.current) {
        downRef.current = { since: new Date(), msg: e.message }
        setDown(downRef.current)
        log('bad', e.message)
        toast.error('장애 감지: API 응답 없음')
      }
    }
  }, [days, onLogout])

  useEffect(() => {
    poll()
    const t = setInterval(poll, POLL_MS)
    const c = setInterval(() => tick((n) => n + 1), 1000) // "n초 전" 표시 갱신
    return () => {
      clearInterval(t)
      clearInterval(c)
    }
  }, [poll])

  const lastApi = apiMs.at(-1)
  const apiLevel: Level = down ? 'bad' : lastApi != null && lastApi > SLOW_MS ? 'warn' : 'ok'
  const dbLevel: Level = down || (sys && !sys.db.ok) ? 'bad' : sys && sys.db.latencyMs > SLOW_MS ? 'warn' : 'ok'
  const memUse = sys ? 1 - sys.host.memFreeMb / sys.host.memTotalMb : 0
  const hostLevel: Level = down ? 'bad' : memUse > 0.9 ? 'warn' : 'ok'
  const ago = updated ? Math.round((Date.now() - updated.getTime()) / 1000) : null

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
          <span className="grid size-8 place-items-center rounded-full bg-lime text-background">
            <Activity className="size-4" />
          </span>
          <span className="display text-xl text-lime">Potory Ops</span>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Dot level={down ? 'bad' : 'ok'} /> 실시간 · {POLL_MS / 1000}초마다 {ago !== null && `· ${ago}초 전 갱신`}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {[7, 14, 30].map((d) => (
              <Button key={d} size="sm" variant={days === d ? 'secondary' : 'ghost'} className="h-7 px-2.5 text-xs" onClick={() => setDays(d)}>
                {d}일
              </Button>
            ))}
            <Button variant="ghost" size="sm" className="ml-2 text-muted-foreground" onClick={onLogout}>
              <LogOut /> <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
        {/* 장애 배너 */}
        {down && (
          <div className="flex items-center gap-3 rounded-xl border border-bad/50 bg-bad/10 px-4 py-3 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-bad" />
            <div>
              <p className="font-bold text-bad">장애 발생 — {down.msg}</p>
              <p className="text-muted-foreground">
                {down.since.toLocaleTimeString('ko-KR')}부터 {Math.round((Date.now() - down.since.getTime()) / 1000)}초째 응답 없음 · 자동으로 계속 확인 중
              </p>
            </div>
          </div>
        )}

        {/* 서버 상태 */}
        <section className="grid gap-3 md:grid-cols-3">
          <StatusCard
            icon={Server}
            title="API 서버"
            level={apiLevel}
            main={lastApi != null ? `${lastApi}ms` : '—'}
            sub={sys ? `가동 ${fmtUptime(sys.api.uptimeSec)} · 메모리 ${sys.api.memoryMb}MB · Node ${sys.api.node}` : '확인 중…'}
          >
            <Sparkline values={apiMs} warnAt={SLOW_MS} />
          </StatusCard>
          <StatusCard
            icon={Database}
            title="데이터베이스"
            level={dbLevel}
            main={sys?.db.ok ? `${sys.db.latencyMs}ms` : '—'}
            sub={sys?.db.ok ? `PostgreSQL · ${sys.db.sizeMb}MB · 연결 ${sys.db.connections}개` : '확인 중…'}
          >
            <Sparkline values={dbMs} warnAt={SLOW_MS} />
          </StatusCard>
          <StatusCard
            icon={Cpu}
            title="서버 PC"
            level={hostLevel}
            main={sys ? `메모리 ${Math.round(memUse * 100)}%` : '—'}
            sub={sys ? `CPU ${sys.host.cpus}코어 · 부하 ${sys.host.load1} · 여유 ${(sys.host.memFreeMb / 1024).toFixed(1)}GB` : '확인 중…'}
          />
        </section>

        {/* 핵심 숫자 */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi icon={Wallet} label="오늘 매출" value={stats && won(stats.today.revenue)} sub={stats ? `${stats.today.orders}건` : undefined} />
          <Kpi icon={TrendingUp} label={`최근 ${days}일 매출`} value={stats && won(stats.period.revenue)} sub={stats ? `${stats.period.orders}건 · 취소 ${stats.period.canceled}건` : undefined} />
          <Kpi icon={ShoppingBag} label="객단가" value={stats && won(stats.avgOrderValue)} sub="주문 1건 평균" />
          <Kpi icon={Timer} label="평균 리드타임" value={stats ? (stats.leadTimeMin ? fmtUptime(stats.leadTimeMin.avg * 60) : '—') : null} sub={stats?.leadTimeMin ? `접수→출고 ${stats.leadTimeMin.count}건 기준` : '출고된 주문 없음'} />
          <Kpi icon={Package} label="재고 부족" value={stats && `${stats.lowStock.length}건`} sub={stats?.lowStock.length ? stats.lowStock.map((s) => s.name.split('·').pop()!.trim()).join(', ') : '모두 충분'} />
        </section>

        {/* 차트 */}
        <section className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">일별 매출 · 주문 수</CardTitle>
            </CardHeader>
            <CardContent>{stats ? <DailyBars data={stats.byDay} /> : <Skeleton className="h-48 w-full" />}</CardContent>
          </Card>
          <div className="grid gap-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">주문 상태 (전체)</CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <HBars
                    rows={[
                      { label: '접수', value: stats.byStatus.RECEIVED, color: 'var(--lime)' },
                      { label: '제작 중', value: stats.byStatus.MAKING, color: 'var(--warn)' },
                      { label: '출고 완료', value: stats.byStatus.SHIPPED, color: 'var(--ok)' },
                      { label: '취소', value: stats.byStatus.CANCELED, color: 'var(--muted-foreground)' },
                    ]}
                  />
                ) : (
                  <Skeleton className="h-24 w-full" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">인기 화분 모양</CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  stats.byShape.length ? (
                    <HBars rows={stats.byShape.map((s) => ({ label: SHAPES.find((x) => x.id === s.shape)?.label ?? s.shape, value: s.count }))} />
                  ) : (
                    <p className="text-sm text-muted-foreground">기간 내 주문 없음</p>
                  )
                ) : (
                  <Skeleton className="h-24 w-full" />
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 장애·이벤트 기록 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">장애 · 이벤트 기록</CardTitle>
            <span className="text-xs text-muted-foreground">이 화면을 연 뒤부터 · 이메일 알림은 모니터링 단계에서 연결</span>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Dot level="ok" /> 문제 없음 — 모든 점검이 정상이에요.
              </p>
            ) : (
              <ul className="divide-y">
                {incidents.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className={cn('inline-block size-2 rounded-full', LEVEL[i.level].dot)} />
                    <span className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">{i.at.toLocaleTimeString('ko-KR')}</span>
                    <span className={LEVEL[i.level].text}>{LEVEL[i.level].label}</span>
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
