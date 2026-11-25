/**
 * Âm thanh yên bình được tạo trực tiếp bằng Web Audio (không cần file nhạc):
 *  - Nền: hợp âm pad ấm, chậm + hộp nhạc (music box) ngũ cung nhẹ nhàng
 *  - Môi trường: gió nhẹ, chim hót ban ngày, dế kêu khi trời tối
 *  - Hiệu ứng: chuông cửa, tiếng chuông khi nhặt hoa, mở quà, pháo hoa
 */

type Sfx = 'collect' | 'doorbell' | 'giftOpen' | 'firework' | 'whoosh' | 'soft' | 'unlock'

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

// Fmaj9 → Dm9 → Bbmaj7 → Csus4/C  (ấm, không buồn)
const CHORDS = [
  [41, 53, 57, 60, 64, 67],
  [38, 50, 53, 57, 60, 64],
  [34, 46, 50, 53, 57, 62],
  [36, 48, 53, 55, 60, 67],
]
// Ngũ cung Fa trưởng cho hộp nhạc
const MELODY = [72, 74, 77, 79, 81, 84, 86, 89]

class AudioEngine {
  ctx: AudioContext | null = null
  master!: GainNode
  music!: GainNode
  sfxBus!: GainNode
  ambience!: GainNode
  reverb!: ConvolverNode
  wet!: GainNode
  noise!: AudioBuffer
  timers: number[] = []
  chordIndex = 0
  night = 0 // 0 ngày → 1 đêm
  muted = false

