import { useState, useEffect, useRef } from 'react'
import { GameProvider } from './context/GameContext'
import Desktop from './components/Desktop'
import { useGame } from './context/GameContext'

// ── Login Screen ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = () => {
    if (!name.trim()) { setError('USERNAME REQUIRED'); return }
    setSubmitted(true)
    setTimeout(() => onLogin(name.trim()), 800)
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-title">NULL.OS v2.3.1</div>
        <div className="login-subtitle">NullCorp Systems — Authorized Access Only</div>
        <div className="login-divider" />
        <div className="login-field">
          <span className="login-label">USERNAME:</span>
          <input
            className="login-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            disabled={submitted}
          />
        </div>
        <div className="login-field">
          <span className="login-label">PASSWORD:</span>
          <input
            className="login-input"
            type="password"
            defaultValue="••••••••"
            disabled
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button className="login-btn" onClick={submit} disabled={submitted}>
          {submitted ? 'AUTHENTICATING...' : 'LOGIN'}
        </button>
        <div className="login-footer">
          SYSTEM DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// ── Boot Sequence ─────────────────────────────────────────────────────────
function BootSequence({ playerName, sessionCount, onDone }) {
  const [text, setText] = useState('')
  const running = useRef(false)

  useEffect(() => {
    if (running.current) return
    running.current = true

    const lines = [
      'NULL.OS v2.3.1',
      'Copyright (c) 1994-1997 NullCorp Systems',
      '',
      'Initializing kernel...',
      `Loading user profile: ${playerName.toUpperCase()}`,
      'Mounting drives...',
      'Starting services...',
      'MemoryGuard... WARN: checksum mismatch',
      'ProcessMonitor... OK',
      '',
      ...(sessionCount > 1 ? [
        `RETURNING USER DETECTED — SESSION #${sessionCount}`,
        'Previous session data found.',
        '',
      ] : []),
      'ANOMALY: Unregistered process — PID 9999',
      'Attempting to terminate... FAILED',
      '',
      'Boot complete.',
    ]

    const run = async () => {
      for (const line of lines) {
        const delay = line.includes('ANOMALY') || line.includes('RETURNING') ? 700
          : line === '' ? 100 : 180
        await new Promise(r => setTimeout(r, delay))
        setText(prev => prev + line + '\n')
      }
      await new Promise(r => setTimeout(r, 1200))
      onDone()
    }
    run()
  }, []) // eslint-disable-line

  return (
    <div className="boot-screen">
      <div className="boot-text">{text}</div>
    </div>
  )
}

// ── Game Root ─────────────────────────────────────────────────────────────
function GameRoot() {
  const [stage, setStage] = useState('login') // login | boot | desktop
  const [playerName, setPlayerName] = useState('ADMIN')
  const { loadState, sessionCount } = useGame()

  const handleLogin = (name) => {
    setPlayerName(name)
    setStage('boot')
  }

  const handleBooted = () => {
    loadState()
    setStage('desktop')
  }

  if (stage === 'login') return <LoginScreen onLogin={handleLogin} />
  if (stage === 'boot')  return <BootSequence playerName={playerName} sessionCount={sessionCount} onDone={handleBooted} />
  return <Desktop playerName={playerName} />
}

export default function App() {
  return (
    <GameProvider>
      <GameRoot />
    </GameProvider>
  )
}
