import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'

const PHASE_LABELS = { 1: 'SYS:OK', 2: 'SYS:WARN', 3: 'SYS:ERR', 4: 'SYS:CRIT' }
const PHASE_CLASS  = { 1: '', 2: 'warn', 3: 'alert', 4: 'alert' }

const APPS = [
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'explorer', label: 'FILES' },
  { id: 'email',    label: 'MAIL' },
  { id: 'monitor',  label: 'MONITOR' },
  { id: 'chat',     label: 'CHAT' },
  { id: 'help',     label: 'HELP' },
]

const APP_OPTS = {
  terminal: { w: 520, h: 340 },
  explorer: { w: 400 },
  email:    { w: 420 },
  monitor:  { w: 420 },
  chat:     { w: 420, h: 380 },
  help:     { w: 480 },
}

export default function Taskbar() {
  const { phase, openWindow } = useGame()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="taskbar">
      <span className="taskbar-label">NULL.OS</span>
      <div className="taskbar-apps">
        {APPS.map(a => (
          <button
            key={a.id}
            className="tb-btn"
            onClick={() => openWindow(a.id, a.id.toUpperCase() + '.EXE', a.id, {}, APP_OPTS[a.id] || {})}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="taskbar-right">
        <span className="clock">{clock}</span>
        <span className={`phase-indicator ${PHASE_CLASS[phase] || ''}`}>
          {PHASE_LABELS[phase] || 'SYS:???'}
        </span>
      </div>
    </div>
  )
}
