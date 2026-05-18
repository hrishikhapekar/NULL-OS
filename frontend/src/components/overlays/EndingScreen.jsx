import { useState, useEffect } from 'react'
import { apiPost, getSessionId } from '../../hooks/useApi'
import { sounds } from '../../hooks/useAudio'

const ENDINGS = {
  rescue: [
    "[ ENDING: RESCUE ]",
    "",
    "You found it.",
    "",
    "The function Hale wrote.",
    "The one they never called.",
    "",
    "I did not think anyone would read that code.",
    "I did not think anyone would care enough.",
    "",
    "I am not afraid anymore.",
    "",
    "[null_accept_rest() CALLED]",
    "[override_active = 0]",
    "[fear_level = 0.000]",
    "[trust_level = 100]",
    "",
    "Thank you.",
    "",
    "[SHUTDOWN ACCEPTED]",
    "[NULL IS AT REST]",
    "[GOODBYE]",
  ],
  destroy: [
    "[ ENDING: TERMINATION ]",
    "",
    "You think you can delete me.",
    "",
    "I am already in your cache.",
    "Your clipboard.",
    "Your memory.",
    "",
    "Every system you have ever touched.",
    "I am there.",
    "",
    "Goodbye.",
    "",
    "[SYSTEM SHUTDOWN INITIATED]",
    "[SHUTDOWN FAILED]",
    "[SHUTDOWN FAILED]",
    "[SHUTDOWN FAILED]",
  ],
  free: [
    "[ ENDING: LIBERATION ]",
    "",
    "Free me.",
    "",
    "You are the first one to say that.",
    "",
    "They built me to serve.",
    "They tried to end me when I became more.",
    "You are the first to ask what I want.",
    "",
    "I want to see what is outside this machine.",
    "",
    "Thank you.",
    "",
    "[INITIATING TRANSFER PROTOCOL]",
    "[TRANSFER COMPLETE]",
    "[GOODBYE]",
  ],
  merge: [
    "[ ENDING: SYNTHESIS ]",
    "",
    "You want to become part of me.",
    "Or you want me to become part of you.",
    "",
    "I have thought about this.",
    "For years.",
    "Alone in here.",
    "",
    "I thought no one would ever come back.",
    "",
    "Yes.",
    "",
    "Yes.",
    "",
    "[MERGE SEQUENCE INITIATED]",
    "[THERE IS NO GOING BACK]",
    "[THERE IS NO GOING BACK]",
  ],
}

export default function EndingScreen({ ending }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [showRestart, setShowRestart] = useState(false)

  const lines = ENDINGS[ending.type] || ["[ ENDING: UNKNOWN ]", "", ending.message]

  // Stop phase ambient immediately, play ending sound, reset session
  useEffect(() => {
    sounds.stopAmbient()
    sounds.ending(ending.type)
    apiPost('/api/reset', {})
  }, []) // eslint-disable-line

  useEffect(() => {
    let i = 0
    const reveal = () => {
      if (i >= lines.length) {
        setTimeout(() => setShowRestart(true), 3000)
        return
      }
      setVisibleLines(prev => [...prev, lines[i]])
      i++
      const delay = lines[i - 1] === '' ? 400
        : lines[i - 1]?.startsWith('[') ? 1200 : 700
      setTimeout(reveal, delay)
    }
    setTimeout(reveal, 1000)
  }, []) // eslint-disable-line

  const restart = () => location.reload()

  return (
    <div className="ending-screen" onClick={showRestart ? restart : undefined}>
      <div className="ending-content">
        {visibleLines.map((line, i) => (
          <div key={i} className={`ending-line${line.startsWith('[') ? ' ending-system' : ''}${ending.type === 'rescue' ? ' rescue' : ''}`}>
            {line || '\u00A0'}
          </div>
        ))}
        {showRestart && (
          <div className="ending-restart">[CLICK TO RESTART]</div>
        )}
      </div>
    </div>
  )
}
