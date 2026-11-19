import { useEffect, useState } from 'react'

// 캔버스에 글씨를 그리기 전에 웹폰트가 로딩됐는지 확인
export function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all([
      document.fonts.load('170px "Black Han Sans"'),
      document.fonts.load('170px "Anton"'),
    ])
      .catch(() => null)
      .then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  return ready
}

export function useHashRoute() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => {
      // #how 같은 섹션 앵커는 페이지 이동이 아니므로 무시
      if (location.hash && !location.hash.startsWith('#/')) return
      setHash(location.hash)
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
