// POTORY watchdog — 앱과 따로 떨어져서 각 서비스를 계속 두드려 보고,
// 죽으면 "장애" 메일, 살아나면 "복구" 메일(중단 시간 포함)을 보냅니다.
//
// 메일 계정 설정은 custom-pot/.env 에서 합니다 (git에 안 올라감):
//   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / ALERT_FROM / ALERT_TO
// 비워 두면 같은 Docker 안의 가짜 메일함(Mailpit, http://localhost:8025)으로 보냅니다.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'

const env = (k, d = '') => (process.env[k] ?? '').trim() || d

const INTERVAL_MS = Number(env('CHECK_INTERVAL_SEC', '5')) * 1000 // 5초 × 2번 실패 = 약 10초 안에 장애 판단
const TIMEOUT_MS = 4000
const FAILS_TO_DOWN = Number(env('FAILS_TO_DOWN', '2')) // 연속 n번 실패해야 장애로 판단 (순간 끊김 무시)
const DATA_DIR = env('DATA_DIR', '/data')
const BACKUP_DIR = env('BACKUP_DIR', '/backups')
const PORT = Number(env('PORT', '3100'))
const STARTED = Date.now()
const STARTUP_GRACE_MS = 120_000 // 시작 후 2분은 "부팅 중"으로 보고 장애 메일 보류

// 감시 대상 (Docker 안에서의 주소)
const TARGETS = [
  { id: 'api', name: 'API 서버', url: 'http://api:3000/health' },
  { id: 'shop', name: 'Shop (고객 화면)', url: 'http://shop:5173/' },
  { id: 'admin', name: 'Admin (관리자)', url: 'http://admin:5174/' },
  { id: 'console', name: '운영 콘솔', url: 'http://console:5175/' },
]

// ---- 메일 ----
const realSmtp = !!env('SMTP_HOST')
const transporter = nodemailer.createTransport(
  realSmtp
    ? {
        host: env('SMTP_HOST'),
        port: Number(env('SMTP_PORT', '465')),
        secure: Number(env('SMTP_PORT', '465')) === 465,
        auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') } : undefined,
      }
    : { host: 'mailpit', port: 1025, secure: false }, // 가짜 메일함 (테스트용)
)
const FROM = env('ALERT_FROM', env('SMTP_USER', 'potory-watchdog@localhost'))
const TO = env('ALERT_TO', 'ops@potory.local')
const mailMode = realSmtp ? `실제 메일 (${env('SMTP_HOST')})` : '가짜 메일함 (Mailpit)'

// 켜질 때 메일 서버 로그인까지 미리 확인 (앱 비밀번호가 틀리면 여기서 바로 알 수 있음)
let mailCheck = { ok: null, error: null }
transporter
  .verify()
  .then(() => {
    mailCheck = { ok: true, error: null }
    console.log(`[mail] 메일 서버 연결·로그인 확인됨: ${mailMode}`)
  })
  .catch((e) => {
    mailCheck = { ok: false, error: String(e?.message ?? e) }
    console.error(`[mail] 메일 서버 확인 실패: ${mailCheck.error}`)
  })

// ---- 상태 저장 (재시작해도 기록 유지) ----
fs.mkdirSync(DATA_DIR, { recursive: true })
const FILE = path.join(DATA_DIR, 'incidents.json')
const load = () => {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return { incidents: [], mails: [] }
  }
}
const store = load()
const save = () => fs.writeFileSync(FILE, JSON.stringify(store, null, 1))

const state = Object.fromEntries(TARGETS.map((t) => [t.id, { status: 'unknown', fails: 0, since: null, lastMs: null, lastError: null, checkedAt: null }]))

