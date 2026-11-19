import { useId } from 'react'
import type { Design } from '../design'

// 갤러리·주문서용 가벼운 2D 화분 그림 (3D 캔버스를 여러 개 띄우지 않기 위해 SVG 사용)
// 3D와 같은 비율: 낮은 화분 + 큰 몬스테라
const BODY: Record<Design['shape'], string> = {
  cylinder: 'M24 70 H76 V108 Q76 114 70 114 H30 Q24 114 24 108 Z',
  tapered: 'M22 70 H78 L72 108 Q71 114 65 114 H35 Q29 114 28 108 Z',
  round: 'M28 70 H72 C86 80 86 104 70 114 H30 C14 104 14 80 28 70 Z',
  glass: 'M25 66 H75 V108 Q75 114 69 114 H31 Q25 114 25 108 Z',
}

function Pattern({ d, id }: { d: Design; id: string }) {
  const a = d.accent
  switch (d.pattern) {
    case 'stripe':
      return <pattern id={id} width="10" height="6" patternUnits="userSpaceOnUse"><rect y="2" width="10" height="1.2" fill={a} /></pattern>
    case 'dots':
      return <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1" fill={a} /></pattern>
    case 'wave':
      return <pattern id={id} width="14" height="8" patternUnits="userSpaceOnUse"><path d="M0 4 Q3.5 2 7 4 T14 4" stroke={a} strokeWidth="1" fill="none" /></pattern>
    case 'check':
      return <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill={a} /><rect x="4" y="4" width="4" height="4" fill={a} /></pattern>
    default:
      return null
  }
}

// 몬스테라 실루엣 (갈라진 큰 잎 몇 장)
function Monstera() {
  const leaf = (x: number, y: number, r: number, rot: number, k: number) => (
    <g key={k} transform={`translate(${x} ${y}) rotate(${rot}) scale(${r})`}>
      <path d="M0 0 C-14 -4 -16 -24 0 -30 C16 -24 14 -4 0 0 Z" fill="#2E6B2A" />
      <path d="M0 -2 V-28 M0 -10 L-9 -16 M0 -16 L-9 -23 M0 -10 L9 -16 M0 -16 L9 -23" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
  return (
    <g>
      <path d="M50 70 Q44 48 26 30 M50 70 Q52 40 50 18 M50 70 Q58 46 76 30 M50 70 Q40 56 18 52 M50 70 Q62 56 84 54" stroke="#3B6E2E" strokeWidth="1.6" fill="none" />
      {leaf(26, 34, 0.75, -50, 1)}
      {leaf(50, 22, 0.85, 0, 2)}
      {leaf(76, 34, 0.75, 50, 3)}
      {leaf(18, 56, 0.6, -80, 4)}
      {leaf(84, 58, 0.6, 80, 5)}
    </g>
  )
}

export default function PotThumb({ design, className }: { design: Design; className?: string }) {
  const id = useId().replace(/:/g, '')
  const text = design.text.trim()
  const glass = design.shape === 'glass'
  return (
    <svg viewBox="0 -12 100 128" className={className} role="img" aria-label={`${design.text || '화분'} 미리보기`}>
      <defs>
        <Pattern d={design} id={`p${id}`} />
        <clipPath id={`c${id}`}>
          <path d={BODY[design.shape]} />
        </clipPath>
      </defs>
      <Monstera />
      {glass ? (
        <>
          {/* 유리: 자갈층 + 흙이 비쳐 보이게 */}
          <g clipPath={`url(#c${id})`}>
            <rect x="0" y="72" width="100" height="22" fill="#3B2A1E" />
            <rect x="0" y="94" width="100" height="20" fill="#D9D1C1" />
          </g>
          <path d={BODY.glass} fill={design.color} fillOpacity="0.25" stroke="#9AA59A" strokeWidth="1.2" />
          <path d="M30 74 V106" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="26" y="68" width="48" height="4" rx="2" fill="#3B2A1E" />
          <path d={BODY[design.shape]} fill={design.color} stroke="#00000022" strokeWidth="1" />
        </>
      )}
      {design.pattern !== 'none' && <rect x="0" y="66" width="100" height="50" fill={`url(#p${id})`} clipPath={`url(#c${id})`} />}
      {text && (
        <text x="50" y="96" textAnchor="middle" fontFamily='Anton, "Black Han Sans", sans-serif' fontSize={text.length > 7 ? 6 : 8} letterSpacing="1" fill={design.textColor}>
          {text}
        </text>
      )}
    </svg>
  )
}
