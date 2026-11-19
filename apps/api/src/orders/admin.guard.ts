import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'

// 관리자 API 보호: 요청 헤더 "x-admin-token" 이 환경변수 ADMIN_TOKEN 과 같아야 통과
// (시연용 간단 인증. 실제 서비스라면 로그인/세션으로 교체)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const expected = process.env.ADMIN_TOKEN ?? ''
    const got = String(ctx.switchToHttp().getRequest().headers['x-admin-token'] ?? '')
    const ok = expected.length >= 8 && got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected))
    if (!ok) throw new UnauthorizedException('관리자 인증이 필요해요')
    return true
  }
}
