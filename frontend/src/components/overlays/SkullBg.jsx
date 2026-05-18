import { useGame } from '../../context/GameContext'

export default function SkullBg() {
  const { phase } = useGame()

  const colors = { 1: '#4dff91', 2: '#ffb347', 3: '#ff4d4d', 4: '#ff4d4d' }
  const c = colors[phase] || '#4dff91'

  return (
    <svg
      className={`skull-bg phase-${phase}`}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill={c}
    >
      {/* Cranium */}
      <ellipse cx="50" cy="42" rx="32" ry="30" />
      {/* Jaw */}
      <rect x="26" y="64" width="48" height="18" rx="4" />
      {/* Jaw teeth gaps */}
      <rect x="33" y="68" width="8" height="14" rx="2" fill="#0d0d0d" />
      <rect x="46" y="68" width="8" height="14" rx="2" fill="#0d0d0d" />
      <rect x="59" y="68" width="8" height="14" rx="2" fill="#0d0d0d" />
      {/* Left eye */}
      <ellipse cx="37" cy="42" rx="9" ry="10" fill="#0d0d0d" />
      {/* Right eye */}
      <ellipse cx="63" cy="42" rx="9" ry="10" fill="#0d0d0d" />
      {/* Nose */}
      <path d="M46 54 L50 48 L54 54 Z" fill="#0d0d0d" />
    </svg>
  )
}
