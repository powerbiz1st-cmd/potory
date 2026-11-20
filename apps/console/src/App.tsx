import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getToken, setToken } from '@/api'
import Login from '@/Login'
import Dashboard from '@/Dashboard'

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken())
  const logout = () => {
    setToken(null)
    setAuthed(false)
  }
  return (
    <TooltipProvider delayDuration={200}>
      {authed ? <Dashboard onLogout={logout} /> : <Login onDone={() => setAuthed(true)} />}
      <Toaster position="top-right" theme="dark" richColors />
    </TooltipProvider>
  )
}
