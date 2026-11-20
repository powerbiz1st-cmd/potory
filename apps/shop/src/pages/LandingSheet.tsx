import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowRight } from 'lucide-react'
import PotStage from '@/three/PotStage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { COLORS, DEFAULT_DESIGN, PATTERNS, PLANT, SHAPES, TEXT_MAX, TEXT_PRICE, encodeDesign, isDark, priceOf, won, type Design } from '@/design'
import { prefersReducedMotion } from '@/hooks'
import { preloadPlant } from '@/three/ModelPlant'
import { cn } from '@/lib/utils'

// 시안 C "제작지시서" (#/sheet)
// 첫 화면이 곧 한 장짜리 주문 서식. 칸을 채우면 도면 칸의 3D 화분과 합계가 바로 바뀌고, 의뢰하면 '접수' 도장이 찍힘.
// 레퍼런스: Plus X(격자·여백·정보 위계) / Royden So(작업물을 실물처럼) / 스위스 그리드 서식
preloadPlant('monstera')

const P = {
  paper: '#F3F2EE',
  ink: '#121212',
  dim: '#12121299',
  line: '#1212121f',
  signal: '#FF4F1F',
}

const today = new Date()
const ORDER_NO = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-0001`

// 서식 한 칸: 왼쪽 위 번호·제목 + 내용
function Field({ no, title, hint, className, children }: { no: string; title: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-3 p-4 md:p-5', className)} style={{ boxShadow: `inset -1px -1px 0 ${P.line}` }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold">
          <span className="mr-2 tabular-nums" style={{ color: P.signal }}>{no}</span>
          {title}
        </p>
        {hint && <span className="text-xs tabular-nums" style={{ color: P.dim }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// 선택 칩 공통
const chip =
  'h-auto min-h-11 justify-start rounded-none! border px-3 py-2 text-left text-sm font-medium shadow-none hover:bg-black/5 data-[state=on]:bg-[#121212] data-[state=on]:text-[#F3F2EE]'

export default function LandingSheet() {
  const [design, setDesign] = useState<Design>({ ...DEFAULT_DESIGN, color: '#DCD3C3' })
  const [stamped, setStamped] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const price = useMemo(() => priceOf(design), [design])
  const set = <K extends keyof Design>(k: K, v: Design[K]) => setDesign((d) => ({ ...d, [k]: v }))
  const shape = SHAPES.find((s) => s.id === design.shape)!
  const color = COLORS.find((c) => c.hex === design.color)!

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-cell]', { opacity: 0, y: 16, duration: 0.8, ease: 'power3.out', stagger: 0.05 })
      gsap.from('[data-headline] > *', { yPercent: 100, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.1 })
    }, root)
    return () => ctx.revert()
  }, [])

  // 의뢰: 도장이 찍힌 뒤 만들기 화면으로 (고른 디자인 그대로)
  const submit = () => {
    setStamped(true)
    setTimeout(() => {
      location.hash = `#/make?d=${encodeDesign(design)}`
    }, 900)
  }

  return (
    <div ref={root} className="min-h-svh break-keep p-3 md:p-6" style={{ background: '#E4E2DC', color: P.ink, fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif' }}>
      <div className="relative mx-auto max-w-[1440px] overflow-hidden" style={{ background: P.paper, boxShadow: `inset 0 0 0 1px ${P.line}, 0 30px 60px -30px #0000004d` }}>
        {/* 머리줄 */}
        <header data-cell className="grid grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1fr]" style={{ boxShadow: `inset 0 -1px 0 ${P.ink}` }}>
          <a href="#/sheet" className="flex items-center p-4 text-xl font-extrabold tracking-[-0.04em] md:p-5 md:text-2xl">POTORY</a>
          <div className="flex flex-col justify-center p-4 text-right md:p-5 md:text-left" style={{ boxShadow: `inset 1px 0 0 ${P.line}` }}>
            <span className="text-xs" style={{ color: P.dim }}>문서</span>
            <span className="text-sm font-semibold">화분 제작지시서</span>
          </div>
          <div className="hidden flex-col justify-center p-5 md:flex" style={{ boxShadow: `inset 1px 0 0 ${P.line}` }}>
            <span className="text-xs" style={{ color: P.dim }}>지시서 번호</span>
            <span className="text-sm font-semibold tabular-nums">No. {ORDER_NO}</span>
          </div>
          <div className="hidden flex-col justify-center p-5 md:flex" style={{ boxShadow: `inset 1px 0 0 ${P.line}` }}>
            <span className="text-xs" style={{ color: P.dim }}>의뢰인</span>
            <span className="text-sm font-semibold">당신</span>
          </div>
        </header>

        <div className="grid md:grid-cols-[1.25fr_1fr]">
          {/* 왼쪽: 제목 + 도면 */}
          <div className="flex flex-col" style={{ boxShadow: `inset -1px 0 0 ${P.ink}` }}>
            <div className="p-5 md:p-8" style={{ boxShadow: `inset 0 -1px 0 ${P.line}` }}>
              <h1 data-headline className="text-[clamp(2.1rem,4.4vw,4.4rem)] leading-[1.08] font-bold tracking-[-0.045em]">
                <span className="block overflow-hidden"><span className="block">세상에 하나뿐인 화분,</span></span>
                <span className="block overflow-hidden"><span className="block">지시서 한 장이면 돼요.</span></span>
              </h1>
              <p data-cell className="mt-4 max-w-md text-[15px] leading-relaxed md:text-base" style={{ color: P.dim }}>
                01부터 05까지 칸을 채우면 도면이 바로 바뀌어요. 의뢰하면 이 지시서 그대로 공방에 전달되고, 3–5 영업일 안에 몬스테라를 심어 보내 드려요.
              </p>
            </div>

            {/* 도면 칸 */}
            <figure data-cell className="relative m-0 min-h-[56svh] flex-1 md:min-h-[60svh]" style={{ backgroundImage: `radial-gradient(${P.line} 1px, transparent 1px)`, backgroundSize: '18px 18px' }}>
              <figcaption className="absolute top-4 left-5 z-10 flex flex-col gap-0.5 text-xs md:top-5 md:left-6">
                <span className="font-semibold">FIG. 01 — 정면도</span>
                <span style={{ color: P.dim }}>{shape.label} · {color.name} 유약{design.pattern !== 'none' ? ` · ${PATTERNS.find((p) => p.id === design.pattern)!.label}` : ''}</span>
              </figcaption>
              <span className="absolute top-4 right-5 z-10 text-xs md:top-5 md:right-6" style={{ color: P.dim }}>드래그해서 360° 확인</span>
              {/* 모서리 재단선 */}
              {['top-10 left-10 border-t border-l', 'top-10 right-10 border-t border-r', 'bottom-10 left-10 border-b border-l', 'bottom-10 right-10 border-b border-r'].map((c) => (
                <span key={c} aria-hidden className={cn('absolute size-5', c)} style={{ borderColor: P.ink }} />
              ))}
              {/* 치수선 */}
              <div aria-hidden className="absolute top-[18%] bottom-[14%] left-[14%] hidden w-px md:block" style={{ background: P.ink }}>
                <span className="absolute -top-px -left-2 h-px w-4" style={{ background: P.ink }} />
                <span className="absolute -bottom-px -left-2 h-px w-4" style={{ background: P.ink }} />
                <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[11px] whitespace-nowrap" style={{ color: P.dim }}>높이 · 식물 포함</span>
              </div>
              <div className="absolute inset-x-[4%] top-[4%] bottom-[2%]">
                <PotStage design={design} interactive />
              </div>
              {/* 접수 도장 */}
              <div
                aria-hidden={!stamped}
                className={cn(
                  'pointer-events-none absolute right-[8%] bottom-[12%] z-20 grid size-36 -rotate-12 place-items-center rounded-full border-[3px] text-center transition-all duration-300 ease-out md:size-44',
                  stamped ? 'scale-100 opacity-100' : 'scale-150 opacity-0',
                )}
                style={{ borderColor: P.signal, color: P.signal }}
              >
                <span className="flex flex-col items-center leading-none">
                  <span className="text-[11px] font-semibold tracking-[0.2em]">POTORY</span>
                  <span className="my-1.5 text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">접수</span>
                  <span className="text-[11px] font-semibold tabular-nums">{ORDER_NO}</span>
                </span>
              </div>
            </figure>
          </div>

          {/* 오른쪽: 기입란 */}
          <div className="grid content-start" style={{ boxShadow: `inset 0 1px 0 ${P.ink}` }}>
            <Field no="01" title="모양" hint={won(shape.price)}>
              <ToggleGroup type="single" value={design.shape} onValueChange={(v) => v && set('shape', v as Design['shape'])} className="grid w-full grid-cols-2 gap-0" aria-label="모양">
                {SHAPES.map((s) => (
                  <ToggleGroupItem key={s.id} value={s.id} className={cn(chip, '-mt-px -ml-px flex flex-col items-start gap-0')} style={{ borderColor: P.line }}>
                    <span>{s.label}</span>
                    <span className="text-xs font-normal opacity-70">{s.desc}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field no="02" title="유약 색" hint={color.name}>
              <ToggleGroup type="single" value={design.color} onValueChange={(v) => v && setDesign((d) => ({ ...d, color: v, textColor: isDark(v) ? '#F2F0EB' : '#2F4A3A' }))} spacing={1.5} className="grid w-full grid-cols-8" aria-label="유약 색">
                {COLORS.map((c) => (
                  <ToggleGroupItem
                    key={c.hex}
                    value={c.hex}
                    aria-label={c.name}
                    className="aspect-square h-auto w-full min-w-0 rounded-none! border p-0 hover:bg-transparent data-[state=on]:bg-transparent"
                    style={{ background: c.hex, borderColor: P.line, boxShadow: design.color === c.hex ? `inset 0 0 0 2px ${P.paper}, 0 0 0 2px ${P.ink}` : undefined }}
                  />
                ))}
              </ToggleGroup>
            </Field>

            <Field no="03" title="패턴" hint={design.pattern === 'none' ? '추가 없음' : `+${won(2000)}`}>
              <ToggleGroup type="single" value={design.pattern} onValueChange={(v) => v && set('pattern', v as Design['pattern'])} className="grid w-full grid-cols-5 gap-0" aria-label="패턴">
                {PATTERNS.map((p) => (
                  <ToggleGroupItem key={p.id} value={p.id} className={cn(chip, '-ml-px justify-center px-1 text-center')} style={{ borderColor: P.line }}>
                    {p.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field no="04" title="새길 문구" hint={`${design.text.length}/${TEXT_MAX} · +${won(TEXT_PRICE)}`}>
              <label htmlFor="sheet-text" className="sr-only">새길 문구</label>
              <Input
                id="sheet-text"
                value={design.text}
                maxLength={TEXT_MAX}
                placeholder="비워 두면 문구 없이 만들어요"
                onChange={(e) => set('text', e.target.value)}
                className="h-11 rounded-none border-0 border-b bg-transparent px-0 text-base shadow-none placeholder:text-[#12121266] focus-visible:ring-0"
                style={{ borderColor: P.ink }}
              />
            </Field>

            <Field no="05" title="식물">
              <p className="text-sm">
                몬스테라 <span className="tabular-nums" style={{ color: P.dim }}>— {won(PLANT.price)}, 모든 화분에 기본 포함</span>
              </p>
            </Field>

            {/* 합계 + 의뢰 */}
            <div className="flex flex-col gap-5 p-5 md:p-6" style={{ background: P.ink, color: P.paper }}>
              <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm tabular-nums" style={{ color: '#F3F2EEb3' }}>
                <dt>모양 · {shape.label}</dt><dd>{won(price.shape)}</dd>
                <dt>식물 · 몬스테라</dt><dd>{won(price.plant)}</dd>
                {price.pattern > 0 && (<><dt>패턴</dt><dd>{won(price.pattern)}</dd></>)}
                {price.text > 0 && (<><dt>문구</dt><dd>{won(price.text)}</dd></>)}
              </dl>
              <div className="flex flex-wrap items-end justify-between gap-4 pt-4" style={{ boxShadow: 'inset 0 1px 0 #F3F2EE33' }}>
                <div>
                  <p className="text-xs" style={{ color: '#F3F2EEb3' }}>합계 · 3–5 영업일 출고</p>
                  <p className="text-[clamp(2.2rem,3.6vw,3.2rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{won(price.total)}</p>
                </div>
                <Button onClick={submit} disabled={stamped} className="h-13 rounded-none px-6 text-base font-bold disabled:opacity-100" style={{ background: P.signal, color: P.ink }}>
                  {stamped ? '접수됐어요' : '이대로 제작 의뢰'} <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 바닥줄 */}
        <footer data-cell className="flex flex-wrap justify-between gap-2 px-5 py-3 text-xs" style={{ color: P.dim, boxShadow: `inset 0 1px 0 ${P.ink}` }}>
          <span>© 2026 POTORY · 포트폴리오 데모</span>
          <span>이 지시서는 주문 즉시 관리자 화면의 제작지시서로 넘어가요</span>
        </footer>
      </div>
    </div>
  )
}
