import { useState } from 'react'
import { login, saveSession } from '../auth'

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const user = login(username.trim(), password)

    setTimeout(() => {
      setLoading(false)
      if (user) {
        saveSession(user)
        onLogin(user)
      } else {
        setError('Usuário ou senha incorretos.')
      }
    }, 300)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#1A4A6B' }}
    >
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="6" height="16" rx="1" fill="white" opacity="0.9" />
              <rect x="13" y="4" width="6" height="24" rx="1" fill="white" />
              <rect x="22" y="8" width="6" height="16" rx="1" fill="white" opacity="0.9" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MEDABIL</h1>
          <p className="text-sm text-white/60 mt-1 tracking-wide">Sistemas Construtivos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl px-8 py-8">
          <h2 className="text-base font-semibold text-slate-700 mb-6 text-center">
            Acesso ao Sistema
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Usuário
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent placeholder-slate-300"
                style={{ '--tw-ring-color': '#1A4A6B' }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #1A4A6B33'}
                onBlur={e => e.target.style.boxShadow = ''}
                placeholder="Nome de usuário"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none placeholder-slate-300"
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #1A4A6B33'}
                onBlur={e => e.target.style.boxShadow = ''}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center pt-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity mt-2 disabled:opacity-70"
              style={{ backgroundColor: '#1A4A6B' }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          GestãoMontagem © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
