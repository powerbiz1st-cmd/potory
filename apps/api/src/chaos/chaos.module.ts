import { Module } from '@nestjs/common'
import { ChaosController } from './chaos.controller'
import { ChaosSync } from './chaos.sync'

@Module({
  controllers: [ChaosController],
  providers: [ChaosSync],
})
export class ChaosModule {}
