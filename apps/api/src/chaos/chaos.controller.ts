import { Body, Controller, ForbiddenException, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator'
import { AdminGuard } from '../orders/admin.guard'
import { PrismaService } from '../prisma/prisma.service'
import { chaos, chaosEnabled, chaosSnapshot, resetChaos } from './chaos.state'

class ChaosDto {
  @IsOptional() @IsInt() @Min(5) @Max(300) sec?: number // 몇 초 동안 (기본 30초, 지나면 저절로 꺼짐)
  @IsOptional() @IsInt() @Min(100) @Max(5000) ms?: number // 응답 지연 시간
  @IsOptional() @IsNumber() @Min(0.1) @Max(1) rate?: number // 실패 비율
}

// 운영 콘솔 "장애 시연" 버튼용. .env 의 CHAOS_ENABLED=true 일 때만 동작 (배포 땐 false)
@Controller('admin/chaos')
@UseGuards(AdminGuard)
export class ChaosController {
  constructor(private readonly prisma: PrismaService) {}

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
  slow(@Body() dto: ChaosDto) {
    this.guard()
    chaos.slowMs = dto.ms ?? 1500
    chaos.slowUntil = this.until(dto.sec)
    return chaosSnapshot()
  }

  // ② DB 장애
  @Post('db-down')
  dbDown(@Body() dto: ChaosDto) {
    this.guard()
    chaos.dbDownUntil = this.until(dto.sec)
    return chaosSnapshot()
  }

  // ③ 일부 요청 실패
  @Post('errors')
  errors(@Body() dto: ChaosDto) {
    this.guard()
    chaos.errorRate = dto.rate ?? 0.5
    chaos.errorUntil = this.until(dto.sec)
    return chaosSnapshot()
  }

  // ④ 서버 다운 → Docker가 자동으로 다시 켬 (restart: unless-stopped)
  @Post('crash')
  @HttpCode(202)
  crash() {
    this.guard()
    console.error('[chaos] 시연용 서버 다운 — 0.5초 뒤 프로세스 종료')
    setTimeout(() => {
      // 개발 모드에선 감시 프로세스(nest --watch)가 부모라서 그것까지 끝내야 컨테이너가 재시작됨
      try {
        process.kill(process.ppid, 'SIGKILL')
      } catch {
        /* 부모가 없으면 무시 */
      }
      process.exit(1)
    }, 500)
    return { ok: true, message: '서버를 내립니다. 잠시 뒤 자동으로 다시 켜져요.' }
  }

  // ⑤ 재고 소진: 몬스테라 재고를 기준치 아래로
  @Post('stock-low')
  async stockLow() {
    this.guard()
    const item = await this.prisma.stockItem.update({ where: { sku: 'plant-monstera' }, data: { qty: 2 } })
    return { ok: true, item }
  }

  // 즉시 정상화
  @Post('reset')
  reset() {
    resetChaos()
    return chaosSnapshot()
  }
}
