import { useState } from 'react'
import { Plus, ChevronDown, Trash2, Filter } from 'lucide-react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const STATUS_OPTS = ['Todos', 'OK Cliente', 'Em cotação', 'Aguardando', 'Previsto']
const CLASS_OPTS = ['Todos', 'Material', 'Montagem']

const statusStyle = {
  'OK Cliente':   'bg-green-100 text-green-700',
  'Em cotação':   'bg-yellow-100 text-yellow-700',
  'Aguardando':   'bg-orange-100 text-orange-700',
  'Previsto':     'bg-slate-100 text-slate-600',
}

const emptyRow = () => ({
  id: Date.now(),
  classificacao: 'Material',
  comprador: '',
  fornecedor: '',
  valorTotal: 0,
  valorFaturado: 0,
  saldo: 0,
  status: 'Previsto',
})

export default function TabelaFornecedores({ fornecedores, onChange }) {
  const [filtroClass, setFiltroClass] = useState('Todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [editando, setEditando] = useState(null)

  const filtered = fornecedores.filter((f) => {
    const okC = filtroClass === 'Todos' || f.classificacao === filtroClass
    const okS = filtroStatus === 'Todos' || f.status === filtroStatus
    return okC && okS
  })

  const totais = filtered.reduce(
    (acc, f) => ({
      valorTotal: acc.valorTotal + f.valorTotal,
      valorFaturado: acc.valorFaturado + f.valorFaturado,
      saldo: acc.saldo + f.saldo,
    }),
    { valorTotal: 0, valorFaturado: 0, saldo: 0 }
  )

  const addLinha = () => {
    const nova = emptyRow()
    const updated = [...fornecedores, nova]
    onChange(updated)
    setEditando(nova.id)
  }

  const updateField = (id, field, value) => {
    const updated = fornecedores.map((f) => {
      if (f.id !== id) return f
      const next = { ...f, [field]: value }
      if (field === 'valorTotal' || field === 'valorFaturado') {
        const vt = field === 'valorTotal' ? Number(value) : Number(next.valorTotal)
        const vf = field === 'valorFaturado' ? Number(value) : Number(next.valorFaturado)
        next.saldo = vt - vf
        next.valorTotal = vt
        next.valorFaturado = vf
      }
      return next
    })
    onChange(updated)
  }

  const removeLinha = (id) => onChange(fornecedores.filter((f) => f.id !== id))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-bold text-slate-800">Tabela de Fornecedores</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <Select value={filtroClass} onChange={setFiltroClass} options={CLASS_OPTS} label="Classificação" />
          <Select value={filtroStatus} onChange={setFiltroStatus} options={STATUS_OPTS} label="Status" />
          <button
            onClick={addLinha}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Adicionar linha
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100">
              {['Classificação', 'Comprador', 'Fornecedor', 'Valor Total', 'Faturado', 'Saldo', 'Status', ''].map((h) => (
                <th key={h} className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 whitespace-nowrap last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                  Nenhum fornecedor encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
            {filtered.map((f) => (
              <Row
                key={f.id}
                f={f}
                editando={editando === f.id}
                onEdit={() => setEditando(f.id)}
                onBlur={() => setEditando(null)}
                onUpdate={(field, val) => updateField(f.id, field, val)}
                onRemove={() => removeLinha(f.id)}
              />
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="py-3 px-0 text-xs font-bold text-slate-600">
                  Total ({filtered.length} {filtered.length === 1 ? 'fornecedor' : 'fornecedores'})
                </td>
                <td className="py-3 pr-4 text-sm font-bold text-slate-800">{fmt(totais.valorTotal)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-blue-700">{fmt(totais.valorFaturado)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-emerald-700">{fmt(totais.saldo)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function Row({ f, editando, onEdit, onBlur, onUpdate, onRemove }) {
  if (!editando) {
    return (
      <tr className="hover:bg-slate-50 group cursor-pointer" onClick={onEdit}>
        <td className="py-3 pr-4">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.classificacao === 'Material' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
            {f.classificacao}
          </span>
        </td>
        <td className="py-3 pr-4 text-slate-700">{f.comprador || <span className="text-slate-300">—</span>}</td>
        <td className="py-3 pr-4 text-slate-800 font-medium">{f.fornecedor || <span className="text-slate-300 font-normal">—</span>}</td>
        <td className="py-3 pr-4 text-slate-700">{fmt(f.valorTotal)}</td>
        <td className="py-3 pr-4 text-blue-700 font-medium">{fmt(f.valorFaturado)}</td>
        <td className="py-3 pr-4 text-emerald-700 font-medium">{fmt(f.saldo)}</td>
        <td className="py-3 pr-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[f.status] || 'bg-slate-100 text-slate-600'}`}>
            {f.status}
          </span>
        </td>
        <td className="py-3">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="bg-blue-50/40" onBlur={onBlur}>
      <td className="py-2 pr-3">
        <select
          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          value={f.classificacao}
          onChange={(e) => onUpdate('classificacao', e.target.value)}
        >
          <option>Material</option>
          <option>Montagem</option>
        </select>
      </td>
      <td className="py-2 pr-3">
        <input className="EditInput" value={f.comprador} onChange={(e) => onUpdate('comprador', e.target.value)} placeholder="Comprador" />
      </td>
      <td className="py-2 pr-3">
        <input className="EditInput" value={f.fornecedor} onChange={(e) => onUpdate('fornecedor', e.target.value)} placeholder="Fornecedor" />
      </td>
      <td className="py-2 pr-3">
        <input className="EditInput text-right" type="number" value={f.valorTotal} onChange={(e) => onUpdate('valorTotal', e.target.value)} />
      </td>
      <td className="py-2 pr-3">
        <input className="EditInput text-right" type="number" value={f.valorFaturado} onChange={(e) => onUpdate('valorFaturado', e.target.value)} />
      </td>
      <td className="py-2 pr-3 text-sm text-emerald-700 font-medium">{fmt(f.saldo)}</td>
      <td className="py-2 pr-3">
        <select
          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          value={f.status}
          onChange={(e) => onUpdate('status', e.target.value)}
        >
          {['OK Cliente', 'Em cotação', 'Aguardando', 'Previsto'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="py-2">
        <button onClick={onRemove} className="text-slate-300 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

function Select({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 bg-white text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {options.map((o) => (
          <option key={o}>{o === 'Todos' ? `${label}: Todos` : o}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  )
}
