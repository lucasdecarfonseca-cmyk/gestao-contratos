import { Plus, Trash2 } from 'lucide-react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const statusStyle = {
  pago: 'bg-green-100 text-green-700',
  pendente: 'bg-orange-100 text-orange-700',
}

export default function MedicoesMontagem({ montagem, onChange }) {
  const verbas = montagem?.verbas ?? []
  const medicoes = montagem?.medicoes ?? []

  const updateVerba = (id, field, raw) => {
    const updated = verbas.map((v) => (v.id !== id ? v : { ...v, [field]: Number(raw) }))
    onChange({ ...montagem, verbas: updated })
  }

  const updateMedicao = (id, field, value) => {
    const updated = medicoes.map((m) => (m.id !== id ? m : { ...m, [field]: value }))
    onChange({ ...montagem, medicoes: updated })
  }

  const addMedicao = () => {
    const nova = {
      id: Date.now(),
      numero: String(medicoes.length + 1).padStart(2, '0'),
      periodoInicio: '',
      periodoFim: '',
      dataMedicao: new Date().toISOString().slice(0, 10),
      valor: 0,
      status: 'pendente',
    }
    onChange({ ...montagem, medicoes: [...medicoes, nova] })
  }

  const removeMedicao = (id) =>
    onChange({ ...montagem, medicoes: medicoes.filter((m) => m.id !== id) })

  // Verbas totals
  const totOrcado = verbas.reduce((s, v) => s + v.valorOrcado, 0)
  const totContrato = verbas.reduce((s, v) => s + v.valorContrato, 0)
  const totRealizado = verbas.reduce((s, v) => s + v.realizado, 0)
  const totSaldo = totContrato - totRealizado
  const totPct = totContrato > 0 ? Math.min(100, (totRealizado / totContrato) * 100) : 0

  const totalMedicoes = medicoes.reduce((s, m) => s + Number(m.valor), 0)

  return (
    <div className="space-y-6">
      {/* Tabela de Verbas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-800 mb-5">Tabela de Verbas — Orçado x Realizado</h2>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100">
                {['Descrição', 'Valor Orçado', 'Valor Contrato Montadora', 'Realizado (pago)', 'Saldo', '% Executado'].map((h) => (
                  <th key={h} className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 whitespace-nowrap last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {verbas.map((v) => {
                const saldo = v.valorContrato - v.realizado
                const pct = v.valorContrato > 0 ? Math.min(100, (v.realizado / v.valorContrato) * 100) : 0
                return (
                  <tr key={v.id}>
                    <td className="py-3 pr-4 font-medium text-slate-800 whitespace-nowrap">{v.descricao}</td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        className="EditInput text-right w-32"
                        value={v.valorOrcado}
                        onChange={(e) => updateVerba(v.id, 'valorOrcado', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        className="EditInput text-right w-32"
                        value={v.valorContrato}
                        onChange={(e) => updateVerba(v.id, 'valorContrato', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        className="EditInput text-right w-32"
                        value={v.realizado}
                        onChange={(e) => updateVerba(v.id, 'realizado', e.target.value)}
                      />
                    </td>
                    <td className={`py-3 pr-4 font-semibold text-sm ${saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {fmt(saldo)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 w-9 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="py-3 pr-4 text-xs font-bold text-slate-700">Total</td>
                <td className="py-3 pr-4 text-sm font-bold text-slate-800">{fmt(totOrcado)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-slate-800">{fmt(totContrato)}</td>
                <td className="py-3 pr-4 text-sm font-bold text-blue-700">{fmt(totRealizado)}</td>
                <td className={`py-3 pr-4 text-sm font-bold ${totSaldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(totSaldo)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${totPct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-9 text-right">{totPct.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tabela de Medições */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800">Medições</h2>
          <button
            onClick={addMedicao}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Nova Medição
          </button>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                {['Nº', 'Período — Início', 'Período — Fim', 'Data da Medição', 'Valor', 'Status', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 whitespace-nowrap last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {medicoes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    Nenhuma medição registrada. Clique em "Nova Medição" para adicionar.
                  </td>
                </tr>
              )}
              {medicoes.map((m) => (
                <tr key={m.id} className="group">
                  <td className="py-2 pr-4">
                    <input
                      className="EditInput w-14 text-center"
                      value={m.numero}
                      onChange={(e) => updateMedicao(m.id, 'numero', e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="date"
                      className="EditInput"
                      value={m.periodoInicio}
                      onChange={(e) => updateMedicao(m.id, 'periodoInicio', e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="date"
                      className="EditInput"
                      value={m.periodoFim}
                      onChange={(e) => updateMedicao(m.id, 'periodoFim', e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="date"
                      className="EditInput"
                      value={m.dataMedicao}
                      onChange={(e) => updateMedicao(m.id, 'dataMedicao', e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      className="EditInput text-right w-32"
                      value={m.valor}
                      onChange={(e) => updateMedicao(m.id, 'valor', Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                      value={m.status}
                      onChange={(e) => updateMedicao(m.id, 'status', e.target.value)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                    </select>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeMedicao(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {medicoes.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={4} className="py-3 pr-4 text-xs font-bold text-slate-600">
                    Total ({medicoes.length} {medicoes.length === 1 ? 'medição' : 'medições'})
                  </td>
                  <td className="py-3 pr-4 text-sm font-bold text-blue-700">{fmt(totalMedicoes)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
