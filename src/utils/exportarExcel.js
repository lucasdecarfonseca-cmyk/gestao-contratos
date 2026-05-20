// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (s) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

const fmtPeriodo = (inicio, fim) => {
  const s = fmtDate(inicio)
  const e = fmtDate(fim)
  if (!s && !e) return ''
  if (!e) return s
  if (!s) return e
  return `${s} a ${e}`
}

function calcObra(obra) {
  const { verbas, medicoes, resumo, avancaFisico } = obra.montagem
  const montadorAvanco = medicoes.reduce(
    (s, m) => s + m.valorBruto - m.descontos - m.retencao, 0
  )
  const totalOrcado = verbas.reduce((s, v) => s + v.orcado, 0)
  const totalContratado = verbas.reduce((s, v) => s + v.contratado, 0)
  const guindaste = verbas.find(v => v.id === 2) ?? verbas[1] ?? {}
  const di = verbas.find(v => v.id === 3) ?? verbas[2] ?? {}
  const totalAvanco = montadorAvanco + (guindaste.avancaFinanceiro ?? 0) + (di.avancaFinanceiro ?? 0)
  const totalBrutoMedido = medicoes.reduce((s, m) => s + m.valorBruto, 0)
  const totalDescontos = medicoes.reduce((s, m) => s + m.descontos, 0)
  const totalRetido = medicoes.reduce((s, m) => s + m.retencao, 0)
  const totalLiquidoMedido = totalBrutoMedido - totalDescontos - totalRetido
  const totalFaturado = medicoes.reduce((s, m) => s + m.valorFaturado, 0)
  const totalLiquidoMontador =
    resumo.totalBrutoMontador - resumo.totalRetencao - resumo.totalPreMontagem
  const base = resumo.totalBrutoMontador || 0
  const afFinanceiro = base > 0 ? (totalLiquidoMedido / base) * 100 : 0
  const afFisico = avancaFisico ?? 0
  const diffPct = afFisico - afFinanceiro
  const diffValor = (afFisico / 100) * base - totalLiquidoMedido
  return {
    montadorAvanco, totalOrcado, totalContratado, totalAvanco,
    totalBrutoMedido, totalDescontos, totalRetido,
    totalLiquidoMedido, totalFaturado, totalLiquidoMontador,
    afFinanceiro, afFisico, diffPct, diffValor,
  }
}

function safeName(nome) {
  return nome.replace(/[*?:/\\[\]]/g, '-').substring(0, 31)
}

function obraFileName(nome) {
  return nome
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim().replace(/\s+/g, '-')
    .substring(0, 40) || 'obra'
}

// ─── Paleta e constantes Medabil ─────────────────────────────────────────────

const C = {
  darkBlue:  'FF1A4A6B',
  medBlue:   'FF6B8FA8',
  lightBlue: 'FFD6E4ED',
  greenBg:   'FFE8F5E8',
  white:     'FFFFFFFF',
  grayRow:   'FFF4F6F8',
  border:    'FFD0D8DE',
  greenText: 'FF1E7A4B',
  redText:   'FFC0392B',
}

const BORDER = {
  top:    { style: 'thin', color: { argb: C.border } },
  left:   { style: 'thin', color: { argb: C.border } },
  bottom: { style: 'thin', color: { argb: C.border } },
  right:  { style: 'thin', color: { argb: C.border } },
}

const BRL     = '"R$ "#,##0.00'
const PCT_FMT = '0.0%'

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

// Aplica borda em todas as células de uma linha (necessário para ranges mesclados)
function bordearLinha(row, n) {
  for (let col = 1; col <= n; col++) row.getCell(col).border = BORDER
}

// ─── Planilha Resumo Geral ────────────────────────────────────────────────────

const N_GERAL = 8

