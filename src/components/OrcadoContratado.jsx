import { useState } from 'react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0)

export default function OrcadoContratado({ obra, onUpdate, isAdmin }) {
  const { verbas, medicoes } = obra.montagem

  const montadorAvanco = medicoes.reduce(
    (s, m) => s + (m.valorBruto - m.descontos - m.retencao),
    0
  )

  const totalOrcado = verbas.reduce((s, v) => s + v.orcado, 0)
  const totalContratado = verbas.reduce((s, v) => s + v.contratado, 0)
  const totalAvanco = verbas.reduce(
    (s, v, i) => s + (i === 0 ? montadorAvanco : v.avancaFinanceiro),
    0
  )

  function updateVerba(id, field, raw) {
    const value = parseFloat(raw) || 0
    onUpdate(o => ({
      ...o,
      montagem: {
        ...o.montagem,
        verbas: o.montagem.verbas.map(v => (v.id === id ? { ...v, [field]: value } : v)),
      },
    }))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
            <th className="text-left px-5 py-3 font-medium">Item</th>
            <th className="text-right px-5 py-3 font-medium">Orçado</th>
            <th className="text-right px-5 py-3 font-medium">Contratado</th>
            <th className="text-right px-5 py-3 font-medium">Avanço Financeiro</th>
          </tr>
        </thead>
        <tbody>
          {verbas.map((verba, idx) => {
            const avanco = idx === 0 ? montadorAvanco : verba.avancaFinanceiro
            return (
              <tr key={verba.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-5 py-3.5 text-slate-700 font-medium">{verba.descricao}</td>
                <td className="px-5 py-3.5 text-right">
                  <EditCell
                    value={verba.orcado}
                    onChange={v => updateVerba(verba.id, 'orcado', v)}
                    isAdmin={isAdmin}
                  />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <EditCell
                    value={verba.contratado}
                    onChange={v => updateVerba(verba.id, 'contratado', v)}
                    isAdmin={isAdmin}
                  />
                </td>
                <td className="px-5 py-3.5 text-right">
                  {idx === 0 ? (
                    <span className="text-slate-600" title="Calculado automaticamente pelas medições">
                      {fmt(avanco)}
                    </span>
                  ) : (
                    <EditCell
                      value={avanco}
                      onChange={v => updateVerba(verba.id, 'avancaFinanceiro', v)}
                      isAdmin={isAdmin}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
            <td className="px-5 py-3.5">Total</td>
            <td className="px-5 py-3.5 text-right">{fmt(totalOrcado)}</td>
            <td className="px-5 py-3.5 text-right">{fmt(totalContratado)}</td>
            <td className="px-5 py-3.5 text-right">{fmt(totalAvanco)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function EditCell({ value, onChange, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState('')

  function start() {
    if (!isAdmin) return
    setTemp(String(value))
    setEditing(true)
  }

  function save() {
    onChange(temp)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        className="w-36 text-right text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        value={temp}
        onChange={e => setTemp(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save() }}
      />
    )
  }

  return isAdmin ? (
    <button
      onClick={start}
      className="text-slate-700 hover:text-blue-600 hover:underline tabular-nums"
    >
      {fmt(value)}
    </button>
  ) : (
    <span className="text-slate-700 tabular-nums">{fmt(value)}</span>
  )
}
