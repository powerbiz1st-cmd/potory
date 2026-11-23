import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { ArrowUpRight } from 'lucide-react'
import HeroStudio, { NAV, lookOf, type Look } from './HeroStudio'
import PotStage from '@/three/PotStage'
import PotThumb from '@/components/PotThumb'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DEFAULT_DESIGN, PLANT, SHAPES, encodeDesign, won, type Design } from '@/design'
import { prefersReducedMotion } from '@/hooks'
import { galleryImg } from '@/orders'
import { preloadPlant } from '@/three/ModelPlant'

// 시안 B "스튜디오 오브젝트" 전체 랜딩 (#/studio)
// 첫 화면에서 고른 유약 색이 페이지 끝까지 배경·글자색으로 이어집니다.
gsap.registerPlugin(ScrollTrigger)
preloadPlant('monstera')

const EN: Record<Design['shape'], string> = { cylinder: 'CYLINDER', tapered: 'TAPERED', round: 'ROUND', glass: 'GLASS' }

const STEPS = [
  ['모양을 고르고', '실린더, 테이퍼, 라운드, 투명 글라스. 360° 돌려 보면서 공간에 맞는 모양을 골라요.'],
  ['색과 이름을 입히고', '유약 8색, 패턴 5종, 그리고 10자까지 새길 수 있는 나만의 문구.'],
  ['심어서 보내 드려요', '주문 즉시 제작지시서가 공방으로. 몬스테라를 심어 3–5 영업일 안에 출고해요.'],
] as const

const IMG = galleryImg
const MADE: { name: string; by: string; img: string; pos?: string; design: Design }[] = [
  { name: '화이트 페데스탈', by: '@hong.pot', img: IMG(1), pos: '50% 78%', design: DEFAULT_DESIGN },
  { name: '샌드 아워글라스', by: '@mint_jy', img: IMG(2), design: { ...DEFAULT_DESIGN, shape: 'round', color: '#DCD3C3' } },
  { name: '코랄 핑크', by: '@studio_k', img: IMG(3), design: { ...DEFAULT_DESIGN, shape: 'tapered', color: '#C46A43' } },
  { name: '차콜 실린더', by: '@daily_green', img: IMG(4), design: { ...DEFAULT_DESIGN, color: '#2A2A2A', textColor: '#F2F0EB' } },
]

const FAQ = [
  ['얼마나 걸려요?', '주문하고 3~5 영업일이면 출고돼요. 문구를 넣어도 같아요.'],
  ['화면에서 본 색이랑 똑같이 나와요?', '도자기 유약이라서 조금 차이가 날 수 있어요. 받아 보고 마음에 안 들면 한 번 무료로 다시 만들어 드려요.'],
  ['식물도 같이 와요?', '모든 화분에 몬스테라가 심어져서 와요. 받자마자 바로 놓기만 하면 돼요.'],
  ['디자인을 친구한테 보낼 수 있어요?', '만들기 화면의 "공유" 버튼을 누르면 링크가 복사돼요. 친구가 그 링크를 열면 같은 화분에서 시작해요.'],
] as const

// 섹션 머리말: 작은 번호 + 큰 넓은 글자
function Eyebrow({ n, title, look }: { n: string; title: string; look: Look }) {
  return (
    <div className="flex items-baseline gap-4 md:gap-6" data-reveal>
      <span className="text-xs font-medium tracking-[0.2em]" style={{ color: look.dim }}>({n})</span>
      <h2 className="studio-wide text-[clamp(2.6rem,7.5vw,7.5rem)] leading-[0.9]">{title}</h2>
    </div>
  )
}

