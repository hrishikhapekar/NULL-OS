export default function NullNotify({ notification }) {
  if (!notification) return null
  return (
    <div className="null-notify-overlay">
      <div key={notification.key} className="null-notify">
        {notification.text}
      </div>
    </div>
  )
}
