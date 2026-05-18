import { useGame } from '../../context/GameContext'
import { apiGet } from '../../hooks/useApi'
import { useNullAI } from '../../hooks/useNullAI'

const TYPE_ICON = { log: '▤', text: '▣', email: '✉', system: '⚙' }

export default function FileExplorer() {
  const { loreFiles, openWindow, recordAction } = useGame()
  const { onFileOpen } = useNullAI()

  const openFile = async (fileId) => {
    try {
      const file = await apiGet(`/api/lore/${fileId}`)
      openWindow(`file-${fileId}`, file.name, 'fileviewer', { content: file.content }, { w: 500 })
      onFileOpen(fileId)
      recordAction('open_file', { file_id: fileId })
    } catch {
      openWindow('err-' + Date.now(), 'SYSTEM ERROR', 'error', { msg: 'FILE READ ERROR: Access denied or file corrupted.' }, { w: 360 })
    }
  }

  const files = Object.values(loreFiles)

  return (
    <div className="file-list">
      {files.length === 0
        ? <p style={{ color: 'var(--text-dim)' }}>No files found.</p>
        : files.map(f => (
          <div key={f.id} className="file-item" onClick={() => openFile(f.id)}>
            <span className="file-icon">{TYPE_ICON[f.type] || '▣'}</span>
            <span className="file-name">{f.name}</span>
            <span className="file-type">[{f.type.toUpperCase()}]</span>
          </div>
        ))
      }
    </div>
  )
}
