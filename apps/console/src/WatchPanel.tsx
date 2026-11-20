import { useEffect, useState } from 'react'
import { Archive, Bell, Mail, MailX, Radar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { watchStatus, type WatchStatus } from '@/api'

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}초 전`
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`
  return `${Math.floor(s / 86400)}일 전`
}
const time = (iso: string) => new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })

// 7번 모니터링: watchdog 컨테이너가 바깥에서 본 서비스 상태 + 보낸 알림 메일 + DB 백업
export default function WatchPanel() {
  const [w, setW] = useState<WatchStatus | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    const load = () =>
      watchStatus()
        .then((s) => {
          setW(s)
          setErr(false)
        })
        .catch(() => setErr(true))
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {/* 서비스 감시 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Radar className="size-4" /> 서비스 감시
          </CardTitle>
          <span className="text-xs text-muted-foreground">{w ? `${w.intervalSec}초마다 바깥에서 확인` : ''}</span>
        </CardHeader>
        <CardContent>
          {err && <p className="text-sm text-bad">감시 컨테이너(watchdog)에 연결할 수 없어요</p>}
          {!w && !err && <Skeleton className="h-28 w-full" />}
          {w && (
            <ul className="space-y-2.5">
              {w.targets.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5 text-sm">
                  <span className={cn('dot-live inline-block size-2.5 rounded-full', t.status === 'up' ? 'bg-ok text-ok' : t.status === 'down' ? 'bg-bad text-bad' : 'bg-muted-foreground text-muted-foreground')} />
                  <span className="flex-1">{t.name}</span>
                  <span className={cn('text-xs tabular-nums', t.status === 'down' ? 'text-bad' : 'text-muted-foreground')}>
                    {t.status === 'up' ? `${t.lastMs}ms` : t.status === 'down' ? (t.lastError ?? '장애') : '확인 중'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 알림 메일 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="size-4" /> 알림 메일
          </CardTitle>
          {w && <span className="truncate text-xs text-muted-foreground">{w.mail.mode} → {w.mail.to}</span>}
        </CardHeader>
        <CardContent>
          {!w ? (
            <Skeleton className="h-28 w-full" />
          ) : w.mails.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 보낸 알림이 없어요. 장애가 나면 자동으로 메일이 가요.</p>
          ) : (
            <ul className="space-y-2">
              {w.mails.slice(0, 5).map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {m.ok ? <Mail className="mt-0.5 size-3.5 shrink-0 text-ok" /> : <MailX className="mt-0.5 size-3.5 shrink-0 text-bad" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate', m.subject.includes('장애') ? 'text-bad' : 'text-ok')}>{m.subject.replace('[POTORY ', '[')}</span>
                    <span className="text-xs text-muted-foreground">
                      {time(m.at)} {!m.ok && `· 발송 실패: ${m.error}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 백업 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Archive className="size-4" /> DB 백업
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!w ? (
            <Skeleton className="h-28 w-full" />
          ) : w.backup ? (
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2">
                <span className={cn('inline-block size-2.5 rounded-full', Date.now() - new Date(w.backup.at).getTime() < 26 * 3600_000 ? 'bg-ok' : 'bg-warn')} />
                마지막 백업 <b>{ago(w.backup.at)}</b>
              </p>
              <p className="text-xs text-muted-foreground">{time(w.backup.at)}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {w.backup.file} · {w.backup.sizeKb}KB
              </p>
              <p className="text-xs text-muted-foreground">보관 {w.backup.count}개 · 24시간마다 자동 · 최근 7개 유지</p>
            </div>
          ) : (
            <p className="text-sm text-warn">아직 백업 파일이 없어요</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
