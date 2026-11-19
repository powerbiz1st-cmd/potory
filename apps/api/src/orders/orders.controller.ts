import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto, LookupDto, UpdateStatusDto } from './dto'
import { AdminGuard } from './admin.guard'
import { OrderStatus } from '../generated/prisma/enums'

// 고객용 (Shop)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // 주문하기
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto)
  }

  // 이름 + 휴대폰 번호로 내 주문 찾기 (번호를 URL에 남기지 않으려고 POST)
  @Post('lookup')
  lookup(@Body() dto: LookupDto) {
    return this.orders.lookup(dto)
  }

  // 휴대폰에 저장된 주문번호 여러 개 한 번에 조회: GET /orders?no=PT-..&no=PT-..
  @Get()
  many(@Query('no') no?: string | string[]) {
    const list = [no ?? []].flat().filter(Boolean)
    if (!list.length) throw new BadRequestException('no 를 하나 이상 넣어 주세요')
    return this.orders.findManyPublic(list)
  }

  // 주문번호로 조회
  @Get(':no')
  one(@Param('no') no: string) {
    return this.orders.findPublic(no)
  }
}

// 관리자용 (Admin 백오피스) — x-admin-token 필요
@Controller('admin/orders')
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query('status') status?: string) {
    if (status && !(status in OrderStatus)) throw new BadRequestException('알 수 없는 상태값')
    return this.orders.listAll(status as OrderStatus | undefined)
  }

  // 관리자 화면 로그인 확인용 (토큰이 맞으면 200)
  @Get('ping')
  ping() {
    return { ok: true }
  }

  @Get(':no')
  one(@Param('no') no: string) {
    return this.orders.findAdmin(no)
  }

  @Patch(':no/status')
  updateStatus(@Param('no') no: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(no, dto)
  }
}
