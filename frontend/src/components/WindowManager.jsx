import { useRef, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import Terminal from './apps/Terminal'
import FileExplorer from './apps/FileExplorer'
import EmailClient from './apps/EmailClient'
import SystemMonitor from './apps/SystemMonitor'
import Chat from './apps/Chat'
import FileViewer from './apps/FileViewer'
import ErrorApp from './apps/ErrorApp'
import Help from './apps/Help'
import RestoreApp from './apps/RestoreApp'

import CodeEditor from './apps/CodeEditor'

const APP_MAP = {
  terminal:   Terminal,
  explorer:   FileExplorer,
  email:      EmailClient,
  monitor:    SystemMonitor,
  chat:       Chat,
  fileviewer: FileViewer,
  error:      ErrorApp,
  help:       Help,
  restore:    RestoreApp,
  codeeditor: CodeEditor,
}

export default function WindowManager() {
  const { openWindows, closeWindow, focusWindow, moveWindow, toggleMinimize, focusedId } = useGame()

  return (
    <>
      {openWindows.map(win => (
        <Window
          key={win.id}
          win={win}
          focused={focusedId === win.id}
          onClose={() => closeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          onMove={(x, y) => moveWindow(win.id, x, y)}
          onMinimize={() => toggleMinimize(win.id)}
        />
      ))}
    </>
  )
}

function Window({ win, focused, onClose, onFocus, onMove, onMinimize }) {
  const dragRef = useRef({ dragging: false, ox: 0, oy: 0 })

  const onMouseDown = useCallback((e) => {
    if (e.target.classList.contains('win-btn')) return
    dragRef.current = { dragging: true, ox: e.clientX - win.x, oy: e.clientY - win.y }
    onFocus()

    const onMove_ = (e) => {
      if (!dragRef.current.dragging) return
      onMove(Math.max(0, e.clientX - dragRef.current.ox), Math.max(0, e.clientY - dragRef.current.oy))
    }
    const onUp = () => {
      dragRef.current.dragging = false
      window.removeEventListener('mousemove', onMove_)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove_)
    window.addEventListener('mouseup', onUp)
  }, [win.x, win.y, onFocus, onMove])

  const AppComponent = APP_MAP[win.app]

  return (
    <div
      className={`window${focused ? ' focused' : ''}${win.shaking ? ' shaking' : ''}`}
      style={{
        left: win.x, top: win.y,
        width: win.w,
        height: win.h ?? 'auto',
        maxHeight: '80vh',
        zIndex: win.z,
      }}
      onMouseDown={onFocus}
    >
      <div className="win-titlebar" onMouseDown={onMouseDown}>
        <span className="win-title">{win.title}</span>
        <button className="win-btn minimize" onClick={onMinimize}>_</button>
        <button className="win-btn" onClick={onClose}>✕</button>
      </div>
      <div className={`win-body${win.minimized ? ' collapsed' : ''}${['terminal','chat','codeeditor'].includes(win.app) ? ' no-pad' : ''}`}>
        {AppComponent && <AppComponent {...win.props} winId={win.id} />}
      </div>
    </div>
  )
}
