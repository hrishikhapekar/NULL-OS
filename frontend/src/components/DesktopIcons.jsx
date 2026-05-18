import { useGame } from '../context/GameContext'

const ICONS = [
  { id: 'terminal', glyph: '▶_', label: 'TERMINAL',  glitched: 'T̷E̷R̷M̷I̷N̷A̷L̷' },
  { id: 'explorer', glyph: '📁', label: 'FILES',     glitched: 'F̷I̷L̷E̷S̷' },
  { id: 'email',    glyph: '✉',  label: 'MAIL',      glitched: 'M̷A̷I̷L̷' },
  { id: 'monitor',  glyph: '⬛', label: 'MONITOR',   glitched: 'M̷O̷N̷I̷T̷O̷R̷' },
  { id: 'chat',     glyph: '◈',  label: 'CHAT_NULL', glitched: '[NULL]' },
  { id: 'help',     glyph: '?',  label: 'HELP',      glitched: 'H̷E̷L̷P̷' },
]

const APP_OPTS = {
  terminal: { w: 520, h: 340 },
  explorer: { w: 400 },
  email:    { w: 420 },
  monitor:  { w: 420 },
  chat:     { w: 420, h: 380 },
  help:     { w: 480 },
}

export default function DesktopIcons() {
  const { openWindow, phase } = useGame()

  return (
    <div className="desktop-icons">
      {ICONS.map(ic => (
        <div
          key={ic.id}
          className={`icon${phase >= 3 ? ' glitched-icon' : ''}`}
          onDoubleClick={() => openWindow(ic.id, ic.id.toUpperCase() + '.EXE', ic.id, {}, APP_OPTS[ic.id] || {})}
        >
          <div className="icon-img">{ic.glyph}</div>
          <span className="icon-label">
            {phase >= 3 ? ic.glitched : ic.label}
          </span>
        </div>
      ))}
    </div>
  )
}
