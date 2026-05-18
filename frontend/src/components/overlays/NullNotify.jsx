import { useEffect } from 'react'
import { sounds } from '../../hooks/useAudio'

export default function NullNotify({ notification }) {
  useEffect(() => {
    if (notification) sounds.nullNotify()
  }, [notification])

  if (!notification) return null
  return (
    <div className="null-notify-overlay">
      <div key={notification.key} className="null-notify">
        {notification.text}
      </div>
    </div>
  )
}
