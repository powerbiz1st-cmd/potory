import { Body, Controller, ForbiddenException, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator'
import { AdminGuard } from '../orders/admin.guard'
import { PrismaService } from '../prisma/prisma.service'
import { INSTANCE, chaosEnabled, chaosSnapshot } from './chaos.state'
import { ChaosSync } from './chaos.sync'

class ChaosDto {
  @IsOptional() @IsInt() @Min(5) @Max(300) sec?: number // 몇 초 동안 (기본 30초, 지나면 저절로 꺼짐)
  @IsOptional() @IsInt() @Min(100) @Max(5000) ms?: number // 응답 지연 시간
  @IsOptional() @IsNumber() @Min(0.1) @Max(1) rate?: number // 실패 비율
}

class CrashDto {
  @IsOptional() @IsIn(['api-1', 'api-2']) instance?: string // 내릴 호기 (없으면 이 요청을 받은 서버)
}

// 운영 콘솔 "장애 시연" 버튼용. .env 의 CHAOS_ENABLED=true 일 때만 동작 (배포 땐 false)
// 스위치 상태는 DB에 저장되어 이중화된 두 서버(api-1, api-2)에 함께 적용됨
@Controller('admin/chaos')
@UseGuards(AdminGuard)
export class ChaosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: ChaosSync,
  ) {}

  private guard() {
    if (!chaosEnabled()) throw new ForbiddenException('장애 시연이 꺼져 있어요 (.env 의 CHAOS_ENABLED=true 필요)')
  }
  private until(sec?: number) {
    return Date.now() + (sec ?? 30) * 1000
  }

  @Get()
  state() {
    return chaosSnapshot()
  }

  // ① 응답 지연
  @Post('slow')
  async slow(@Body() dto: ChaosDto) {
    this.guard()
    await this.sync.save({ slowMs: dto.ms ?? 1500, slowUntil: this.until(dto.sec) })
    return chaosSnapshot()
  }

  // ② DB 장애
  @Post('db-down')
  async dbDown(@Body() dto: ChaosDto) {
    this.guard()
    await this.sync.save({ dbDownUntil: this.until(dto.sec) })
    return chaosSnapshot()
  }

  // ③ 일부 요청 실패
  @Post('errors')
  async errors(@Body() dto: ChaosDto) {
    this.guard()
    await this.sync.save({ errorRate: dto.rate ?? 0.5, errorUntil: this.until(dto.sec) })
    return chaosSnapshot()
  }

  // ④ API 한 대 다운 → 그 호기만 스스로 종료, Docker가 자동 재시작. 나머지 한 대가 계속 처리
  @Post('crash')
  @HttpCode(202)
  async crash(@Body() dto: CrashDto) {
    this.guard()
    const target = dto.instance ?? INSTANCE
    await this.sync.save({ crashTarget: target, crashAt: Date.now() })
    return { ok: true, target, message: `${target} 를 내립니다. 잠시 뒤 자동으로 다시 켜져요.` }
  }

  // ⑤ 재고 소진: 몬스테라 재고를 기준치 아래로
  @Post('stock-low')
  async stockLow() {
    this.guard()
    const item = await this.prisma.stockItem.update({ where: { sku: 'plant-monstera' }, data: { qty: 2 } })
    return { ok: true, item }
  }

  // 즉시 정상화 (두 서버 모두)
  @Post('reset')
  async reset() {
    await this.sync.save({ slowUntil: 0, dbDownUntil: 0, errorUntil: 0, crashTarget: '' })
    return chaosSnapshot()
  }
}
