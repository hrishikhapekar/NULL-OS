// In dev: proxied to localhost:8000 via vite.config.js
// In production: set VITE_API_URL to your HF Space URL
const BASE = import.meta.env.VITE_API_URL ?? ''

export async function apiGet(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}
