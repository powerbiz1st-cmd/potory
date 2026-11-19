import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '../generated/prisma/client'

// 처음 실행할 때 없으면 만들어 두는 기본 재고 (이미 있으면 수량은 건드리지 않음)
const DEFAULTS = [
  { sku: 'pot-cylinder', name: '화분 몸체 · 실린더', qty: 40, threshold: 8 },
  { sku: 'pot-tapered', name: '화분 몸체 · 테이퍼', qty: 30, threshold: 8 },
  { sku: 'pot-round', name: '화분 몸체 · 라운드', qty: 20, threshold: 6 },
  { sku: 'pot-glass', name: '유리 화분 · 글라스', qty: 12, threshold: 4 },
  { sku: 'plant-monstera', name: '몬스테라 묘목', qty: 60, threshold: 10 },
]

// 주문 1건에 필요한 재고
export function skusFor(design: { shape: string }) {
  return [`pot-${design.shape}`, 'plant-monstera']
}

type Tx = Prisma.TransactionClient

@Injectable()
export class StockService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const d of DEFAULTS) {
      await this.prisma.stockItem.upsert({ where: { sku: d.sku }, update: { name: d.name }, create: d })
    }
  }

  list() {
    return this.prisma.stockItem.findMany({ orderBy: { sku: 'asc' } })
  }

  async adjust(sku: string, delta: number) {
    const item = await this.prisma.stockItem.findUnique({ where: { sku } })
    if (!item) throw new NotFoundException('없는 재고 항목이에요')
    return this.prisma.stockItem.update({ where: { sku }, data: { qty: { increment: delta } } })
  }

  // 주문 생성/취소와 같은 트랜잭션 안에서 호출 (수량이 0 아래로 내려가도 주문은 받음 → 관리자 화면에 빨간 경고)
  async consume(tx: Tx, design: { shape: string }, sign: 1 | -1) {
    for (const sku of skusFor(design)) {
      await tx.stockItem.updateMany({ where: { sku }, data: { qty: { increment: -sign } } })
    }
  }
}
