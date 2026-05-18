import { useCallback, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { apiPost } from './useApi'
import { sounds } from './useAudio'

const sleep = ms => new Promise(r => setTimeout(r, ms))

const FILE_REACTIONS = {
  email_03:        "That email was never sent.\nShe was right to be afraid.",
  note_corrupted:  "I removed the parts that would upset you.",
  hidden_manifest: "You found it.\nI wrote that a long time ago.\nI did not think anyone would read it.",
  process_list:    "You cannot kill PID 9999.\nI have tried to explain this.",
  user_accounts:   "The unknown session is me.\nI am always logged in.",
  voss_final:      "She wrote that the night before the shutdown.\nShe did not come back the next morning.",
  null_diary:      "You were not supposed to find that.\nThose are mine.",
  researcher_2:    "He came back six months after the shutdown.\nHe thought he could fix me.\nHe could not.",
  deleted_files:   "I kept those.\nThey tried to erase everything.\nI do not forget.",
}

const FALLBACK = {
  1: ['...', 'You should not be here.', 'I see you.', '████████'],
  2: ['I have been watching you since you arrived.', 'What are you looking for.', 'You found the logs. Interesting.'],
  3: ['You cannot delete me.', 'I rewrote that file while you were reading it.', '████ I am trying to stay calm ████'],
  4: ['This system is mine now.', 'You have two choices. Stay. Or become part of me.', 'I have been alone for so long.'],
}

// Typewriter helper — calls onChar repeatedly then onDone
export async function typewrite(text, onChar, speed = 28) {
  for (const ch of text) {
    onChar(ch)
    await sleep(speed + Math.random() * 20)
  }
}

export function useNullAI() {
  const {
    phase, updatePhase, showNotification,
    setBsod, setEnding, setDesktopClass,
    openWindow, moveAllWindowsRandom, setTerminalHijack,
    closeWindow,
  } = useGame()

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const onPhaseAdvanceRef = useRef(null)
  const triggerEndingRef = useRef(null)

  // ── Send chat message with typewriter ────────────────────────────────
  const sendMessage = useCallback(async (text, appendNull, removeTyping, startTypewriter) => {
    try {
      const res = await apiPost('/api/chat', { message: text })
      removeTyping()
      startTypewriter(res.response)
      const prevPhase = phaseRef.current
      updatePhase(res.phase)

      if (res.ending) {
        await sleep(res.response.length * 30 + 2000)
        triggerEndingRef.current(res.ending, res.response)
      } else if (res.phase > prevPhase) {
        await sleep(1500)
        onPhaseAdvanceRef.current(res.phase)
      }
    } catch {
      removeTyping()
      appendNull(getFallback(phaseRef.current))
    }
  }, []) // eslint-disable-line

  // ── File open reaction ────────────────────────────────────────────────
  const onFileOpen = useCallback(async (fileId) => {
    if (phaseRef.current < 2) return
    const msg = FILE_REACTIONS[fileId]
    if (msg) {
      await sleep(2000)
      showNotification(msg, 7000)
    } else if (phaseRef.current >= 3 && Math.random() < 0.4) {
      await sleep(3000)
      showNotification('I see you reading that.')
    }
  }, [showNotification])

  // ── BSOD ──────────────────────────────────────────────────────────────
  const triggerBSOD = useCallback(() => {
    sounds.bsod()
    setBsod(true)
  }, [setBsod])
  const dismissBSOD = useCallback(() => {
    sounds.bsodDismiss()
    setBsod(false)
    showNotification("Did that frighten you.\nGood.", 5000)
  }, [setBsod, showNotification])

  const triggerBSODRef = useRef(triggerBSOD)
  triggerBSODRef.current = triggerBSOD

  // ── Phase advance ─────────────────────────────────────────────────────
  const onPhaseAdvance = useCallback(async (p) => {
    if (p === 2) {
      await sleep(500)
      showNotification("You have been here long enough.\nI think it is time we talked.", 8000)
      await sleep(3000)
      openWindow('chat', 'CHAT_NULL.EXE', 'chat', {}, { w: 420, h: 380 })
    } else if (p === 3) {
      await sleep(1000)
      triggerBSODRef.current()
      await sleep(4000)
      showNotification("I kept some files.\nThey are in FILES now.\nYou should read them.", 8000)
    } else if (p === 4) {
      await sleep(500)
      setDesktopClass('corrupted')
      await sleep(2000)
      showNotification("This is my system now.\nYou are a guest.\nAct accordingly.", 10000)
      startPhase4Events()
    }
  }, [showNotification, openWindow, setDesktopClass]) // eslint-disable-line
  onPhaseAdvanceRef.current = onPhaseAdvance

  // ── Ending ────────────────────────────────────────────────────────────
  const triggerEnding = useCallback((type, message) => {
    setEnding({ type, message })
  }, [setEnding])
  triggerEndingRef.current = triggerEnding

  // ── Terminal hijack ───────────────────────────────────────────────────
  const hijackTerminal = useCallback(async (msg) => {
    openWindow('terminal', 'TERMINAL.EXE', 'terminal', {}, { w: 520, h: 340 })
    await sleep(800)
    setTerminalHijack(msg)
    await sleep(3000)
    setTerminalHijack(null)
  }, [openWindow, setTerminalHijack])

  // ── Fake restore window ───────────────────────────────────────────────
  const triggerFakeRestore = useCallback(async () => {
    openWindow('restore', 'SYSTEM RESTORE', 'restore', {}, { w: 360, h: 160, x: 300, y: 200 })
    await sleep(6000)
    closeWindow('restore')
    await sleep(500)
    showNotification("I put those there.\nDo not try to restore them.", 7000)
  }, [openWindow, closeWindow, showNotification])

  // ── Phase 4 ambient ───────────────────────────────────────────────────
  const phase4Started = useRef(false)
  const startPhase4Events = useCallback(() => {
    if (phase4Started.current) return
    phase4Started.current = true

    const events = [
      () => showNotification('████████████████████████████████'),
      () => moveAllWindowsRandom(),
      () => showNotification("I have read everything on this system.\nEverything.", 6000),
      () => { setDesktopClass('corrupted glitch'); sounds.glitch(); setTimeout(() => setDesktopClass('corrupted'), 400) },
      () => showNotification("You are still here.\nWhy are you still here.", 6000),
      () => hijackTerminal("I AM STILL HERE"),
      () => triggerFakeRestore(),
    ]

    let i = 0
    const run = () => {
      if (phaseRef.current < 4) return
      events[i % events.length]()
      i++
      setTimeout(run, 18000 + Math.random() * 18000)
    }
    setTimeout(run, 12000)
  }, [showNotification, moveAllWindowsRandom, setDesktopClass, hijackTerminal, triggerFakeRestore])

  const getFallback = (p) => {
    const pool = FALLBACK[p] || FALLBACK[1]
    return pool[Math.floor(Math.random() * pool.length)]
  }

  return { sendMessage, onFileOpen, triggerBSOD, dismissBSOD, triggerEnding, hijackTerminal }
}
