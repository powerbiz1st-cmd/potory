import { useState } from 'react'
import { KeyRound, Loader2, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, setToken } from '@/api'

// 시연용 간단 로그인: 서버 .env 의 ADMIN_TOKEN 을 입력
export default function Login({ onDone }: { onDone: () => void }) {
  const [token, setTok] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      await api.login(token.trim())
      setToken(token.trim())
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-start">
          <div className="mb-2 flex items-center gap-2 text-forest">
            <span className="grid size-9 place-items-center rounded-full bg-lime">
              <Sprout className="size-5" />
            </span>
            <span className="display text-2xl">Potory Admin</span>
          </div>
          <CardTitle>관리자 로그인</CardTitle>
          <CardDescription>서버에 설정한 관리자 토큰을 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" autoFocus value={token} onChange={(e) => setTok(e.target.value)} placeholder="ADMIN_TOKEN" aria-label="관리자 토큰" className="h-11 pl-9" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />} 들어가기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
