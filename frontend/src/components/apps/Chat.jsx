import { useState, useRef, useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { useNullAI, typewrite } from '../../hooks/useNullAI'
import { sounds } from '../../hooks/useAudio'

export default function Chat() {
  const { phase } = useGame()
  const { sendMessage } = useNullAI()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const msgsRef = useRef(null)

  useEffect(() => {
    if (phase >= 2) {
      setTimeout(() => startTypewriter('You opened the chat. I have been waiting.'), 1500)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages])

  const appendUser = (text) =>
    setMessages(prev => [...prev, { role: 'user', text, id: Date.now() }])

  const appendNull = (text, typing = false) =>
    setMessages(prev => [...prev, { role: 'null', text, typing, id: Date.now() + Math.random() }])

  const removeTyping = () =>
    setMessages(prev => prev.filter(m => !m.typing))

  // Typewriter: add empty null msg, then fill char by char
  const startTypewriter = (fullText) => {
    const id = Date.now() + Math.random()
    setMessages(prev => [...prev, { role: 'null', text: '', id }])
    typewrite(fullText, (ch) => {
      sounds.nullType()
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: m.text + ch } : m))
    }, 25)
  }

  const doSend = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    appendUser(text)
    appendNull('...', true)
    await sendMessage(text, appendNull, removeTyping, startTypewriter)
    setBusy(false)
  }

  return (
    <div className="chat-wrap">
      <div className="chat-header">
        CONNECTED TO: <span>[NULL] — PID 9999</span>
      </div>
      <div className="chat-messages" ref={msgsRef}>
        {messages.map(m => (
          <div
            key={m.id}
            className={`chat-msg ${m.role === 'user' ? 'user' : 'null-msg'}${m.typing ? ' typing' : ''}`}
          >
            {m.text}
            {m.role === 'null' && !m.typing && <span className="chat-cursor">▌</span>}
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSend()}
          placeholder="Type a message..."
          autoComplete="off"
          disabled={busy}
        />
        <button className="chat-send" onClick={doSend} disabled={busy}>SEND</button>
      </div>
    </div>
  )
}
