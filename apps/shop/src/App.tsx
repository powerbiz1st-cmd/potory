import Landing from './pages/Landing'
import Customizer from './pages/Customizer'
import { useHashRoute } from './hooks'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

// GitHub Pages에서도 새로고침이 깨지지 않도록 해시(#) 라우팅 사용
export default function App() {
  const hash = useHashRoute()
  return (
    <TooltipProvider delayDuration={200}>
      <div className="paper" aria-hidden />
      {hash.startsWith('#/make') ? <Customizer /> : <Landing />}
      <Toaster position="top-center" />
    </TooltipProvider>
  )
}
