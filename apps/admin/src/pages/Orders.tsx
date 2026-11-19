import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react'
import PotThumb from '@shop/components/PotThumb'
import { SHAPES, won } from '@shop/design'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { AuthError, STATUS, api, fmtPhone, fmtTime, type AdminOrder, type OrderStatus } from '@/api'
import OrderDetail from '@/components/OrderDetail'
import PrintSheet from '@/components/PrintSheet'

const POLL_MS = 4000 // 휴대폰 주문이 몇 초 안에 뜨도록 주기적으로 새로고침
type Filter = 'ALL' | OrderStatus

export default function Orders({ onAuthFail }: { onAuthFail: () => void }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [q, setQ] = useState('')
  const [selectedNo, setSelectedNo] = useState<string | null>(null)
  const [fresh, setFresh] = useState<Set<string>>(new Set()) // 방금 들어온 주문 (줄 강조)
  const [busyNo, setBusyNo] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const known = useRef<Set<string> | null>(null)

  const load = useCallback(async () => {
    try {
      const list = await api.orders()
      // 처음 불러온 뒤로 새로 생긴 주문번호 → 알림 + 강조
      if (known.current) {
        const added = list.filter((o) => !known.current!.has(o.no))
        if (added.length) {
          added.forEach((o) => toast.success(`새 주문 ${o.no}`, { description: `${o.name} · ${won(o.total)}` }))
          setFresh((s) => new Set([...s, ...added.map((o) => o.no)]))
          setTimeout(() => setFresh((s) => new Set([...s].filter((n) => !added.some((a) => a.no === n)))), 8000)
        }
      }
      known.current = new Set(list.map((o) => o.no))
      setOrders(list)
    } catch (e) {
      if (e instanceof AuthError) onAuthFail()
      else toast.error(e instanceof Error ? e.message : '불러오기 실패', { id: 'load-error' })
    }
  }, [onAuthFail])

  useEffect(() => {
    load()
    const t = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS)
    return () => clearInterval(t)
  }, [load])

  const replace = (o: AdminOrder) => setOrders((list) => list?.map((x) => (x.no === o.no ? o : x)) ?? null)

  const advance = async (o: AdminOrder) => {
    const next = STATUS[o.status].next
    if (!next) return
    setBusyNo(o.no)
    try {
      const updated = await api.setStatus(o.no, next)
      replace(updated)
      toast.success(`${o.no} → ${STATUS[next].label}`)
    } catch (e) {
      if (e instanceof AuthError) onAuthFail()
      toast.error(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setBusyNo(null)
    }
  }

  const counts = useMemo(() => {
    const c = { ALL: 0, RECEIVED: 0, MAKING: 0, SHIPPED: 0, CANCELED: 0 } as Record<Filter, number>
    orders?.forEach((o) => {
      c.ALL++
      c[o.status]++
    })
    return c
  }, [orders])

  const today = useMemo(() => {
    const d = new Date().toDateString()
    const list = orders?.filter((o) => new Date(o.createdAt).toDateString() === d && o.status !== 'CANCELED') ?? []
    return { n: list.length, sum: list.reduce((a, o) => a + o.total, 0) }
  }, [orders])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/-/g, '')
    return (orders ?? []).filter(
      (o) =>
        (filter === 'ALL' || o.status === filter) &&
        (!s || o.no.toLowerCase().replace(/-/g, '').includes(s) || o.name.toLowerCase().includes(s) || o.phone.includes(s)),
    )
  }, [orders, filter, q])

  const selected = orders?.find((o) => o.no === selectedNo) ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">주문</h1>
          <p className="text-sm text-muted-foreground">휴대폰에서 들어온 주문이 {POLL_MS / 1000}초 안에 자동으로 나타나요.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setRefreshing(true)
            await load()
            setRefreshing(false)
          }}
        >
          <RefreshCw className={cn(refreshing && 'animate-spin')} /> 새로고침
        </Button>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: '오늘 주문', value: `${today.n}건`, sub: won(today.sum) },
          { label: '접수 대기', value: `${counts.RECEIVED}건`, sub: '제작 시작 전', hot: counts.RECEIVED > 0 },
          { label: '제작 중', value: `${counts.MAKING}건`, sub: '공방 작업 중' },
          { label: '출고 완료', value: `${counts.SHIPPED}건`, sub: '누적' },
        ].map((c) => (
          <Card key={c.label} className={cn('gap-0 py-0', c.hot && 'border-forest bg-lime/15')}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{orders ? c.value : <Skeleton className="h-8 w-16" />}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {(['ALL', 'RECEIVED', 'MAKING', 'SHIPPED', 'CANCELED'] as Filter[]).map((f) => (
              <TabsTrigger key={f} value={f} className="gap-1.5">
                {f === 'ALL' ? '전체' : STATUS[f].label}
                <span className="text-xs text-muted-foreground tabular-nums">{counts[f]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="주문번호 · 이름 · 연락처" className="pl-9" />
        </div>
      </div>

      {/* 목록 */}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[150px]">주문번호</TableHead>
              <TableHead>디자인</TableHead>
              <TableHead className="hidden md:table-cell">고객</TableHead>
              <TableHead className="hidden sm:table-cell">주문 시각</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-[130px] text-right">처리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!orders &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {orders && shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {orders.length ? '조건에 맞는 주문이 없어요' : '아직 주문이 없어요. Shop에서 주문하면 여기에 바로 나타나요.'}
                </TableCell>
              </TableRow>
            )}
            {shown.map((o) => {
              const st = STATUS[o.status]
              return (
                <TableRow
                  key={o.no}
                  onClick={() => setSelectedNo(o.no)}
                  className={cn('cursor-pointer transition-colors', fresh.has(o.no) && 'bg-lime/30 hover:bg-lime/40')}
                >
                  <TableCell className="font-mono text-[13px] font-semibold">
                    {o.no}
                    {fresh.has(o.no) && <Badge className="ml-2 bg-forest px-1.5 text-[10px] text-white">NEW</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="grid size-10 shrink-0 place-items-end rounded-md bg-muted">
                        <PotThumb design={o.design} className="w-full" />
                      </span>
                      <span className="text-sm">
                        {SHAPES.find((s) => s.id === o.design.shape)?.label}
                        {o.design.text.trim() && <span className="block text-xs text-muted-foreground">“{o.design.text.trim()}”</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">{o.name}</span>
                    <span className="block text-xs text-muted-foreground">{fmtPhone(o.phone)}</span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{fmtTime(o.createdAt)}</TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">{won(o.total)}</TableCell>
                  <TableCell>
                    <Badge className={cn('font-semibold', st.tone)}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {st.next ? (
                      <Button
                        size="sm"
                        variant={o.status === 'RECEIVED' ? 'default' : 'outline'}
                        disabled={busyNo === o.no}
                        onClick={(e) => {
                          e.stopPropagation()
                          advance(o)
                        }}
                      >
                        {busyNo === o.no && <Loader2 className="animate-spin" />} {st.action}
                      </Button>
                    ) : (
                      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <OrderDetail order={selected} onClose={() => setSelectedNo(null)} onChanged={replace} onAuthFail={onAuthFail} />
      {selected && <PrintSheet order={selected} />}
    </div>
  )
}
