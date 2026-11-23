import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Lenis from 'lenis'
import { ArrowRight, Shuffle, Sparkles, Truck, Palette, Box } from 'lucide-react'
import PotStage from '@/three/PotStage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DEFAULT_DESIGN, PLANT, SHAPES, encodeDesign, randomDesign, won, type Design } from '@/design'
import { prefersReducedMotion } from '@/hooks'
import { galleryImg } from '@/orders'
import SiteHeader from '@/components/SiteHeader'
import LiftText from '@/components/LiftText'
import PotThumb from '@/components/PotThumb'
import { preloadPlant } from '@/three/ModelPlant'

// 첫 화면 대표 화분: 깨끗한 화이트 실린더 + 몬스테라 (모델은 페이지 열자마자 미리 받아 둠)
const HERO: Design = DEFAULT_DESIGN
preloadPlant('monstera')

// 갤러리: 실제 몬스테라 화분 사진 + 누르면 비슷한 디자인으로 만들기 시작
const IMG = galleryImg
const PRESETS: { name: string; by: string; img: string; pos?: string; design: Design }[] = [
  { name: '화이트 페데스탈', by: '@hong.pot', img: IMG(1), pos: '50% 78%', design: HERO },
  { name: '샌드 아워글라스', by: '@mint_jy', img: IMG(2), design: { ...DEFAULT_DESIGN, shape: 'round', color: '#DCD3C3' } },
  { name: '코랄 핑크', by: '@studio_k', img: IMG(3), design: { ...DEFAULT_DESIGN, shape: 'tapered', color: '#C46A43' } },
  { name: '차콜 실린더', by: '@daily_green', img: IMG(4), design: { ...DEFAULT_DESIGN, shape: 'cylinder', color: '#2A2A2A', textColor: '#F2F0EB' } },
]

// 사진은 로컬 시연용으로만 두고 git에는 올리지 않음 → 사진이 없는 환경(배포본 등)에선 화분 그림으로 대체
function GalleryImage({ p }: { p: (typeof PRESETS)[number] }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className="flex size-full items-end justify-center bg-[#f4f4f1]">
        <PotThumb design={p.design} className="w-[78%] transition-transform duration-500 group-hover:scale-105" />
      </div>
    )
  return (
    <img
      src={p.img}
      alt={`${p.name} 몬스테라 화분`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      style={{ objectPosition: p.pos ?? '50% 60%' }}
    />
  )
}

const STEPS = [
  { icon: Box, title: '모양 고르기', body: '실린더, 테이퍼, 라운드, 투명 글라스 중에서 골라요. 360° 돌려 보면서요.' },
  { icon: Palette, title: '마음대로 꾸미기', body: '유약 색 8가지, 패턴 5가지에 이름이나 짧은 문구를 새겨요.' },
  { icon: Truck, title: '주문하고 지켜보기', body: '주문하면 바로 제작지시서가 나가요. 제작부터 출고까지 단계마다 알려드려요.' },
]

const FAQ = [
  ['얼마나 걸려요?', '주문하고 3~5 영업일이면 출고돼요. 문구를 넣어도 같아요.'],
  ['화면에서 본 색이랑 똑같이 나와요?', '도자기 유약이라서 조금 차이가 날 수 있어요. 받아 보고 마음에 안 들면 한 번 무료로 다시 만들어 드려요.'],
  ['식물도 같이 와요?', '모든 화분에 몬스테라가 심어져서 와요. 받자마자 바로 놓기만 하면 돼요.'],
  ['디자인을 친구한테 보낼 수 있어요?', '만들기 화면의 "공유" 버튼을 누르면 링크가 복사돼요. 친구가 그 링크를 열면 같은 화분에서 시작해요.'],
]

