import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { HealthController } from './health.controller'
import { OrdersModule } from './orders/orders.module'
import { StockModule } from './stock/stock.module'
import { ConsoleModule } from './console/console.module'

@Module({
  imports: [PrismaModule, OrdersModule, StockModule, ConsoleModule],
  controllers: [HealthController],
})
export class AppModule {}
