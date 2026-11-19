import { useState } from 'react'
import { toast } from 'sonner'
import { PartyPopper } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import PotThumb from '@/components/PotThumb'
import { PriceLines } from '@/pages/Customizer'
import { COLORS, PATTERNS, PLANTS, SHAPES, priceOf, type Design } from '@/design'
import { createOrder } from '@/orders'

// 주문서 → POST /orders. 결제는 시연용이라 생략
export default function OrderSheet({ open, onOpenChange, design }: { open: boolean; onOpenChange: (v: boolean) => void; design: Design }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const price = priceOf(design)
  const valid = name.trim().length > 0 && /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim())

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || sending) return
    setSending(true)
    try {
      const order = await createOrder({ name: name.trim(), phone: phone.trim(), design })
      setDone(order.no)
      toast.success('주문이 접수됐어요', { description: `주문번호 ${order.no}` })
    } catch (err) {
      toast.error('주문하지 못했어요', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSending(false)
    }
  }

  const close = (v: boolean) => {
    onOpenChange(v)
    if (!v) setDone(null)
  }

  const summary = [
    ['모양', SHAPES.find((s) => s.id === design.shape)!.label],
    ['색', `${COLORS.find((c) => c.hex === design.color)?.name ?? design.color} / ${COLORS.find((c) => c.hex === design.accent)?.name ?? design.accent}`],
    ['패턴', PATTERNS.find((p) => p.id === design.pattern)!.label],
    ['문구', design.text.trim() || '없음'],
    ['식물', PLANTS.find((p) => p.id === design.plant)!.label],
  ]

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-l-2 border-forest bg-paper sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="display text-4xl text-forest">{done ? 'Thank you!' : 'Order'}</SheetTitle>
          <SheetDescription className="text-forest/70">
            {done ? '제작팀에 제작지시서가 전달됐어요.' : '디자인을 확인하고 받는 분 정보를 적어 주세요.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="flex gap-4 rounded-3xl border-2 border-forest bg-card p-4">
            <div className="grid w-28 shrink-0 place-items-end rounded-2xl" style={{ background: `${design.accent}33` }}>
              <PotThumb design={design} className="w-full" />
            </div>
            <dl className="grid flex-1 grid-cols-[auto_1fr] content-center gap-x-3 gap-y-1 text-sm text-forest">
              {summary.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-forest/60">{k}</dt>
                  <dd className="truncate font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {done ? (
            <div className="space-y-4 rounded-3xl bg-lime p-6 text-forest">
              <PartyPopper className="size-8" />
              <p className="text-sm font-semibold text-forest/70">주문번호</p>
              <p className="display text-4xl">{done}</p>
              <ol className="space-y-1 text-sm">
                <li>✓ 주문 접수</li>
                <li className="opacity-50">○ 제작 중 (성형 · 유약 · 소성)</li>
                <li className="opacity-50">○ 포장 · 출고</li>
              </ol>
              <p className="text-sm text-forest/70">위쪽 메뉴의 <b>주문 조회</b>에서 이 번호로 진행 상황을 볼 수 있어요.</p>
            </div>
          ) : (
            <form id="order" onSubmit={submit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-forest">받는 분</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="h-12 rounded-xl border-2 border-forest/40 bg-card" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-forest">연락처</span>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="010-0000-0000" className="h-12 rounded-xl border-2 border-forest/40 bg-card" />
              </label>
              <Separator className="bg-forest/20" />
              <PriceLines price={price} />
            </form>
          )}
        </div>

        <SheetFooter className="mt-auto border-t-2 border-forest/10 p-6">
          {done ? (
            <Button size="lg" className="h-14 rounded-full text-base font-bold" onClick={() => close(false)}>
              하나 더 만들기
            </Button>
          ) : (
            <Button form="order" type="submit" size="lg" disabled={!valid || sending} className="h-14 rounded-full text-base font-bold">
              {sending ? '주문 보내는 중…' : '결제 없이 데모 주문하기'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
