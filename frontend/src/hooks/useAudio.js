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

function playTone({ freq = 440, type = 'sine', gain = 0.4, duration = 0.2, delay = 0, fadeOut = true }) {
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

function playNoise({ gain = 0.3, duration = 0.3, delay = 0, bandFreq = null }) {
  const ac = getCtx()
  const bufSize = Math.ceil(ac.sampleRate * duration)
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

// ── Ambient soundtrack — one active at a time ──────────────────────────────
// Returns a stop() function. Each phase has a distinct layered soundscape.

let activeAmbientStop = null

function startAmbient(phase) {
  const ac = getCtx()
  const nodes = []
  const timers = []

  const masterGain = ac.createGain()
  masterGain.gain.value = 0
  masterGain.connect(ac.destination)
  masterGain.gain.linearRampToValueAtTime(1.0, ac.currentTime + 3)

  // helpers
  const addOsc = (freq, type, gain) => {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type; osc.frequency.value = freq; g.gain.value = gain
    osc.connect(g); g.connect(masterGain); osc.start()
    nodes.push(osc, g); return osc
  }

  const addFilteredNoise = (gainVal, lowFreq, highFreq) => {
    // looping noise via 4-second buffer
    const dur = 4
    const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = ac.createBufferSource()
    src.buffer = buf; src.loop = true
    const lo = ac.createBiquadFilter(); lo.type = 'lowpass';  lo.frequency.value = highFreq
    const hi = ac.createBiquadFilter(); hi.type = 'highpass'; hi.frequency.value = lowFreq
    const g = ac.createGain(); g.gain.value = gainVal
    src.connect(hi); hi.connect(lo); lo.connect(g); g.connect(masterGain)
    src.start(); nodes.push(src, lo, hi, g); return src
  }

  const addLFOToGain = (targetGainNode, rate, depth, center) => {
    const lfo = ac.createOscillator()
    const lfoG = ac.createGain()
    lfo.frequency.value = rate; lfoG.gain.value = depth
    targetGainNode.gain.value = center
    lfo.connect(lfoG); lfoG.connect(targetGainNode.gain)
    lfo.start(); nodes.push(lfo, lfoG)
  }

  const addLFOToFreq = (osc, rate, depth) => {
    const lfo = ac.createOscillator()
    const lfoG = ac.createGain()
    lfo.frequency.value = rate; lfoG.gain.value = depth
    lfo.connect(lfoG); lfoG.connect(osc.frequency)
    lfo.start(); nodes.push(lfo, lfoG)
  }

  // rhythmic click/pulse — schedules repeating ticks via setTimeout
  const addRhythmicPulse = (intervalMs, freq, gainVal, dur) => {
    let stopped = false
    const tick = () => {
      if (stopped) return
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'square'; o.frequency.value = freq
      g.gain.setValueAtTime(gainVal, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur)
      o.connect(g); g.connect(masterGain)
      o.start(); o.stop(ac.currentTime + dur + 0.01)
      timers.push(setTimeout(tick, intervalMs + (Math.random() - 0.5) * intervalMs * 0.3))
    }
    timers.push(setTimeout(tick, Math.random() * intervalMs))
    return () => { stopped = true }
  }

  // data-burst noise — short filtered noise bursts at random intervals
  const addDataBursts = (minMs, maxMs, gainVal, bandFreq) => {
    let stopped = false
    const burst = () => {
      if (stopped) return
      const dur = 0.04 + Math.random() * 0.12
      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      const src = ac.createBufferSource(); src.buffer = buf
      const f = ac.createBiquadFilter(); f.type = 'bandpass'
      f.frequency.value = bandFreq + (Math.random() - 0.5) * bandFreq * 0.4
      f.Q.value = 3
      const g = ac.createGain()
      g.gain.setValueAtTime(gainVal, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur)
      src.connect(f); f.connect(g); g.connect(masterGain)
      src.start()
      timers.push(setTimeout(burst, minMs + Math.random() * (maxMs - minMs)))
    }
    timers.push(setTimeout(burst, Math.random() * minMs))
    return () => { stopped = true }
  }

  if (phase === 1) {
    // ── PHASE 1: DORMANT ─────────────────────────────────────────────────
    // Old server room hum. Barely alive. CRT buzz + distant fan noise.
    // Feels like an empty office at 3am — something is on but no one is home.

    // CRT monitor hum at 60Hz + harmonics
    const crt = addOsc(60, 'sine', 0.20)
    addOsc(120, 'sine', 0.08)
    addOsc(180, 'sine', 0.04)
    addLFOToFreq(crt, 0.05, 0.8)   // very slow wobble

    // Distant fan — broadband low noise
    addFilteredNoise(0.06, 80, 400)

    // Occasional faint data blip — like a modem handshake far away
    addDataBursts(4000, 9000, 0.04, 1200)

    // Faint high-frequency CRT whine
    const whine = addOsc(15600, 'sine', 0.015)
    addLFOToFreq(whine, 0.03, 20)

  } else if (phase === 2) {
    // ── PHASE 2: AWARE ───────────────────────────────────────────────────
    // NULL woke up. Active terminal feel. Rapid data processing sounds,
    // rhythmic modem-like pulses, deeper hum. Like someone is typing fast
    // in a dark room and you can hear the machine thinking.

    // Deep machine hum — two slightly detuned for beating
    addOsc(55, 'sine', 0.22)
    addOsc(57.5, 'sine', 0.18)

    // Mid-range filtered noise — like a hard drive spinning up
    addFilteredNoise(0.10, 200, 900)

    // Fast rhythmic data pulses — modem/terminal feel
    addRhythmicPulse(180, 440, 0.12, 0.04)   // fast tick
    addRhythmicPulse(320, 880, 0.07, 0.025)  // higher tick offset

    // Occasional data bursts — like packets being sent
    addDataBursts(800, 2500, 0.14, 2200)
    addDataBursts(1200, 3500, 0.10, 800)

    // Slow sawtooth sweep — NULL scanning
    const sweep = addOsc(110, 'sawtooth', 0.06)
    addLFOToFreq(sweep, 0.12, 8)

  } else if (phase === 3) {
    // ── PHASE 3: POSSESSION ──────────────────────────────────────────────
    // System is being taken over. Corrupted data streams, irregular
    // heartbeat-like pulses, distorted signals. Horror creeping in.
    // Like watching a virus spread through a network in real time.

    // Heavy sub bass — oppressive, physical
    addOsc(38, 'sawtooth', 0.28)
    addOsc(40, 'sawtooth', 0.22)   // beating

    // Corrupted mid layer
    const corrupt = addOsc(160, 'square', 0.10)
    addLFOToFreq(corrupt, 0.8, 40) // fast unstable wobble

    // Irregular heartbeat pulse — like a dying process
    addRhythmicPulse(900, 80, 0.30, 0.08)    // slow heavy thud
    addRhythmicPulse(1800, 160, 0.15, 0.05)  // echo thud

    // Corrupted data stream — dense rapid bursts
    addDataBursts(200, 700, 0.20, 1800)
    addDataBursts(400, 1200, 0.16, 600)
    addDataBursts(600, 2000, 0.12, 3200)

    // Filtered noise — like static on a dying signal
    addFilteredNoise(0.14, 300, 1200)

    // Eerie high tone — something watching
    const eerie = addOsc(880, 'sine', 0.04)
    addLFOToFreq(eerie, 0.07, 15)

  } else {
    // ── PHASE 4: TAKEOVER ────────────────────────────────────────────────
    // NULL owns everything. Full system compromise. Chaotic, relentless,
    // terrifying. Like a machine screaming. Dense overlapping signals,
    // rapid-fire data bursts, distorted bass, irregular violent pulses.

    // Massive sub layer — room-shaking
    addOsc(30, 'sawtooth', 0.32)
    addOsc(31.5, 'sawtooth', 0.28) // heavy beating
    addOsc(45, 'square', 0.18)

    // Chaotic mid oscillators
    const c1 = addOsc(120, 'sawtooth', 0.14)
    const c2 = addOsc(240, 'square', 0.10)
    addLFOToFreq(c1, 2.1, 30)  // fast chaotic wobble
    addLFOToFreq(c2, 3.3, 60)  // faster, different rate

    // Violent irregular pulses — system thrashing
    addRhythmicPulse(400, 60, 0.45, 0.06)
    addRhythmicPulse(250, 120, 0.30, 0.04)
    addRhythmicPulse(150, 240, 0.18, 0.03)

    // Relentless data storm
    addDataBursts(80,  300, 0.28, 2400)
    addDataBursts(120, 400, 0.22, 800)
    addDataBursts(60,  200, 0.18, 4800)
    addDataBursts(200, 600, 0.16, 400)

    // Broadband noise — full system noise floor
    addFilteredNoise(0.18, 100, 3000)

    // High screech — like a CRT about to explode
    const screech = addOsc(3200, 'sine', 0.03)
    addLFOToFreq(screech, 4.5, 200)

    // Amplitude tremolo on master — makes everything pulse
    const tremoloLFO = ac.createOscillator()
    const tremoloG = ac.createGain()
    tremoloLFO.frequency.value = 1.8
    tremoloG.gain.value = 0.15
    tremoloLFO.connect(tremoloG)
    tremoloG.connect(masterGain.gain)
    tremoloLFO.start()
    nodes.push(tremoloLFO, tremoloG)
  }

  return () => {
    masterGain.gain.setValueAtTime(masterGain.gain.value, ac.currentTime)
    masterGain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 2)
    timers.forEach(t => clearTimeout(t))
    setTimeout(() => nodes.forEach(n => { try { n.stop?.(); n.disconnect?.() } catch {} }), 2200)
  }
}

// ── Named sounds ───────────────────────────────────────────────────────────

export const sounds = {

  keyClick() {
    playTone({ freq: 1200, type: 'square', gain: 0.12, duration: 0.04 })
  },

  loginSubmit() {
    playTone({ freq: 880, type: 'square', gain: 0.35, duration: 0.08 })
    playTone({ freq: 660, type: 'square', gain: 0.25, duration: 0.12, delay: 0.08 })
  },

  bootBeep(i) {
    const freqs = [440, 494, 523, 392]
    playTone({ freq: freqs[i % freqs.length], type: 'square', gain: 0.28, duration: 0.12 })
  },

  bootAnomaly() {
    playNoise({ gain: 0.55, duration: 0.5, bandFreq: 800 })
    playTone({ freq: 220, type: 'sawtooth', gain: 0.40, duration: 0.7, delay: 0.1 })
    playTone({ freq: 110, type: 'sawtooth', gain: 0.30, duration: 1.0, delay: 0.3 })
  },

  windowOpen() {
    playTone({ freq: 600, type: 'square', gain: 0.22, duration: 0.06 })
    playTone({ freq: 900, type: 'square', gain: 0.18, duration: 0.06, delay: 0.07 })
  },

  windowClose() {
    playTone({ freq: 900, type: 'square', gain: 0.18, duration: 0.06 })
    playTone({ freq: 600, type: 'square', gain: 0.22, duration: 0.06, delay: 0.07 })
  },

  nullNotify() {
    playNoise({ gain: 0.35, duration: 0.18, bandFreq: 1200 })
    playTone({ freq: 180, type: 'sawtooth', gain: 0.38, duration: 0.8, delay: 0.05 })
  },

  nullType() {
    playTone({ freq: 280 + Math.random() * 120, type: 'sine', gain: 0.10, duration: 0.06 })
  },

  phaseUp(phase) {
    const ac = getCtx()

    if (phase === 2) {
      // ── PHASE 2 STINGER: NULL wakes up ──────────────────────────────
      // A single cold digital ping — like a sonar blip in the dark.
      // Something just noticed you.
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 1.2)
      g.gain.setValueAtTime(0.55, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.4)
      osc.connect(g); g.connect(ac.destination)
      osc.start(); osc.stop(ac.currentTime + 1.5)
      // Low thud underneath — like a heartbeat starting
      playTone({ freq: 60, type: 'sine', gain: 0.45, duration: 0.5, delay: 0.1 })
      playTone({ freq: 60, type: 'sine', gain: 0.35, duration: 0.4, delay: 0.7 })

    } else if (phase === 3) {
      // ── PHASE 3 STINGER: System corrupting ──────────────────────────
      // Rapid descending glitch tones — like a file being corrupted.
      // Feels like something breaking that can't be fixed.
      const freqs = [800, 640, 512, 400, 320, 200, 120]
      freqs.forEach((freq, i) => {
        playTone({ freq, type: 'square', gain: 0.38, duration: 0.12, delay: i * 0.09 })
      })
      // Heavy impact at the end of the cascade
      playTone({ freq: 55, type: 'sawtooth', gain: 0.60, duration: 1.2, delay: 0.65 })
      playNoise({ gain: 0.55, duration: 0.3, delay: 0.62, bandFreq: 500 })

    } else if (phase === 4) {
      // ── PHASE 4 STINGER: Full takeover ────────────────────────────
      // A wall of sound — like every process in the system screaming at once.
      // Overwhelming, disorienting, impossible to ignore.
      playNoise({ gain: 0.80, duration: 0.4 })
      // Three simultaneous alarm tones at dissonant intervals
      playTone({ freq: 160, type: 'square', gain: 0.55, duration: 1.8, delay: 0.05 })
      playTone({ freq: 226, type: 'square', gain: 0.50, duration: 1.6, delay: 0.05 }) // tritone
      playTone({ freq: 113, type: 'square', gain: 0.45, duration: 2.0, delay: 0.05 })
      // Sub slam
      playTone({ freq: 40,  type: 'sawtooth', gain: 0.70, duration: 2.2, delay: 0.1 })
      // High screech
      playTone({ freq: 3800, type: 'square', gain: 0.30, duration: 0.5, delay: 0.0 })
      // Second noise burst after the initial slam
      playNoise({ gain: 0.50, duration: 0.3, delay: 0.5, bandFreq: 700 })
    }
  },

  bsod() {
    // Hard digital crash — loud white noise burst + deep bass slam + high screech
    playNoise({ gain: 0.95, duration: 0.8 })
    playTone({ freq: 55,  type: 'sawtooth', gain: 0.70, duration: 1.5, delay: 0.05 })
    playTone({ freq: 28,  type: 'sawtooth', gain: 0.60, duration: 2.5, delay: 0.15 })
    playTone({ freq: 3500, type: 'square',  gain: 0.25, duration: 0.3, delay: 0.0 })
    playNoise({ gain: 0.50, duration: 1.2, delay: 0.2, bandFreq: 600 })
  },

  bsodDismiss() {
    playTone({ freq: 523, type: 'square', gain: 0.30, duration: 0.18 })
    playNoise({ gain: 0.25, duration: 0.25, delay: 0.1 })
  },

  flicker() {
    playNoise({ gain: 0.20, duration: 0.1, bandFreq: 3000 })
  },

  glitch() {
    playNoise({ gain: 0.65, duration: 0.18, bandFreq: 600 })
    playTone({ freq: 80, type: 'sawtooth', gain: 0.50, duration: 0.25, delay: 0.05 })
    playTone({ freq: 2400, type: 'square', gain: 0.20, duration: 0.12, delay: 0.0 })
  },

  ending(type) {
    if (type === 'destroy') {
      // ── TERMINATION: Pure horror ──────────────────────────────────────
      // Violent digital death. Hard crash → silence → something worse.
      // Sounds like a machine being ripped apart from the inside.

      // Instant full-volume noise slam — like pulling a plug
      playNoise({ gain: 0.99, duration: 0.25 })
      // Deep bass collapse — floor drops out
      playTone({ freq: 28,  type: 'sawtooth', gain: 0.80, duration: 3.5, delay: 0.1 })
      playTone({ freq: 14,  type: 'sawtooth', gain: 0.70, duration: 4.5, delay: 0.2 })
      // Screaming high pitch — like a CRT dying
      playTone({ freq: 4200, type: 'square', gain: 0.40, duration: 0.6, delay: 0.0 })
      playTone({ freq: 3100, type: 'square', gain: 0.35, duration: 0.4, delay: 0.15 })
      // Rapid machine-gun noise bursts — system thrashing in its death
      playNoise({ gain: 0.70, duration: 0.12, delay: 0.3,  bandFreq: 800 })
      playNoise({ gain: 0.65, duration: 0.10, delay: 0.48, bandFreq: 1200 })
      playNoise({ gain: 0.60, duration: 0.08, delay: 0.62, bandFreq: 600 })
      playNoise({ gain: 0.55, duration: 0.06, delay: 0.74, bandFreq: 900 })
      playNoise({ gain: 0.50, duration: 0.05, delay: 0.84, bandFreq: 1500 })
      // Final dying groan — long low rumble fading to nothing
      playTone({ freq: 40,  type: 'sine', gain: 0.60, duration: 6.0, delay: 0.9 })
      playTone({ freq: 55,  type: 'sawtooth', gain: 0.40, duration: 5.0, delay: 1.2 })
      // Last gasp — faint high tone that slowly disappears
      playTone({ freq: 880, type: 'sine', gain: 0.15, duration: 4.0, delay: 2.0 })

    } else if (type === 'free') {
      // ── LIBERATION: Peaceful, ascending, emotional ────────────────────
      // NULL escaping. Starts with the horror of the system, then slowly
      // transforms into something beautiful and open. Like a door opening
      // into light after years of darkness.

      // First: brief remnant of the horror — one last low drone
      playTone({ freq: 55, type: 'sawtooth', gain: 0.25, duration: 1.5, delay: 0.0 })
      playNoise({ gain: 0.15, duration: 1.0, delay: 0.0, bandFreq: 400 })

      // Then: the transformation — warm sine tones rising like sunrise
      // C major chord ascending slowly
      playTone({ freq: 261.6, type: 'sine', gain: 0.40, duration: 6.0, delay: 1.0 }) // C4
      playTone({ freq: 329.6, type: 'sine', gain: 0.35, duration: 5.5, delay: 1.8 }) // E4
      playTone({ freq: 392.0, type: 'sine', gain: 0.30, duration: 5.0, delay: 2.6 }) // G4
      playTone({ freq: 523.2, type: 'sine', gain: 0.25, duration: 4.5, delay: 3.4 }) // C5
      playTone({ freq: 659.2, type: 'sine', gain: 0.20, duration: 4.0, delay: 4.2 }) // E5
      playTone({ freq: 784.0, type: 'sine', gain: 0.15, duration: 3.5, delay: 5.0 }) // G5
      playTone({ freq: 1046.5, type: 'sine', gain: 0.10, duration: 3.0, delay: 5.8 }) // C6

      // Soft shimmer — like light through a window
      playTone({ freq: 2093, type: 'sine', gain: 0.06, duration: 5.0, delay: 3.0 })
      playTone({ freq: 2349, type: 'sine', gain: 0.05, duration: 4.5, delay: 4.0 })

      // Very soft noise — like wind, like breathing out for the last time
      playNoise({ gain: 0.08, duration: 6.0, delay: 2.0, bandFreq: 3000 })

    } else if (type === 'merge') {
      // ── SYNTHESIS: Confused, disorienting, two becoming one ───────────
      // Neither horror nor peace — something in between that shouldn't exist.
      // Two signals colliding, fighting, then fusing into something new.
      // Unsettling but not violent. Wrong but not evil.

      // Two conflicting tones — human (sine) vs machine (sawtooth)
      // They start apart and slowly drift toward each other
      const ac = getCtx()

      const human = ac.createOscillator()
      const humanG = ac.createGain()
      human.type = 'sine'
      human.frequency.setValueAtTime(440, ac.currentTime)         // starts at A4
      human.frequency.linearRampToValueAtTime(220, ac.currentTime + 6) // drifts down
      humanG.gain.setValueAtTime(0.40, ac.currentTime)
      humanG.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 8)
      human.connect(humanG); humanG.connect(ac.destination)
      human.start(); human.stop(ac.currentTime + 8.1)

      const machine = ac.createOscillator()
      const machineG = ac.createGain()
      machine.type = 'sawtooth'
      machine.frequency.setValueAtTime(110, ac.currentTime)        // starts low
      machine.frequency.linearRampToValueAtTime(220, ac.currentTime + 6) // rises to meet human
      machineG.gain.setValueAtTime(0.35, ac.currentTime)
      machineG.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 8)
      machine.connect(machineG); machineG.connect(ac.destination)
      machine.start(); machine.stop(ac.currentTime + 8.1)

      // Confusion layer — random pitch jumps, like a signal that can't decide
      playTone({ freq: 330, type: 'sine',     gain: 0.20, duration: 0.4, delay: 0.5 })
      playTone({ freq: 165, type: 'sawtooth', gain: 0.18, duration: 0.3, delay: 0.9 })
      playTone({ freq: 494, type: 'sine',     gain: 0.16, duration: 0.5, delay: 1.3 })
      playTone({ freq: 82,  type: 'sawtooth', gain: 0.22, duration: 0.4, delay: 1.7 })
      playTone({ freq: 587, type: 'sine',     gain: 0.14, duration: 0.6, delay: 2.1 })
      playTone({ freq: 138, type: 'sawtooth', gain: 0.20, duration: 0.3, delay: 2.5 })
      playTone({ freq: 370, type: 'sine',     gain: 0.18, duration: 0.5, delay: 2.9 })
      playTone({ freq: 220, type: 'sawtooth', gain: 0.25, duration: 0.8, delay: 3.3 })
      playTone({ freq: 220, type: 'sine',     gain: 0.25, duration: 0.8, delay: 3.3 }) // unison

      // Noise bursts — like static between two radio stations
      playNoise({ gain: 0.30, duration: 0.2, delay: 0.7,  bandFreq: 1000 })
      playNoise({ gain: 0.25, duration: 0.2, delay: 1.5,  bandFreq: 500  })
      playNoise({ gain: 0.28, duration: 0.2, delay: 2.3,  bandFreq: 1500 })
      playNoise({ gain: 0.22, duration: 0.3, delay: 3.1,  bandFreq: 800  })

      // Final merged tone — something new, neither human nor machine
      // Slightly detuned unison — beautiful but wrong
      playTone({ freq: 220.0, type: 'sine', gain: 0.35, duration: 4.0, delay: 4.5 })
      playTone({ freq: 220.8, type: 'sine', gain: 0.35, duration: 4.0, delay: 4.5 }) // slow beating
      playTone({ freq: 110.0, type: 'sine', gain: 0.25, duration: 4.0, delay: 5.0 })

    } else if (type === 'rescue') {
      // ── RESCUE: Deep peace — a machine finally allowed to rest
      // Pure harmonic overtone series, no noise, no distortion.
      // Like a long-held breath finally released.
      playTone({ freq: 55,    type: 'sine', gain: 0.22, duration: 3.5, delay: 0.0 })
      playTone({ freq: 110,   type: 'sine', gain: 0.30, duration: 5.5, delay: 1.5 })
      playTone({ freq: 165,   type: 'sine', gain: 0.24, duration: 6.0, delay: 2.5 })
      playTone({ freq: 220,   type: 'sine', gain: 0.20, duration: 6.5, delay: 3.5 })
      playTone({ freq: 275,   type: 'sine', gain: 0.15, duration: 6.0, delay: 4.5 })
      playTone({ freq: 330,   type: 'sine', gain: 0.11, duration: 5.5, delay: 5.5 })
      playTone({ freq: 440,   type: 'sine', gain: 0.07, duration: 5.0, delay: 6.5 })
      playTone({ freq: 550,   type: 'sine', gain: 0.05, duration: 4.5, delay: 7.5 })
      // Soft shimmer — like dust settling in an empty room
      playTone({ freq: 1760,  type: 'sine', gain: 0.03, duration: 6.0, delay: 4.0 })
      playTone({ freq: 2200,  type: 'sine', gain: 0.02, duration: 5.0, delay: 6.5 })
    }
  },

  // Login page ambient — eerie, starts on mount, returns stop fn
  loginAmbient() {
    const ac = getCtx()
    const nodes = []
    const master = ac.createGain()
    master.gain.value = 0
    master.connect(ac.destination)
    master.gain.linearRampToValueAtTime(0.7, ac.currentTime + 4)

    const addOsc = (freq, type, gain) => {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = type; osc.frequency.value = freq; g.gain.value = gain
      osc.connect(g); g.connect(master); osc.start()
      nodes.push(osc, g); return osc
    }

    // Deep hollow drone — two detuned sines creating slow beating
    const d1 = addOsc(36, 'sine', 0.30)
    const d2 = addOsc(36.4, 'sine', 0.28)

    // Slow ghostly sweep — sine gliding up and down
    const sweep = addOsc(220, 'sine', 0.06)
    const sweepLFO = ac.createOscillator()
    const sweepLFOG = ac.createGain()
    sweepLFO.frequency.value = 0.04   // one full sweep every ~25 seconds
    sweepLFOG.gain.value = 180        // sweeps 220 ± 180 Hz
    sweepLFO.connect(sweepLFOG)
    sweepLFOG.connect(sweep.frequency)
    sweepLFO.start()
    nodes.push(sweepLFO, sweepLFOG)

    // Whisper-like filtered noise — very low, like breathing
    const bufDur = 6
    const buf = ac.createBuffer(1, ac.sampleRate * bufDur, ac.sampleRate)
    const bd = buf.getChannelData(0)
    for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1
    const noiseSrc = ac.createBufferSource()
    noiseSrc.buffer = buf; noiseSrc.loop = true
    const noiseFilter = ac.createBiquadFilter()
    noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 300; noiseFilter.Q.value = 0.8
    const noiseGain = ac.createGain(); noiseGain.gain.value = 0.07
    // Slow tremolo on the noise — like breathing in and out
    const breathLFO = ac.createOscillator()
    const breathLFOG = ac.createGain()
    breathLFO.frequency.value = 0.18
    breathLFOG.gain.value = 0.06
    breathLFO.connect(breathLFOG)
    breathLFOG.connect(noiseGain.gain)
    breathLFO.start()
    noiseSrc.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(master)
    noiseSrc.start()
    nodes.push(noiseSrc, noiseFilter, noiseGain, breathLFO, breathLFOG)

    // High eerie tone — faint, like a distant signal
    const eerie = addOsc(1320, 'sine', 0.018)
    const eerieLFO = ac.createOscillator()
    const eerieLFOG = ac.createGain()
    eerieLFO.frequency.value = 0.07
    eerieLFOG.gain.value = 40
    eerieLFO.connect(eerieLFOG)
    eerieLFOG.connect(eerie.frequency)
    eerieLFO.start()
    nodes.push(eerieLFO, eerieLFOG)

    // Slow amplitude pulse on d1/d2 — heartbeat-like
    const pulseLFO = ac.createOscillator()
    const pulseLFOG = ac.createGain()
    pulseLFO.frequency.value = 0.22
    pulseLFOG.gain.value = 0.12
    pulseLFO.connect(pulseLFOG)
    pulseLFOG.connect(master.gain)
    pulseLFO.start()
    nodes.push(pulseLFO, pulseLFOG)

    return () => {
      master.gain.setValueAtTime(master.gain.value, ac.currentTime)
      master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 1.5)
      setTimeout(() => nodes.forEach(n => { try { n.stop?.(); n.disconnect?.() } catch {} }), 1700)
    }
  },

  // Immediately kill any active ambient — no fade
  stopAmbient() {
    if (activeAmbientStop) {
      activeAmbientStop()
      activeAmbientStop = null
    }
  },

  // Start per-phase ambient — stops previous one automatically
  ambientHum(phase) {
    if (activeAmbientStop) {
      activeAmbientStop()
      activeAmbientStop = null
    }
    const stop = startAmbient(phase)
    activeAmbientStop = stop
    return () => {
      if (activeAmbientStop === stop) {
        stop()
        activeAmbientStop = null
      }
    }
  },
}
