import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { INSTANCE } from './chaos/chaos.state'

// 서버 상태 확인용 (Ops 콘솔 · Uptime Kuma가 주기적으로 호출)
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const started = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch {
      throw new ServiceUnavailableException({ ok: false, db: 'down' })
    }
    return { ok: true, instance: INSTANCE, db: 'up', dbLatencyMs: Date.now() - started, uptimeSec: Math.round(process.uptime()) }
  }

  // 이 서버 프로세스가 살아 있는지만 (DB 안 봄) — 로드밸런서·감시가 호기별 생존 확인에 사용
  @Get('live')
  live() {
    return { ok: true, instance: INSTANCE, uptimeSec: Math.round(process.uptime()) }
  }
}