  start() {
    if (this.ctx) {
      this.ctx.resume()
      return
    }
    try {
      // iPhone: cho phép phát tiếng kể cả khi gạt nút im lặng
      const nav = navigator as Navigator & { audioSession?: { type: string } }
      if (nav.audioSession) nav.audioSession.type = 'playback'
    } catch {
      /* bỏ qua */
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx
    ctx.resume()

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 3)
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    this.master.connect(comp).connect(ctx.destination)

    this.reverb = ctx.createConvolver()
    this.reverb.buffer = this.makeImpulse(3.2)
    this.wet = ctx.createGain()
    this.wet.gain.value = 0.55
    this.reverb.connect(this.wet).connect(this.master)

    this.music = ctx.createGain()
    this.music.gain.value = 0.5
    this.music.connect(this.master)
    this.music.connect(this.reverb)

    this.sfxBus = ctx.createGain()
    this.sfxBus.gain.value = 0.8
    this.sfxBus.connect(this.master)
    this.sfxBus.connect(this.reverb)

    this.ambience = ctx.createGain()
    this.ambience.gain.value = 0.6
    this.ambience.connect(this.master)

    this.noise = this.makeNoise(2)

    this.startPads()
    this.startMusicBox()
    this.startWind()
    this.startBirds()
    this.startCrickets()

    // Safari có thể tạm dừng âm thanh khi chuyển ứng dụng
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return
      if (document.hidden) this.ctx.suspend()
      else this.ctx.resume()
    })
  }

  // ---------- Bài hát chúc mừng sinh nhật ----------

  songMode = false
  private songTimer = 0
  private songEl: HTMLAudioElement | null = null

  /**
   * Phát bài chúc mừng sinh nhật. Nếu có file nhạc riêng thì phát file đó,
   * không thì chơi giai điệu "Happy Birthday" bằng hộp nhạc, lặp lại nhẹ nhàng.
   */
  startBirthdaySong(file: string | null) {
    if (!this.ctx || this.songMode) return
    this.songMode = true
    if (file) {
      const el = new Audio(file)
      el.loop = true
      el.volume = 0
      el.muted = this.muted
      el.play().catch(() => {
        // không phát được file thì quay về hộp nhạc
        this.songEl = null
        this.playMusicBoxSong()
      })
      this.songEl = el
      const fade = window.setInterval(() => {
        if (!this.songEl) return window.clearInterval(fade)
        this.songEl.volume = Math.min(0.85, this.songEl.volume + 0.05)
        if (this.songEl.volume >= 0.85) window.clearInterval(fade)
      }, 120)
      return
    }
    this.playMusicBoxSong()
  }

  stopBirthdaySong() {
    this.songMode = false
    window.clearTimeout(this.songTimer)
    if (this.songEl) {
      this.songEl.pause()
      this.songEl = null
    }
  }

  private playMusicBoxSong() {
    if (!this.ctx || !this.songMode) return
    const beat = 0.72 // khoảng 83 nhịp/phút, nhịp 3/4, chậm rãi
    // Giai điệu Happy Birthday (giọng Fa trưởng, cao một quãng tám cho giống hộp nhạc)
    // [nốt MIDI, số phách]
    const melody: [number, number][] = [
      [72, 0.75], [72, 0.25],
      [74, 1], [72, 1], [77, 1],
      [76, 2], [72, 0.75], [72, 0.25],
      [74, 1], [72, 1], [79, 1],
      [77, 2], [72, 0.75], [72, 0.25],
      [84, 1], [81, 1], [77, 1],
      [76, 1], [74, 1], [82, 0.75], [82, 0.25],
      [81, 1], [77, 1], [79, 1],
      [77, 3],
    ]
    // hợp âm nền: [phách bắt đầu, độ dài (phách), các nốt]
    const chords: [number, number, number[]][] = [
      [1, 3, [53, 57, 60]], // F
      [4, 3, [48, 52, 55, 58]], // C7
      [7, 3, [48, 52, 55, 58]], // C7
      [10, 3, [53, 57, 60]], // F
      [13, 3, [53, 57, 60, 63]], // F7
      [16, 3, [46, 50, 53]], // Bb
      [19, 2, [53, 57, 60]], // F
      [21, 1, [48, 52, 55, 58]], // C7
      [22, 3, [53, 57, 60]], // F
    ]
    const t0 = this.ctx.currentTime + 0.3
    // thời điểm (giây) của từng phách, kéo chậm dần ở câu cuối cho tình cảm
    const at = (beatPos: number) => {
      const slowFrom = 19
      if (beatPos <= slowFrom) return t0 + beatPos * beat
      const extra = beatPos - slowFrom
      return t0 + slowFrom * beat + extra * beat * (1 + extra * 0.03)
    }
    let b = 0
    melody.forEach(([m, d]) => {
      const t = at(b)
      this.bell(mtof(m), t, 0.11, this.music, 2.8)
      this.bell(mtof(m + 12), t, 0.018, this.music, 1.4)
      b += d
    })
    chords.forEach(([start, len, notes]) => {
      const t = at(start)
      const dur = at(start + len) - t + 1.2
      notes.forEach((n) => this.padVoice(mtof(n), t, dur, 0.024, 0.25, 1.4))
      // tiếng bass nhẹ
      this.bell(mtof(notes[0] - 12), t, 0.05, this.music, 2.2)
    })
    const total = at(b) - t0 + 1
    // nghỉ một lát rồi hát lại
    this.songTimer = window.setTimeout(() => this.playMusicBoxSong(), (total + 5) * 1000)
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.songEl) this.songEl.muted = m
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, t, 0.3)
  }

  setNight(n: number) {
    this.night = Math.max(0, Math.min(1, n))
  }

  // ---------- Nhạc nền ----------

  private startPads() {
    const play = () => {
      if (!this.ctx || this.songMode) return
      const chord = CHORDS[this.chordIndex % CHORDS.length]
      this.chordIndex++
      const t = this.ctx.currentTime + 0.05
      chord.forEach((m, i) => this.padVoice(mtof(m), t, 9.5, i === 0 ? 0.07 : 0.035))
    }
    play()
    this.timers.push(window.setInterval(play, 8000))
  }

  private padVoice(freq: number, t: number, dur: number, vol: number, attack = 2.5, release = 3.5) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    lp.Q.value = 0.3
    attack = Math.min(attack, dur * 0.4)
    release = Math.min(release, dur - attack)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + attack)
    g.gain.setValueAtTime(vol, t + dur - release)
    g.gain.linearRampToValueAtTime(0, t + dur)
    lp.connect(g).connect(this.music)
    for (const [type, detune] of [
      ['triangle', -6],
      ['sine', 5],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = freq
      o.detune.value = detune
      o.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
  }

  private startMusicBox() {
    let last = 3
    const step = () => {
      if (!this.ctx) return
      // Đi từng bước nhỏ trên thang âm cho giai điệu mềm mại
      if (!this.songMode && Math.random() < 0.78) {
        last = Math.max(0, Math.min(MELODY.length - 1, last + Math.round((Math.random() - 0.5) * 3)))
        this.bell(mtof(MELODY[last]), this.ctx.currentTime + 0.02, 0.05, this.music)
        if (Math.random() < 0.2) {
          this.bell(mtof(MELODY[last] - 12), this.ctx.currentTime + 0.02, 0.03, this.music)
        }
      }
      this.timers.push(window.setTimeout(step, 700 + Math.random() * 1500))
    }
    this.timers.push(window.setTimeout(step, 2500))
  }

  /** Tiếng chuông nhỏ kiểu hộp nhạc. */
  private bell(freq: number, t: number, vol: number, dest: AudioNode, decay = 2.4) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    g.connect(dest)
    ;[1, 2.0, 3.01].forEach((h, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = freq * h
      const hg = ctx.createGain()
      hg.gain.value = [1, 0.25, 0.08][i]
      o.connect(hg).connect(g)
      o.start(t)
      o.stop(t + decay + 0.05)
    })
  }

  // ---------- Âm thanh môi trường ----------

  private startWind() {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 500
    bp.Q.value = 0.6
    const g = ctx.createGain()
    g.gain.value = 0.035
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoG = ctx.createGain()
    lfoG.gain.value = 0.02
    lfo.connect(lfoG).connect(g.gain)
    const lfo2 = ctx.createOscillator()
    lfo2.frequency.value = 0.05
    const lfo2G = ctx.createGain()
    lfo2G.gain.value = 250
    lfo2.connect(lfo2G).connect(bp.frequency)
    src.connect(bp).connect(g).connect(this.ambience)
    src.start()
    lfo.start()
    lfo2.start()
  }

  private startBirds() {
    const chirp = () => {
      if (!this.ctx) return
      const dayness = 1 - this.night
      if (Math.random() < dayness * 0.9) {
        const ctx = this.ctx
        const n = 2 + Math.floor(Math.random() * 3)
        const base = 2600 + Math.random() * 1400
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null
        if (pan) pan.pan.value = Math.random() * 1.6 - 0.8
        const out = ctx.createGain()
        out.gain.value = 0.022 * dayness
        if (pan) out.connect(pan).connect(this.ambience)
        else out.connect(this.ambience)
        out.connect(this.reverb)
        for (let i = 0; i < n; i++) {
          const t = ctx.currentTime + i * (0.09 + Math.random() * 0.05)
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.type = 'sine'
          o.frequency.setValueAtTime(base, t)
          o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t + 0.06)
          o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.1)
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(1, t + 0.01)
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
          o.connect(g).connect(out)
          o.start(t)
          o.stop(t + 0.13)
        }
      }
      this.timers.push(window.setTimeout(chirp, 2500 + Math.random() * 5000))
    }
    this.timers.push(window.setTimeout(chirp, 1500))
  }

  private startCrickets() {
    const trill = () => {
      if (!this.ctx) return
      if (this.night > 0.35 && Math.random() < this.night) {
        const ctx = this.ctx
        const t0 = ctx.currentTime
        const o = ctx.createOscillator()
        o.frequency.value = 4400 + Math.random() * 300
        const g = ctx.createGain()
        g.gain.value = 0
        const am = ctx.createOscillator()
        am.frequency.value = 28
        const amG = ctx.createGain()
        amG.gain.value = 0.006 * this.night
        am.connect(amG).connect(g.gain)
        const env = ctx.createGain()
        env.gain.setValueAtTime(0, t0)
        env.gain.linearRampToValueAtTime(1, t0 + 0.1)
        env.gain.linearRampToValueAtTime(0, t0 + 0.9)
        o.connect(g).connect(env).connect(this.ambience)
        o.start(t0)
        am.start(t0)
        o.stop(t0 + 1)
        am.stop(t0 + 1)
      }
      this.timers.push(window.setTimeout(trill, 900 + Math.random() * 1800))
    }
    this.timers.push(window.setTimeout(trill, 2000))
  }

  // ---------- Hiệu ứng ----------

  sfx(name: Sfx) {
    if (!this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime + 0.01
    switch (name) {
      case 'soft':
        this.bell(mtof(84), t, 0.05, this.sfxBus, 1.2)
        break
      case 'whoosh': {
        const s = ctx.createBufferSource()
        s.buffer = this.noise
        const f = ctx.createBiquadFilter()
        f.type = 'bandpass'
        f.Q.value = 1.2
        f.frequency.setValueAtTime(300, t)
        f.frequency.exponentialRampToValueAtTime(2200, t + 0.9)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.12, t + 0.4)
        g.gain.linearRampToValueAtTime(0, t + 1.1)
        s.connect(f).connect(g).connect(this.sfxBus)
        s.start(t)
        s.stop(t + 1.2)
        ;[77, 81, 84, 89].forEach((m, i) => this.bell(mtof(m), t + 0.25 + i * 0.12, 0.05, this.sfxBus))
        break
      }
      case 'doorbell':
        this.bell(mtof(76), t, 0.16, this.sfxBus, 2.5)
        this.bell(mtof(72), t + 0.55, 0.16, this.sfxBus, 3)
        break
      case 'collect':
        ;[72, 76, 79, 84, 88].forEach((m, i) => this.bell(mtof(m), t + i * 0.09, 0.09, this.sfxBus, 2.2))
        break
      case 'unlock':
        ;[65, 69, 72, 77, 81, 84].forEach((m, i) => this.bell(mtof(m), t + 0.6 + i * 0.14, 0.07, this.sfxBus, 2.6))
        break
      case 'giftOpen':
        ;[60, 64, 67, 72, 76, 79, 84, 88, 91].forEach((m, i) =>
          this.bell(mtof(m), t + i * 0.07, 0.08, this.sfxBus, 3),
        )
        break
      case 'firework': {
        const s = ctx.createBufferSource()
        s.buffer = this.noise
        const f = ctx.createBiquadFilter()
        f.type = 'lowpass'
        f.frequency.setValueAtTime(1800, t)
        f.frequency.exponentialRampToValueAtTime(120, t + 0.8)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null
        if (pan) {
          pan.pan.value = Math.random() * 1.2 - 0.6
          s.connect(f).connect(g).connect(pan).connect(this.sfxBus)
        } else s.connect(f).connect(g).connect(this.sfxBus)
        s.start(t)
        s.stop(t + 1.3)
        // tiếng lấp lánh sau khi nổ
        for (let i = 0; i < 5; i++) {
          this.bell(2400 + Math.random() * 2400, t + 0.15 + Math.random() * 0.6, 0.012, this.sfxBus, 0.5)
        }
        break
      }
    }
  }

  // ---------- Tiện ích ----------

  private makeNoise(seconds: number) {
    const ctx = this.ctx!
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    return buf
  }

  private makeImpulse(seconds: number) {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6)
    }
    return buf
  }
}

export const audio = new AudioEngine()
