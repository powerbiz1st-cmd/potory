import type { ReactNode } from 'react'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OrderLookup from '@/components/OrderLookup'

export default function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-forest/10 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <a href="#/" className="flex items-center gap-2 text-forest">
          <span className="grid size-9 place-items-center rounded-full bg-lime">
            <Sprout className="size-5" />
          </span>
          <span className="display text-3xl">Potory</span>
        </a>
        <div className="flex items-center gap-1">
          {right ?? (
            <nav className="flex items-center gap-1">
              <a href="#how" className="hidden rounded-full px-4 py-2 font-semibold text-forest/80 hover:bg-forest/5 md:block">이용 방법</a>
              <a href="#gallery" className="hidden rounded-full px-4 py-2 font-semibold text-forest/80 hover:bg-forest/5 md:block">갤러리</a>
              <a href="#faq" className="hidden rounded-full px-4 py-2 font-semibold text-forest/80 hover:bg-forest/5 md:block">FAQ</a>
            </nav>
          )}
          <OrderLookup />
          {!right && (
            <Button asChild className="ml-1 rounded-full font-bold">
              <a href="#/make">만들기</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
