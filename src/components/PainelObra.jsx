import { useState } from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import OrcadoContratado from './OrcadoContratado'
import Medicoes from './Medicoes'
import CadernoObra from './CadernoObra'
import { exportarObra } from '../utils/exportarExcel'

const TABS = [
  { id: 'orcado',   label: 'Orçado x Contratado' },
  { id: 'medicoes', label: 'Medições' },
  { id: 'caderno',  label: 'Caderno da Obra' },
]

export default function PainelObra({ obra, onUpdate, onBack, isAdmin }) {
  const [tab, setTab] = useState('orcado')

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Obras
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 leading-tight">{obra.nome}</h1>
          {obra.local && <p className="text-sm text-slate-400 mt-0.5">{obra.local}</p>}
        </div>
        <button
          onClick={() => exportarObra(obra)}
          className="flex items-center gap-1.5 text-sm border border-slate-300 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      <div className="flex border-b border-slate-200 mb-6 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orcado'   && <OrcadoContratado obra={obra} onUpdate={onUpdate} isAdmin={isAdmin} />}
      {tab === 'medicoes' && <Medicoes obra={obra} onUpdate={onUpdate} isAdmin={isAdmin} />}
      {tab === 'caderno'  && <CadernoObra obra={obra} onUpdate={onUpdate} isAdmin={isAdmin} />}
    </div>
  )
}
