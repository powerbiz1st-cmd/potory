import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'

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
    return { ok: true, db: 'up', dbLatencyMs: Date.now() - started, uptimeSec: Math.round(process.uptime()) }
  }
}
