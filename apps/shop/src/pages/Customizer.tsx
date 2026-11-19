import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Check, Link2, RotateCcw, Shuffle, ShoppingBag } from 'lucide-react'
import PotStage from '@/three/PotStage'
import SiteHeader from '@/components/SiteHeader'
import OrderSheet from '@/components/OrderSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  COLORS, DEFAULT_DESIGN, PATTERNS, PLANTS, SHAPES, TEXT_MAX, TEXT_PRICE,
  decodeDesign, encodeDesign, priceOf, randomDesign, won, type Design,
} from '@/design'

const TEXT_COLORS = [
  { hex: '#0B4A0A', name: '포레스트' },
  { hex: '#FFFFFF', name: '화이트' },
  { hex: '#191919', name: '블랙' },
  { hex: '#B8FF00', name: '라임' },
  { hex: '#FF7A1A', name: '오렌지' },
]

function designFromHash(): Design {
  const m = location.hash.match(/[?&]d=([^&]+)/)
  return decodeDesign(m ? m[1] : null) ?? DEFAULT_DESIGN
}

// 칩 모양 선택 버튼 공통 스타일
const chip =
  'h-auto rounded-2xl border-2 border-forest/15 bg-card px-4 py-3 text-forest data-[state=on]:border-forest data-[state=on]:bg-lime data-[state=on]:text-forest data-[state=on]:shadow-[3px_3px_0_var(--forest)] hover:bg-lime/40 hover:text-forest'

