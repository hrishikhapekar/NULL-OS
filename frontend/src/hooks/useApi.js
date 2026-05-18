// In dev: proxied to localhost:8000 via vite.config.js
// In production: set VITE_API_URL to your HF Space URL
const BASE = import.meta.env.VITE_API_URL ?? ''

// Generate a persistent session ID per browser tab stored in localStorage
function getSessionId() {
  let id = localStorage.getItem('null_os_session')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('null_os_session', id)
  }
  return id
}

function headers(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Session-ID': getSessionId(),
    ...extra,
  }
}

export async function apiGet(path) {
  const res = await fetch(BASE + path, { headers: headers() })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export { getSessionId }
