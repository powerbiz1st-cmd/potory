import { useState } from 'react'
import { Activity, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, setToken } from '@/api'

// Admin과 같은 관리자 토큰으로 로그인
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
    <div className="grid min-h-dvh place-items-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-lime text-background">
              <Activity className="size-5" />
            </span>
            <span className="display text-2xl text-lime">Potory Ops</span>
          </div>
          <CardTitle>운영 콘솔</CardTitle>
          <CardDescription>관리자 토큰(ADMIN_TOKEN)으로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" autoFocus value={token} onChange={(e) => setTok(e.target.value)} placeholder="ADMIN_TOKEN" aria-label="관리자 토큰" className="h-11 pl-9" />
            </div>
            {error && <p className="text-sm text-bad">{error}</p>}
            <Button type="submit" className="h-11 w-full font-bold" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />} 들어가기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
