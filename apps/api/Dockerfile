# POTORY API 운영용 이미지 — 이중화(api-1, api-2)가 같은 이미지를 씀
# 코드 바꾼 뒤 반영: docker compose up -d --build api-1 api-2
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# prisma.config.ts 가 DATABASE_URL 을 요구해서 빌드 때만 가짜 값 (접속은 안 함, 실행 땐 compose의 실제 값 사용)
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate && npx nest build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts /app/package.json ./
EXPOSE 3000
# 마이그레이션 적용(두 대가 동시에 해도 Prisma가 잠금으로 순서 보장) → 서버 실행
# exec: node가 컨테이너의 주 프로세스가 되어, 죽으면 컨테이너가 끝나고 Docker가 다시 켬
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/src/main.js"]