function buildResumoSheetEJ(wb, obras) {
  const ws = wb.addWorksheet('Resumo Geral')

  ws.columns = [
    { width: 38 }, // Obra
    { width: 18 }, // Local
    { width: 14 }, // Status
    { width: 18 }, // Orçado Total
    { width: 18 }, // AF Financeiro %
    { width: 18 }, // AF Físico %
    { width: 18 }, // Diferença %
    { width: 18 }, // Diferença em Valor
  ]

  // Linha 1: Título
  const r1 = ws.addRow(['MEDABIL — SISTEMAS CONSTRUTIVOS'])
  r1.height = 38
  ws.mergeCells(`A1:H1`)
  bordearLinha(r1, N_GERAL)
  const c1 = ws.getCell('A1')
  c1.font      = { bold: true, size: 14, color: { argb: C.white } }
  c1.fill      = fill(C.darkBlue)
  c1.alignment = { horizontal: 'center', vertical: 'middle' }

  // Linha 2: Subtítulo
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const r2 = ws.addRow([`Avanço de Montagem por Obra — ${dataHoje}`])
  r2.height = 20
  ws.mergeCells('A2:H2')
  bordearLinha(r2, N_GERAL)
  const c2 = ws.getCell('A2')
  c2.font      = { color: { argb: C.white } }
  c2.fill      = fill(C.medBlue)
  c2.alignment = { horizontal: 'center', vertical: 'middle' }

  // Linha 3: vazia
  ws.addRow([])

  // Linha 4: cabeçalho de colunas
  const r4 = ws.addRow([
    'Obra', 'Local', 'Status', 'Orçado Total',
    'AF Financeiro %', 'AF Físico %', 'Diferença %', 'Diferença em Valor',
  ])
  r4.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: C.white } }
    cell.fill      = fill(C.darkBlue)
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false }
    cell.border    = BORDER
  })

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5' }]

  // Linhas de dados
  obras.forEach((obra, i) => {
    const c = calcObra(obra)
    const bgFill = fill(i % 2 === 1 ? C.grayRow : C.white)

    const row = ws.addRow([
      obra.nome,
      obra.local || '',
      obra.status || '',
      c.totalOrcado,
      c.afFinanceiro / 100,
      c.afFisico / 100,
      c.diffPct / 100,
      c.diffValor,
    ])

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill      = bgFill
      cell.border    = BORDER
      cell.alignment = { vertical: 'middle' }
    })

    row.getCell(4).numFmt = BRL

    const cellAfFin = row.getCell(5)
    cellAfFin.numFmt = PCT_FMT
    cellAfFin.font = { bold: true, color: { argb: c.afFinanceiro >= 50 ? C.greenText : C.redText } }

    row.getCell(6).numFmt = PCT_FMT

    const cellDiffPct = row.getCell(7)
    cellDiffPct.numFmt = PCT_FMT
    if (c.diffPct !== 0) cellDiffPct.font = { color: { argb: c.diffPct > 0 ? C.greenText : C.redText } }

    const cellDiffVal = row.getCell(8)
    cellDiffVal.numFmt = BRL
    if (c.diffValor !== 0) cellDiffVal.font = { color: { argb: c.diffValor > 0 ? C.greenText : C.redText } }
  })

  // Linha de total
  const allCalcs  = obras.map(calcObra)
  const sumOrcado = allCalcs.reduce((s, c) => s + c.totalOrcado, 0)
  const sumLiq    = allCalcs.reduce((s, c) => s + c.totalLiquidoMedido, 0)
  const sumBase   = obras.reduce((s, o) => s + (o.montagem.resumo.totalBrutoMontador || 0), 0)
  const totAfFin  = sumBase > 0 ? sumLiq / sumBase : 0
  const totAfFis  = obras.length > 0
    ? allCalcs.reduce((s, c) => s + c.afFisico, 0) / obras.length / 100
    : 0
  const totDiffVal = allCalcs.reduce((s, c) => s + c.diffValor, 0)

  const rTotal = ws.addRow(['TOTAL', '', '', sumOrcado, totAfFin, totAfFis, totAfFis - totAfFin, totDiffVal])
  rTotal.eachCell({ includeEmpty: true }, (cell) => {
    cell.font      = { bold: true, color: { argb: C.white } }
    cell.fill      = fill(C.darkBlue)
    cell.border    = BORDER
    cell.alignment = { vertical: 'middle' }
  })
  rTotal.getCell(4).numFmt = BRL
  rTotal.getCell(5).numFmt = PCT_FMT
  rTotal.getCell(6).numFmt = PCT_FMT
  rTotal.getCell(7).numFmt = PCT_FMT
  rTotal.getCell(8).numFmt = BRL
}

// ─── Planilha por Obra (formatação visual Medabil) ────────────────────────────

const N_OBRA = 7