export default function Landing() {
  const [design, setDesign] = useState<Design>(HERO)
  const heroRef = useRef<HTMLDivElement>(null)

  // 부드러운 스크롤 + 첫 화면 등장 애니메이션
  useEffect(() => {
    if (prefersReducedMotion()) return
    const lenis = new Lenis()
    let id = 0
    const raf = (t: number) => {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    const ctx = gsap.context(() => {
      // 등장 후엔 잘림(overflow) 해제 → 마우스로 글자가 들려도 위가 안 잘림
      gsap.from('[data-rise]', { yPercent: 110, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, onComplete: () => gsap.set('[data-clip]', { overflow: 'visible' }) })
      gsap.from('[data-pop]', { scale: 0, rotate: -20, duration: 0.7, ease: 'back.out(2)', delay: 0.5, stagger: 0.1 })
    }, heroRef)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      ctx.revert()
    }
  }, [])

  const minPrice = Math.min(...SHAPES.map((s) => s.price))

  return (
    <div className="relative">
      <SiteHeader />

      {/* HERO */}
      <section ref={heroRef} className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 pt-4 pb-10 md:grid-cols-[1.05fr_1fr] md:px-8 md:pt-10">
        <div className="relative z-10">
          <Badge data-pop className="tape mb-5 -rotate-2 rounded-sm border-0 px-3 py-1 text-sm font-bold text-forest">
            <Sparkles /> 세상에 하나뿐인 내 화분
          </Badge>
          <h1 className="display text-[clamp(4.2rem,13vw,10rem)] text-forest">
            <span data-clip className="block overflow-hidden"><span data-rise className="block"><LiftText text="Make" /></span></span>
            <span data-clip className="block overflow-hidden"><span data-rise className="block"><LiftText text="your own" /></span></span>
            <span data-clip className="block overflow-hidden">
              <span data-rise className="inline-block rounded-2xl bg-lime px-3 text-forest"><LiftText text="pot." /></span>
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-forest/80">
            모양, 색, 패턴, 문구까지 직접 고르고 3D로 돌려 보면서 만들어요. 한 개부터 제작해 드려요.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-14 rounded-full px-8 text-base font-bold">
              <a href={`#/make?d=${encodeDesign(design)}`}>
                지금 만들기 <ArrowRight />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full border-[1.5px] border-forest bg-transparent px-6 text-base font-bold" onClick={() => setDesign(randomDesign())}>
              <Shuffle /> 랜덤 화분
            </Button>
          </div>
          <p className="mt-4 font-hand text-xl text-forest/70">* {won(minPrice + PLANT.price)}부터, 몬스테라 포함</p>
        </div>

        <div className="relative aspect-square w-full md:aspect-[4/5]">
          <div className="absolute inset-0">
            <PotStage design={design} />
          </div>
          <span data-pop className="absolute top-[8%] right-[6%] rotate-6 rounded-full bg-forest px-4 py-2 font-hand text-xl text-lime">
            돌려 보세요 ↻
          </span>
          <span data-pop className="tape absolute bottom-[10%] left-[4%] -rotate-3 rounded-sm px-3 py-1 text-sm font-bold text-forest">
            100% 핸드메이드 도자기
          </span>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative -rotate-1 overflow-hidden border-y-2 border-forest bg-lime py-3">
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-10">
              {['SHAPE IT', '★', 'COLOR IT', '★', 'NAME IT', '★', 'GROW IT', '★', '한 개부터 제작', '★', '3~5일 출고', '★'].map((t, i) => (
                <span key={i} className="display text-3xl text-forest md:text-4xl">{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <h2 className="display mb-10 text-[clamp(3rem,8vw,6rem)] text-forest"><LiftText text="How it works" /></h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="relative gap-0 rounded-3xl border-2 border-forest bg-card py-0 shadow-[6px_6px_0_var(--forest)]">
              <CardContent className="p-6">
                <div className="mb-8 flex items-center justify-between">
                  <span className="display text-6xl text-lime [-webkit-text-stroke:2px_var(--forest)]">0{i + 1}</span>
                  <s.icon className="size-8 text-forest" />
                </div>
                <h3 className="font-kr-display text-2xl text-forest">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-forest/75">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="bg-forest py-20 text-paper">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-[clamp(3rem,8vw,6rem)] text-lime"><LiftText text="Made by you" /></h2>
            <p className="max-w-xs text-paper/70">다른 사람이 만든 화분이에요. 누르면 그 디자인에서 시작해요.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PRESETS.map((p, i) => (
              <a
                key={p.name}
                href={`#/make?d=${encodeDesign(p.design)}`}
                className="group relative flex flex-col rounded-3xl bg-paper p-4 text-forest transition-transform hover:-translate-y-1 hover:rotate-1"
                style={{ rotate: `${[-1.5, 1, -0.5, 1.5][i]}deg` }}
              >
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                  <GalleryImage p={p} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-kr-display text-lg leading-tight">{p.name}</p>
                    <p className="text-sm text-forest/60">{p.by}</p>
                  </div>
                  <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto grid max-w-7xl gap-8 px-4 py-20 md:grid-cols-[1fr_1.4fr] md:px-8">
        <h2 className="display text-[clamp(3rem,8vw,6rem)] text-forest"><LiftText text="FAQ" /></h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q} className="border-b-2 border-forest/20">
              <AccordionTrigger className="py-5 text-lg font-bold text-forest hover:no-underline">{q}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-forest/75">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA + FOOTER */}
      <footer className="border-t-2 border-forest bg-lime">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 md:flex-row md:items-end md:justify-between md:px-8">
          <h2 className="display text-[clamp(3.4rem,10vw,8rem)] text-forest"><LiftText text="Let's grow." /></h2>
          <Button asChild size="lg" className="h-14 rounded-full px-8 text-base font-bold">
            <a href="#/make">
              내 화분 만들러 가기 <ArrowRight />
            </a>
          </Button>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 pb-8 text-sm text-forest/70 md:px-8">
          <span>© 2026 POTORY · 포트폴리오 데모</span>
          <span>Shop · Admin · Console</span>
        </div>
      </footer>
    </div>
  )
}
