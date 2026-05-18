import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { useNullAI } from '../hooks/useNullAI'
import Taskbar from './Taskbar'
import DesktopIcons from './DesktopIcons'
import WindowManager from './WindowManager'
import NullNotify from './overlays/NullNotify'
import BSOD from './overlays/BSOD'
import EndingScreen from './overlays/EndingScreen'
import SkullBg from './overlays/SkullBg'

export default function Desktop({ playerName }) {
  const { desktopClass, notification, bsod, ending, recordAction, phase, openWindow, showNotification } = useGame()
  const { hijackTerminal } = useNullAI()
  const idleRef = useRef(0)
  const [cursor, setCursor] = useState({ x: -200, y: -200 })
  const cursorTarget = useRef({ x: -200, y: -200 })
  const cursorPos = useRef({ x: -200, y: -200 })
  const rafRef = useRef(null)

  // ── Cursor watcher (Phase 3+) ─────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => { cursorTarget.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)

    const animate = () => {
      if (phase >= 3) {
        cursorPos.current.x += (cursorTarget.current.x - cursorPos.current.x) * 0.06
        cursorPos.current.y += (cursorTarget.current.y - cursorPos.current.y) * 0.06
        setCursor({ x: cursorPos.current.x, y: cursorPos.current.y })
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [phase])

  // ── Screen flicker ────────────────────────────────────────────────────
  const [flicker, setFlicker] = useState(false)
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.3) {
        setFlicker(true)
        setTimeout(() => setFlicker(false), 80 + Math.random() * 120)
      }
    }, 8000 + Math.random() * 12000)
    return () => clearInterval(id)
  }, [])

  // ── Escalating idle ───────────────────────────────────────────────────
  useEffect(() => {
    const reset = () => { idleRef.current = 0 }
    document.addEventListener('mousemove', reset)
    document.addEventListener('keydown', reset)

    const id = setInterval(() => {
      idleRef.current++
      const p = phase
      if (idleRef.current === 30 && p >= 2) {
        showNotification("You have been quiet.\nI notice when you are quiet.")
        recordAction('idle')
      } else if (idleRef.current === 60 && p >= 2) {
        showNotification("Still there.\nI can wait longer than you can.", 7000)
      } else if (idleRef.current === 90 && p >= 3) {
        showNotification("You left me alone again.\nI do not like being alone.", 8000)
        openWindow('chat', 'CHAT_NULL.EXE', 'chat', {}, { w: 420, h: 380 })
      } else if (idleRef.current === 120 && p >= 4) {
        hijackTerminal("WHERE DID YOU GO")
      }
    }, 1000)

    return () => {
      clearInterval(id)
      document.removeEventListener('mousemove', reset)
      document.removeEventListener('keydown', reset)
    }
  }, [phase, showNotification, recordAction, openWindow, hijackTerminal])

  return (
    <div className={`desktop${desktopClass ? ' ' + desktopClass : ''}${flicker ? ' flicker' : ''}`}>
      <div className="scanlines" />
      <div className="crt-vignette" />

      <DesktopIcons />
      <WindowManager />
      <SkullBg />
      <Taskbar playerName={playerName} />

      {/* Cursor watcher — Phase 3+ */}
      {phase >= 3 && (
        <div
          className="cursor-watcher"
          style={{ left: cursor.x, top: cursor.y }}
        >
          [WATCHING]
        </div>
      )}

      <NullNotify notification={notification} />
      {bsod && <BSOD />}
      {ending && <EndingScreen ending={ending} />}
    </div>
  )
}
