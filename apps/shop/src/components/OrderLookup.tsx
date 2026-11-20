import { useEffect, useState } from 'react'
import { Loader2, PackageSearch, RefreshCw, Search } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import PotThumb from '@/components/PotThumb'
import { cn } from '@/lib/utils'
import { won } from '@/design'
import { ORDERS_CHANGED, STATUS_STEPS, findOrder, lookupOrders, myOrderCount, myOrders, statusLabel, type Order } from '@/orders'

const fmt = (iso: string) => new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function OrderResult({ order }: { order: Order }) {
  const canceled = order.status === 'CANCELED'
  const current = STATUS_STEPS.findIndex((s) => s.id === order.status)
  const at = (id: string) => [...order.events].reverse().find((e) => e.status === id)?.at
  return (
    <div className="space-y-5 rounded-3xl border-2 border-forest bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="grid w-24 shrink-0 place-items-end rounded-2xl" style={{ background: `${order.design.accent}33` }}>
          <PotThumb design={order.design} className="w-full" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <Badge className={cn('rounded-full font-bold', canceled ? 'bg-destructive text-white' : 'bg-lime text-forest')}>{statusLabel(order.status)}</Badge>
          <p className="display truncate text-2xl text-forest">{order.no}</p>
          <p className="text-sm text-forest/70">
            {order.name} · {fmt(order.createdAt)}
          </p>
          <p className="font-bold text-forest">{won(order.total)}</p>
        </div>
      </div>
      {!canceled && (
        <ol className="relative space-y-4 border-l-2 border-forest/15 pl-5">
          {STATUS_STEPS.map((s, i) => (
            <li key={s.id} className={cn('relative', i > current && 'opacity-40')}>
              <span
                className={cn(
                  'absolute top-1 -left-[27px] size-3.5 rounded-full border-2 border-forest bg-card',
                  i <= current && 'bg-lime',
                  i === current && 'ring-4 ring-lime/50',
                )}
              />
              <p className="flex items-baseline justify-between gap-2 font-bold text-forest">
                {s.label}
                {at(s.id) && <span className="text-xs font-normal text-forest/50">{fmt(at(s.id)!)}</span>}
              </p>
              <p className="text-sm text-forest/65">{s.desc}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function OrderRow({ o, onClick }: { o: Order; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-forest/15 bg-card p-2 pr-4 text-left hover:border-forest">
      <span className="grid size-14 shrink-0 place-items-end rounded-xl" style={{ background: `${o.design.accent}33` }}>
        <PotThumb design={o.design} className="w-full" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-forest">{o.no}</span>
        <span className="text-sm text-forest/60">
          {new Date(o.createdAt).toLocaleDateString('ko-KR')} · {won(o.total)}
        </span>
      </span>
      <Badge className={cn('shrink-0 rounded-full font-bold', o.status === 'SHIPPED' ? 'bg-forest text-lime' : o.status === 'CANCELED' ? 'bg-muted text-forest/60' : 'bg-lime text-forest')}>
        {statusLabel(o.status)}
      </Badge>
    </button>
  )
}

export default function OrderLookup({ compact = false }: { compact?: boolean }) {
  const [no, setNo] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<Order | null>(null)
  const [found, setFound] = useState<Order[] | null>(null) // 이름+번호 조회 결과
  const [mine, setMine] = useState<Order[]>([])
  const [count, setCount] = useState(myOrderCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 주문이 새로 들어오면 헤더 숫자 갱신
  useEffect(() => {
    const on = () => setCount(myOrderCount())
    addEventListener(ORDERS_CHANGED, on)
    return () => removeEventListener(ORDERS_CHANGED, on)
  }, [])

  const run = async (fn: () => Promise<void>) => {
    setLoading(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : '문제가 생겼어요')
    } finally {
      setLoading(false)
    }
  }

  const loadMine = () => run(async () => setMine(await myOrders()))

  const searchNo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!no.trim()) return
    run(async () => {
      const o = await findOrder(no)
      if (!o) throw new Error('그 번호로 된 주문이 없어요. 번호를 다시 확인해 주세요.')
      setResult(o)
    })
  }

  const searchPhone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    run(async () => {
      const list = await lookupOrders(name, phone)
      if (!list.length) throw new Error('일치하는 주문이 없어요. 주문할 때 적은 이름과 번호인지 확인해 주세요.')
      setFound(list)
      setMine(await myOrders())
    })
  }

  const reset = () => {
    setResult(null)
    setFound(null)
    setError(null)
  }

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open) loadMine()
        else reset()
      }}
    >
      <SheetTrigger asChild>
        <Button variant="ghost" className="rounded-full font-semibold text-forest/80" aria-label="주문 조회">
          <span className="relative">
            <PackageSearch />
            {count > 0 && (
              <span className="absolute -top-2 -right-2.5 grid size-4 place-items-center rounded-full bg-lime text-[10px] font-bold text-forest ring-2 ring-paper">{count}</span>
            )}
          </span>
          {!compact && <span className="hidden sm:inline">주문 조회</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-l-2 border-forest bg-paper sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="display text-4xl text-forest">Track</SheetTitle>
          <SheetDescription className="text-forest/70">제작이 어디까지 됐는지 볼 수 있어요.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 py-6">
          {result ? (
            <>
              <OrderResult order={result} />
              <Button variant="ghost" className="rounded-full text-forest/70" onClick={reset}>
                ← 목록으로
              </Button>
            </>
          ) : (
            <>
              <Tabs defaultValue="no" className="gap-4" onValueChange={() => setError(null)}>
                <TabsList className="h-auto w-full rounded-full border-[1.5px] border-forest bg-card p-1">
                  <TabsTrigger value="no" className="rounded-full py-2 font-bold data-[state=active]:bg-forest data-[state=active]:text-lime">
                    주문번호로
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="rounded-full py-2 font-bold data-[state=active]:bg-forest data-[state=active]:text-lime">
                    번호를 잊었어요
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="no">
                  <form onSubmit={searchNo} className="flex gap-2">
                    <Input value={no} onChange={(e) => setNo(e.target.value)} placeholder="PT-261119-1234" aria-label="주문번호" className="h-12 rounded-full border-[1.5px] border-forest bg-card px-5 font-semibold uppercase" />
                    <Button type="submit" size="icon" className="size-12 shrink-0 rounded-full" aria-label="조회" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : <Search />}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="phone">
                  <form onSubmit={searchPhone} className="space-y-2">
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="주문한 분 이름" aria-label="이름" className="h-12 rounded-full border-[1.5px] border-forest bg-card px-5" />
                    <div className="flex gap-2">
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="010-0000-0000" aria-label="휴대폰 번호" className="h-12 rounded-full border-[1.5px] border-forest bg-card px-5" />
                      <Button type="submit" size="icon" className="size-12 shrink-0 rounded-full" aria-label="찾기" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <Search />}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>

              {error && <p className="rounded-2xl bg-muted p-4 text-sm text-forest/80">{error}</p>}

              {found && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-forest/70">찾은 주문 · {found.length}건 (이 휴대폰 목록에도 저장했어요)</p>
                  {found.map((o) => (
                    <OrderRow key={o.no} o={o} onClick={() => setResult(o)} />
                  ))}
                </div>
              )}

              {!found && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-forest/70">이 휴대폰에서 한 주문 {mine.length > 0 && `· ${mine.length}건`}</p>
                    {count > 0 && (
                      <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={loadMine} aria-label="새로고침">
                        <RefreshCw className={cn(loading && 'animate-spin')} />
                      </Button>
                    )}
                  </div>
                  {count === 0 && <p className="rounded-2xl bg-muted p-4 text-sm text-forest/70">아직 주문이 없어요. 주문하면 번호를 몰라도 여기에서 바로 볼 수 있어요.</p>}
                  {mine.map((o) => (
                    <OrderRow key={o.no} o={o} onClick={() => setResult(o)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
