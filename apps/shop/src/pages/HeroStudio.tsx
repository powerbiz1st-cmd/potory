import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import PotStage from '@/three/PotStage'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { COLORS, PLANT, SHAPES, encodeDesign, won, type Design } from '@/design'
import { prefersReducedMotion } from '@/hooks'
import { cn } from '@/lib/utils'

// 시안 B "스튜디오 오브젝트"의 첫 화면
// 레퍼런스에서 가져온 원칙: 제품 하나가 주인공 / 거대한 타이포 위에 제품을 겹쳐 깊이감 / 배경색을 제품 색에 맞춘 스튜디오 톤 / 정보는 모서리에 작게

export type Look = { bg: string; ink: string; dim: string }

// 유약 색마다 어울리는 스튜디오 배경(bg)과 글자색(ink)
export const BACKDROP: Record<string, Look> = {
  '#F2F0EB': { bg: '#E7E4DC', ink: '#161614', dim: '#161614a6' },
  '#DCD3C3': { bg: '#E9DFCF', ink: '#2A2118', dim: '#2A2118a6' },
  '#C46A43': { bg: '#EBCDB9', ink: '#4A1D0C', dim: '#4A1D0Cb3' },
  '#A3B19A': { bg: '#D3DBCB', ink: '#1C2A1A', dim: '#1C2A1Aa6' },
  '#8FA9BF': { bg: '#D0DBE6', ink: '#15222E', dim: '#15222Ea6' },
  '#2F4A3A': { bg: '#16241C', ink: '#DCE8D3', dim: '#DCE8D3b3' },
  '#2A2A2A': { bg: '#161615', ink: '#ECE9E2', dim: '#ECE9E2b3' },
  '#B8FF00': { bg: '#0B4A0A', ink: '#B8FF00', dim: '#B8FF00cc' },
}
export const lookOf = (hex: string) => BACKDROP[hex] ?? BACKDROP['#F2F0EB']

export const NAV = [
  ['#forms', '모양'],
  ['#process', '이용 방법'],
  ['#made', '갤러리'],
  ['#faq', 'FAQ'],
] as const

