import { Controller, Get, ParseIntPipe, Query, UseGuards, DefaultValuePipe, ServiceUnavailableException } from '@nestjs/common'
import { AdminGuard } from '../orders/admin.guard'
import { ConsoleService } from './console.service'

// 운영 콘솔용 (관리자 토큰 필요)
@Controller('admin/console')
@UseGuards(AdminGuard)
export class ConsoleController {
  constructor(private readonly console: ConsoleService) {}

  // 매출·주문 흐름·인기 모양·리드타임·재고 부족
  @Get('stats')
  stats(@Query('days', new DefaultValuePipe(14), ParseIntPipe) days: number) {
    return this.console.stats(Math.min(Math.max(days, 1), 90))
  }

  // API · DB · 호스트 상태
  @Get('system')
  system() {
    return this.console.system()
  }

  // 감시 컨테이너(watchdog) 상태를 대신 받아다 줌 → watchdog은 외부에 열지 않아도 됨 (배포 시 터널은 API 하나만)
  @Get('watch')
  async watch() {
    try {
      const res = await fetch(process.env.WATCHDOG_URL ?? 'http://watchdog:3100/status', { signal: AbortSignal.timeout(3000) })
      if (!res.ok) throw new Error(String(res.status))
      return await res.json()
    } catch {
      throw new ServiceUnavailableException('감시 컨테이너(watchdog)에 연결할 수 없어요')
    }
  }
}
