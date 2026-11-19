import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Minus, Plus, PackagePlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { AuthError, api, fmtTime, type StockItem } from '@/api'

// 재고: 주문이 들어오면 화분 몸체 1 + 몬스테라 1 이 자동으로 빠지고, 취소하면 돌아옴
export default function Stock({ onAuthFail }: { onAuthFail: () => void }) {
  const [items, setItems] = useState<StockItem[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await api.stock())
    } catch (e) {
      if (e instanceof AuthError) onAuthFail()
      else toast.error(e instanceof Error ? e.message : '불러오기 실패', { id: 'stock-error' })
    }
  }, [onAuthFail])

  useEffect(() => {
    load()
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 5000)
    return () => clearInterval(t)
  }, [load])

  const adjust = async (sku: string, delta: number) => {
    setBusy(sku + delta)
    try {
      const it = await api.adjustStock(sku, delta)
      setItems((list) => list?.map((x) => (x.sku === sku ? it : x)) ?? null)
      if (delta >= 10) toast.success(`${it.name} ${delta}개 입고`)
    } catch (e) {
      if (e instanceof AuthError) onAuthFail()
      toast.error(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setBusy(null)
    }
  }

  const low = items?.filter((i) => i.qty <= i.threshold) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">재고</h1>
        <p className="text-sm text-muted-foreground">주문 1건마다 화분 몸체 1개와 몬스테라 1그루가 자동으로 빠지고, 주문을 취소하면 돌아와요.</p>
      </div>

      {low.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">재고 부족 {low.length}건</p>
            <p className="text-muted-foreground">{low.map((i) => `${i.name} (${i.qty}개)`).join(' · ')}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>품목</TableHead>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="hidden md:table-cell">상태</TableHead>
              <TableHead className="hidden lg:table-cell">마지막 변경</TableHead>
              <TableHead className="text-right">조정</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!items &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {items?.map((i) => {
              const isLow = i.qty <= i.threshold
              const pct = Math.max(0, Math.min(100, (i.qty / (i.threshold * 5)) * 100))
              return (
                <TableRow key={i.sku}>
                  <TableCell>
                    <p className="font-medium">{i.name}</p>
                    <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', isLow ? 'bg-destructive' : 'bg-forest')} style={{ width: `${pct}%` }} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{i.sku}</TableCell>
                  <TableCell className={cn('text-right text-lg font-bold tabular-nums', isLow && 'text-destructive')}>{i.qty}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {isLow ? <Badge variant="destructive">부족 (기준 {i.threshold})</Badge> : <Badge variant="secondary">충분</Badge>}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{fmtTime(i.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon-sm" variant="outline" aria-label="1개 빼기" disabled={!!busy} onClick={() => adjust(i.sku, -1)}>
                        <Minus />
                      </Button>
                      <Button size="icon-sm" variant="outline" aria-label="1개 더하기" disabled={!!busy} onClick={() => adjust(i.sku, 1)}>
                        <Plus />
                      </Button>
                      <Button size="sm" disabled={!!busy} onClick={() => adjust(i.sku, 10)}>
                        <PackagePlus /> 10개 입고
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
