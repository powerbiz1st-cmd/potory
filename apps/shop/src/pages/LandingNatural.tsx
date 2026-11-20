import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { ArrowRight } from 'lucide-react'
import PotStage from '@/three/PotStage'
import PotThumb from '@/components/PotThumb'
import { Button } from '@/components/ui/button'
import { DEFAULT_DESIGN, PLANT, SHAPES, encodeDesign, won, type Design } from '@/design'
import { prefersReducedMotion } from '@/hooks'
import { preloadPlant } from '@/three/ModelPlant'

// 시안 C "흙과 빛" (#/natural)
// 레퍼런스: Concreta(세리프 워드마크 위에 걸친 오브제·흙갈색+세이지) / aarya.wtf(나뭇잎 그림자) /
// Flowers Sim(세리프+이탤릭 혼용, 고정폭 라벨) / Nettie's Bees(도는 도장 배지) / Kevala·21st(질감 이미지가 스크롤로 펼쳐짐)
gsap.registerPlugin(ScrollTrigger)
preloadPlant('monstera')

const C = {
  soil: '#24150E',
  soil2: '#2E1B12',
  sage: '#CAD9C4',
  sageDim: '#CAD9C4b8',
  clay: '#D9825B',
  cream: '#F1E9DC',
}

const HERO_POT: Design = { ...DEFAULT_DESIGN, shape: 'tapered', color: '#DCD3C3' }

// 창가 햇빛 사이로 드리운 잎 그림자 (흐리게 + 천천히 흔들림)
function LeafShadow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden mix-blend-multiply">
      <svg viewBox="0 0 1000 700" preserveAspectRatio="xMaxYMin slice" className="leaf-shadow absolute -top-[8%] -right-[6%] h-[115%] w-[115%] opacity-70" style={{ filter: 'blur(14px)' }}>
        <g fill="#0E0805">
          <path d="M1000 0 C900 60 860 120 820 210 C780 300 700 330 640 300 C700 250 720 180 760 130 C800 80 880 30 1000 0 Z" />
          <path d="M1000 120 C930 170 900 250 880 330 C860 410 800 450 740 440 C790 390 810 320 840 260 C870 200 930 150 1000 120 Z" />
          <path d="M760 0 C720 70 640 110 560 120 C480 130 440 90 450 40 C520 70 600 50 660 20 C700 0 740 -10 760 0 Z" />
          <path d="M1000 330 C960 380 960 450 930 520 C900 590 840 610 790 590 C840 550 860 490 880 440 C900 390 950 350 1000 330 Z" />
          <path d="M620 0 C600 60 540 100 470 110 C520 70 560 30 580 0 Z" />
          <path d="M820 210 L1000 60 M880 330 L1000 200 M560 120 L760 0" stroke="#0E0805" strokeWidth="6" />
        </g>
      </svg>
    </div>
  )
}

// 빙글빙글 도는 원형 도장 배지
function StampBadge() {
  return (
    <div className="relative size-28 md:size-36">
      <svg viewBox="0 0 120 120" className="spin-slow absolute inset-0 size-full" aria-hidden>
        <defs>
          <path id="stamp-circle" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" />
        </defs>
        <text className="nat-mono" fontSize="10.5" letterSpacing="3.2" fill={C.sage}>
          <textPath href="#stamp-circle">HANDMADE · ONE OF ONE · POTORY ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-[30%] grid place-items-center rounded-full" style={{ background: C.clay }}>
        <span className="nat-serif text-xl italic md:text-2xl" style={{ color: C.soil }}>1/1</span>
      </div>
    </div>
  )
}

// 갤러리 사진은 로컬 시연용(git 제외) → 없으면 화분 그림으로 대체
function GlazeImage() {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className="flex size-full items-end justify-center" style={{ background: C.soil2 }}>
        <PotThumb design={HERO_POT} className="w-[46%] max-w-md" />
      </div>
    )
  return (
    <img
      src={`${import.meta.env.BASE_URL}gallery/monstera-2.jpg`}
      alt="샌드 유약 화분에 심은 몬스테라"
      onError={() => setFailed(true)}
      className="size-full object-cover"
      style={{ objectPosition: '50% 62%' }}
    />
  )
}