// 갤러리 사진은 로컬 시연용(git 제외) → 없으면 화분 그림으로 대체
function MadeImage({ p, look }: { p: (typeof MADE)[number]; look: Look }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className="flex size-full items-end justify-center" style={{ background: `color-mix(in srgb, ${look.ink} 6%, ${look.bg})` }}>
        <PotThumb design={p.design} className="w-[74%] transition-transform duration-700 group-hover:scale-105" />
      </div>
    )
  return (
    <img
      src={p.img}
      alt={`${p.name} 몬스테라 화분`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      style={{ objectPosition: p.pos ?? '50% 60%' }}
    />
  )
}

export default function LandingStudio() {
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN)
  const root = useRef<HTMLDivElement>(null)
  const look = lookOf(design.color)
  const inverse: Look = { bg: look.ink, ink: look.bg, dim: `color-mix(in srgb, ${look.bg} 70%, transparent)` }
  const line = `color-mix(in srgb, ${look.ink} 18%, transparent)`
  const minPrice = Math.min(...SHAPES.map((s) => s.price)) + PLANT.price

  // 부드러운 스크롤 + 섹션이 화면에 들어올 때 살짝 떠오르기
  useEffect(() => {
    if (prefersReducedMotion()) return
    const lenis = new Lenis()
    lenis.on('scroll', ScrollTrigger.update)
    let id = 0
    const raf = (t: number) => {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, { y: 48, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.from('[data-tile]', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#made', start: 'top 70%' } })
    }, root)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      ctx.revert()
    }
  }, [])

  return (
    <div
      ref={root}
      className="break-keep transition-colors duration-700 ease-out"
      style={{ background: look.bg, color: look.ink, fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif' }}
    >
      <HeroStudio design={design} setDesign={setDesign} />

      {/* (01) 모양 — 왼쪽 큰 목록, 오른쪽 3D */}
      <section id="forms" className="border-t px-5 pt-20 pb-16 md:px-10 md:pt-32 md:pb-24" style={{ borderColor: line }}>
        <Eyebrow n="01" title="FOUR FORMS" look={look} />
        <div className="mt-10 grid gap-8 md:mt-16 md:grid-cols-[1.1fr_1fr] md:gap-12">
          <ul className="flex flex-col border-t" style={{ borderColor: line }} data-reveal>
            {SHAPES.map((s, i) => {
              const on = s.id === design.shape
              return (
                <li key={s.id} className="border-b" style={{ borderColor: line }}>
                  <button
                    type="button"
                    onClick={() => setDesign((d) => ({ ...d, shape: s.id }))}
                    aria-pressed={on}
                    className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-5 text-left md:grid-cols-[4rem_1fr_auto] md:py-7"
                  >
                    <span className="text-xs font-medium tracking-[0.2em]" style={{ color: look.dim }}>0{i + 1}</span>
                    <span className="flex flex-col gap-1">
                      <span
                        className="studio-wide text-[clamp(1.9rem,4.6vw,4.4rem)] leading-none transition-colors duration-300"
                        style={on ? { color: look.ink } : { color: 'transparent', WebkitTextStroke: `1px ${look.ink}` }}
                      >
                        {EN[s.id]}
                      </span>
                      <span className="text-sm" style={{ color: look.dim }}>{s.label} — {s.desc}</span>
                    </span>
                    <span className="text-sm font-medium tabular-nums md:text-base">{won(s.price)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="relative aspect-square w-full self-start md:sticky md:top-10 md:max-h-[86svh]" data-reveal>
            <div className="absolute inset-0 rounded-[2rem]" style={{ background: `color-mix(in srgb, ${look.ink} 5%, transparent)` }} />
            <div className="absolute inset-0">
              <PotStage design={design} />
            </div>
            <p className="absolute bottom-5 left-6 text-xs font-medium tracking-[0.18em]" style={{ color: look.dim }}>
              {EN[design.shape]} — 몬스테라 포함 {won(SHAPES.find((s) => s.id === design.shape)!.price + PLANT.price)}
            </p>
          </div>
        </div>
      </section>

      {/* (02) 이용 방법 — 색을 반전한 띠 */}
      <section id="process" className="px-5 py-20 md:px-10 md:py-32" style={{ background: inverse.bg, color: inverse.ink }}>
        <Eyebrow n="02" title="HOW IT WORKS" look={inverse} />
        <ol className="mt-12 grid gap-px md:mt-20 md:grid-cols-3" style={{ background: `color-mix(in srgb, ${inverse.ink} 22%, transparent)` }}>
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-10 p-6 md:min-h-[22rem] md:p-8" style={{ background: inverse.bg }} data-reveal>
              <span className="studio-wide text-[clamp(4rem,9vw,8rem)] leading-none text-transparent" style={{ WebkitTextStroke: `1.5px ${inverse.ink}` }}>
                0{i + 1}
              </span>
              <div className="mt-auto flex flex-col gap-3">
                <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                <p className="max-w-xs leading-relaxed" style={{ color: inverse.dim }}>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* (03) 갤러리 — 촘촘한 타일 */}
      <section id="made" className="px-5 pt-20 pb-16 md:px-10 md:pt-32 md:pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Eyebrow n="03" title="MADE BY YOU" look={look} />
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: look.dim }} data-reveal>
            다른 사람이 만든 화분이에요. 누르면 그 디자인에서 바로 시작해요.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-1.5 md:mt-16 lg:grid-cols-4">
          {MADE.map((p) => (
            <a key={p.name} href={`#/make?d=${encodeDesign(p.design)}`} className="group flex flex-col gap-3" data-tile>
              <div className="aspect-[4/5] overflow-hidden">
                <MadeImage p={p} look={look} />
              </div>
              <div className="flex items-start justify-between gap-2 px-0.5 pb-4">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm" style={{ color: look.dim }}>{p.by}</p>
                </div>
                <ArrowUpRight className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* (04) FAQ */}
      <section id="faq" className="grid gap-10 border-t px-5 pt-20 pb-24 md:grid-cols-[1fr_1.3fr] md:px-10 md:pt-32 md:pb-32" style={{ borderColor: line }}>
        <Eyebrow n="04" title="FAQ" look={look} />
        <Accordion type="single" collapsible className="w-full border-t" style={{ borderColor: line }} data-reveal>
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q} className="border-b" style={{ borderColor: line }}>
              <AccordionTrigger className="py-6 text-lg font-semibold hover:no-underline md:text-xl">{q}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed" style={{ color: look.dim }}>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 푸터 — 화면 폭을 꽉 채우는 워드마크 */}
      <footer className="overflow-hidden px-5 pt-16 pb-6 md:px-10 md:pt-24" style={{ background: inverse.bg, color: inverse.ink }}>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between" data-reveal>
          <p className="max-w-md text-2xl leading-snug font-semibold tracking-tight md:text-3xl">
            고른 색 그대로, 지금 바로 만들어 보세요.
            <span className="mt-2 block text-base font-normal" style={{ color: inverse.dim }}>{won(minPrice)}부터 · 몬스테라 포함</span>
          </p>
          <Button asChild size="lg" className="h-13 w-fit rounded-full pr-2 pl-6 text-base font-semibold" style={{ background: inverse.ink, color: inverse.bg }}>
            <a href={`#/make?d=${encodeDesign(design)}`}>
              내 화분 만들기
              <span className="ml-2 grid size-9 place-items-center rounded-full" style={{ background: inverse.bg, color: inverse.ink }}>
                <ArrowUpRight className="size-4" />
              </span>
            </a>
          </Button>
        </div>
        <nav className="mt-14 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: inverse.dim }}>
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="hover:opacity-70">{label}</a>
          ))}
        </nav>
        <p aria-hidden className="studio-wide mt-6 text-center text-[17vw] leading-[0.78] whitespace-nowrap select-none">POTORY</p>
        <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs" style={{ color: inverse.dim }}>
          <span>© 2026 POTORY · 포트폴리오 데모</span>
          <span>Shop · Admin · Console</span>
        </div>
      </footer>
    </div>
  )
}
