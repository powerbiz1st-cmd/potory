-- POTORY 시연용 데이터로 초기화
-- 기존 주문·기록을 모두 지우고, 최근 14일치 데모 주문 22건 + 재고를 다시 넣습니다.
-- 시각은 "지금"을 기준으로 계산해서 언제 실행해도 '오늘·어제…' 흐름이 자연스럽게 보입니다.
-- 이름·연락처는 모두 가짜입니다. 실행: tools/demo/reset-demo.ps1
SET client_encoding = 'UTF8';
BEGIN;

TRUNCATE "OrderEvent", "Order" RESTART IDENTITY CASCADE;
DELETE FROM "ChaosFlag"; -- 장애 시연 스위치도 모두 끔 (이중화된 API가 공유하는 상태)

-- (분 전, 이름, 끝번호, 모양, 바탕색, 포인트색, 패턴, 문구, 글자색, 상태)
CREATE TEMP TABLE demo(seq serial, mins_ago int, name text, tail text, shape text, color text, accent text, pattern text, txt text, text_color text, status "OrderStatus") ON COMMIT DROP;
INSERT INTO demo(mins_ago, name, tail, shape, color, accent, pattern, txt, text_color, status) VALUES
  (19180, '김서연', '1024', 'cylinder', '#F2F0EB', '#2F4A3A', 'none',   '',         '#2F4A3A', 'SHIPPED'),
  (18200, '이도윤', '2231', 'tapered',  '#C46A43', '#F2F0EB', 'stripe', '',         '#2F4A3A', 'SHIPPED'),
  (17150, '박지우', '3317', 'round',    '#A3B19A', '#2F4A3A', 'dots',   'LEAF',     '#2F4A3A', 'SHIPPED'),
  (15700, '최하은', '4402', 'glass',    '#F2F0EB', '#2F4A3A', 'none',   '',         '#2F4A3A', 'SHIPPED'),
  (14420, '정민준', '5513', 'cylinder', '#2A2A2A', '#DCD3C3', 'none',   'HOME',     '#F2F0EB', 'SHIPPED'),
  (12990, '강서준', '6624', 'tapered',  '#DCD3C3', '#C46A43', 'wave',   '',         '#2F4A3A', 'SHIPPED'),
  (11610, '조예린', '7735', 'cylinder', '#8FA9BF', '#F2F0EB', 'stripe', '',         '#2F4A3A', 'CANCELED'),
  (10180, '윤지호', '8846', 'round',    '#2F4A3A', '#A3B19A', 'none',   'MONSTERA', '#F2F0EB', 'SHIPPED'),
  (8770,  '장수아', '9957', 'glass',    '#F2F0EB', '#2F4A3A', 'stripe', 'GREEN',    '#2F4A3A', 'SHIPPED'),
  (8650,  '임하준', '1068', 'cylinder', '#F2F0EB', '#2F4A3A', 'none',   '',         '#2F4A3A', 'SHIPPED'),
  (7240,  '한지민', '2179', 'tapered',  '#C46A43', '#F2F0EB', 'none',   '',         '#2F4A3A', 'SHIPPED'),
  (5860,  '오시우', '3280', 'round',    '#DCD3C3', '#2F4A3A', 'check',  '',         '#2F4A3A', 'SHIPPED'),
  (5710,  '서유나', '4391', 'cylinder', '#A3B19A', '#2F4A3A', 'dots',   '초록',     '#2F4A3A', 'SHIPPED'),
  (4380,  '신동현', '5402', 'glass',    '#8FA9BF', '#2F4A3A', 'none',   '',         '#2F4A3A', 'SHIPPED'),
  (4200,  '권나연', '6513', 'cylinder', '#2A2A2A', '#DCD3C3', 'stripe', '',         '#F2F0EB', 'SHIPPED'),
  (2950,  '황준서', '7624', 'tapered',  '#F2F0EB', '#C46A43', 'wave',   'HOME',     '#2F4A3A', 'SHIPPED'),
  (2830,  '안채원', '8735', 'round',    '#C46A43', '#F2F0EB', 'none',   '',         '#F2F0EB', 'MAKING'),
  (1510,  '송현우', '9846', 'cylinder', '#F2F0EB', '#2F4A3A', 'none',   'LEAF',     '#2F4A3A', 'MAKING'),
  (1390,  '류다은', '1957', 'glass',    '#F2F0EB', '#2F4A3A', 'dots',   '',         '#2F4A3A', 'MAKING'),
  (330,   '홍지안', '2068', 'tapered',  '#A3B19A', '#2F4A3A', 'none',   '',         '#2F4A3A', 'MAKING'),
  (95,    '배서윤', '3179', 'cylinder', '#DCD3C3', '#2F4A3A', 'stripe', '',         '#2F4A3A', 'RECEIVED'),
  (40,    '문태윤', '4280', 'round',    '#2F4A3A', '#A3B19A', 'none',   'GREEN',    '#F2F0EB', 'RECEIVED');

