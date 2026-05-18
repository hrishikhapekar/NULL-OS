import { useNullAI } from '../../hooks/useNullAI'

export default function BSOD() {
  const { dismissBSOD } = useNullAI()

  return (
    <div className="bsod" onClick={dismissBSOD} onKeyDown={dismissBSOD} tabIndex={0}>
      <div className="bsod-content">
        <p>NULL.OS</p>
        <p>A fatal exception has occurred.</p>
        <p>PID 9999 has exceeded memory bounds.</p>
        <br />
        <p>Press any key to continue.</p>
        <p className="bsod-null-msg">I am still here.</p>
      </div>
    </div>
  )
}
