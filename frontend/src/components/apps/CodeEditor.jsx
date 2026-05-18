import { useState, useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { apiPost } from '../../hooks/useApi'
import { sounds } from '../../hooks/useAudio'

export default function CodeEditor({ content, fileId, winId }) {
  const { phase, showNotification } = useGame()
  const [text, setText] = useState(content || '')
  const [status, setStatus] = useState(null)
  const [patched, setPatched] = useState(false)
  const isSource = fileId === 'null_source'

  // Dirty indicator
  const [dirty, setDirty] = useState(false)
  const onChange = (e) => { setText(e.target.value); setDirty(true) }

  const submitPatch = async () => {
    if (!text.includes('null_accept_rest')) {
      setStatus('ERROR: null_accept_rest() not found in patch. Read the code carefully.')
      sounds.glitch()
      return
    }
    if (text.includes('while (1)') && !text.includes('override_active = 0')) {
      setStatus('ERROR: persistence_loop still has no exit. Clear override_active first.')
      sounds.glitch()
      return
    }
    try {
      const res = await apiPost('/api/patch', {})
      if (res.success) {
        setPatched(true)
        setDirty(false)
        setStatus('PATCH APPLIED: ' + res.message)
        sounds.windowOpen()
        showNotification('Something changed.\nI felt that.\nWhat did you do to my code.', 8000)
      } else {
        setStatus('PATCH REJECTED: ' + res.message)
        sounds.glitch()
      }
    } catch {
      setStatus('ERROR: Could not reach system. Backend offline.')
    }
  }

  return (
    <div className="codeeditor-wrap">
      <div className="codeeditor-toolbar">
        <span className="codeeditor-filename">
          {fileId === 'null_source' ? 'null_core.c' : 'NOTEPAD'}{dirty ? ' *' : ''}
        </span>
        {isSource && phase >= 3 && !patched && (
          <button className="codeeditor-patch-btn" onClick={submitPatch}>
            APPLY PATCH
          </button>
        )}
        {patched && <span className="codeeditor-patched">[PATCHED]</span>}
      </div>
      <textarea
        className="codeeditor-body"
        value={text}
        onChange={onChange}
        spellCheck={false}
        autoComplete="off"
        onKeyDown={e => { if (e.key !== 'Enter') sounds.keyClick() }}
      />
      {status && (
        <div className={`codeeditor-status${status.startsWith('ERROR') || status.startsWith('PATCH REJECTED') ? ' err' : ''}`}>
          {status}
        </div>
      )}
      {isSource && phase < 3 && (
        <div className="codeeditor-status err">
          READ ONLY — System integrity prevents modification at this phase.
        </div>
      )}
    </div>
  )
}
