import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/hooks'

// 큰 제목용 인터랙션: 커서가 가까이 오면 글자 하나하나가
// 위로 들리고(lift) · 살짝 커지고(scale) · 커서 반대쪽으로 기울어짐(tilt).
// 바닥 가운데를 축으로 움직여서 스티커가 들리는 느낌. 커서가 멀어지면 부드럽게 제자리로.
const RADIUS = 1.6 // 영향 반경 = 글자 높이 × RADIUS
const LIFT = 0.12 // 최대 들림 = 글자 높이 × LIFT
const SCALE = 0.07 // 최대 확대
const TILT = 7 // 최대 기울기(도)

type Props = { text: string; className?: string }

export default function LiftText({ text, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion()) return
    const chars = Array.from(root.querySelectorAll<HTMLSpanElement>('[data-ch]'))
    const movers = chars.map((el) => ({
      el,
      y: gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' }),
      r: gsap.quickTo(el, 'rotation', { duration: 0.6, ease: 'power3.out' }),
      // quickTo는 'scale' 단축 속성을 못 받아서 가로·세로를 따로
      sx: gsap.quickTo(el, 'scaleX', { duration: 0.45, ease: 'power3.out' }),
      sy: gsap.quickTo(el, 'scaleY', { duration: 0.45, ease: 'power3.out' }),
    }))

    let px = -1e4
    let py = -1e4
    let frame = 0

    const update = () => {
      frame = 0
      for (const m of movers) {
        const b = m.el.getBoundingClientRect()
        const h = b.height || 1
        // 글자 중심 기준 거리 (변형 전 위치에 가깝게: 현재 y 이동분을 되돌려 계산)
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2 - (gsap.getProperty(m.el, 'y') as number)
        const dx = cx - px
        const dist = Math.hypot(dx, cy - py)
        const t = Math.max(0, 1 - dist / (h * RADIUS))
        const f = t * t * (3 - 2 * t) // smoothstep: 가까울수록 급하게 커짐
        m.y(-h * LIFT * f)
        m.sx(1 + SCALE * f)
        m.sy(1 + SCALE * f)
        m.r(gsap.utils.clamp(-1, 1, dx / (h * 0.8)) * TILT * f)
      }
    }

    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onLeave = () => {
      px = py = -1e4
      if (!frame) frame = requestAnimationFrame(update)
    }

    // 문서 전체에서 듣되, 제목 근처에서만 반응 (반경 밖은 f=0)
    addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    addEventListener('scroll', onLeave, { passive: true })
    return () => {
      removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      removeEventListener('scroll', onLeave)
      cancelAnimationFrame(frame)
      gsap.killTweensOf(chars)
      gsap.set(chars, { clearProps: 'transform' })
    }
  }, [text])

  // 단어 단위로 줄바꿈되도록: 단어는 nowrap 묶음, 글자는 inline-block
  const words = text.split(' ')
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden>
          <span className="inline-block whitespace-nowrap">
            {Array.from(w).map((ch, ci) => (
              <span key={ci} data-ch className="inline-block origin-bottom will-change-transform">
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
