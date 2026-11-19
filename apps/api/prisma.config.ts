import { defineConfig, env } from 'prisma/config'

// DATABASE_URL은 docker-compose.yml에서 넣어줍니다.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
})