export default function HeroStudio({ design, setDesign }: { design: Design; setDesign: (f: (d: Design) => Design) => void }) {
  const root = useRef<HTMLElement>(null)
  const look = lookOf(design.color)
  const color = COLORS.find((c) => c.hex === design.color)!
  const shape = SHAPES.find((s) => s.id === design.shape)!
  const minPrice = Math.min(...SHAPES.map((s) => s.price)) + PLANT.price

  // 등장: 큰 글자가 아래에서 올라오고, 모서리 정보가 뒤따라 나타남
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-word]', { yPercent: 100, duration: 1.1, ease: 'expo.out', stagger: 0.09 })
      gsap.from('[data-stage]', { opacity: 0, y: 40, scale: 0.96, duration: 1.4, ease: 'expo.out', delay: 0.25 })
      gsap.from('[data-meta]', { opacity: 0, y: 12, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.6 })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative flex min-h-svh flex-col overflow-hidden">
      {/* 상단 바 */}
      <header data-meta className="relative z-30 flex items-center justify-between px-5 pt-5 md:px-10 md:pt-7">
        <a href="#/studio" className="studio-wide text-xl tracking-tight md:text-2xl" style={{ color: look.ink }}>
          POTORY<sup className="ml-0.5 text-[0.5em]">®</sup>
        </a>
        <nav className="flex items-center gap-1 text-sm md:gap-6">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="hidden font-medium transition-opacity hover:opacity-60 md:inline" style={{ color: look.dim }}>
              {label}
            </a>
          ))}
          <Button asChild className="h-11 rounded-full px-5 font-semibold" style={{ background: look.ink, color: look.bg }}>
            <a href={`#/make?d=${encodeDesign(design)}`}>만들기</a>
          </Button>
        </nav>
      </header>

      {/* 거대한 타이포 (화분 뒤) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[13svh] z-0 select-none px-3 md:top-[9svh] md:px-8">
        <div className="overflow-hidden">
          <p data-word className="studio-wide text-center text-[min(16.5vw,19rem)] leading-[0.84] whitespace-nowrap">MAKE IT</p>
        </div>
        <div className="overflow-hidden">
          <p
            data-word
            className="studio-wide text-center text-[min(16.5vw,19rem)] leading-[0.84] whitespace-nowrap text-transparent"
            style={{ WebkitTextStroke: `clamp(1px, 0.18vw, 3px) ${look.ink}` }}
          >
            YOURS.
          </p>
        </div>
      </div>

      {/* 3D 화분 (타이포 위에 겹침) */}
      <div
        data-stage
        className="absolute top-[46%] left-1/2 z-10 h-[54svh] w-[min(94vw,52svh)] -translate-x-1/2 -translate-y-1/2 md:top-[48%] md:h-[74svh] md:w-[min(60vw,72svh)]"
      >
        <PotStage design={design} />
      </div>

      <span data-meta className="absolute top-[56%] right-5 z-20 hidden text-xs font-medium tracking-[0.18em] md:right-10 md:block" style={{ color: look.dim }}>
        DRAG TO ROTATE ↻
      </span>

      {/* 하단 정보 — 모서리에 작게 */}
      <div className="relative z-20 mt-auto grid gap-6 px-5 pb-6 md:grid-cols-[1fr_auto_1fr] md:items-end md:px-10 md:pb-9">
        <div data-meta className="flex max-w-sm flex-col gap-4">
          <p className="hidden text-[15px] leading-relaxed md:block md:text-base" style={{ color: look.dim }}>
            모양, 유약, 패턴, 새길 문구까지.
            <br />
            직접 골라 만드는 세상에 하나뿐인 화분.
          </p>
          <Button asChild size="lg" className="h-13 w-fit rounded-full pr-2 pl-6 text-base font-semibold" style={{ background: look.ink, color: look.bg }}>
            <a href={`#/make?d=${encodeDesign(design)}`}>
              지금 만들기
              <span className="ml-2 grid size-9 place-items-center rounded-full" style={{ background: look.bg, color: look.ink }}>
                <ArrowUpRight className="size-4" />
              </span>
            </a>
          </Button>
        </div>

        <div data-meta className="flex flex-col items-start gap-2 md:items-center">
          <span className="text-xs font-medium tracking-[0.18em]" style={{ color: look.dim }}>GLAZE — {color.name}</span>
          <ToggleGroup
            type="single"
            value={design.color}
            onValueChange={(v) => v && setDesign((d) => ({ ...d, color: v, textColor: lookOf(v).ink }))}
            spacing={2}
            className="flex-wrap rounded-full p-1.5 backdrop-blur"
            style={{ background: `color-mix(in srgb, ${look.ink} 8%, transparent)` }}
            aria-label="유약 색"
          >
            {COLORS.map((c) => (
              <ToggleGroupItem
                key={c.hex}
                value={c.hex}
                aria-label={c.name}
                className={cn('size-9 rounded-full border p-0 transition-transform hover:scale-110 hover:bg-transparent data-[state=on]:scale-110 data-[state=on]:bg-transparent md:size-10')}
                style={{
                  background: c.hex,
                  borderColor: `color-mix(in srgb, ${look.ink} 25%, transparent)`,
                  boxShadow: design.color === c.hex ? `0 0 0 2px ${look.bg}, 0 0 0 4px ${look.ink}` : undefined,
                }}
              />
            ))}
          </ToggleGroup>
        </div>

        <dl data-meta className="hidden flex-col items-end gap-1 text-right text-sm md:flex">
          <dt className="sr-only">선택한 화분</dt>
          <dd className="studio-wide text-base">N°01 — {shape.label} / {color.name}</dd>
          <dt className="sr-only">가격</dt>
          <dd style={{ color: look.dim }}>{won(minPrice)}부터 · 몬스테라 포함 · 3–5일 출고</dd>
        </dl>
      </div>
    </section>
  )
}
