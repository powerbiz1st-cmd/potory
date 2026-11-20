# POTORY

세상에 하나뿐인 화분을 3D로 직접 디자인해서 주문하는 커스텀 화분 플랫폼 (포트폴리오 데모).

고객이 휴대폰에서 화분을 꾸며 주문하면 → 관리자 화면에 제작지시서로 뜨고 → 운영 콘솔에서 통계·서버 상태를 봅니다.
세 화면이 하나의 API · DB를 공유합니다.

| 앱 | 설명 | 상태 |
|---|---|---|
| `apps/shop` | 고객용 3D 커스터마이저 (React · Vite · React Three Fiber · shadcn/ui · Tailwind v4) | ✅ |
| `apps/api` | 주문 API (NestJS 12 · Prisma 7 · PostgreSQL 17) | ✅ |
| `apps/admin` | 관리자 백오피스 — 실시간 주문 목록, 상태 변경, 제작지시서 인쇄, 재고 (React · shadcn/ui) | ✅ |
| `apps/console` | 운영 콘솔 — 서버·DB 상태, 장애 감지·복구 기록, 매출·주문 통계 (다크 대시보드) | ✅ |

## 실행

Docker만 있으면 됩니다.

```bash
cp .env.example .env   # ADMIN_TOKEN 등 값 채우기
docker compose up -d
```

- Shop: http://localhost:5173
- Admin: http://localhost:5174 (`.env` 의 `ADMIN_TOKEN` 으로 로그인)
- Console: http://localhost:5175 (같은 토큰)
- 알림 메일함(테스트용 Mailpit): http://localhost:8025
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
| `PATCH` | `/admin/orders/:no/status` | 관리자: 상태 변경 (접수 → 제작 중 → 출고 / 취소 시 재고 복구) |
| `GET` | `/admin/stock` | 관리자: 재고 (주문 시 화분 몸체·몬스테라 자동 차감) |
| `PATCH` | `/admin/stock/:sku` | 관리자: 입고·수동 조정 |
| `GET` | `/admin/console/stats?days=14` | 콘솔: 날짜별 주문·매출, 상태별·모양별, 리드타임, 재고 부족 |
| `GET` | `/admin/console/system` | 콘솔: API·DB·호스트 상태 (메모리, DB 응답시간·크기·연결 수) |
| `GET` | `/health` | 서버 · DB 상태 |

## 모니터링 · 알림 · 백업

| 서비스 | 역할 |
|---|---|
| `watchdog` (:3100) | API·Shop·Admin·Console을 10초마다 바깥에서 확인. 2번 연속 실패하면 **장애 메일**, 살아나면 **복구 메일**(중단 시간 포함). 콘솔이 `/status`를 읽어 표시 |
| `mailpit` (:8025) | 가짜 메일함. 메일 계정을 설정하기 전에도 알림을 여기서 확인 |
| `backup` | 켜질 때 1번 + 24시간마다 DB를 `./backups/*.sql.gz`로 저장, 최근 7개 보관 (git 제외) |

모든 서비스는 `restart: unless-stopped` — 죽으면 Docker가 자동으로 다시 켭니다.

### 알림 메일 계정 설정

`.env`에 적습니다 (git에 안 올라감). 비워 두면 Mailpit으로 갑니다. Gmail 예시:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=보내는주소@gmail.com
SMTP_PASS=구글 앱 비밀번호 16자리
ALERT_TO=받는주소@example.com
```

Gmail은 계정에 2단계 인증을 켠 뒤 "앱 비밀번호"를 발급해 `SMTP_PASS`에 넣습니다 (일반 로그인 비밀번호는 안 됨). 저장 후 `docker compose up -d watchdog`.

### 백업 복원

```bash
gunzip -c backups/potory-YYYYMMDD-HHMMSS.sql.gz | docker compose exec -T db psql -U potory -d potory
```

## 3D 식물 모델 변환

`tools/blender` — 원본 `.blend`를 Docker 안의 Blender로 열어 화분을 지우고, 폴리곤·텍스처를 줄여 웹용 GLB(Draco + WebP)로 내보냅니다.
원본은 `assets-src/`(git 제외)에 두고 실행:

```bash
docker compose -f tools/blender/compose.yml run --rm blender \
  -b monstera/PlantMonstera001_Blender_Cycles.blend --disable-autoexec \
  --python /scripts/convert_plant.py -- /out/monstera.glb 30000
```
