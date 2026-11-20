# POTORY

세상에 하나뿐인 화분을 3D로 직접 디자인해서 주문하는 커스텀 화분 플랫폼 (포트폴리오 데모).

고객이 휴대폰에서 화분을 꾸며 주문하면 → 관리자 화면에 제작지시서로 뜨고 → 운영 콘솔에서 통계·서버 상태를 봅니다.
세 화면이 하나의 API · DB를 공유합니다.

| 앱 | 설명 | 상태 |
|---|---|---|
| `apps/shop` | 고객용 3D 커스터마이저 (React · Vite · React Three Fiber · shadcn/ui · Tailwind v4) | ✅ |
| `apps/api` | 주문 API (NestJS 12 · Prisma 7 · PostgreSQL 17) — **2대 이중화 + 로드밸런서(Caddy)** | ✅ |
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

## API 이중화

```
화면 · 터널 · 감시 ──▶ api:3000 (Caddy 로드밸런서) ──┬──▶ api-1 ─┐
                                                     └──▶ api-2 ─┴──▶ PostgreSQL
```

- 같은 이미지(`apps/api/Dockerfile`)로 두 대 실행, 요청은 번갈아 분배 (`tools/lb/Caddyfile`)
- 한 대가 죽으면: 연결 실패 요청은 **다른 한 대로 즉시 재시도**(최대 5초) → 고객은 실패를 못 느낌, 죽은 서버는 10초간 제외, 2초마다 생존 확인 후 복귀
- 주문은 `Idempotency-Key`로 중복 방지 → 재시도돼도 주문은 1건
- 장애 시연 스위치는 DB(`ChaosFlag`)에 두어 두 대가 같은 상태를 봄. 응답 헤더 `X-Instance`로 처리한 호기 확인
- 콘솔 "API 이중화" 카드: 1·2호기 상태, 최근 요청 분배, 호기별 **중지**(20초 응답 중지 → 자동 재시작)
- 확인 결과: 1호기 중지 중 주문 144건 전송 → **실패 0건**, 그동안 2호기가 49건 연속 처리, 장애·복구 메일 수신
- API 코드를 바꾼 뒤: `docker compose up -d --build api-1 api-2`

## DB 직접 보기

- **DB 프로그램 (DBeaver, pgAdmin 등)**: 호스트 `127.0.0.1` · 포트 `5432` · DB `potory` · 사용자 `potory` · 비밀번호는 `.env`의 `POSTGRES_PASSWORD`. 이 PC에서만 접속됩니다.
- **웹으로 (설치 없이)**: `docker compose --profile tools up -d studio` → http://localhost:5555 (Prisma Studio)
- 테이블: `Order`(주문) · `OrderEvent`(상태 변경 기록) · `StockItem`(재고). SQL에서는 `SELECT * FROM "Order";`처럼 큰따옴표가 필요합니다.

## 배포 (시연 당일)

```powershell
powershell -ExecutionPolicy Bypass -File tools\demo\start-demo.ps1 -Reset   # 데모 데이터로 초기화 + 터널 + Pages 재배포 + 링크
powershell -ExecutionPolicy Bypass -File tools\demo\reset-demo.ps1          # 초기화만 (직전 DB는 backups/before-reset-*.sql.gz)
powershell -ExecutionPolicy Bypass -File tools\demo\stop-demo.ps1           # 끝나면 터널 닫기
```

화면은 GitHub Pages(고정 주소), API는 Cloudflare 임시 터널(켤 때마다 주소가 바뀜 → 스크립트가 자동으로 다시 빌드).
평소에는 둘 다 내려 둡니다: `stop-demo.ps1`이 터널을 닫고 Pages도 내림(`-KeepPages`로 화면만 남기기 가능), `start-demo.ps1`이 Pages를 다시 켜고 배포합니다. 배포는 시연 스크립트로만 실행됩니다(push 자동 배포 없음).

## 모니터링 · 알림 · 백업

| 서비스 | 역할 |
|---|---|
| `watchdog` (:3100) | API·Shop·Admin·Console을 5초마다 바깥에서 확인. 2번 연속 실패하면 **장애 메일**, 살아나면 **복구 메일**(중단 시간 포함). 콘솔이 `/status`를 읽어 표시 |
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

Gmail은 계정에 2단계 인증을 켠 뒤 "앱 비밀번호"를 발급해 `SMTP_PASS`에 넣습니다 (일반 로그인 비밀번호는 안 됨). 저장 후 꼭 `docker compose up -d watchdog` 로 감시 컨테이너를 다시 띄워야 적용됩니다. 켜질 때 메일 서버 로그인을 확인해서 콘솔·로그에 결과가 나옵니다.

### 장애 시연 (운영 콘솔 "장애 시연" 패널)

`.env`에 `CHAOS_ENABLED=true`일 때만 동작합니다 (실제 배포에선 false). 각 시연은 30초 뒤 저절로 정상화되고, "즉시 정상화" 버튼도 있습니다.

| 버튼 | 일어나는 일 | 보이는 것 |
|---|---|---|
| ① 응답 지연 | 모든 요청 1.5초 지연 | 콘솔 노란불, 응답시간 그래프 상승 |
| ② DB 장애 | DB 쓰는 요청 503 | 콘솔 DB 빨간불, 휴대폰 주문 실패 안내, 장애·복구 메일 |
| ③ 일부 요청 실패 | 주문·조회의 50%가 500 | 주문이 되다 안 되다 함 |
| ④ 서버 다운 | API 프로세스 강제 종료 → Docker 자동 재시작 | 장애 배너 → 자동 복구, 장애·복구 메일 (중단 약 10~20초) |
| ⑤ 재고 소진 | 몬스테라 재고 2개로 | Admin·콘솔 재고 부족 경고 → Admin에서 "10개 입고"로 해결 |

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
