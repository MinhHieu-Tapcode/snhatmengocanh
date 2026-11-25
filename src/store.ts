import { create } from 'zustand'
import { texts } from './content/texts'
import { audio } from './audio/audio'
import { birthdaySongFile } from './content/music'
import { resetPlayer } from './game/runtime'

export type Phase = 'title' | 'guide' | 'play' | 'memory' | 'finale' | 'letter'
export type Quest = 'bell' | 'flowers' | 'gift' | 'done'
export type TargetId = 'bell' | 'gift' | `flower-${number}`

type State = {
  phase: Phase
  quest: Quest
  collected: boolean[]
  activeMemory: number | null
  nearTarget: TargetId | null
  bubble: string | null
  bubbleKey: number
  finaleAt: number
  finaleReady: boolean
  muted: boolean

  start: () => void
  beginPlay: () => void
  setNear: (t: TargetId | null) => void
  say: (text: string | null) => void
  interact: () => void
  closeMemory: () => void
  setFinaleReady: () => void
  openLetter: () => void
  toggleMute: () => void
  replay: () => void
}

export const collectedCount = (c: boolean[]) => c.filter(Boolean).length

export const useGame = create<State>((set, get) => ({
  phase: 'title',
  quest: 'bell',
  collected: [false, false, false],
  activeMemory: null,
  nearTarget: null,
  bubble: null,
  bubbleKey: 0,
  finaleAt: 0,
  finaleReady: false,
  muted: false,

  start: () => {
    audio.start()
    audio.sfx('whoosh')
    set({ phase: 'guide' })
  },

  beginPlay: () => {
    audio.sfx('soft')
    resetPlayer()
    set({ phase: 'play' })
    get().say(texts.questBell)
  },

  setNear: (t) => {
    if (get().nearTarget !== t) set({ nearTarget: t })
  },

  say: (text) => set((s) => ({ bubble: text, bubbleKey: s.bubbleKey + 1 })),

  interact: () => {
    const { nearTarget, quest, phase, collected } = get()
    if (phase !== 'play' || !nearTarget) return

    if (nearTarget === 'bell' && quest === 'bell') {
      audio.sfx('doorbell')
      set({ quest: 'flowers', nearTarget: null })
      get().say(texts.afterBell)
      return
    }

    if (nearTarget.startsWith('flower-') && quest === 'flowers') {
      const i = Number(nearTarget.split('-')[1])
      if (collected[i]) return
      const next = collected.slice()
      next[i] = true
      audio.sfx('collect')
      set({ collected: next, activeMemory: i, phase: 'memory', nearTarget: null })
      return
    }

    if (nearTarget === 'gift' && quest === 'gift') {
      audio.sfx('giftOpen')
      // bài chúc mừng sinh nhật vang lên cùng lúc pháo hoa bắt đầu
      window.setTimeout(() => {
        if (get().phase === 'finale' || get().phase === 'letter') audio.startBirthdaySong(birthdaySongFile)
      }, 2300)
      set({
        phase: 'finale',
        quest: 'done',
        nearTarget: null,
        bubble: null,
        finaleAt: performance.now(),
        finaleReady: false,
      })
    }
  },

  closeMemory: () => {
    const done = collectedCount(get().collected) === 3
    audio.sfx('soft')
    set({ phase: 'play', activeMemory: null, quest: done ? 'gift' : 'flowers' })
    if (done) {
      audio.sfx('unlock')
      get().say(texts.questGift)
    } else {
      get().say(`${texts.questFlowers} (${collectedCount(get().collected)}/3)`)
    }
  },

  setFinaleReady: () => set({ finaleReady: true }),

  openLetter: () => {
    audio.sfx('soft')
    set({ phase: 'letter' })
  },

  toggleMute: () => {
    const muted = !get().muted
    audio.setMuted(muted)
    set({ muted })
  },

  replay: () => {
    audio.stopBirthdaySong()
    resetPlayer()
    set({
      phase: 'play',
      quest: 'bell',
      collected: [false, false, false],
      activeMemory: null,
      nearTarget: null,
      finaleReady: false,
    })
    get().say(texts.questBell)
  },
}))
