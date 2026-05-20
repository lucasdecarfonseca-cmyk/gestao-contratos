import { DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function ResumoContrato({ contrato, onUpdate }) {
  const { valorContrato, valorFaturado } = contrato
  const saldo = valorContrato - valorFaturado
  const exec = valorContrato > 0 ? Math.min(100, (valorFaturado / valorContrato) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-base font-bold text-slate-800 mb-5">Resumo do Contrato</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card
          icon={<DollarSign size={18} className="text-slate-600" />}
          bg="bg-slate-50"
          label="Valor do Contrato"
          value={fmt(valorContrato)}
          valueClass="text-slate-800"
        />
        <Card
          icon={<CheckCircle2 size={18} className="text-blue-600" />}
          bg="bg-blue-50"
          label="Valor Faturado"
          value={fmt(valorFaturado)}
          valueClass="text-blue-700"
        />
        <Card
          icon={<Clock size={18} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Saldo a Receber"
          value={fmt(saldo)}
          valueClass="text-emerald-700"
        />
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <TrendingUp size={15} />
            <span>% Executado</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{exec.toFixed(1)}%</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${exec}%`,
              background: exec < 50
                ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                : exec < 85
                ? 'linear-gradient(90deg, #3b82f6, #22c55e)'
                : 'linear-gradient(90deg, #22c55e, #16a34a)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}

function Card({ icon, bg, label, value, valueClass }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}
