import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { HealthController } from './health.controller'
import { OrdersModule } from './orders/orders.module'
import { StockModule } from './stock/stock.module'
import { ConsoleModule } from './console/console.module'
import { ChaosModule } from './chaos/chaos.module'

@Module({
  imports: [PrismaModule, OrdersModule, StockModule, ConsoleModule, ChaosModule],
  controllers: [HealthController],
})
export class AppModule {}
