import { useState } from 'react'
import { LogOut, Package, ClipboardList, Sprout } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getToken, setToken } from '@/api'
import Login from '@/pages/Login'
import Orders from '@/pages/Orders'
import Stock from '@/pages/Stock'

type Tab = 'orders' | 'stock'

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken())
  const [tab, setTab] = useState<Tab>('orders')

  const logout = () => {
    setToken(null)
    setAuthed(false)
  }

  return (
    <TooltipProvider delayDuration={200}>
      {!authed ? (
        <Login onDone={() => setAuthed(true)} />
      ) : (
        <div className="min-h-dvh">
          <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur print:hidden">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 md:px-6">
              <div className="flex items-center gap-2 text-forest">
                <span className="grid size-8 place-items-center rounded-full bg-lime">
                  <Sprout className="size-4" />
                </span>
                <span className="display text-xl">Potory</span>
                <span className="rounded-md bg-forest px-1.5 py-0.5 text-[11px] font-bold text-white">ADMIN</span>
              </div>
              <nav className="flex gap-1">
                {(
                  [
                    ['orders', '주문', ClipboardList],
                    ['stock', '재고', Package],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground',
                      tab === id && 'bg-accent text-forest',
                    )}
                  >
                    <Icon className="size-4" /> {label}
                  </button>
                ))}
              </nav>
              <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={logout}>
                <LogOut /> 로그아웃
              </Button>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{tab === 'orders' ? <Orders onAuthFail={logout} /> : <Stock onAuthFail={logout} />}</main>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  )
}
