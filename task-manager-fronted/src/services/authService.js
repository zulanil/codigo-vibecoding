const BASE = 'http://localhost:3000/user'

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`)
  return data
}

export const authService = {
  login: (email, password) => post(`${BASE}/login`, { email, password }),
  register: (name, lastname, email, password) =>
    post(`${BASE}/register`, { name, lastname, email, password }),
}
