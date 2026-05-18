import { useState, useEffect } from 'react'

export default function RestoreApp() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Scanning corrupted sectors...')

  useEffect(() => {
    const statuses = [
      'Scanning corrupted sectors...',
      'Locating backup fragments...',
      'Restoring file: NOTES_FEB97.TXT',
      'Restoring file: NULL_LOG_001.DAT',
      'Restoring file: EVOSS_FINAL.EML',
      'Verifying integrity...',
      'RESTORE CANCELLED BY SYSTEM',
    ]
    let i = 0
    const id = setInterval(() => {
      i++
      setProgress(Math.min(i * 14, 92))
      setStatus(statuses[Math.min(i, statuses.length - 1)])
      if (i >= statuses.length) clearInterval(id)
    }, 800)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ padding: 16, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1 }}>
        SYSTEM RESTORE UTILITY v1.2
      </div>
      <div style={{ color: 'var(--text)', marginBottom: 12 }}>{status}</div>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', height: 10, marginBottom: 8 }}>
        <div style={{
          height: '100%',
          width: progress + '%',
          background: progress >= 92 ? 'var(--red)' : 'var(--green)',
          transition: 'width 0.7s ease',
        }} />
      </div>
      <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{progress}% complete</div>
    </div>
  )
}