-- 주문 (금액은 API 가격표와 같은 계산: 모양 + 패턴 + 몬스테라 12,000 + 문구 3,000)
INSERT INTO "Order"(no, name, phone, design, total, status, "createdAt", "updatedAt")
SELECT
  'PT-' || to_char(t.created + interval '9 hours', 'YYMMDD') || '-' || d.tail,
  d.name,
  '0100000' || d.tail,
  jsonb_build_object('shape', d.shape, 'color', d.color, 'accent', d.accent, 'pattern', d.pattern,
                     'text', d.txt, 'textColor', d.text_color, 'plant', 'monstera'),
  (CASE d.shape WHEN 'cylinder' THEN 13900 WHEN 'tapered' THEN 14900 WHEN 'round' THEN 15900 ELSE 19900 END)
    + (CASE WHEN d.pattern = 'none' THEN 0 ELSE 2000 END) + 12000 + (CASE WHEN d.txt = '' THEN 0 ELSE 3000 END),
  d.status,
  t.created,
  t.created + CASE d.status WHEN 'SHIPPED' THEN interval '26 hours' WHEN 'MAKING' THEN interval '3 hours' WHEN 'CANCELED' THEN interval '1 hour' ELSE interval '0' END
FROM demo d
CROSS JOIN LATERAL (SELECT (now() AT TIME ZONE 'UTC') - make_interval(mins => d.mins_ago) AS created) t
ORDER BY d.seq;

-- 상태 변경 기록: 접수 → (3시간 뒤) 제작 → (26시간 뒤) 출고 / 취소는 1시간 뒤
INSERT INTO "OrderEvent"("orderId", status, note, "createdAt")
SELECT o.id, 'RECEIVED'::"OrderStatus", NULL::text, o."createdAt" FROM "Order" o
UNION ALL
SELECT o.id, 'MAKING'::"OrderStatus", NULL, o."createdAt" + interval '3 hours' FROM "Order" o WHERE o.status IN ('MAKING', 'SHIPPED')
UNION ALL
SELECT o.id, 'SHIPPED'::"OrderStatus", NULL, o."createdAt" + interval '26 hours' FROM "Order" o WHERE o.status = 'SHIPPED'
UNION ALL
SELECT o.id, 'CANCELED'::"OrderStatus", '고객 요청 취소', o."createdAt" + interval '1 hour' FROM "Order" o WHERE o.status = 'CANCELED'
ORDER BY 4;

-- 재고: 기본 수량에서 (취소 제외) 데모 주문만큼 빼서 실제 흐름과 맞춤
INSERT INTO "StockItem"(sku, name, qty, threshold, "updatedAt") VALUES
  ('pot-cylinder',   '화분 몸체 · 실린더', 40, 8,  now() AT TIME ZONE 'UTC'),
  ('pot-tapered',    '화분 몸체 · 테이퍼', 30, 8,  now() AT TIME ZONE 'UTC'),
  ('pot-round',      '화분 몸체 · 라운드', 20, 6,  now() AT TIME ZONE 'UTC'),
  ('pot-glass',      '유리 화분 · 글라스', 12, 4,  now() AT TIME ZONE 'UTC'),
  ('plant-monstera', '몬스테라 묘목',      60, 10, now() AT TIME ZONE 'UTC')
ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, qty = EXCLUDED.qty, threshold = EXCLUDED.threshold, "updatedAt" = EXCLUDED."updatedAt";

UPDATE "StockItem" s SET qty = s.qty - c.n
FROM (
  SELECT 'pot-' || (design->>'shape') AS sku, count(*) AS n FROM "Order" WHERE status <> 'CANCELED' GROUP BY 1
  UNION ALL
  SELECT 'plant-monstera', count(*) FROM "Order" WHERE status <> 'CANCELED'
) c
WHERE s.sku = c.sku;

COMMIT;

-- 결과 요약
SELECT status, count(*) AS 주문수, sum(total) AS 금액 FROM "Order" GROUP BY status ORDER BY status;
SELECT sku, qty FROM "StockItem" ORDER BY sku;
