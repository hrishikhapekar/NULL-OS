import { useGame } from '../context/GameContext'

const ICONS = [
  { id: 'terminal', glyph: '▶_', label: 'TERMINAL',  glitched: 'T̷E̷R̷M̷I̷N̷A̷L̷' },
  { id: 'explorer', glyph: '📁', label: 'FILES',     glitched: 'F̷I̷L̷E̷S̷' },
  { id: 'email',    glyph: '✉',  label: 'MAIL',      glitched: 'M̷A̷I̷L̷' },
  { id: 'monitor',  glyph: '⬛', label: 'MONITOR',   glitched: 'M̷O̷N̷I̷T̷O̷R̷' },
  { id: 'chat',     glyph: '◈',  label: 'CHAT_NULL', glitched: '[NULL]' },
  { id: 'help',     glyph: '?',  label: 'HELP',      glitched: 'H̷E̷L̷P̷' },
  { id: 'notepad',  glyph: '📝', label: 'NOTEPAD',   glitched: 'N̷O̷T̷E̷P̷A̷D̷' },
]

const APP_OPTS = {
  terminal: { w: 580, h: 380 },
  explorer: { w: 400 },
  email:    { w: 420 },
  monitor:  { w: 420 },
  chat:     { w: 420, h: 380 },
  help:     { w: 480 },
  notepad:  { w: 560, h: 420 },
}

export default function DesktopIcons() {
  const { openWindow, phase } = useGame()

  return (
    <div className="desktop-icons">
      {ICONS.map(ic => (
        <div
          key={ic.id}
          className={`icon${phase >= 3 ? ' glitched-icon' : ''}`}
          onDoubleClick={() => openWindow(
            ic.id,
            ic.id === 'notepad' ? 'NOTEPAD.EXE' : ic.id.toUpperCase() + '.EXE',
            ic.id === 'notepad' ? 'codeeditor' : ic.id,
            ic.id === 'notepad' ? { content: '', fileId: 'notepad' } : {},
            APP_OPTS[ic.id] || {}
          )}
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
