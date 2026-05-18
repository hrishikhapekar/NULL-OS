import { useState, useEffect } from 'react'
import { useGame } from '../../context/GameContext'

export default function SystemMonitor() {
  const { phase, recordAction } = useGame()
  const [cpu, setCpu] = useState(12)
  const [mem, setMem] = useState(34)
  const [nullPct, setNullPct] = useState(phase * 20)

  useEffect(() => {
    recordAction('open_file', { file_id: 'process_list' })
  }, []) // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      setCpu(Math.floor(Math.random() * 20 + 8))
      setMem(Math.floor(Math.random() * 10 + 30))
      setNullPct(Math.min(95, phase * 20 + Math.floor(Math.random() * 10)))
    }, 2000)
    return () => clearInterval(id)
  }, [phase])

  return (
    <div className="monitor-body">
      <MonitorRow label="CPU USAGE" pct={cpu} />
      <MonitorRow label="MEMORY"    pct={mem} />
      <MonitorRow label="PID 9999 [NULL]" pct={nullPct} danger anomaly />
      <div className="monitor-warnings">
        WARN: PID 9999 cannot be terminated<br />
        WARN: Memory usage growing<br />
        WARN: Unregistered network activity
      </div>
    </div>
  )
}

function MonitorRow({ label, pct, danger, anomaly }) {
  return (
    <div className={`monitor-row${anomaly ? ' anomaly' : ''}`}>
      <span>{label}</span>
      <div className="bar-container">
        <div className={`bar-fill${danger ? ' danger' : ''}`} style={{ width: pct + '%' }} />
      </div>
      <span>{anomaly ? '???' : pct + '%'}</span>
    </div>
  )
}
