import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { INSTANCE, STARTED_AT, chaos, type ChaosData } from './chaos.state'

const DOWN_SEC = 20 // ④ 한 대 다운 시 응답을 멈추는 시간

// 장애 시연 스위치를 DB(ChaosFlag, id=1)로 두 서버가 공유
// - save(): 버튼을 누르면 DB에 저장 + 내 메모리에도 바로 반영
// - 1초마다 DB에서 읽어 와 반영 → 다른 호기가 받은 버튼도 1초 안에 같이 적용
// - ④ 특정 호기 다운: crashTarget 이 나이고, 내가 켜진 뒤에 요청된 것이면 스스로 종료 → Docker가 다시 켬
@Injectable()
export class ChaosSync implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout
  private crashing = false

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.pull().catch(() => {})
    this.timer = setInterval(() => this.pull().catch(() => {}), 1000)
  }

  onModuleDestroy() {
    clearInterval(this.timer)
  }

  private apply(data: Partial<ChaosData>) {
    Object.assign(chaos, data)
    if (chaos.crashTarget === INSTANCE && chaos.crashAt > STARTED_AT && !this.crashing) {
      this.crashing = true
      // 시연에서 눈으로 볼 수 있게: 20초 동안 접속을 아예 안 받다가(장애) → 프로세스 종료 → Docker가 다시 켬(복구)
      console.error(`[chaos] 시연용 다운 → ${INSTANCE} ${DOWN_SEC}초간 응답 중지 후 종료 (Docker가 자동 재시작)`)
      const server = (globalThis as { __httpServer?: import('node:http').Server }).__httpServer
      server?.close()
      server?.closeAllConnections() // 로드밸런서와 맺어 둔 연결도 끊어야 진짜 "죽은 서버"가 됨
      setTimeout(() => process.exit(1), DOWN_SEC * 1000)
    }
  }

  async pull() {
    const row = await this.prisma.chaosFlag.findUnique({ where: { id: 1 } })
    if (row) this.apply(row.data as Partial<ChaosData>)
  }

  async save(patch: Partial<ChaosData>) {
    const data = { ...chaos, ...patch }
    await this.prisma.chaosFlag.upsert({ where: { id: 1 }, update: { data }, create: { id: 1, data } })
    this.apply(data)
  }
}
