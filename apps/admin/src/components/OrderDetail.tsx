import { useState } from 'react'
import { toast } from 'sonner'
import { Ban, Loader2, Printer, RotateCcw } from 'lucide-react'
import PotThumb from '@shop/components/PotThumb'
import { won } from '@shop/design'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { AuthError, STATUS, api, fmtPhone, fmtTime, type AdminOrder, type OrderStatus } from '@/api'
import DesignSpec from './DesignSpec'

type Props = {
  order: AdminOrder | null
  onClose: () => void
  onChanged: (o: AdminOrder) => void
  onAuthFail: () => void
}

export default function OrderDetail({ order, onClose, onChanged, onAuthFail }: Props) {
  const [busy, setBusy] = useState<OrderStatus | null>(null)

  const change = async (status: OrderStatus) => {
    if (!order) return
    setBusy(status)
    try {
      const o = await api.setStatus(order.no, status)
      onChanged(o)
      toast.success(`${o.no} → ${STATUS[status].label}`)
    } catch (e) {
      if (e instanceof AuthError) onAuthFail()
      toast.error(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setBusy(null)
    }
  }

  const st = order ? STATUS[order.status] : null

  return (
    <Sheet open={!!order} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md print:hidden">
        {order && st && (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-2">
                <Badge className={cn('font-bold', st.tone)}>{st.label}</Badge>
                <span className="text-xs text-muted-foreground">{fmtTime(order.createdAt)} 주문</span>
              </div>
              <SheetTitle className="display text-2xl">{order.no}</SheetTitle>
              <SheetDescription>
                {order.name} · {fmtPhone(order.phone)} · <b className="text-foreground">{won(order.total)}</b>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 p-4">
              <div className="flex gap-4">
                <div className="grid w-32 shrink-0 place-items-end rounded-xl bg-muted">
                  <PotThumb design={order.design} className="w-full" />
                </div>
                <DesignSpec design={order.design} className="grid flex-1 grid-cols-[4.5rem_1fr] content-center gap-x-2 gap-y-1.5 text-sm" />
              </div>

              <div className="flex flex-wrap gap-2">
                {st.next && (
                  <Button className="flex-1" onClick={() => change(st.next!)} disabled={!!busy}>
                    {busy === st.next && <Loader2 className="animate-spin" />} {st.action}
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  <Printer /> 제작지시서 인쇄
                </Button>
              </div>

              <Separator />

              <section>
                <h3 className="mb-3 text-sm font-semibold">진행 기록</h3>
                <ol className="space-y-3 border-l-2 border-border pl-4">
                  {order.events.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-forest ring-4 ring-white" />
                      <p className="text-sm font-medium">{STATUS[e.status].label}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtTime(e.createdAt)}
                        {e.note && ` · ${e.note}`}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              <Separator />

              <div className="flex gap-2">
                {order.status !== 'CANCELED' ? (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => change('CANCELED')} disabled={!!busy || order.status === 'SHIPPED'}>
                    <Ban /> 주문 취소 (재고 복구)
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => change('RECEIVED')} disabled={!!busy}>
                    <RotateCcw /> 취소 되돌리기
                  </Button>
                )}
                {order.status === 'MAKING' && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => change('RECEIVED')} disabled={!!busy}>
                    <RotateCcw /> 접수로 되돌리기
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
