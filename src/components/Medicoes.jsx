import { useState } from 'react'
import { Plus } from 'lucide-react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0)

const fmtDate = (s) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

const pct = (v) => `${(v ?? 0).toFixed(1)}%`

export default function Medicoes({ obra, onUpdate }) {
  const { resumo, medicoes } = obra.montagem
  const [medicaoAtiva, setMedicaoAtiva] = useState(medicoes[0]?.id ?? null)

  const totalBrutoMedido = medicoes.reduce((s, m) => s + m.valorBruto, 0)
  const totalDescontos = medicoes.reduce((s, m) => s + m.descontos, 0)
  const totalRetido = medicoes.reduce((s, m) => s + m.retencao, 0)
  const totalLiquidoMedido = totalBrutoMedido - totalDescontos - totalRetido
  const totalFaturado = medicoes.reduce((s, m) => s + m.valorFaturado, 0)
  const totalLiquidoMontador =
    resumo.totalBrutoMontador - resumo.totalRetencao - resumo.totalPreMontagem
  const afFinanceiro =
    resumo.totalBrutoMontador > 0
      ? (totalLiquidoMedido / resumo.totalBrutoMontador) * 100
      : 0

  function updateResumo(field, raw) {
    const isText = field.startsWith('empresa')
    const value = isText ? raw : parseFloat(raw) || 0
    onUpdate(o => ({
      ...o,
      montagem: {
        ...o.montagem,
        resumo: { ...o.montagem.resumo, [field]: value },
      },
    }))
  }

  function updateMedicao(id, field, raw) {
    const isText = field.includes('periodo')
    const value = isText ? raw : parseFloat(raw) || 0
    onUpdate(o => ({
      ...o,
      montagem: {
        ...o.montagem,
        medicoes: o.montagem.medicoes.map(m =>
          m.id === id ? { ...m, [field]: value } : m
        ),
      },
    }))
  }

  function addMedicao() {
    const newId = crypto.randomUUID()
    const nextNum = String(medicoes.length + 1).padStart(2, '0')
    const nova = {
      id: newId,
      numero: nextNum,
      periodoInicio: '',
      periodoFim: '',
      valorBruto: 0,
      descontos: 0,
      retencao: 0,
      valorFaturado: 0,
    }
    onUpdate(o => ({
      ...o,
      montagem: { ...o.montagem, medicoes: [...o.montagem.medicoes, nova] },
    }))
    setMedicaoAtiva(newId)
  }

  const medicaoAtual = medicoes.find(m => m.id === medicaoAtiva)

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Resumo do Contrato de Montagem
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <ResumoField
            label="Empresa Montador Contratado"
            value={resumo.empresaMontador}
            onChange={v => updateResumo('empresaMontador', v)}
            type="text"
          />
          <ResumoField
            label="Empresa Pré-montagem"
            value={resumo.empresaPreMontagem}
            onChange={v => updateResumo('empresaPreMontagem', v)}
            type="text"
            optional
          />
          <div className="md:col-start-1">
            <ResumoField
              label="Total Bruto Valor Montador"
              value={resumo.totalBrutoMontador}
              onChange={v => updateResumo('totalBrutoMontador', v)}
            />
          </div>
          <ResumoField
            label="Total Retenção"
            value={resumo.totalRetencao}
            onChange={v => updateResumo('totalRetencao', v)}
            optional
          />
          <ResumoField
            label="Total Pré-montagem Medajoists"
            value={resumo.totalPreMontagem}
            onChange={v => updateResumo('totalPreMontagem', v)}
            optional
          />
          <ResumoField
            label="Total Líquido Montador"
            value={totalLiquidoMontador}
            readOnly
            highlight
          />
        </div>

        <div className="border-t border-slate-100 my-4" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <ResumoField label="Total Bruto Medido" value={totalBrutoMedido} readOnly />
          <ResumoField label="Total Descontos" value={totalDescontos} readOnly />
          <ResumoField label="Total Retido" value={totalRetido} readOnly />
          <ResumoField label="Total Líquido Medido" value={totalLiquidoMedido} readOnly highlight />
          <ResumoField label="Total Faturado" value={totalFaturado} readOnly />
          <div>
            <p className="text-xs text-slate-400 mb-1">AF Financeiro %</p>
            <p className="text-2xl font-bold text-blue-600">{pct(afFinanceiro)}</p>
          </div>
        </div>
      </div>

      {/* Abas de medições */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-0.5 px-4 pt-3 border-b border-slate-200 overflow-x-auto">
          {medicoes.map(m => (
            <button
              key={m.id}
              onClick={() => setMedicaoAtiva(m.id)}
              className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t whitespace-nowrap transition-colors ${
                m.id === medicaoAtiva
                  ? 'bg-white border-slate-200 text-blue-600 shadow-[0_1px_0_white] -mb-px'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              Medição {m.numero}
            </button>
          ))}
          <button
            onClick={addMedicao}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-blue-600 transition-colors ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Medição
          </button>
        </div>

        {medicaoAtual ? (
          <div className="p-5">
            <MedicaoForm
              medicao={medicaoAtual}
              onUpdate={(field, value) => updateMedicao(medicaoAtual.id, field, value)}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            Nenhuma medição. Clique em &quot;+ Nova Medição&quot; para começar.
          </div>
        )}
      </div>
    </div>
  )
}

function ResumoField({ label, value, onChange, readOnly, optional, highlight, type = 'number' }) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState('')

  function start() {
    if (readOnly) return
    setTemp(type === 'number' ? String(value) : (value ?? ''))
    setEditing(true)
  }

  function save() {
    onChange?.(temp)
    setEditing(false)
  }

  const displayValue =
    type === 'number'
      ? fmt(value)
      : value || <span className="text-slate-300">—</span>

  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">
        {label}
        {optional && <span className="text-slate-300 ml-1">(opcional)</span>}
        {readOnly && <span className="text-slate-300 ml-1">calculado</span>}
      </p>
      {editing ? (
        <input
          autoFocus
          className="text-sm border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
          value={temp}
          onChange={e => setTemp(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save() }}
        />
      ) : readOnly ? (
        <p className={`text-sm font-semibold ${highlight ? 'text-blue-700 text-base' : 'text-slate-600'}`}>
          {displayValue}
        </p>
      ) : (
        <button
          onClick={start}
          className="text-sm font-medium text-slate-700 hover:text-blue-600 hover:underline text-left"
        >
          {displayValue}
        </button>
      )}
    </div>
  )
}

