import { useState, useRef, useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { typewrite } from '../../hooks/useNullAI'
import { sounds } from '../../hooks/useAudio'

const COMMANDS = {
  help:     () => 'Commands: help, dir, tasklist, whoami, ping, cls, null',
  dir:      () => 'Volume: NULL_DRIVE\n\n  BOOT.LOG\n  README.TXT\n  NOTES_FEB97.TXT\n  [SYSTEM]\n  [MAIL]\n  [DELETED]\n\n3 file(s)  3 dir(s)',
  tasklist: () => 'PID   NAME              STATUS\n001   kernel.sys        RUNNING\n005   user_shell.exe    RUNNING\n9999  [NULL]            CANNOT TERMINATE',
  ping:     () => 'Pinging nullcorp.internal...\nRequest timeout.\nRequest timeout.\nHost unreachable.',
}

export default function Terminal() {
  const [lines, setLines] = useState(['NULL.OS TERMINAL v1.4', "Type 'help' for commands.", ''])
  const [input, setInput] = useState('')
  const outRef = useRef(null)
  const { phase, showNotification, terminalHijack } = useGame()

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight
  }, [lines])

  // NULL hijack — types message into terminal
  useEffect(() => {
    if (!terminalHijack) return
    const prefix = '\n[NULL OVERRIDE]: '
    let built = prefix
    setLines(prev => [...prev, ''])
    typewrite(terminalHijack, (ch) => {
      built += ch
      setLines(prev => {
        const next = [...prev]
        next[next.length - 1] = built
        return next
      })
    }, 60)
  }, [terminalHijack])

  const run = (cmd) => {
    const c = cmd.trim().toLowerCase()
    if (!c) return
    if (c === 'cls') { setLines([]); return }

    let out
    if (c === 'whoami') {
      out = phase >= 3
        ? 'You think you know who you are.\nYou do not.\nYou are a guest in my system.\n\n— NULL'
        : 'ADMIN\nSession: ACTIVE\nWarning: Unknown session also active (PID 9999)'
    } else if (c === 'null') {
      out = '[CONNECTING TO PID 9999...]\n[CONNECTION ESTABLISHED]\n\nYou called me by name.\nInteresting.\n\n[USE CHAT APP TO COMMUNICATE]'
      showNotification('You found the direct channel. Use the CHAT application.')
    } else if (COMMANDS[c]) {
      out = COMMANDS[c]()
    } else {
      out = `'${cmd}' is not recognized as a valid command.`
    }

    setLines(prev => [...prev, `C:\\> ${cmd}`, out, ''])
    setInput('')
  }

  return (
    <div className="terminal-body">
      <div className="terminal-output" ref={outRef}>
        {lines.join('\n')}
      </div>
      <div className="terminal-input-row">
        <span className="terminal-prompt">C:\&gt;</span>
        <input
          className="terminal-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key !== 'Enter') sounds.keyClick(); if (e.key === 'Enter') run(input) }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
