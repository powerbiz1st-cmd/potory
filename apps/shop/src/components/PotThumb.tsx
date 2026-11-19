import { useId } from 'react'
import type { Design } from '@/design'

// 갤러리·주문서용 가벼운 2D 화분 그림 (3D 캔버스를 여러 개 띄우지 않기 위해 SVG 사용)
const BODY: Record<Design['shape'], string> = {
  classic: 'M14 40 H86 L76 112 H24 Z',
  round: 'M22 40 H78 C98 62 96 100 74 112 H26 C4 100 2 62 22 40 Z',
  cylinder: 'M20 40 H80 V112 H20 Z',
  square: 'M10 40 H90 V112 H10 Z',
}

function Pattern({ d, id }: { d: Design; id: string }) {
  const a = d.accent
  switch (d.pattern) {
    case 'stripe':
      return <pattern id={id} width="10" height="14" patternUnits="userSpaceOnUse"><rect y="3" width="10" height="5" fill={a} /></pattern>
    case 'dots':
      return <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.2" fill={a} /></pattern>
    case 'wave':
      return <pattern id={id} width="20" height="16" patternUnits="userSpaceOnUse"><path d="M0 8 Q5 3 10 8 T20 8" stroke={a} strokeWidth="3" fill="none" /></pattern>
    case 'check':
      return <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill={a} /><rect x="8" y="8" width="8" height="8" fill={a} /></pattern>
    default:
      return null
  }
}

function Leaves({ plant }: { plant: Design['plant'] }) {
  if (plant === 'flower')
    return (
      <g>
        <path d="M50 40 V8" stroke="#1F7A12" strokeWidth="3" />
        <ellipse cx="60" cy="26" rx="9" ry="4" fill="#3DBE29" transform="rotate(-30 60 26)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse key={i} cx="50" cy="0" rx="4" ry="7" fill="#fff" transform={`rotate(${i * 45} 50 8) translate(0 -1)`} />
        ))}
        <circle cx="50" cy="8" r="4.5" fill="#FFC20E" />
      </g>
    )
  if (plant === 'monstera')
    return (
      <g stroke="#1F7A12" strokeWidth="2" fill="#2E8B1F">
        <path d="M50 40 Q46 24 30 14" fill="none" />
        <path d="M50 40 Q54 22 70 10" fill="none" />
        <path d="M50 40 V4" fill="none" />
        <path d="M30 14 C14 12 10 -2 24 -4 C34 -4 38 6 30 14 Z" />
        <path d="M70 10 C86 8 92 -6 78 -8 C66 -8 62 2 70 10 Z" />
        <path d="M50 4 C38 2 40 -12 50 -12 C60 -12 62 2 50 4 Z" />
      </g>
    )
  if (plant === 'succulent')
    return (
      <g fill="#6CC24A">
        {[-50, -25, 0, 25, 50].map((r) => (
          <path key={r} d="M50 40 Q44 22 50 12 Q56 22 50 40 Z" transform={`rotate(${r} 50 40)`} />
        ))}
        <path d="M50 40 Q46 28 50 22 Q54 28 50 40 Z" fill="#B6E36A" />
      </g>
    )
  return (
    <g>
      <path d="M50 40 V20" stroke="#1F7A12" strokeWidth="3" />
      <ellipse cx="40" cy="18" rx="11" ry="5" fill="#3DBE29" transform="rotate(-25 40 18)" />
      <ellipse cx="60" cy="16" rx="11" ry="5" fill="#3DBE29" transform="rotate(25 60 16)" />
    </g>
  )
}

export default function PotThumb({ design, className }: { design: Design; className?: string }) {
  const id = useId().replace(/:/g, '')
  const text = design.text.trim()
  return (
    <svg viewBox="-4 -6 108 122" className={className} role="img" aria-label={`${design.text || '화분'} 미리보기`}>
      <defs>
        <Pattern d={design} id={`p${id}`} />
        <clipPath id={`c${id}`}>
          <path d={BODY[design.shape]} />
        </clipPath>
      </defs>
      <Leaves plant={design.plant} />
      <rect x="8" y="34" width="84" height="8" rx="3" fill="#4A2E1B" />
      <path d={BODY[design.shape]} fill={design.color} stroke="#0B4A0A" strokeWidth="2.5" strokeLinejoin="round" />
      {design.pattern !== 'none' && <rect x="0" y="40" width="100" height="80" fill={`url(#p${id})`} clipPath={`url(#c${id})`} />}
      {text && (
        <>
          {design.pattern !== 'none' && <rect x={50 - Math.min(text.length, 6) * 5 - 6} y="64" width={Math.min(text.length, 6) * 10 + 12} height="22" rx="5" fill={design.color} />}
          <text x="50" y="80" textAnchor="middle" fontFamily='"Black Han Sans", Anton, sans-serif' fontSize={text.length > 6 ? 10 : 15} fill={design.textColor}>
            {text}
          </text>
        </>
      )}
    </svg>
  )
}
