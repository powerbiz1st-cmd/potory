import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { GitFork, Loader2, PowerOff, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chaosRun, watchStatus, whoServes, type WatchStatus } from '@/api'

const INSTANCES = [
  { id: 'api-1', name: '1호기', color: 'var(--lime)' },
  { id: 'api-2', name: '2호기', color: '#60a5fa' },
] as const
const WINDOW = 24 // 최근 몇 개 요청으로 분배 비율을 볼지 (1초에 1번)

// API 이중화: 로드밸런서 뒤의 두 서버 상태 + 요청이 어디로 가는지 + 한 대 중지 버튼
export default function HaPanel() {
  const [watch, setWatch] = useState<WatchStatus | null>(null)
  const [hits, setHits] = useState<(string | null)[]>([]) // 최근 요청을 받은 호기 (null = 실패)
  const [busy, setBusy] = useState<string | null>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const probe = async () => {
      const who = await whoServes()
      if (alive.current) setHits((h) => [...h, who].slice(-WINDOW))
    }
    const loadWatch = () => watchStatus().then((w) => alive.current && setWatch(w)).catch(() => {})
    probe()
    loadWatch()
    const a = setInterval(probe, 1000)
    const b = setInterval(loadWatch, 2000)
    return () => {
      alive.current = false
      clearInterval(a)
      clearInterval(b)
    }
  }, [])

  const stop = async (id: string, name: string) => {
    setBusy(id)
    try {
      await chaosRun('crash', { instance: id })
      toast(`${name} 중지 — 20초 뒤 자동으로 다시 켜져요. 그동안 다른 호기가 주문을 처리해요.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '실패')
    } finally {
      setBusy(null)
    }
  }

  const recent = hits.slice(-8)
  const servingIds = new Set(recent.filter(Boolean))
  const lbMsg =
    recent.length && recent.every((h) => h === null)
      ? { text: '응답 없음 — 두 대 모두 장애', tone: 'text-bad' }
      : servingIds.size >= 2
        ? { text: '2대에 번갈아 분배 중', tone: 'text-ok' }
        : servingIds.size === 1
          ? { text: `${INSTANCES.find((i) => servingIds.has(i.id))?.name}가 혼자 처리 중 (다른 1대 장애)`, tone: 'text-warn' }
          : { text: '확인 중…', tone: 'text-muted-foreground' }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitFork className="size-4" /> API 이중화
          <span className="text-xs font-normal text-muted-foreground">로드밸런서 → 2대</span>
        </CardTitle>
        <span className={cn('text-xs font-semibold', lbMsg.tone)}>{lbMsg.text}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {INSTANCES.map((ins) => {
            const t = watch?.targets.find((x) => x.id === ins.id)
            const share = hits.length ? Math.round((hits.filter((h) => h === ins.id).length / hits.length) * 100) : 0
            const servingNow = recent.includes(ins.id)
            const status = !t ? 'unknown' : t.status === 'down' || (!servingNow && recent.length >= 5) ? 'down' : t.status
            return (
              <div key={ins.id} className={cn('rounded-lg border p-3', status === 'down' && 'border-bad/60 bg-bad/5')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold">
                    <Server className="size-4" style={{ color: ins.color }} /> API {ins.name}
                    <span className="font-mono text-[11px] font-normal text-muted-foreground">{ins.id}</span>
                  </span>
                  <span className={cn('flex items-center gap-1.5 text-sm font-bold', status === 'up' ? 'text-ok' : status === 'down' ? 'text-bad' : 'text-muted-foreground')}>
                    <span className={cn('dot-live inline-block size-2.5 rounded-full', status === 'up' ? 'bg-ok text-ok' : status === 'down' ? 'bg-bad text-bad' : 'bg-muted-foreground')} />
                    {status === 'up' ? '정상' : status === 'down' ? '장애' : '확인 중'}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    <p>
                      응답 {t?.lastMs != null ? `${t.lastMs}ms` : '—'} · 최근 처리 <b className="text-foreground tabular-nums">{share}%</b>
                    </p>
                    <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all" style={{ width: `${share}%`, background: ins.color }} />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs hover:border-bad/60 hover:text-bad" disabled={busy !== null || status === 'down'} onClick={() => stop(ins.id, ins.name)}>
                    {busy === ins.id ? <Loader2 className="animate-spin" /> : <PowerOff />} 중지
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 최근 요청이 어느 호기로 갔는지 (왼쪽이 오래된 것) */}
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">최근 {WINDOW}초 요청 흐름 (1초마다 1건)</p>
          <div className="flex gap-1">
            {Array.from({ length: WINDOW }).map((_, i) => {
              const h = hits[i - (WINDOW - hits.length)]
              const ins = INSTANCES.find((x) => x.id === h)
              return (
                <span
                  key={i}
                  title={h ?? (i < WINDOW - hits.length ? '' : '실패')}
                  className={cn('h-4 flex-1 rounded-sm', i < WINDOW - hits.length ? 'bg-muted' : !ins && 'bg-bad')}
                  style={ins ? { background: ins.color } : undefined}
                />
              )
            })}
          </div>
          <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground">
            {INSTANCES.map((i) => (
              <span key={i.id} className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-sm" style={{ background: i.color }} /> {i.name}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-bad" /> 실패
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
