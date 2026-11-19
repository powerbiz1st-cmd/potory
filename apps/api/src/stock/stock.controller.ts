import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { IsInt, Max, Min } from 'class-validator'
import { AdminGuard } from '../orders/admin.guard'
import { StockService } from './stock.service'

class AdjustDto {
  @IsInt() @Min(-999) @Max(999) delta: number
}

@Controller('admin/stock')
@UseGuards(AdminGuard)
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  list() {
    return this.stock.list()
  }

  // 입고(+) / 수동 차감(-)
  @Patch(':sku')
  adjust(@Param('sku') sku: string, @Body() dto: AdjustDto) {
    return this.stock.adjust(sku, dto.delta)
  }
}