const kst = (d) => new Date(d).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
const dur = (ms) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}초` : `${Math.floor(s / 60)}분 ${s % 60}초`
}

async function sendMail(subject, lines) {
  const entry = { at: new Date().toISOString(), subject, to: TO, ok: false, error: null }
  try {
    await transporter.sendMail({
      from: `POTORY 감시 <${FROM}>`,
      to: TO,
      subject,
      text: lines.join('\n'),
      html: `<div style="font-family:sans-serif;line-height:1.6">${lines.map((l) => `<p style="margin:4px 0">${l}</p>`).join('')}</div>`,
    })
    entry.ok = true
    console.log(`[mail] 보냄: ${subject}`)
  } catch (e) {
    entry.error = String(e?.message ?? e)
    console.error(`[mail] 실패: ${subject} — ${entry.error}`)
  }
  store.mails = [entry, ...store.mails].slice(0, 50)
  save()
}

async function check(t) {
  const s = state[t.id]
  const t0 = Date.now()
  let ok = false
  let error = null
  try {
    const res = await fetch(t.url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    ok = res.ok
    if (!ok) error = `HTTP ${res.status}`
  } catch (e) {
    error = e?.name === 'TimeoutError' ? `${TIMEOUT_MS / 1000}초 안에 응답 없음` : '연결 안 됨'
  }
  s.lastMs = ok ? Date.now() - t0 : null
  s.checkedAt = new Date().toISOString()
  s.lastError = error

  if (ok) {
    if (s.status === 'down') {
      const downFor = Date.now() - new Date(s.since).getTime()
      store.incidents = [{ id: t.id, name: t.name, type: 'up', at: s.checkedAt, downForMs: downFor }, ...store.incidents].slice(0, 100)
      save()
      await sendMail(`[POTORY 복구] ${t.name} 정상화 (중단 ${dur(downFor)})`, [
        `<b>${t.name}</b>가 다시 정상 응답합니다.`,
        `복구 시각: ${kst(s.checkedAt)}`,
        `중단 시간: ${dur(downFor)} (${kst(s.since)}부터)`,
        `응답 시간: ${s.lastMs}ms`,
      ])
    }
    if (s.status !== 'up') s.since = s.checkedAt
    s.status = 'up'
    s.fails = 0
  } else {
    s.fails++
    // 막 켜졌을 때(전체를 다시 띄우는 중)는 아직 부팅 중일 수 있어서, 한 번도 안 살아난 서비스는 잠시 기다림
    const booting = s.status === 'unknown' && Date.now() - STARTED < STARTUP_GRACE_MS
    if (s.fails >= FAILS_TO_DOWN && s.status !== 'down' && !booting) {
      s.status = 'down'
      s.since = s.checkedAt
      store.incidents = [{ id: t.id, name: t.name, type: 'down', at: s.checkedAt, error }, ...store.incidents].slice(0, 100)
      save()
      await sendMail(`[POTORY 장애] ${t.name} 응답 없음`, [
        `<b>${t.name}</b>가 응답하지 않습니다.`,
        `감지 시각: ${kst(s.checkedAt)}`,
        `원인: ${error}`,
        `${FAILS_TO_DOWN}번 연속 실패해서 장애로 판단했습니다. 복구되면 다시 알려드려요.`,
      ])
    }
  }
}

function lastBackup() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((f) => ({ file: f, ...fs.statSync(path.join(BACKUP_DIR, f)) }))
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
    return files.length ? { file: files[0].file, at: new Date(files[0].mtimeMs).toISOString(), sizeKb: Math.round(files[0].size / 1024), count: files.length } : null
  } catch {
    return null
  }
}

async function loop() {
  await Promise.all(TARGETS.map(check))
}

// 콘솔이 읽어 가는 상태 API (GET /status)
http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (req.url?.startsWith('/status')) {
      res.end(
        JSON.stringify({
          at: new Date().toISOString(),
          intervalSec: INTERVAL_MS / 1000,
          mail: { mode: mailMode, to: TO, ready: mailCheck.ok, error: mailCheck.error },
          targets: TARGETS.map((t) => ({ id: t.id, name: t.name, ...state[t.id] })),
          incidents: store.incidents.slice(0, 20),
          mails: store.mails.slice(0, 10),
          backup: lastBackup(),
        }),
      )
    } else {
      res.statusCode = 404
      res.end('{}')
    }
  })
  .listen(PORT, () => console.log(`watchdog :${PORT} · ${TARGETS.length}개 감시 · ${INTERVAL_MS / 1000}초마다 · 메일: ${mailMode} → ${TO}`))

loop()
setInterval(loop, INTERVAL_MS)
