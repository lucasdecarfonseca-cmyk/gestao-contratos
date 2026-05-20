import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react'
import * as XLSX from 'xlsx'

const normalize = (str) =>
  (str || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

const matchCol = (headers, candidates) => {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => normalize(h).includes(normalize(c)))
    if (idx !== -1) return idx
  }
  return -1
}

export default function ImportacaoExcel({ onImportarFluxo, onImportarFornecedores }) {
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const inputRef = useRef()

  const processarArquivo = (file) => {
    if (!file) return
    setCarregando(true)
    setErro(null)
    setResultado(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const stats = { fluxo: 0, fornecedores: 0 }

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
          if (rows.length < 2) continue

          const headers = rows[0].map((h) => h.toString())

          // Detect Fluxo Financeiro
          const iData = matchCol(headers, ['data'])
          const iDoc = matchCol(headers, ['documento', 'doc', 'nf', 'numero'])
          const iValor = matchCol(headers, ['valor'])
          const iDesc = matchCol(headers, ['descricao', 'historico', 'obs'])

          if (iData !== -1 && iValor !== -1) {
            const items = []
            for (let r = 1; r < rows.length; r++) {
              const row = rows[r]
              const rawValor = Number(String(row[iValor]).replace(',', '.')) || 0
              if (rawValor === 0 && !row[iData]) continue
              const rawDate = row[iData]
              let data = ''
              if (rawDate) {
                if (typeof rawDate === 'number') {
                  const d = XLSX.SSF.parse_date_code(rawDate)
                  data = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
                } else {
                  const parts = rawDate.toString().split(/[/\-.]/)
                  if (parts.length === 3) {
                    data = parts[0].length === 4
                      ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
                      : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                  } else {
                    data = rawDate.toString()
                  }
                }
              }
              items.push({
                id: Date.now() + r,
                data,
                documento: iDoc !== -1 ? row[iDoc].toString() : '',
                valor: rawValor,
                descricao: iDesc !== -1 ? row[iDesc].toString() : '',
                tipo: rawValor >= 0 ? 'entrada' : 'saida',
              })
            }
            if (items.length > 0) {
              onImportarFluxo(items)
              stats.fluxo += items.length
            }
            continue
          }

          // Detect Fornecedores
          const iForn = matchCol(headers, ['fornecedor', 'empresa', 'razao'])
          const iClass = matchCol(headers, ['classificacao', 'tipo'])
          const iVT = matchCol(headers, ['valor total', 'contrato', 'vt'])
          const iVF = matchCol(headers, ['faturado', 'vf', 'medido'])
          const iSaldo = matchCol(headers, ['saldo', 'restante'])
          const iStatus = matchCol(headers, ['status', 'situacao'])
          const iComp = matchCol(headers, ['comprador', 'responsavel', 'compra'])

          if (iForn !== -1 && iVT !== -1) {
            const items = []
            for (let r = 1; r < rows.length; r++) {
              const row = rows[r]
              if (!row[iForn]) continue
              const vt = Number(String(row[iVT]).replace(',', '.')) || 0
              const vf = iVF !== -1 ? (Number(String(row[iVF]).replace(',', '.')) || 0) : 0
              const sl = iSaldo !== -1 ? (Number(String(row[iSaldo]).replace(',', '.')) || 0) : vt - vf
              items.push({
                id: Date.now() + r,
                classificacao: iClass !== -1 ? row[iClass].toString() : 'Material',
                comprador: iComp !== -1 ? row[iComp].toString() : '',
                fornecedor: row[iForn].toString(),
                valorTotal: vt,
                valorFaturado: vf,
                saldo: sl,
                status: iStatus !== -1 ? row[iStatus].toString() : 'Previsto',
              })
            }
            if (items.length > 0) {
              onImportarFornecedores(items)
              stats.fornecedores += items.length
            }
          }
        }

        setResultado(stats)
      } catch (err) {
        setErro('Erro ao processar o arquivo. Verifique se é um .xlsx válido.')
      } finally {
        setCarregando(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processarArquivo(file)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileSpreadsheet size={20} className="text-green-600" />
        <h2 className="text-base font-bold text-slate-800">Importar Planilha Excel</h2>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={28} className="text-slate-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Arraste um arquivo .xlsx aqui</p>
          <p className="text-xs text-slate-400 mt-1">ou clique para selecionar</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => processarArquivo(e.target.files[0])}
        />
      </div>

      {/* Info */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard
          title="Aba → Fluxo Financeiro"
          cols={['DATA', 'DOCUMENTO', 'VALOR', 'DESCRIÇÃO']}
          color="blue"
        />
        <InfoCard
          title="Aba → Tabela de Fornecedores"
          cols={['FORNECEDOR', 'CLASSIFICAÇÃO', 'VALOR TOTAL', 'FATURADO', 'SALDO']}
          color="purple"
        />
      </div>

      {/* Status */}
      {carregando && (
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Processando arquivo...
        </div>
      )}

      {resultado && (
        <div className="mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-semibold">Importação concluída!</p>
            {resultado.fluxo > 0 && <p>{resultado.fluxo} lançamentos importados para o Fluxo Financeiro.</p>}
            {resultado.fornecedores > 0 && <p>{resultado.fornecedores} fornecedores importados para a Tabela.</p>}
            {resultado.fluxo === 0 && resultado.fornecedores === 0 && (
              <p>Nenhuma aba reconhecida. Verifique os cabeçalhos das colunas.</p>
            )}
          </div>
          <button onClick={() => setResultado(null)} className="text-green-400 hover:text-green-600 ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {erro && (
        <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{erro}</p>
          <button onClick={() => setErro(null)} className="text-red-300 hover:text-red-500 ml-auto">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function InfoCard({ title, cols, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  }
  return (
    <div className={`border rounded-xl p-3 ${colors[color]}`}>
      <p className="text-xs font-semibold mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1">
        {cols.map((c) => (
          <span key={c} className="text-xs bg-white/70 px-2 py-0.5 rounded border border-current/20 font-mono">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}
