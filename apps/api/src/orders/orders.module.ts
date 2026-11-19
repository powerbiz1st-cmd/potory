import { Module } from '@nestjs/common'
import { AdminOrdersController, OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { StockModule } from '../stock/stock.module'

@Module({
  imports: [StockModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
