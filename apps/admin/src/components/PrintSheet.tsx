import PotThumb from '@shop/components/PotThumb'
import { won } from '@shop/design'
import { fmtPhone, type AdminOrder } from '@/api'
import DesignSpec from './DesignSpec'

// 제작지시서 (A4 인쇄용). 화면에는 안 보이고 인쇄할 때만 나타남 (styles.css의 @media print)
export default function PrintSheet({ order }: { order: AdminOrder }) {
  const d = order.design
  const steps = ['몸체 성형 · 건조', '초벌 소성', '유약 시유 (바탕색 · 패턴)', '문구 각인 / 전사', '재벌 소성', '몬스테라 식재 · 마감 검수', '포장 · 출고']
  return (
    <div id="print-sheet" className="hidden bg-white p-2 text-[13px] text-black print:block">
      <div className="flex items-end justify-between border-b-2 border-black pb-3">
        <div>
          <p className="display text-3xl">Potory</p>
          <p className="text-lg font-bold">제작지시서</p>
        </div>
        <div className="text-right">
          <p className="display text-2xl">{order.no}</p>
          <p>주문 {new Date(order.createdAt).toLocaleString('ko-KR')}</p>
          <p>출력 {new Date().toLocaleString('ko-KR')}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[180px_1fr] gap-6">
        <div className="rounded-lg border border-black/30 p-2">
          <PotThumb design={d} className="w-full" />
        </div>
        <div className="space-y-4">
          <section>
            <h3 className="mb-2 font-bold">디자인 사양</h3>
            <DesignSpec design={d} className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5" />
          </section>
          <section>
            <h3 className="mb-1 font-bold">받는 분</h3>
            <p>
              {order.name} · {fmtPhone(order.phone)}
            </p>
            <p>결제 금액 {won(order.total)}</p>
          </section>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="mb-2 font-bold">공정 체크</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['공정', '담당', '완료 시각', '확인'].map((h) => (
                <th key={h} className="border border-black/40 px-2 py-1.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s}>
                <td className="border border-black/40 px-2 py-2.5">{s}</td>
                <td className="w-28 border border-black/40" />
                <td className="w-32 border border-black/40" />
                <td className="w-14 border border-black/40 text-center">☐</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-5">
        <h3 className="mb-1 font-bold">메모</h3>
        <div className="h-24 rounded border border-black/40" />
      </section>
    </div>
  )
}
