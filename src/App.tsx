import { useEffect, useState } from 'react'
import { Scene } from './game/Scene'
import { useGame } from './store'
import { useKeyboard } from './ui/Controls'
import { FinaleOverlay, GuideScreen, Hud, LetterScreen, MemoryCard, TitleScreen } from './ui/Overlays'

function Loader() {
  const [hide, setHide] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setHide(true), 900)
    return () => window.clearTimeout(id)
  }, [])
  return <div className={`loader ${hide ? 'is-hidden' : ''}`} aria-hidden />
}

export default function App() {
  const phase = useGame((s) => s.phase)
  useKeyboard()

  // Không cho trình duyệt cuộn/zoom khi chạm vào game
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (useGame.getState().phase !== 'letter' && e.touches.length > 1) e.preventDefault()
    }
    const gesture = (e: Event) => e.preventDefault()
    document.addEventListener('touchmove', prevent, { passive: false })
    document.addEventListener('gesturestart', gesture)
    return () => {
      document.removeEventListener('touchmove', prevent)
      document.removeEventListener('gesturestart', gesture)
    }
  }, [])

  return (
    <>
      <Scene />
      {phase === 'title' && <TitleScreen />}
      {phase === 'guide' && <GuideScreen />}
      {phase === 'play' && <Hud />}
      {phase === 'memory' && <MemoryCard />}
      {phase === 'finale' && <FinaleOverlay />}
      {phase === 'letter' && <LetterScreen />}
      <Loader />
    </>
  )
}
