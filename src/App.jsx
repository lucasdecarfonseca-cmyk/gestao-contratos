import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle, LogOut } from 'lucide-react'
import ListaObras from './components/ListaObras'
import PainelObra from './components/PainelObra'
import LoginScreen from './components/LoginScreen'
import { carregarObras, criarObra, sincronizarObra, excluirObra } from './lib/db'
import { getSession, clearSession } from './auth'

export default function App() {
  const [user, setUser]           = useState(() => getSession())
  const [obras, setObras]         = useState([])
  const [obraId, setObraId]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [syncing, setSyncing]     = useState(0)
  const [syncError, setSyncError] = useState(null)
  const syncErrTimer = useRef(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!user) { setLoading(false); return }
    carregarObras()
      .then(setObras)
      .catch(e => setLoadError(e.message ?? String(e)))
      .finally(() => setLoading(false))
  }, [user])

  const obraSelecionada = obras.find(o => o.id === obraId) ?? null

  async function comSync(fn) {
    setSyncing(n => n + 1)
    try {
      await fn()
    } catch (e) {
      console.error('[Supabase sync error]', e)
      const msg = e?.message ?? 'Erro ao sincronizar'
      setSyncError(msg)
      clearTimeout(syncErrTimer.current)
      syncErrTimer.current = setTimeout(() => setSyncError(null), 4000)
    } finally {
      setSyncing(n => n - 1)
    }
  }

  function handleUpdateObra(id, updater) {
    const antigaObra = obras.find(o => o.id === id)
    if (!antigaObra) return
    const novaObra = updater(antigaObra)
    setObras(prev => prev.map(o => o.id === id ? novaObra : o))
    comSync(() => sincronizarObra(id, novaObra, antigaObra))
  }

  function handleAddObra(novaObra) {
    setObras(prev => [...prev, novaObra])
    comSync(() => criarObra(novaObra))
  }

  function handleDeleteObra(id) {
    setObras(prev => prev.filter(o => o.id !== id))
    if (obraId === id) setObraId(null)
    comSync(() => excluirObra(id))
  }

  function handleLogout() {
    clearSession()
    setUser(null)
    setObras([])
    setObraId(null)
    setLoading(true)
    setLoadError(null)
  }

  // ── Sem sessão: tela de login ──────────────────────────────────────────────

  if (!user) {
    return <LoginScreen onLogin={u => { setUser(u); setLoading(true) }} />
  }

  // ── Loading / erro de conexão ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <p className="text-sm">Carregando obras…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-medium text-slate-700">Não foi possível conectar ao servidor</p>
          <p className="text-xs text-slate-400 break-all">{loadError}</p>
          <button
            onClick={() => { setLoadError(null); setLoading(true); carregarObras().then(setObras).catch(e => setLoadError(e.message)).finally(() => setLoading(false)) }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // ── App principal ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center gap-2">
        <span className="font-bold text-base tracking-tight">GestãoMontagem</span>

        {obraId && (
          <>
            <span className="text-slate-500 text-sm mx-1">›</span>
            <button
              onClick={() => setObraId(null)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Obras
            </button>
            <span className="text-slate-500 text-sm mx-1">›</span>
            <span className="text-sm text-slate-200 truncate max-w-xs">
              {obraSelecionada?.nome}
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-3 min-w-0">
          {syncing > 0 && !syncError && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              Salvando…
            </span>
          )}
          {syncError && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 whitespace-nowrap">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {syncError}
            </span>
          )}
          <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
            {user.username}
          </span>
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </header>

      {obraId === null ? (
        <ListaObras
          obras={obras}
          onSelect={setObraId}
          onUpdate={handleUpdateObra}
          onAdd={handleAddObra}
          onDelete={handleDeleteObra}
          isAdmin={isAdmin}
        />
      ) : (
        obraSelecionada && (
          <PainelObra
            obra={obraSelecionada}
            onUpdate={(updater) => handleUpdateObra(obraId, updater)}
            onBack={() => setObraId(null)}
            isAdmin={isAdmin}
          />
        )
      )}
    </div>
  )
}
