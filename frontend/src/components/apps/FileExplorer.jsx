import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { apiGet } from '../../hooks/useApi'
import { useNullAI } from '../../hooks/useNullAI'

const TYPE_ICON = { log: '▤', text: '▣', email: '✉', system: '⚙', code: '{}', config: '≡', default: '▣' }

const DIR_LABELS = {
  undefined:        'C:\\',
  'SYSTEM':         'C:\\SYSTEM',
  'SYSTEM/SRC':     'C:\\SYSTEM\\SRC',
  'LOGS':           'C:\\LOGS',
  'PERSONAL/EVOSS': 'C:\\PERSONAL\\EVOSS',
}

export default function FileExplorer() {
  const { loreFiles, openWindow, recordAction } = useGame()
  const { onFileOpen } = useNullAI()
  const [expanded, setExpanded] = useState({ undefined: true })

  const openFile = async (fileId, isCode) => {
    try {
      const file = await apiGet(`/api/lore/${fileId}`)
      const app = isCode ? 'codeeditor' : 'fileviewer'
      const props = isCode
        ? { content: file.content, fileId }
        : { content: file.content }
      const opts = isCode ? { w: 600, h: 480 } : { w: 500 }
      openWindow(`file-${fileId}`, file.name, app, props, opts)
      onFileOpen(fileId)
      recordAction('open_file', { file_id: fileId })
    } catch {
      openWindow('err-' + Date.now(), 'SYSTEM ERROR', 'error',
        { msg: 'FILE READ ERROR: Access denied or file corrupted.' }, { w: 360 })
    }
  }

  const files = Object.values(loreFiles)

  // Group by dir
  const groups = {}
  files.forEach(f => {
    const key = f.dir ?? 'undefined'
    if (!groups[key]) groups[key] = []
    groups[key].push(f)
  })

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="file-list">
      {Object.entries(groups).map(([dirKey, items]) => (
        <div key={dirKey}>
          <div className="file-dir-header" onClick={() => toggle(dirKey)}>
            <span>{expanded[dirKey] ? '▼' : '▶'}</span>
            <span>{DIR_LABELS[dirKey] ?? `C:\\${dirKey.replace('/', '\\')}`}</span>
          </div>
          {expanded[dirKey] && items.map(f => (
            <div key={f.id} className="file-item file-item-indent"
              onClick={() => openFile(f.id, f.type === 'code' || f.type === 'config')}>
              <span className="file-icon">{TYPE_ICON[f.type] || TYPE_ICON.default}</span>
              <span className="file-name">{f.name}</span>
              <span className="file-type">[{f.type?.toUpperCase()}]</span>
            </div>
          ))}
        </div>
      ))}
      {files.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No files found.</p>}
    </div>
  )
}
