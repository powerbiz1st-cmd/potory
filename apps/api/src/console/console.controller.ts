import { Controller, Get, ParseIntPipe, Query, UseGuards, DefaultValuePipe } from '@nestjs/common'
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
}
