import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { HealthController } from './health.controller'
import { OrdersModule } from './orders/orders.module'

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [HealthController],
})
export class AppModule {}
