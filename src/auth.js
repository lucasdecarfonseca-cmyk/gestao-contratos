const USERS = [
  { username: 'coordenaçãolf', password: 'LF@2025', role: 'admin' },
  { username: 'usuario01', password: 'Usu@2025', role: 'viewer' },
]

const SESSION_KEY = 'medabil_session'

export function login(username, password) {
  return USERS.find(u => u.username === username && u.password === password) ?? null
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, role: user.role }))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
