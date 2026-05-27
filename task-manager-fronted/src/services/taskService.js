const BASE_URL = 'http://localhost:3000/task'

function getAuthHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    ...options,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}

export const taskService = {
  getAll: () => request(BASE_URL),
  getById: (id) => request(`${BASE_URL}/${id}`),
  create: (data) => request(BASE_URL, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`${BASE_URL}/${id}`, { method: 'DELETE' }),
}