function MedicaoForm({ medicao, onUpdate }) {
  const liquidoMedido = medicao.valorBruto - medicao.descontos - medicao.retencao

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
      <FormField
        label="Período — Início"
        value={medicao.periodoInicio}
        onChange={v => onUpdate('periodoInicio', v)}
        type="date"
      />
      <FormField
        label="Período — Fim"
        value={medicao.periodoFim}
        onChange={v => onUpdate('periodoFim', v)}
        type="date"
      />
      <div />

      <FormField
        label="Valor Bruto"
        value={medicao.valorBruto}
        onChange={v => onUpdate('valorBruto', v)}
      />
      <FormField
        label="Descontos"
        value={medicao.descontos}
        onChange={v => onUpdate('descontos', v)}
      />
      <FormField
        label="Retenção"
        value={medicao.retencao}
        onChange={v => onUpdate('retencao', v)}
      />

      <div>
        <p className="text-xs text-slate-400 mb-1">Valor Líquido Medido <span className="text-slate-300">calculado</span></p>
        <p className="text-sm font-semibold text-blue-700">{fmt(liquidoMedido)}</p>
      </div>

      <FormField
        label="Valor Faturado"
        value={medicao.valorFaturado}
        onChange={v => onUpdate('valorFaturado', v)}
      />
    </div>
  )
}

function FormField({ label, value, onChange, type = 'number' }) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState('')

  function start() {
    setTemp(String(value ?? ''))
    setEditing(true)
  }

  function save() {
    onChange(temp)
    setEditing(false)
  }

  const displayValue =
    type === 'date'
      ? fmtDate(value)
      : fmt(parseFloat(value) || 0)

  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {editing ? (
        <input
          autoFocus
          type={type === 'date' ? 'date' : 'text'}
          className="text-sm border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
          value={temp}
          onChange={e => setTemp(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save() }}
        />
      ) : (
        <button
          onClick={start}
          className="text-sm font-medium text-slate-700 hover:text-blue-600 hover:underline text-left"
        >
          {displayValue}
        </button>
      )}
    </div>
  )
}