function buildObraSheetEJ(wb, obra) {
  const ws = wb.addWorksheet(safeName(obra.nome))
  const c = calcObra(obra)
  const { verbas, medicoes, resumo } = obra.montagem

  ws.columns = [
    { width: 32 }, // labels / nomes
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
    { width: 18 },
  ]

  // ── Helpers de layout ────────────────────────────────────────────────────

  /** Linha mesclada A:G com estilo aplicado à célula master */
  function mergeRow(content, styleObj, height) {
    const row = ws.addRow([content])
    if (height) row.height = height
    const n = row.number
    ws.mergeCells(`A${n}:G${n}`)
    bordearLinha(row, N_OBRA)
    const cell = ws.getCell(`A${n}`)
    if (styleObj.font)      cell.font      = styleObj.font
    if (styleObj.fill)      cell.fill      = styleObj.fill
    if (styleObj.alignment) cell.alignment = styleObj.alignment
    return row
  }

  /** Cabeçalho de seção: fundo #6B8FA8, texto branco bold */
  function sectionHeader(title) {
    return mergeRow(title, {
      font:      { bold: true, color: { argb: C.white } },
      fill:      fill(C.medBlue),
      alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    })
  }

  /** Linha de cabeçalho de colunas: fundo #1A4A6B, texto branco bold centralizado */
  function colHeaderRow(labels) {
    const data = [...labels, ...Array(Math.max(0, N_OBRA - labels.length)).fill('')]
    const row = ws.addRow(data)
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill   = fill(C.darkBlue)
      cell.border = BORDER
      if (col <= labels.length) {
        cell.font      = { bold: true, color: { argb: C.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
    return row
  }

  /** Linha rótulo + valor para seções de resumo.
   *  isCalc=true → fundo #E8F5E8 bold; caso contrário rótulo #D6E4ED, valor branco */
  function labelValRow(label, value, isCalc = false) {
    const data = [label, value, ...Array(N_OBRA - 2).fill('')]
    const row = ws.addRow(data)
    const lFill = fill(isCalc ? C.greenBg : C.lightBlue)
    const vFill = fill(isCalc ? C.greenBg : C.white)
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill   = col === 1 ? lFill : vFill
      cell.border = BORDER
      cell.alignment = { vertical: 'middle' }
      if (isCalc) cell.font = { bold: true }
    })
    return row
  }

  /** Linha de dados com fundo alternado (rowIdx 0-based) */
  function dataRow(values, rowIdx) {
    const data = [...values, ...Array(Math.max(0, N_OBRA - values.length)).fill('')]
    const row = ws.addRow(data)
    const bgFill = fill(rowIdx % 2 === 0 ? C.white : C.grayRow)
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill      = bgFill
      cell.border    = BORDER
      cell.alignment = { vertical: 'middle' }
    })
    return row
  }

  /** Linha de total: fundo #1A4A6B, texto branco bold */
  function totalRow(values) {
    const data = [...values, ...Array(Math.max(0, N_OBRA - values.length)).fill('')]
    const row = ws.addRow(data)
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font      = { bold: true, color: { argb: C.white } }
      cell.fill      = fill(C.darkBlue)
      cell.border    = BORDER
      cell.alignment = { vertical: 'middle' }
    })
    return row
  }

  // ── Cabeçalho da planilha ─────────────────────────────────────────────────

  mergeRow('MEDABIL — SISTEMAS CONSTRUTIVOS', {
    font:      { bold: true, size: 14, color: { argb: C.white } },
    fill:      fill(C.darkBlue),
    alignment: { horizontal: 'center', vertical: 'middle' },
  }, 38)

  mergeRow(obra.nome, {
    font:      { color: { argb: C.white } },
    fill:      fill(C.medBlue),
    alignment: { horizontal: 'center', vertical: 'middle' },
  }, 20)

  ws.addRow([])

  // ── INFORMAÇÕES GERAIS ────────────────────────────────────────────────────

  sectionHeader('INFORMAÇÕES GERAIS')
  labelValRow('Nome', obra.nome)
  labelValRow('Local', obra.local || '')
  labelValRow('Status', obra.status || '')
  ws.addRow([])

  // ── ORÇADO X CONTRATADO X AVANÇO FINANCEIRO ──────────────────────────────

  sectionHeader('ORÇADO X CONTRATADO X AVANÇO FINANCEIRO')
  colHeaderRow(['Item', 'Orçado (R$)', 'Contratado (R$)', 'Avanço Financeiro (R$)'])

  const avancos = [
    c.montadorAvanco,
    verbas.find(v => v.id === 2)?.avancaFinanceiro ?? verbas[1]?.avancaFinanceiro ?? 0,
    verbas.find(v => v.id === 3)?.avancaFinanceiro ?? verbas[2]?.avancaFinanceiro ?? 0,
  ]
  verbas.forEach((v, i) => {
    const row = dataRow([v.descricao, v.orcado, v.contratado, avancos[i] ?? 0], i)
    row.getCell(2).numFmt = BRL
    row.getCell(3).numFmt = BRL
    row.getCell(4).numFmt = BRL
  })
  {
    const row = totalRow(['Total', c.totalOrcado, c.totalContratado, c.totalAvanco])
    row.getCell(2).numFmt = BRL
    row.getCell(3).numFmt = BRL
    row.getCell(4).numFmt = BRL
  }
  ws.addRow([])

  // ── RESUMO DO CONTRATO DE MONTAGEM ────────────────────────────────────────

  sectionHeader('RESUMO DO CONTRATO DE MONTAGEM')
  labelValRow('Empresa Montador Contratado', resumo.empresaMontador || '')
  labelValRow('Empresa Pré-montagem', resumo.empresaPreMontagem || '')

  // Helper: rótulo + valor monetário
  const addBRL = (label, value, isCalc = false) => {
    const row = labelValRow(label, value, isCalc)
    row.getCell(2).numFmt = BRL
    return row
  }

  addBRL('Total Bruto Valor Montador', resumo.totalBrutoMontador)
  addBRL('Total Retenção', resumo.totalRetencao)
  addBRL('Total Pré-montagem Medajoists', resumo.totalPreMontagem)
  addBRL('Total Líquido Montador (calculado)', c.totalLiquidoMontador, true)
  addBRL('Total Bruto Medido', c.totalBrutoMedido)
  addBRL('Total Descontos', c.totalDescontos)
  addBRL('Total Retido', c.totalRetido)
  addBRL('Total Líquido Medido (calculado)', c.totalLiquidoMedido, true)
  addBRL('Total Faturado', c.totalFaturado)

  // AF Financeiro % — calculado, cor condicional
  {
    const row = labelValRow('AF Financeiro %', c.afFinanceiro / 100, true)
    const cell = row.getCell(2)
    cell.numFmt = PCT_FMT
    cell.font = { bold: true, color: { argb: c.afFinanceiro >= 50 ? C.greenText : C.redText } }
  }

  // AF Físico % — calculado
  {
    const row = labelValRow('AF Físico %', c.afFisico / 100, true)
    row.getCell(2).numFmt = PCT_FMT
  }

  ws.addRow([])

  // ── MEDIÇÕES DETALHADAS ───────────────────────────────────────────────────

  sectionHeader('MEDIÇÕES DETALHADAS')
  colHeaderRow([
    'Medição', 'Período',
    'Valor Bruto (R$)', 'Descontos (R$)', 'Retenção (R$)',
    'Valor Líquido (R$)', 'Valor Faturado (R$)',
  ])

  medicoes.forEach((m, i) => {
    const liquidoMedido = m.valorBruto - m.descontos - m.retencao
    const row = dataRow([
      `Medição ${m.numero}`,
      fmtPeriodo(m.periodoInicio, m.periodoFim),
      m.valorBruto,
      m.descontos,
      m.retencao,
      liquidoMedido,
      m.valorFaturado,
    ], i)
    for (let col = 3; col <= 7; col++) row.getCell(col).numFmt = BRL
  })

  if (medicoes.length > 0) {
    const row = totalRow([
      'Total', '',
      c.totalBrutoMedido, c.totalDescontos, c.totalRetido,
      c.totalLiquidoMedido, c.totalFaturado,
    ])
    for (let col = 3; col <= 7; col++) row.getCell(col).numFmt = BRL
  }
}

// ─── Download helper ──────────────────────────────────────────────────────────

async function downloadXlsx(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Exportações públicas ─────────────────────────────────────────────────────

export async function exportarRelatorioGeral(obras) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()

  buildResumoSheetEJ(wb, obras)
  obras.forEach(obra => buildObraSheetEJ(wb, obra))

  const date = new Date().toISOString().slice(0, 10)
  await downloadXlsx(wb, `relatorio-geral-${date}.xlsx`)
}

export async function exportarObra(obra) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()

  buildObraSheetEJ(wb, obra)

  const date = new Date().toISOString().slice(0, 10)
  await downloadXlsx(wb, `relatorio-${obraFileName(obra.nome)}-${date}.xlsx`)
}
