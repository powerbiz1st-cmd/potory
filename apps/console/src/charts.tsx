import { useState } from 'react'
import { cn } from '@/lib/utils'

// 라이브러리 없이 그리는 가벼운 차트들

// 일별 매출 막대 + 주문 수
export function DailyBars({ data }: { data: { date: string; orders: number; revenue: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.revenue))
  const h = 160
  return (
    <div className="relative">
      <div className="flex h-[188px] items-end gap-1.5">
        {data.map((d, i) => {
          const bh = Math.max(2, (d.revenue / max) * h)
          const isToday = i === data.length - 1
          return (
            <div
              key={d.date}
              className="group flex flex-1 flex-col items-center justify-end gap-1"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className={cn('text-[10px] tabular-nums text-muted-foreground', d.orders === 0 && 'opacity-0')}>{d.orders}</span>
              <div
                className={cn('w-full max-w-9 rounded-t-md transition-all', isToday ? 'bg-lime' : 'bg-lime/35 group-hover:bg-lime/60', d.revenue === 0 && 'bg-border')}
                style={{ height: bh }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span key={d.date} className={cn('flex-1 text-center text-[10px] text-muted-foreground tabular-nums', i % 2 && data.length > 10 && 'invisible sm:visible')}>
            {d.date.slice(5).replace('-', '/')}
          </span>
        ))}
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 rounded-md border bg-popover px-3 py-1.5 text-xs shadow-lg">
          <b>{data[hover].date}</b> · 주문 {data[hover].orders}건 · {data[hover].revenue.toLocaleString('ko-KR')}원
        </div>
      )}
    </div>
  )
}

// 가로 막대 (상태별·모양별)
export function HBars({ rows }: { rows: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? 'var(--lime)' }} />
          </div>
          <span className="text-right font-semibold tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// 응답 시간 흐름 (최근 N번 측정)
export function Sparkline({ values, warnAt, className }: { values: (number | null)[]; warnAt: number; className?: string }) {
  const W = 120
  const H = 32
  const nums = values.map((v) => v ?? 0)
  const max = Math.max(warnAt, ...nums)
  const step = values.length > 1 ? W / (values.length - 1) : W
  const pts = values.map((v, i) => `${i * step},${v === null ? H : H - (v / max) * (H - 3) - 1}`).join(' ')
  const last = values.at(-1)
  const color = last === null || last === undefined ? 'var(--bad)' : last > warnAt ? 'var(--warn)' : 'var(--ok)'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn('h-8 w-30', className)} preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {values.map((v, i) => (v === null ? <circle key={i} cx={i * step} cy={H - 2} r="2" fill="var(--bad)" /> : null))}
    </svg>
  )
}
