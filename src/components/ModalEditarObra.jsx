import { useState } from 'react'
import { X } from 'lucide-react'

const STATUS_OPTIONS = ['Em andamento', 'A iniciar', 'Pausada', 'Concluída']

export default function ModalEditarObra({ obra, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: obra.nome,
    local: obra.local ?? '',
    status: obra.status ?? 'Em andamento',
    avancaFisico: obra.montagem.avancaFisico,
    empresaMontador: obra.montagem.resumo.empresaMontador,
    empresaPreMontagem: obra.montagem.resumo.empresaPreMontagem,
    totalBrutoMontador: obra.montagem.resumo.totalBrutoMontador,
    totalRetencao: obra.montagem.resumo.totalRetencao,
    totalPreMontagem: obra.montagem.resumo.totalPreMontagem,
    verbas: obra.montagem.verbas.map(v => ({ ...v })),
  })

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setVerba(id, field, raw) {
    setForm(prev => ({
      ...prev,
      verbas: prev.verbas.map(v =>
        v.id === id ? { ...v, [field]: parseFloat(raw) || 0 } : v
      ),
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) return
    onSave(o => ({
      ...o,
      nome: form.nome.trim(),
      local: form.local.trim(),
      status: form.status,
      montagem: {
        ...o.montagem,
        avancaFisico: Math.min(100, Math.max(0, parseFloat(form.avancaFisico) || 0)),
        resumo: {
          ...o.montagem.resumo,
          empresaMontador: form.empresaMontador,
          empresaPreMontagem: form.empresaPreMontagem,
          totalBrutoMontador: parseFloat(form.totalBrutoMontador) || 0,
          totalRetencao: parseFloat(form.totalRetencao) || 0,
          totalPreMontagem: parseFloat(form.totalPreMontagem) || 0,
        },
        verbas: form.verbas,
      },
    }))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Editar Obra</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-6">

            {/* Informações gerais */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Informações Gerais
              </h3>
              <div className="space-y-3">
                <Field label="Nome da Obra *">
                  <input
                    className="FormInput"
                    value={form.nome}
                    onChange={e => setField('nome', e.target.value)}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Local">
                    <input
                      className="FormInput"
                      value={form.local}
                      onChange={e => setField('local', e.target.value)}
                      placeholder="Ex: São Paulo — SP"
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      className="FormInput"
                      value={form.status}
                      onChange={e => setField('status', e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </section>

            {/* Montagem — resumo */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Contrato de Montagem
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Empresa Montador Contratado">
                    <input
                      className="FormInput"
                      value={form.empresaMontador}
                      onChange={e => setField('empresaMontador', e.target.value)}
                    />
                  </Field>
                  <Field label="Empresa Pré-montagem">
                    <input
                      className="FormInput"
                      value={form.empresaPreMontagem}
                      onChange={e => setField('empresaPreMontagem', e.target.value)}
                      placeholder="opcional"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Total Bruto Montador (R$)">
                    <input
                      className="FormInput"
                      type="number"
                      min="0"
                      value={form.totalBrutoMontador}
                      onChange={e => setField('totalBrutoMontador', e.target.value)}
                    />
                  </Field>
                  <Field label="Total Retenção (R$)">
                    <input
                      className="FormInput"
                      type="number"
                      min="0"
                      value={form.totalRetencao}
                      onChange={e => setField('totalRetencao', e.target.value)}
                    />
                  </Field>
                  <Field label="Pré-montagem (R$)">
                    <input
                      className="FormInput"
                      type="number"
                      min="0"
                      value={form.totalPreMontagem}
                      onChange={e => setField('totalPreMontagem', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="AF Físico (%)">
                  <input
                    className="FormInput"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.avancaFisico}
                    onChange={e => setField('avancaFisico', e.target.value)}
                  />
                </Field>
              </div>
            </section>

            {/* Verbas */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Verbas — Orçado / Contratado
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-xs text-slate-400 px-1">
                  <span>Item</span>
                  <span className="w-28 text-right">Orçado (R$)</span>
                  <span className="w-28 text-right">Contratado (R$)</span>
                </div>
                {form.verbas.map(v => (
                  <div key={v.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <span className="text-sm text-slate-600 truncate">{v.descricao}</span>
                    <input
                      className="FormInput w-28 text-right"
                      type="number"
                      min="0"
                      value={v.orcado}
                      onChange={e => setVerba(v.id, 'orcado', e.target.value)}
                    />
                    <input
                      className="FormInput w-28 text-right"
                      type="number"
                      min="0"
                      value={v.contratado}
                      onChange={e => setVerba(v.id, 'contratado', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-slate-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}
