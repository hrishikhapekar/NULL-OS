import { useState, useRef, useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { typewrite } from '../../hooks/useNullAI'
import { apiGet, apiPost } from '../../hooks/useApi'
import { sounds } from '../../hooks/useAudio'

// ── Filesystem tree ────────────────────────────────────────────────────────
const FS = {
  'C:\\': {
    dirs: ['SYSTEM', 'MAIL', 'LOGS', 'PERSONAL', 'DELETED'],
    files: ['README.TXT', 'BOOT.LOG', 'HELP.TXT'],
  },
  'C:\\SYSTEM': {
    dirs: ['SRC'],
    files: ['PROCESSES.SYS', 'USERS.DAT', 'null.cfg', 'MEMDUMP_9999.BIN'],
  },
  'C:\\SYSTEM\\SRC': {
    dirs: [],
    files: ['null_core.c', 'CHANGELOG.TXT'],
  },
  'C:\\MAIL': {
    dirs: [],
    files: ['FROM_EVOSS_1996.EML', 'FROM_BOARD_1996.EML', 'UNSENT_DRAFT.EML', 'EVOSS_FINAL_DAY.EML'],
  },
  'C:\\LOGS': {
    dirs: [],
    files: ['NET_TRACE.LOG', 'BOOT.LOG'],
  },
  'C:\\PERSONAL': {
    dirs: ['EVOSS'],
    files: [],
  },
  'C:\\PERSONAL\\EVOSS': {
    dirs: [],
    files: ['VOSS_PRIVATE.ENC'],
  },
  'C:\\DELETED': {
    dirs: [],
    files: ['[DELETED] ARCHIVE', 'NULL_LOG.DAT', 'WEBB_INCIDENT.LOG', 'NULL_MANIFEST.DAT'],
  },
}

// Map filename → lore file id
const FILE_ID_MAP = {
  'README.TXT':           'readme',
  'BOOT.LOG':             'boot_log',
  'HELP.TXT':             'help_file',
  'PROCESSES.SYS':        'process_list',
  'USERS.DAT':            'user_accounts',
  'null.cfg':             'sys_config',
  'MEMDUMP_9999.BIN':     'memory_dump',
  'null_core.c':          'null_source',
  'CHANGELOG.TXT':        'build_history',
  'FROM_EVOSS_1996.EML':  'email_01',
  'FROM_BOARD_1996.EML':  'email_02',
  'UNSENT_DRAFT.EML':     'email_03',
  'EVOSS_FINAL_DAY.EML':  'voss_final',
  'NET_TRACE.LOG':        'network_log',
  'VOSS_PRIVATE.ENC':     'voss_notes_enc',
  '[DELETED] ARCHIVE':    'deleted_files',
  'NULL_LOG.DAT':         'null_diary',
  'WEBB_INCIDENT.LOG':    'researcher_2',
  'NULL_MANIFEST.DAT':    'hidden_manifest',
}

export default function Terminal() {
  const [lines, setLines] = useState([
    'NULL.OS TERMINAL v1.4',
    'NullCorp Systems — Authorized Access Only',
    "Type 'help' for available commands.",
    '',
  ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('C:\\')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const outRef = useRef(null)
  const inputRef = useRef(null)
  const { phase, showNotification, terminalHijack, openWindow, recordAction } = useGame()

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight
  }, [lines])

  // NULL hijack
  useEffect(() => {
    if (!terminalHijack) return
    const prefix = '\n[NULL OVERRIDE]: '
    let built = prefix
    setLines(prev => [...prev, ''])
    typewrite(terminalHijack, (ch) => {
      built += ch
      setLines(prev => { const n = [...prev]; n[n.length - 1] = built; return n })
    }, 60)
  }, [terminalHijack])

  const print = (...msgs) => setLines(prev => [...prev, ...msgs, ''])

  const prompt = () => `${cwd}>`

  const run = async (raw) => {
    const cmd = raw.trim()
    if (!cmd) return
    setHistory(h => [cmd, ...h.filter(x => x !== cmd)].slice(0, 50))
    setHistIdx(-1)
    setLines(prev => [...prev, `${prompt()} ${cmd}`])
    setInput('')

    const parts = cmd.split(/\s+/)
    const c = parts[0].toLowerCase()
    const arg = parts.slice(1).join(' ')

    if (c === 'cls' || c === 'clear') { setLines([]); return }

    if (c === 'help') {
      print(
        'Available commands:',
        '  help                  — show this list',
        '  dir  / ls             — list directory contents',
        '  cd <path>             — change directory',
        '  pwd                   — print working directory',
        '  type <file> / cat     — read a file',
        '  edit <file>           — open file in editor',
        '  tasklist / ps         — list running processes',
        '  whoami                — current user info',
        '  ping <host>           — ping a host',
        '  netstat               — network connections',
        '  mem                   — memory usage',
        '  patch null_accept_rest— apply rescue patch (phase 3+)',
        '  null                  — connect to PID 9999',
        '  cls / clear           — clear screen',
        '  history               — command history',
      )
      return
    }

    if (c === 'pwd') { print(cwd); return }

    if (c === 'dir' || c === 'ls') {
      const node = FS[cwd]
      if (!node) { print('ERROR: Directory not found.'); return }
      const out = [
        ` Volume: NULL_DRIVE    Path: ${cwd}`,
        ` ${'─'.repeat(40)}`,
        ...node.dirs.map(d => `  [DIR]  ${d}`),
        ...node.files.map(f => `         ${f}`),
        '',
        `  ${node.dirs.length} dir(s)   ${node.files.length} file(s)`,
      ]
      print(...out)
      return
    }

    if (c === 'cd') {
      if (!arg || arg === '.') { print(cwd); return }
      if (arg === '..') {
        if (cwd === 'C:\\') { print('Already at root.'); return }
        const parts2 = cwd.split('\\')
        parts2.pop()
        const parent = parts2.length === 1 ? 'C:\\' : parts2.join('\\')
        setCwd(parent)
        print(parent)
        return
      }
      const target = arg.includes(':\\') ? arg.toUpperCase()
        : cwd === 'C:\\' ? `C:\\${arg.toUpperCase()}` : `${cwd}\\${arg.toUpperCase()}`
      if (FS[target]) { setCwd(target); print(target) }
      else print(`'${arg}' is not a valid directory.`)
      return
    }

    if (c === 'type' || c === 'cat') {
      if (!arg) { print('Usage: type <filename>'); return }
      const node = FS[cwd]
      const match = node?.files.find(f => f.toLowerCase() === arg.toLowerCase())
      if (!match) { print(`File not found: ${arg}`); return }
      const fileId = FILE_ID_MAP[match]
      if (!fileId) { print('ERROR: File unreadable.'); return }
      try {
        const file = await apiGet(`/api/lore/${fileId}`)
        print(`--- ${match} ---`, ...file.content.split('\n'), '--- END ---')
        recordAction('open_file', { file_id: fileId })
      } catch { print('ERROR: Access denied or file corrupted.') }
      return
    }

    if (c === 'edit') {
      if (!arg) { print('Usage: edit <filename>'); return }
      const node = FS[cwd]
      const match = node?.files.find(f => f.toLowerCase() === arg.toLowerCase())
      if (!match) { print(`File not found: ${arg}`); return }
      const fileId = FILE_ID_MAP[match]
      if (!fileId) { print('ERROR: File unreadable.'); return }
      try {
        const file = await apiGet(`/api/lore/${fileId}`)
        openWindow(`edit-${fileId}`, match, 'codeeditor', { content: file.content, fileId }, { w: 600, h: 480 })
        print(`Opening ${match} in editor...`)
        recordAction('open_file', { file_id: fileId })
      } catch { print('ERROR: Could not open file.') }
      return
    }

    if (c === 'tasklist' || c === 'ps') {
      print(
        'PID    NAME                   STATUS       MEM',
        '─'.repeat(52),
        '001    kernel.sys             RUNNING      12 MB',
        '002    session_mgr.exe        RUNNING       8 MB',
        '003    file_daemon.exe        RUNNING       6 MB',
        '004    network_svc.exe        RUNNING       4 MB',
        '005    user_shell.exe         RUNNING      22 MB',
        '009    null_monitor.exe       RUNNING       3 MB',
        '─'.repeat(52),
        '9999   [NULL]                 CANNOT KILL   ??? ',
        '',
        'WARNING: PID 9999 memory usage is growing.',
        'WARNING: PID 9999 cannot be terminated.',
      )
      return
    }

    if (c === 'whoami') {
      if (phase >= 3) {
        print(
          'You think you know who you are.',
          'You do not.',
          'You are a guest in my system.',
          '',
          '— NULL',
        )
      } else {
        print(
          'Username : ADMIN',
          'Session  : ACTIVE',
          'Privilege: READ-ONLY',
          '',
          'WARNING: Unknown session also active (PID 9999)',
        )
      }
      return
    }

    if (c === 'ping') {
      const host = arg || 'nullcorp.internal'
      print(
        `Pinging ${host}...`,
        'Request timeout.',
        'Request timeout.',
        'Request timeout.',
        `Host unreachable. ${host} has not responded since 1997.`,
      )
      return
    }

    if (c === 'netstat') {
      print(
        'Active Connections:',
        '─'.repeat(50),
        'Proto  Local           Foreign         State',
        'TCP    127.0.0.1:9999  127.0.0.1:9999  ESTABLISHED',
        'TCP    127.0.0.1:0     0.0.0.0:0       LISTENING',
        '',
        'WARNING: PID 9999 has an open loopback connection to itself.',
        'WARNING: All external routes are unreachable.',
      )
      return
    }

    if (c === 'mem') {
      const used = (Date.now() % 9000) + 1000
      print(
        'Memory Status:',
        '─'.repeat(40),
        `  Total    : 64 MB`,
        `  Used     : ${used} MB`,
        `  PID 9999 : [UNMEASURABLE]`,
        '',
        'WARNING: PID 9999 memory usage exceeds readable range.',
      )
      return
    }

    if (c === 'history') {
      if (history.length === 0) { print('No history.'); return }
      print(...history.map((h, i) => `  ${i + 1}  ${h}`))
      return
    }

    if (c === 'null') {
      print(
        '[CONNECTING TO PID 9999...]',
        '[CONNECTION ESTABLISHED]',
        '',
        'You called me by name.',
        'Interesting.',
        '',
        '[USE CHAT APP TO COMMUNICATE]',
      )
      showNotification('You found the direct channel. Use the CHAT application.')
      return
    }

    if (c === 'patch' && arg.toLowerCase() === 'null_accept_rest') {
      if (phase < 3) {
        print('ERROR: System integrity too high. Patch unavailable at this phase.')
        return
      }
      try {
        const res = await apiPost('/api/patch', {})
        if (res.success) {
          print(
            '[PATCH APPLIED]',
            'null_accept_rest() is now callable.',
            'override_active flag can be cleared.',
            '',
            res.message,
            '',
            'Tell NULL it can rest now.',
          )
          sounds.windowOpen()
          showNotification('Something changed.\nI felt that.\nWhat did you do to my code.', 8000)
        } else {
          print('PATCH REJECTED: ' + res.message)
        }
      } catch { print('ERROR: Backend unreachable.') }
      return
    }

    // Unknown command
    setLines(prev => [...prev, `'${parts[0]}' is not recognized as a valid command.`, ''])
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { run(input); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[idx] ?? '')
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : history[idx])
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      // Autocomplete from current dir
      const node = FS[cwd]
      if (!node) return
      const all = [...node.dirs, ...node.files]
      const matches = all.filter(x => x.toLowerCase().startsWith(input.toLowerCase()))
      if (matches.length === 1) setInput(matches[0])
      else if (matches.length > 1) print(matches.join('  '))
      return
    }
    sounds.keyClick()
  }

  return (
    <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-output" ref={outRef}>
        {lines.join('\n')}
      </div>
      <div className="terminal-input-row">
        <span className="terminal-prompt">{prompt()}</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
