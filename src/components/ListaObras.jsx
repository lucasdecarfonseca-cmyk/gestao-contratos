import { useState } from 'react'
import { ChevronRight, Plus, Pencil, Trash2, AlertTriangle, Download } from 'lucide-react'
import ModalNovaObra from './ModalNovaObra'
import ModalEditarObra from './ModalEditarObra'
import { exportarRelatorioGeral } from '../utils/exportarExcel'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0)

const pct = (v, d = 1) => `${(v ?? 0).toFixed(d)}%`

function calcStats(obra) {
  const { montagem } = obra
  const totalOrcado = montagem.verbas.reduce((s, v) => s + v.orcado, 0)
  const totalLiquidoMedido = montagem.medicoes.reduce(
    (s, m) => s + (m.valorBruto - m.descontos - m.retencao),
    0
  )
  const base = montagem.resumo.totalBrutoMontador || 0
  const afFinanceiro = base > 0 ? (totalLiquidoMedido / base) * 100 : 0
  const afFisico = montagem.avancaFisico ?? 0
  const diffPct = afFisico - afFinanceiro
  const diffValor = (afFisico / 100) * base - totalLiquidoMedido
  return { totalOrcado, totalLiquidoMedido, afFinanceiro, afFisico, diffPct, diffValor, base }
}

export default function ListaObras({ obras, onSelect, onUpdate, onAdd, onDelete }) {
  const [showNovaObra, setShowNovaObra] = useState(false)
  const [editingObra, setEditingObra] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const confirmDeleteObra = obras.find(o => o.id === confirmDeleteId)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-800">Obras</h1>
        <div className="flex items-center gap-2">
          {obras.length > 0 && (
            <button
              onClick={() => exportarRelatorioGeral(obras)}
              className="flex items-center gap-1.5 text-sm border border-slate-300 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar Relatório Geral
            </button>
          )}
          <button
            onClick={() => setShowNovaObra(true)}
            className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Obra
          </button>
        </div>
      </div>

      {obras.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-12">Nenhuma obra cadastrada.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {obras.map(obra => (
          <ObraCard
            key={obra.id}
            obra={obra}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onEdit={() => setEditingObra(obra)}
            onDelete={() => setConfirmDeleteId(obra.id)}
          />
        ))}
      </div>

      {/* Modal nova obra */}
      {showNovaObra && (
        <ModalNovaObra
          onAdd={(nova) => { onAdd(nova); setShowNovaObra(false) }}
          onClose={() => setShowNovaObra(false)}
        />
      )}

      {/* Modal editar obra */}
      {editingObra && (
        <ModalEditarObra
          obra={editingObra}
          onSave={(updater) => { onUpdate(editingObra.id, updater); setEditingObra(null) }}
          onClose={() => setEditingObra(null)}
        />
      )}

      {/* Confirmação de exclusão */}
      {confirmDeleteId && confirmDeleteObra && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Excluir obra</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tem certeza que deseja excluir{' '}
                  <span className="font-medium text-slate-700">"{confirmDeleteObra.nome}"</span>?
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null) }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ObraCard({ obra, onSelect, onUpdate, onEdit, onDelete }) {
  const stats = calcStats(obra)
  const [editingFisico, setEditingFisico] = useState(false)
  const [tempFisico, setTempFisico] = useState('')

  function startEdit(e) {
    e.stopPropagation()
    setTempFisico(String(obra.montagem.avancaFisico))
    setEditingFisico(true)
  }

  function saveFisico(e) {
    e?.stopPropagation?.()
    const val = Math.min(100, Math.max(0, parseFloat(tempFisico) || 0))
    onUpdate(obra.id, o => ({ ...o, montagem: { ...o.montagem, avancaFisico: val } }))
    setEditingFisico(false)
  }

  const diffPositive = stats.diffPct > 0
  const diffZero = Math.abs(stats.diffPct) < 0.05

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(obra.id)}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-4 border-b border-slate-100 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-800 text-sm leading-snug">{obra.nome}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{obra.local}</p>
        </div>
        {/* Action buttons + chevron */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onEdit}
            title="Editar obra"
            className="p-1.5 rounded-md text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Excluir obra"
            className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300 ml-0.5" />
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Orçado x Medido */}
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Total Orçado Montagem</p>
            <p className="font-semibold text-slate-700">{fmt(stats.totalOrcado)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Total Líquido Medido</p>
            <p className="font-semibold text-slate-700">{fmt(stats.totalLiquidoMedido)}</p>
          </div>
        </div>

        {/* AF Financeiro */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">AF Financeiro</span>
            <span className="font-semibold text-blue-600">{pct(stats.afFinanceiro)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, stats.afFinanceiro)}%` }}
            />
          </div>
        </div>

        {/* AF Físico */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">AF Físico</span>
            <span onClick={e => e.stopPropagation()}>
              {editingFisico ? (
                <input
                  autoFocus
                  className="w-16 text-xs border border-blue-300 rounded px-1 py-0.5 text-right focus:outline-none"
                  value={tempFisico}
                  onChange={e => setTempFisico(e.target.value)}
                  onBlur={saveFisico}
                  onKeyDown={e => { if (e.key === 'Enter') saveFisico(e) }}
                />
              ) : (
                <button
                  onClick={startEdit}
                  className="font-semibold text-emerald-600 hover:underline"
                  title="Clique para editar"
                >
                  {pct(stats.afFisico)}
                </button>
              )}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, stats.afFisico)}%` }}
            />
          </div>
        </div>

        {/* Comparativo */}
        {!diffZero && (
          <div
            className={`rounded-lg px-4 py-3 flex items-center justify-between ${
              diffPositive
                ? 'bg-amber-50 border border-amber-100'
                : 'bg-sky-50 border border-sky-100'
            }`}
          >
            <span className="text-xs text-slate-500">Físico vs Financeiro</span>
            <div className="text-right">
              <p className={`text-sm font-bold ${diffPositive ? 'text-amber-600' : 'text-sky-600'}`}>
                {diffPositive ? '+' : ''}{pct(stats.diffPct)}
              </p>
              <p className={`text-xs ${diffPositive ? 'text-amber-400' : 'text-sky-400'}`}>
                {stats.diffValor >= 0 ? '+' : ''}{fmt(stats.diffValor)}
              </p>
            </div>
          </div>
        )}
        {diffZero && (
          <div className="rounded-lg px-4 py-3 bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Físico vs Financeiro</span>
            <span className="text-xs font-semibold text-emerald-600">Alinhados</span>
          </div>
        )}
      </div>
    </div>
  )
}
