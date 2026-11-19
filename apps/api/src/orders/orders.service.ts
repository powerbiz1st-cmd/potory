import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '../generated/prisma/client'
import type { OrderStatus } from '../generated/prisma/enums'
import { CreateOrderDto, LookupDto, UpdateStatusDto } from './dto'
import { priceOf } from './pricing'

const digits = (phone: string) => phone.replace(/\D/g, '')

// 고객 화면에 내려줄 때는 개인정보를 가림 (홍*동, 010-****-5678)
function maskName(n: string) {
  if (n.length <= 1) return n
  if (n.length === 2) return n[0] + '*'
  return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]
}
function maskPhone(p: string) {
  return `${p.slice(0, 3)}-****-${p.slice(-4)}`
}

const withEvents = { events: { orderBy: { createdAt: 'asc' as const } } }
type OrderWithEvents = Prisma.OrderGetPayload<{ include: typeof withEvents }>

function toPublic(o: OrderWithEvents) {
  return {
    no: o.no,
    name: maskName(o.name),
    phone: maskPhone(o.phone),
    design: o.design,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
    events: o.events.map((e) => ({ status: e.status, at: e.createdAt })),
  }
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async newOrderNo() {
    const d = new Date()
    const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    for (let i = 0; i < 10; i++) {
      const no = `PT-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`
      if (!(await this.prisma.order.findUnique({ where: { no }, select: { id: true } }))) return no
    }
    throw new Error('order number exhausted')
  }

  async create(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        no: await this.newOrderNo(),
        name: dto.name.trim(),
        phone: digits(dto.phone),
        design: { ...dto.design, text: dto.design.text.trim() },
        total: priceOf(dto.design),
        events: { create: { status: 'RECEIVED' } },
      },
      include: withEvents,
    })
    return toPublic(order)
  }

  async findPublic(no: string) {
    const order = await this.prisma.order.findUnique({ where: { no: no.trim().toUpperCase() }, include: withEvents })
    if (!order) throw new NotFoundException('주문을 찾을 수 없어요')
    return toPublic(order)
  }

  // 여러 주문번호 한 번에 (휴대폰에 저장해 둔 "내 주문" 목록 새로고침용)
  async findManyPublic(nos: string[]) {
    const list = await this.prisma.order.findMany({
      where: { no: { in: nos.slice(0, 50).map((n) => n.trim().toUpperCase()) } },
      include: withEvents,
      orderBy: { createdAt: 'desc' },
    })
    return list.map(toPublic)
  }

  async lookup(dto: LookupDto) {
    const list = await this.prisma.order.findMany({
      where: { phone: digits(dto.phone), name: dto.name.trim() },
      include: withEvents,
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return list.map(toPublic)
  }

  // ---- 관리자용 (개인정보 그대로) ----
  listAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: withEvents,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
  }

  async updateStatus(no: string, dto: UpdateStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { no } })
    if (!order) throw new NotFoundException('주문을 찾을 수 없어요')
    return this.prisma.order.update({
      where: { no },
      data: { status: dto.status, events: { create: { status: dto.status, note: dto.note } } },
      include: withEvents,
    })
  }
}
