import { useState } from 'react'
import { X } from 'lucide-react'

function emptyObra(id, nome, local) {
  return {
    id,
    nome,
    local,
    status: 'Em andamento',
    montagem: {
      avancaFisico: 0,
      resumo: {
        empresaMontador: '',
        empresaPreMontagem: '',
        totalBrutoMontador: 0,
        totalRetencao: 0,
        totalPreMontagem: 0,
      },
      verbas: [
        { id: 1, descricao: 'Montador', orcado: 0, contratado: 0, avancaFinanceiro: 0 },
        { id: 2, descricao: 'Guindaste / Perfilação', orcado: 0, contratado: 0, avancaFinanceiro: 0 },
        { id: 3, descricao: 'Despesas Indiretas (DI)', orcado: 0, contratado: 0, avancaFinanceiro: 0 },
      ],
      medicoes: [],
    },
  }
}

export default function ModalNovaObra({ onAdd, onClose }) {
  const [nome, setNome] = useState('')
  const [local, setLocal] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!nome.trim()) return
    onAdd(emptyObra(crypto.randomUUID(), nome.trim(), local.trim()))
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">Nova Obra</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Nome da Obra *</label>
            <input
              className="FormInput"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Galpão Industrial Zona Norte"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Local</label>
            <input
              className="FormInput"
              value={local}
              onChange={e => setLocal(e.target.value)}
              placeholder="Ex: São Paulo — SP"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Criar Obra
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
