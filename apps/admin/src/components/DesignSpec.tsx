import { COLORS, PATTERNS, PLANT, SHAPES, type Design } from '@shop/design'

const colorName = (hex: string) => COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex

function Swatch({ hex }: { hex: string }) {
  return <span className="inline-block size-3.5 shrink-0 rounded-full border border-black/15 align-[-2px]" style={{ background: hex }} />
}

// 제작에 필요한 디자인 사양 (주문 상세 · 제작지시서 공용)
export function specRows(d: Design) {
  return [
    { k: '모양', v: SHAPES.find((s) => s.id === d.shape)?.label ?? d.shape },
    { k: '바탕색', v: colorName(d.color), hex: d.color },
    { k: '포인트 색', v: colorName(d.accent), hex: d.accent },
    { k: '패턴', v: PATTERNS.find((p) => p.id === d.pattern)?.label ?? d.pattern },
    { k: '문구', v: d.text.trim() ? `“${d.text.trim()}”` : '없음' },
    ...(d.text.trim() ? [{ k: '글자색', v: colorName(d.textColor), hex: d.textColor }] : []),
    { k: '식물', v: PLANT.label },
  ]
}

export default function DesignSpec({ design, className }: { design: Design; className?: string }) {
  return (
    <dl className={className ?? 'grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 text-sm'}>
      {specRows(design).map((r) => (
        <div key={r.k} className="contents">
          <dt className="text-muted-foreground">{r.k}</dt>
          <dd className="flex items-center gap-1.5 font-medium">
            {r.hex && <Swatch hex={r.hex} />}
            {r.v}
            {r.hex && <span className="text-xs font-normal text-muted-foreground">{r.hex.toUpperCase()}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
