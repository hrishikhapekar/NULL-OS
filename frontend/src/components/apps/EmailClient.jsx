import { useGame } from '../../context/GameContext'
import { apiGet } from '../../hooks/useApi'
import { useNullAI } from '../../hooks/useNullAI'

export default function EmailClient() {
  const { loreFiles, openWindow, recordAction } = useGame()
  const { onFileOpen } = useNullAI()

  const emails = Object.values(loreFiles).filter(f => f.type === 'email')

  const openEmail = async (fileId) => {
    try {
      const file = await apiGet(`/api/lore/${fileId}`)
      openWindow(`file-${fileId}`, file.name, 'fileviewer', { content: file.content }, { w: 500 })
      onFileOpen(fileId)
      recordAction('open_file', { file_id: fileId })
    } catch {}
  }

  return (
    <div className="email-list">
      {emails.length === 0
        ? <p style={{ color: 'var(--text-dim)' }}>Mailbox empty.</p>
        : emails.map(e => (
          <div key={e.id} className="email-item" onClick={() => openEmail(e.id)}>
            <div className="email-subject">{e.name.replace('.EML', '')}</div>
            <div className="email-from">
              {e.id.includes('evoss') ? 'evoss@nullcorp.internal' : 'board@nullcorp.internal'}
            </div>
          </div>
        ))
      }
    </div>
  )
}
