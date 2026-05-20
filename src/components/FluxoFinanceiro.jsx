import { useState } from 'react'
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(Math.abs(v))

const fmtDate = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const emptyItem = () => ({
  id: Date.now(),
  data: new Date().toISOString().slice(0, 10),
  documento: '',
  valor: 0,
  descricao: '',
  tipo: 'entrada',
})

export default function FluxoFinanceiro({ fluxo, onChange }) {
  const [editando, setEditando] = useState(null)

  const sorted = [...fluxo].sort((a, b) => a.data.localeCompare(b.data))

  const totalEntradas = sorted.filter((f) => f.tipo === 'entrada').reduce((s, f) => s + Math.abs(f.valor), 0)
  const totalSaidas = sorted.filter((f) => f.tipo === 'saida').reduce((s, f) => s + Math.abs(f.valor), 0)
  const saldo = totalEntradas - totalSaidas

  const addLinha = () => {
    const nova = emptyItem()
    onChange([...fluxo, nova])
    setEditando(nova.id)
  }

  const updateField = (id, field, value) => {
    onChange(fluxo.map((f) => (f.id !== id ? f : { ...f, [field]: value })))
  }

  const removeLinha = (id) => onChange(fluxo.filter((f) => f.id !== id))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-800">Fluxo Financeiro</h2>
        <button
          onClick={addLinha}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Chip color="green" label="Entradas" value={fmt(totalEntradas)} />
        <Chip color="red" label="Saídas" value={fmt(totalSaidas)} />
        <Chip color={saldo >= 0 ? 'blue' : 'orange'} label="Saldo" value={`${saldo >= 0 ? '+' : '-'}${fmt(saldo)}`} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100">
              {['Data', 'Documento', 'Descrição', 'Valor', ''].map((h) => (
                <th key={h} className={`text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 whitespace-nowrap ${h === 'Valor' ? 'text-right' : ''} last:pr-0`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                  Nenhum lançamento registrado.
                </td>
              </tr>
            )}
            {sorted.map((item) => (
              editando === item.id
                ? <EditRow key={item.id} item={item} onUpdate={(f, v) => updateField(item.id, f, v)} onBlur={() => setEditando(null)} onRemove={() => removeLinha(item.id)} />
                : <ViewRow key={item.id} item={item} onClick={() => setEditando(item.id)} onRemove={() => removeLinha(item.id)} />
            ))}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="py-3 text-xs font-bold text-slate-600">
                  Saldo acumulado
                </td>
                <td className={`py-3 pr-4 text-sm font-bold text-right ${saldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  {saldo >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function ViewRow({ item, onClick, onRemove }) {
  const isEntrada = item.tipo === 'entrada'
  const valorDisplay = isEntrada ? item.valor : item.valor

  return (
    <tr className="hover:bg-slate-50 group cursor-pointer" onClick={onClick}>
      <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{fmtDate(item.data)}</td>
      <td className="py-3 pr-4 text-slate-600 font-mono text-xs whitespace-nowrap">{item.documento}</td>
      <td className="py-3 pr-4 text-slate-700 max-w-xs truncate">{item.descricao}</td>
      <td className="py-3 pr-4">
        <div className={`flex items-center justify-end gap-1.5 font-semibold ${isEntrada ? 'text-emerald-600' : 'text-red-500'}`}>
          {isEntrada
            ? <ArrowUpCircle size={14} />
            : <ArrowDownCircle size={14} />}
          {isEntrada ? '+' : '-'}{fmt(valorDisplay)}
        </div>
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

function EditRow({ item, onUpdate, onBlur, onRemove }) {
  return (
    <tr className="bg-blue-50/40" onBlur={onBlur}>
      <td className="py-2 pr-3">
        <input
          type="date"
          className="EditInput"
          value={item.data}
          onChange={(e) => onUpdate('data', e.target.value)}
        />
      </td>
      <td className="py-2 pr-3">
        <input className="EditInput font-mono" value={item.documento} onChange={(e) => onUpdate('documento', e.target.value)} placeholder="Documento" />
      </td>
      <td className="py-2 pr-3">
        <input className="EditInput w-full" value={item.descricao} onChange={(e) => onUpdate('descricao', e.target.value)} placeholder="Descrição" />
      </td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-2 justify-end">
          <select
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
            value={item.tipo}
            onChange={(e) => onUpdate('tipo', e.target.value)}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <input
            className="EditInput text-right w-28"
            type="number"
            value={Math.abs(item.valor)}
            onChange={(e) => onUpdate('valor', item.tipo === 'saida' ? -Math.abs(Number(e.target.value)) : Math.abs(Number(e.target.value)))}
          />
        </div>
      </td>
      <td className="py-2">
        <button onClick={onRemove} className="text-slate-300 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

function Chip({ color, label, value }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return (
    <div className={`border rounded-xl px-4 py-2 text-xs ${styles[color]}`}>
      <span className="font-medium">{label}:</span>
      <span className="ml-1.5 font-bold">{value}</span>
    </div>
  )
}