export default function LandingNatural() {
  const root = useRef<HTMLDivElement>(null)
  const minPrice = Math.min(...SHAPES.map((s) => s.price)) + PLANT.price
  const makeHref = `#/make?d=${encodeDesign(HERO_POT)}`

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
      // 등장: 워드마크가 흙에서 올라오듯, 화분은 뒤따라 내려앉음
      gsap.from('[data-mark]', { yPercent: 60, opacity: 0, duration: 1.6, ease: 'expo.out' })
      gsap.from('[data-pot]', { y: -40, opacity: 0, duration: 1.6, ease: 'expo.out', delay: 0.35 })
      gsap.from('[data-fade]', { opacity: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.7 })
      // 스크롤: 작은 사진 카드가 화면 전체로 펼쳐짐
      gsap.fromTo(
        '[data-expand]',
        { clipPath: 'inset(22% 30% 22% 30% round 24px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '#glaze', start: 'top top', end: 'bottom bottom', scrub: true } },
      )
      gsap.fromTo('[data-expand-img]', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#glaze', start: 'top top', end: 'bottom bottom', scrub: true } })
      gsap.fromTo('[data-expand-copy]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '#glaze', start: '45% top', end: '75% top', scrub: true } })
    }, root)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      ctx.revert()
    }
  }, [])

  return (
    <div ref={root} className="break-keep" style={{ background: C.soil, color: C.sage, fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif' }}>
      {/* HERO */}
      <section className="relative flex min-h-svh flex-col overflow-hidden">
        {/* 창가 햇빛 */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 60% at 68% 30%, #5A3A2499, transparent 70%)' }} />
        <LeafShadow />

        <header data-fade className="relative z-40 grid grid-cols-[1fr_auto] items-center gap-4 px-5 pt-5 md:grid-cols-[1fr_auto_1fr] md:px-10 md:pt-7">
          <a href="#/natural" className="nat-mono text-xs leading-tight uppercase" style={{ color: C.sage }}>
            potory<br />
            <span style={{ color: C.sageDim }}>수제 도자기 화분 — Est. 2026</span>
          </a>
          <nav className="nat-mono hidden gap-7 text-xs uppercase md:flex" style={{ color: C.sageDim }}>
            <a href="#glaze" className="hover:opacity-70">Glaze</a>
            <a href="#/" className="hover:opacity-70">Forms</a>
            <a href="#/" className="hover:opacity-70">Journal</a>
          </nav>
          <div className="flex justify-end">
            <Button asChild variant="outline" className="nat-mono h-11 rounded-full border bg-transparent px-5 text-xs uppercase hover:bg-transparent hover:opacity-80" style={{ borderColor: C.sage, color: C.sage }}>
              <a href={makeHref}>만들기</a>
            </Button>
          </div>
        </header>

        {/* 왼쪽 위 문장 + 오른쪽 배지 */}
        <div className="relative z-20 mt-8 flex items-start justify-between gap-6 px-5 md:mt-12 md:px-10">
          <div data-fade className="max-w-xl">
            <p className="nat-serif text-[clamp(2rem,4.4vw,4rem)] leading-[1.02] font-light tracking-tight" style={{ color: C.cream }}>
              Shaped from earth,
              <br />
              <em className="font-light" style={{ color: C.clay }}>grown in light.</em>
            </p>
            <p className="nat-kr mt-4 text-[15px] leading-relaxed md:text-lg" style={{ color: C.sageDim }}>
              흙으로 빚고 햇빛 아래 자라는, 세상에 단 하나뿐인 화분.
            </p>
          </div>
          <div data-fade className="hidden shrink-0 sm:block">
            <StampBadge />
          </div>
        </div>

        {/* 워드마크 + 그 위에 걸쳐 앉은 3D 화분 */}
        <div className="relative z-10 mt-auto">
          <div data-pot className="absolute bottom-[27%] left-1/2 z-20 h-[54svh] w-[min(92vw,48svh)] -translate-x-1/2 md:bottom-[24%] md:h-[64svh] md:w-[min(56vw,58svh)]">
            <PotStage design={HERO_POT} />
          </div>
          <p
            data-mark
            aria-label="potory"
            className="nat-serif relative z-10 pb-[9vw] text-center text-[38vw] leading-[0.8] font-light tracking-[-0.06em] whitespace-nowrap select-none"
            style={{ color: C.sage }}
          >
            potory
          </p>
        </div>

        {/* 아래 줄: 고정폭 라벨 + CTA */}
        <div className="nat-mono relative z-40 grid gap-4 px-5 pt-5 pb-6 text-[11px] uppercase md:grid-cols-4 md:items-end md:px-10 md:pb-8 md:text-xs" style={{ color: C.sageDim }}>
          <span data-fade className="hidden md:block">( 01 ) Tapered — Sand glaze</span>
          <span data-fade className="hidden md:block">Monstera deliciosa · 몬스테라 포함</span>
          <span data-fade className="hidden md:block">{won(minPrice)}부터 · 3–5일 출고</span>
          <div data-fade className="flex items-center justify-between gap-4 md:justify-end">
            <span className="md:hidden">{won(minPrice)}부터</span>
            <Button asChild className="nat-kr h-12 rounded-full pr-2 pl-6 text-base normal-case" style={{ background: C.clay, color: C.soil }}>
              <a href={makeHref}>
                내 화분 빚기
                <span className="ml-2 grid size-8 place-items-center rounded-full" style={{ background: C.soil, color: C.clay }}>
                  <ArrowRight className="size-4" />
                </span>
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 스크롤하면 펼쳐지는 질감 사진 */}
      <section id="glaze" className="relative h-[260svh]">
        <div className="sticky top-0 h-svh overflow-hidden">
          <div data-expand className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(22% 30% 22% 30% round 24px)' }}>
            <div data-expand-img className="size-full">
              <GlazeImage />
            </div>
            <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, #24150E 0%, #24150Ef0 22%, #24150E80 42%, transparent 62%)' }} />
          </div>
          <div data-expand-copy className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 px-5 pb-10 md:px-10 md:pb-14">
            <span className="nat-mono text-xs uppercase" style={{ color: C.sageDim }}>( 02 ) Glaze</span>
            <p className="nat-serif text-[clamp(2.4rem,6vw,6rem)] leading-[0.95] font-light tracking-tight" style={{ color: C.cream }}>
              Every glaze, <em style={{ color: C.clay }}>one of one.</em>
            </p>
            <p className="nat-kr max-w-lg text-base leading-relaxed md:text-lg" style={{ color: C.cream }}>
              같은 유약도 가마의 불길에 따라 조금씩 다르게 익어요. 그래서 당신의 화분은 세상에 하나뿐이에요.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
