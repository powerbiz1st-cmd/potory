# POTORY

세상에 하나뿐인 화분을 3D로 직접 디자인해서 주문하는 커스텀 화분 플랫폼 (포트폴리오 데모).

고객이 휴대폰에서 화분을 꾸며 주문하면 → 관리자 화면에 제작지시서로 뜨고 → 운영 콘솔에서 통계·서버 상태를 봅니다.
세 화면이 하나의 API · DB를 공유합니다.

| 앱 | 설명 | 상태 |
|---|---|---|
| `apps/shop` | 고객용 3D 커스터마이저 (React · Vite · React Three Fiber · shadcn/ui · Tailwind v4) | ✅ |
| `apps/api` | 주문 API (NestJS 12 · Prisma 7 · PostgreSQL 17) | ✅ |
| `apps/admin` | 관리자 백오피스 (주문 · 제작지시서 · 재고) | 예정 |
| `apps/console` | 운영 콘솔 (통계 · 서버 상태 · 장애 알림) | 예정 |

## 실행

Docker만 있으면 됩니다.

```bash
cp .env.example .env   # ADMIN_TOKEN 등 값 채우기
docker compose up -d
```

- Shop: http://localhost:5173
- API 상태: http://localhost:3000/health

같은 와이파이의 휴대폰에서는 `http://<PC의 IP>:5173` 으로 접속하면 됩니다.

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| `POST` | `/orders` | 주문 (금액은 서버에서 다시 계산) |
| `GET` | `/orders/:no` | 주문번호로 조회 (이름·연락처는 가려서 응답) |
| `GET` | `/orders?no=..&no=..` | 여러 주문 한 번에 조회 (휴대폰에 저장된 내 주문 목록) |
| `POST` | `/orders/lookup` | 이름 + 휴대폰 번호로 찾기 |
| `GET` | `/admin/orders` | 관리자: 주문 목록 (`x-admin-token` 필요) |
| `PATCH` | `/admin/orders/:no/status` | 관리자: 상태 변경 (접수 → 제작 중 → 출고) |
| `GET` | `/health` | 서버 · DB 상태 |

## 3D 식물 모델 변환

`tools/blender` — 원본 `.blend`를 Docker 안의 Blender로 열어 화분을 지우고, 폴리곤·텍스처를 줄여 웹용 GLB(Draco + WebP)로 내보냅니다.
원본은 `assets-src/`(git 제외)에 두고 실행:

```bash
docker compose -f tools/blender/compose.yml run --rm blender \
  -b monstera/PlantMonstera001_Blender_Cycles.blend --disable-autoexec \
  --python /scripts/convert_plant.py -- /out/monstera.glb 30000
```