function Swatches({ value, onChange, colors, label }: { value: string; onChange: (v: string) => void; colors: { hex: string; name: string }[]; label: string }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v)} spacing={2} className="flex-wrap" aria-label={label}>
      {colors.map((c) => (
        <Tooltip key={c.hex}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={c.hex}
              aria-label={c.name}
              className="size-12 rounded-full border-2 border-forest/20 p-0 data-[state=on]:border-forest data-[state=on]:bg-transparent data-[state=on]:ring-4 data-[state=on]:ring-lime hover:bg-transparent"
              style={{ background: c.hex }}
            >
              {value === c.hex && <Check className={cn('size-5', ['#0B4A0A', '#2F3BA8', '#191919'].includes(c.hex) ? 'text-white' : 'text-forest')} />}
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{c.name}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-kr-display text-lg text-forest">{title}</h3>
        {hint && <span className="text-sm text-forest/60">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function Customizer() {
  const [design, setDesign] = useState<Design>(designFromHash)
  const [orderOpen, setOrderOpen] = useState(false)
  const price = useMemo(() => priceOf(design), [design])
  const set = <K extends keyof Design>(k: K, v: Design[K]) => setDesign((d) => ({ ...d, [k]: v }))

  // 새로고침해도 디자인이 유지되도록 주소에 반영
  useEffect(() => {
    const next = `#/make?d=${encodeDesign(design)}`
    if (location.hash !== next) history.replaceState(null, '', next)
  }, [design])

  const share = async () => {
    const url = location.href
    try {
      if (navigator.share) await navigator.share({ title: 'POTORY — 내가 만든 화분', url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('링크를 복사했어요', { description: '친구가 열면 이 화분에서 시작해요.' })
      }
    } catch {
      /* 사용자가 공유 창을 닫은 경우 */
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        right={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="rounded-full font-semibold" asChild>
              <a href="#/"><ArrowLeft /> 처음으로</a>
            </Button>
          </div>
        }
      />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-0 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-8 md:px-8 md:py-6">
        {/* 3D 미리보기 */}
        <section className="relative h-[52dvh] min-w-0 md:sticky md:top-22 md:h-[calc(100dvh-7.5rem)] md:rounded-[2rem] md:border-2 md:border-forest md:bg-card">
          <div className="absolute inset-x-[15%] top-[20%] bottom-[15%] rounded-full bg-lime/60 blur-3xl" aria-hidden />
          <PotStage design={design} interactive />
          <div className="absolute top-3 left-4 flex flex-col gap-1">
            <span className="display text-2xl text-forest md:text-3xl">{SHAPES.find((s) => s.id === design.shape)!.label} pot</span>
            <span className="font-hand text-lg text-forest/60">드래그해서 돌려 보세요</span>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-full border-2 border-forest bg-paper" onClick={() => setDesign(randomDesign())} aria-label="랜덤 디자인">
                  <Shuffle />
                </Button>
              </TooltipTrigger>
              <TooltipContent>랜덤</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-full border-2 border-forest bg-paper" onClick={() => setDesign(DEFAULT_DESIGN)} aria-label="처음 디자인으로">
                  <RotateCcw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>초기화</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" className="rounded-full" onClick={share} aria-label="공유">
                  <Link2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>공유</TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* 옵션 패널 */}
        <section className="relative z-10 min-w-0 -mt-6 rounded-t-[2rem] border-t-2 border-forest bg-paper px-4 pt-5 pb-32 md:mt-0 md:rounded-none md:border-0 md:bg-transparent md:px-0 md:pt-0 md:pb-10">
          <Tabs defaultValue="shape" className="gap-5">
            <TabsList className="h-auto w-full rounded-full border-2 border-forest bg-card p-1">
              {[
                ['shape', '모양'],
                ['color', '색'],
                ['pattern', '패턴'],
                ['text', '문구'],
                ['plant', '식물'],
              ].map(([v, l]) => (
                <TabsTrigger key={v} value={v} className="rounded-full py-2 text-[15px] font-bold data-[state=active]:bg-forest data-[state=active]:text-lime">
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="shape">
              <Section title="모양을 골라요" hint="모양마다 가격이 달라요">
                <ToggleGroup type="single" value={design.shape} onValueChange={(v) => v && set('shape', v as Design['shape'])} spacing={2} className="grid w-full grid-cols-2">
                  {SHAPES.map((s) => (
                    <ToggleGroupItem key={s.id} value={s.id} className={cn(chip, 'flex flex-col items-start gap-0.5')}>
                      <span className="text-base font-bold">{s.label}</span>
                      <span className="text-sm opacity-70">{won(s.price)}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Section>
            </TabsContent>

            <TabsContent value="color" className="space-y-7">
              <Section title="바탕색" hint={COLORS.find((c) => c.hex === design.color)?.name}>
                <Swatches value={design.color} onChange={(v) => set('color', v)} colors={COLORS} label="바탕색" />
              </Section>
              <Section title="포인트 색" hint="패턴에 쓰이는 색이에요">
                <Swatches value={design.accent} onChange={(v) => set('accent', v)} colors={COLORS} label="포인트 색" />
              </Section>
            </TabsContent>

            <TabsContent value="pattern">
              <Section title="패턴" hint={`패턴 추가 +${won(2000)}`}>
                <ToggleGroup type="single" value={design.pattern} onValueChange={(v) => v && set('pattern', v as Design['pattern'])} spacing={2} className="grid w-full grid-cols-3 sm:grid-cols-5 md:grid-cols-3 lg:grid-cols-5">
                  {PATTERNS.map((p) => (
                    <ToggleGroupItem key={p.id} value={p.id} className={cn(chip, 'flex flex-col gap-1 px-2')}>
                      <span className="font-bold">{p.label}</span>
                      <span className="text-xs opacity-70">{p.price ? `+${won(p.price)}` : '무료'}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Section>
            </TabsContent>

            <TabsContent value="text" className="space-y-7">
              <Section title="새길 문구" hint={`${design.text.length}/${TEXT_MAX}자 · +${won(TEXT_PRICE)}`}>
                <Input
                  value={design.text}
                  maxLength={TEXT_MAX}
                  onChange={(e) => set('text', e.target.value)}
                  placeholder="이름이나 짧은 문구"
                  className="h-14 rounded-2xl border-2 border-forest bg-card px-4 font-kr-display text-xl text-forest md:text-xl"
                />
                <div className="flex flex-wrap gap-2">
                  {['MY POT', '초록이', 'HELLO', '쑥쑥', 'GROW!'].map((t) => (
                    <Button key={t} variant="outline" size="sm" className="rounded-full border-forest/30 bg-transparent" onClick={() => set('text', t)}>
                      {t}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" className="rounded-full text-forest/60" onClick={() => set('text', '')}>
                    문구 없이
                  </Button>
                </div>
              </Section>
              <Section title="글자색">
                <Swatches value={design.textColor} onChange={(v) => set('textColor', v)} colors={TEXT_COLORS} label="글자색" />
              </Section>
            </TabsContent>

            <TabsContent value="plant">
              <Section title="함께 받을 식물">
                <ToggleGroup type="single" value={design.plant} onValueChange={(v) => v && set('plant', v as Design['plant'])} spacing={2} className="flex w-full flex-col">
                  {PLANTS.map((p) => (
                    <ToggleGroupItem key={p.id} value={p.id} className={cn(chip, 'flex w-full items-center justify-between')}>
                      <span className="flex flex-col items-start">
                        <span className="text-base font-bold">{p.label}</span>
                        <span className="text-sm font-normal opacity-70">{p.desc}</span>
                      </span>
                      <span className="font-bold">{p.price ? `+${won(p.price)}` : '기본'}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Section>
            </TabsContent>
          </Tabs>

          {/* 데스크톱: 패널 안 가격 요약 */}
          <div className="mt-8 hidden rounded-3xl border-2 border-forest bg-card p-5 shadow-[6px_6px_0_var(--forest)] md:block">
            <PriceLines price={price} />
            <Button size="lg" className="mt-4 h-14 w-full rounded-full text-base font-bold" onClick={() => setOrderOpen(true)}>
              <ShoppingBag /> {won(price.total)} 주문하기
            </Button>
          </div>
        </section>
      </main>

      {/* 모바일: 하단 고정 주문 바 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-forest bg-lime px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-forest/70">합계</p>
            <p className="display text-3xl text-forest">{won(price.total)}</p>
          </div>
          <Button size="lg" className="h-13 rounded-full px-7 text-base font-bold" onClick={() => setOrderOpen(true)}>
            <ShoppingBag /> 주문하기
          </Button>
        </div>
      </div>

      <OrderSheet open={orderOpen} onOpenChange={setOrderOpen} design={design} />
    </div>
  )
}

export function PriceLines({ price }: { price: ReturnType<typeof priceOf> }) {
  const rows: [string, number][] = [
    ['화분', price.shape],
    ['패턴', price.pattern],
    ['문구 각인', price.text],
    ['식물', price.plant],
  ]
  return (
    <dl className="space-y-1.5 text-forest">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm">
          <dt className="text-forest/70">{k}</dt>
          <dd className="font-semibold">{v ? won(v) : '—'}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t-2 border-dashed border-forest/30 pt-3">
        <dt className="font-bold">합계</dt>
        <dd className="display text-3xl">{won(price.total)}</dd>
      </div>
    </dl>
  )
}
