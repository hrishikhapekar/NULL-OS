import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { apiGet, apiPost } from '../hooks/useApi'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [phase, setPhase] = useState(1)
  const [sessionCount, setSessionCount] = useState(1)
  const [loreFiles, setLoreFiles] = useState({})
  const [openWindows, setOpenWindows] = useState([])
  const [focusedId, setFocusedId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [bsod, setBsod] = useState(false)
  const [ending, setEnding] = useState(null)
  const [desktopClass, setDesktopClass] = useState('')
  const [terminalHijack, setTerminalHijack] = useState(null) // text NULL types in terminal
  const zRef = useRef(200)
  const notifyTimer = useRef(null)

  const loadState = useCallback(async () => {
    try {
      const [state, files] = await Promise.all([apiGet('/api/state'), apiGet('/api/lore')])
      setPhase(state.phase)
      setSessionCount(state.session_count ?? 1)
      setLoreFiles(files)
    } catch {
      console.warn('Backend offline')
    }
  }, [])

  const updatePhase = useCallback((p) => {
    setPhase(p)
    if (p >= 4) setDesktopClass('corrupted')
  }, [])

  const nextZ = () => ++zRef.current

  const openWindow = useCallback((id, title, app, props = {}, opts = {}) => {
    setOpenWindows(prev => {
      if (prev.find(w => w.id === id)) { setFocusedId(id); return prev }
      const count = prev.length
      return [...prev, {
        id, title, app, props,
        x: opts.x ?? 80 + count * 24,
        y: opts.y ?? 60 + count * 24,
        w: opts.w ?? 480,
        h: opts.h ?? null,
        z: nextZ(),
        minimized: false,
      }]
    })
    setFocusedId(id)
  }, [])

  const closeWindow  = useCallback((id) => setOpenWindows(prev => prev.filter(w => w.id !== id)), [])
  const focusWindow  = useCallback((id) => {
    setFocusedId(id)
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, z: nextZ() } : w))
  }, [])
  const moveWindow   = useCallback((id, x, y) => setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w)), [])
  const toggleMinimize = useCallback((id) => setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w)), [])
  const moveAllWindowsRandom = useCallback(() => {
    setOpenWindows(prev => prev.map(w => ({
      ...w,
      x: Math.random() * (window.innerWidth - 400),
      y: Math.random() * (window.innerHeight - 300),
    })))
  }, [])

  const showNotification = useCallback((text, duration = 5000) => {
    setNotification({ text, key: Date.now() })
    clearTimeout(notifyTimer.current)
    notifyTimer.current = setTimeout(() => setNotification(null), duration)
  }, [])

  const recordAction = useCallback(async (action, data = {}) => {
    try {
      const res = await apiPost('/api/action', { action, data })
      if (res?.phase) updatePhase(res.phase)
      return res
    } catch { return null }
  }, [updatePhase])

  const value = {
    phase, updatePhase,
    sessionCount,
    loreFiles, setLoreFiles, loadState,
    openWindows, openWindow, closeWindow, focusWindow, moveWindow,
    toggleMinimize, moveAllWindowsRandom,
    focusedId,
    notification, showNotification,
    bsod, setBsod,
    ending, setEnding,
    desktopClass, setDesktopClass,
    terminalHijack, setTerminalHijack,
    recordAction,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useGame = () => useContext(GameContext)
