import { Injectable } from '@nestjs/common'
import * as os from 'node:os'
import { PrismaService } from '../prisma/prisma.service'

const DAY = 24 * 60 * 60 * 1000
const LEGACY_SHAPES: Record<string, string> = { classic: 'tapered', square: 'cylinder' }
// 한국 시간 기준 날짜 문자열 (YYYY-MM-DD)
const kstDate = (d: Date) => new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

// 운영 콘솔용 집계 (매출 · 주문 흐름 · 리드타임 · 서버 상태)
@Injectable()
export class ConsoleService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(days = 14) {
    const since = new Date(Date.now() - days * DAY)
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { total: true, status: true, design: true, createdAt: true, events: { select: { status: true, createdAt: true } } },
    })
    const live = orders.filter((o) => o.status !== 'CANCELED')

    // 날짜별 주문 수·매출 (비어 있는 날도 0으로 채움)
    const byDay = new Map<string, { date: string; orders: number; revenue: number }>()
    for (let i = days - 1; i >= 0; i--) {
      const date = kstDate(new Date(Date.now() - i * DAY))
      byDay.set(date, { date, orders: 0, revenue: 0 })
    }
    for (const o of live) {
      const row = byDay.get(kstDate(o.createdAt))
      if (row) {
        row.orders++
        row.revenue += o.total
      }
    }

    const today = kstDate(new Date())
    const todayRow = byDay.get(today)!

    // 상태별 (전체 기간 누적)
    const statusGroups = await this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } })
    const byStatus = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]))

    // 모양별 인기
    const shapes = new Map<string, number>()
    for (const o of live) {
      const raw = (o.design as { shape?: string }).shape ?? 'unknown'
      const s = LEGACY_SHAPES[raw] ?? raw // 리디자인 전 주문은 새 모양 이름으로 합산
      shapes.set(s, (shapes.get(s) ?? 0) + 1)
    }

    // 리드타임: 접수 → 출고 (분)
    const leads = live
      .map((o) => {
        const r = o.events.find((e) => e.status === 'RECEIVED')?.createdAt
        const s = [...o.events].reverse().find((e) => e.status === 'SHIPPED')?.createdAt
        return r && s ? (s.getTime() - r.getTime()) / 60000 : null
      })
      .filter((v): v is number => v !== null)

    const lowStock = await this.prisma.stockItem.findMany({ orderBy: { qty: 'asc' } })

    return {
      rangeDays: days,
      today: { date: today, orders: todayRow.orders, revenue: todayRow.revenue },
      period: { orders: live.length, revenue: live.reduce((a, o) => a + o.total, 0), canceled: orders.length - live.length },
      avgOrderValue: live.length ? Math.round(live.reduce((a, o) => a + o.total, 0) / live.length) : 0,
      byDay: [...byDay.values()],
      byStatus: { RECEIVED: 0, MAKING: 0, SHIPPED: 0, CANCELED: 0, ...byStatus },
      byShape: [...shapes.entries()].map(([shape, count]) => ({ shape, count })).sort((a, b) => b.count - a.count),
      leadTimeMin: leads.length ? { avg: Math.round(leads.reduce((a, v) => a + v, 0) / leads.length), count: leads.length } : null,
      lowStock: lowStock.filter((i) => i.qty <= i.threshold).map((i) => ({ sku: i.sku, name: i.name, qty: i.qty, threshold: i.threshold })),
    }
  }

  async system() {
    const t0 = Date.now()
    let db: { ok: boolean; latencyMs: number; sizeMb?: number; connections?: number }
    try {
      const [size] = await this.prisma.$queryRaw<{ mb: number }[]>`SELECT round(pg_database_size(current_database()) / 1048576.0, 1)::float AS mb`
      const [conn] = await this.prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database()`
      db = { ok: true, latencyMs: Date.now() - t0, sizeMb: size.mb, connections: conn.n }
    } catch {
      db = { ok: false, latencyMs: Date.now() - t0 }
    }
    const mem = process.memoryUsage()
    return {
      at: new Date().toISOString(),
      api: {
        ok: true,
        uptimeSec: Math.round(process.uptime()),
        node: process.version,
        memoryMb: Math.round(mem.rss / 1048576),
        heapUsedMb: Math.round(mem.heapUsed / 1048576),
      },
      db,
      host: {
        cpus: os.cpus().length,
        load1: Math.round(os.loadavg()[0] * 100) / 100,
        memFreeMb: Math.round(os.freemem() / 1048576),
        memTotalMb: Math.round(os.totalmem() / 1048576),
      },
    }
  }
}
