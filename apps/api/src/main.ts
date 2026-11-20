import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { chaosMiddleware } from './chaos/chaos.state'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // CORS_ORIGINS가 비어 있으면(개발) 모든 출처 허용 → 같은 와이파이의 휴대폰에서도 접속 가능
  // 배포 땐 "https://shop.도메인,https://admin.도메인" 처럼 콤마로 지정
  const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  app.enableCors({ origin: origins.length ? origins : true })

  // 장애 시연 스위치 (CHAOS_ENABLED=true 일 때만 동작)
  app.use(chaosMiddleware)

  // 요청 본문 검증: DTO에 없는 필드는 거절, 숫자/문자 자동 변환
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))

  app.enableShutdownHooks()
  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port, '0.0.0.0')
  console.log(`POTORY API listening on :${port}`)
}
bootstrap()
