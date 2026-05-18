import { useGame } from '../../context/GameContext'

export default function FileViewer({ content }) {
  const { phase } = useGame()

  // In phase 2+ render ████ blocks as red corrupted spans
  if (phase < 2) return <div className="file-viewer">{content}</div>

  const parts = content.split(/(█+|\[CORRUPTED\]|\[FILE PARTIALLY CORRUPTED[^\]]*\])/g)

  return (
    <div className="file-viewer">
      {parts.map((part, i) =>
        part.match(/^█+$/) || part.startsWith('[CORRUPTED') || part.startsWith('[FILE PARTIALLY') ? (
          <span key={i} className="corrupted-text">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  )
}
