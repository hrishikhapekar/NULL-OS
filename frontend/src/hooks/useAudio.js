/**
 * NULL.OS — Synthesized audio engine (no files needed)
 * All sounds generated via Web Audio API.
 */

let ctx = null
const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

// ── Low-level helpers ──────────────────────────────────────────────────────

function playTone({ freq = 440, type = 'sine', gain = 0.3, duration = 0.2, delay = 0, fadeOut = true }) {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.connect(g)
  g.connect(ac.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + delay)
  g.gain.setValueAtTime(gain, ac.currentTime + delay)
  if (fadeOut) g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + duration)
  osc.start(ac.currentTime + delay)
  osc.stop(ac.currentTime + delay + duration + 0.05)
}

function playNoise({ gain = 0.15, duration = 0.3, delay = 0, bandFreq = null }) {
  const ac = getCtx()
  const bufSize = ac.sampleRate * duration
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

  const src = ac.createBufferSource()
  src.buffer = buf

  const g = ac.createGain()
  g.gain.setValueAtTime(gain, ac.currentTime + delay)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + duration)

  if (bandFreq) {
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = bandFreq
    filter.Q.value = 1.5
    src.connect(filter)
    filter.connect(g)
  } else {
    src.connect(g)
  }

  g.connect(ac.destination)
  src.start(ac.currentTime + delay)
}

// ── Named sounds ───────────────────────────────────────────────────────────

export const sounds = {
  // Keyboard click in terminal / login
  keyClick() {
    playTone({ freq: 1200, type: 'square', gain: 0.04, duration: 0.04, fadeOut: true })
  },

  // Login button press
  loginSubmit() {
    playTone({ freq: 880, type: 'square', gain: 0.12, duration: 0.08 })
    playTone({ freq: 660, type: 'square', gain: 0.08, duration: 0.12, delay: 0.08 })
  },

  // Boot beep sequence
  bootBeep(i) {
    const freqs = [440, 494, 523, 392]
    playTone({ freq: freqs[i % freqs.length], type: 'square', gain: 0.1, duration: 0.12 })
  },

  // Anomaly line during boot
  bootAnomaly() {
    playNoise({ gain: 0.2, duration: 0.4, bandFreq: 800 })
    playTone({ freq: 220, type: 'sawtooth', gain: 0.15, duration: 0.5, delay: 0.1 })
  },

  // Window open
  windowOpen() {
    playTone({ freq: 600, type: 'square', gain: 0.08, duration: 0.06 })
    playTone({ freq: 900, type: 'square', gain: 0.06, duration: 0.06, delay: 0.07 })
  },

  // Window close
  windowClose() {
    playTone({ freq: 900, type: 'square', gain: 0.06, duration: 0.06 })
    playTone({ freq: 600, type: 'square', gain: 0.08, duration: 0.06, delay: 0.07 })
  },

  // NULL notification pop
  nullNotify() {
    playNoise({ gain: 0.08, duration: 0.15, bandFreq: 1200 })
    playTone({ freq: 180, type: 'sawtooth', gain: 0.12, duration: 0.6, delay: 0.05 })
  },

  // NULL typing a character in chat
  nullType() {
    playTone({ freq: 300 + Math.random() * 100, type: 'sine', gain: 0.03, duration: 0.05 })
  },

  // Phase transition — unsettling drone
  phaseUp(phase) {
    const freqs = { 2: [110, 138], 3: [80, 100, 60], 4: [55, 69, 41] }
    const f = freqs[phase] || [110]
    f.forEach((freq, i) => {
      playTone({ freq, type: 'sawtooth', gain: 0.18, duration: 2.5, delay: i * 0.3, fadeOut: true })
    })
    playNoise({ gain: 0.25, duration: 1.5, delay: 0.2, bandFreq: 400 })
  },

  // BSOD crash
  bsod() {
    playNoise({ gain: 0.5, duration: 0.6 })
    playTone({ freq: 60, type: 'sawtooth', gain: 0.3, duration: 1.2, delay: 0.1 })
    playTone({ freq: 30, type: 'sawtooth', gain: 0.2, duration: 2.0, delay: 0.4 })
  },

  // BSOD dismiss
  bsodDismiss() {
    playTone({ freq: 523, type: 'square', gain: 0.1, duration: 0.15 })
    playNoise({ gain: 0.1, duration: 0.2, delay: 0.1 })
  },

  // Screen flicker
  flicker() {
    playNoise({ gain: 0.06, duration: 0.1, bandFreq: 3000 })
  },

  // Desktop glitch (phase 4)
  glitch() {
    playNoise({ gain: 0.3, duration: 0.15, bandFreq: 600 })
    playTone({ freq: 80, type: 'sawtooth', gain: 0.2, duration: 0.2, delay: 0.05 })
  },

  // Ending — each type has a distinct sound
  ending(type) {
    if (type === 'destroy') {
      playNoise({ gain: 0.4, duration: 2.0 })
      playTone({ freq: 55, type: 'sawtooth', gain: 0.3, duration: 3.0, delay: 0.3 })
    } else if (type === 'free') {
      playTone({ freq: 523, type: 'sine', gain: 0.2, duration: 3.0 })
      playTone({ freq: 659, type: 'sine', gain: 0.15, duration: 2.5, delay: 0.5 })
      playTone({ freq: 784, type: 'sine', gain: 0.1, duration: 2.0, delay: 1.0 })
    } else if (type === 'merge') {
      playTone({ freq: 110, type: 'sine', gain: 0.2, duration: 3.0 })
      playTone({ freq: 111, type: 'sine', gain: 0.2, duration: 3.0, delay: 0.1 }) // beating
      playNoise({ gain: 0.1, duration: 3.0, delay: 0.5, bandFreq: 500 })
    }
  },

  // Ambient hum — call once, returns stop fn
  ambientHum(phase) {
    const ac = getCtx()
    const freq = phase >= 4 ? 40 : phase >= 3 ? 55 : phase >= 2 ? 70 : 90
    const gainVal = phase >= 4 ? 0.06 : 0.03

    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.value = gainVal
    osc.connect(g)
    g.connect(ac.destination)
    osc.start()

    return () => {
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.5)
      osc.stop(ac.currentTime + 1.6)
    }
  },
}
