import { supabase } from './supabase'

// ─── Schema mapeado (verificado contra o banco real) ────────────────────────
//
// obras: id(uuid) nome local status af_fisico
//        orcado_montador orcado_guindaste orcado_di
//        contratado_montador contratado_guindaste contratado_di
//        av_fin_guindaste av_fin_di
//        empresa_montador empresa_premontagem
//        total_bruto_montador total_retencao total_premontagem total_faturado
//
// medicoes: id(uuid) obra_id numero periodo_inicio periodo_fim
//           valor_bruto descontos retencao valor_faturado

// ─── DB row → objeto de app ──────────────────────────────────────────────────

function rowToObra(row, medicoes = []) {
  return {
    id: row.id,
    nome: row.nome || '',
    local: row.local || '',
    status: row.status || '',
    caderno: row.caderno || '',
    montagem: {
      avancaFisico: row.af_fisico || 0,
      resumo: {
        empresaMontador:    row.empresa_montador   || '',
        empresaPreMontagem: row.empresa_premontagem || '',
        totalBrutoMontador: row.total_bruto_montador || 0,
        totalRetencao:      row.total_retencao      || 0,
        totalPreMontagem:   row.total_premontagem   || 0,
      },
      verbas: [
        { id: 1, descricao: 'Montador',                 orcado: row.orcado_montador  || 0, contratado: row.contratado_montador  || 0, avancaFinanceiro: 0 },
        { id: 2, descricao: 'Guindaste / Perfilação',   orcado: row.orcado_guindaste || 0, contratado: row.contratado_guindaste || 0, avancaFinanceiro: row.av_fin_guindaste || 0 },
        { id: 3, descricao: 'Despesas Indiretas (DI)',  orcado: row.orcado_di        || 0, contratado: row.contratado_di        || 0, avancaFinanceiro: row.av_fin_di        || 0 },
      ],
      medicoes: medicoes.map(rowToMedicao),
    },
  }
}

function rowToMedicao(row) {
  return {
    id:           row.id,
    numero:       row.numero        || '',
    periodoInicio: row.periodo_inicio || '',
    periodoFim:   row.periodo_fim   || '',
    valorBruto:   row.valor_bruto   || 0,
    descontos:    row.descontos     || 0,
    retencao:     row.retencao      || 0,
    valorFaturado: row.valor_faturado || 0,
  }
}

// ─── Objeto de app → DB row ──────────────────────────────────────────────────

function obraToRow(obra) {
  const { verbas, medicoes, avancaFisico, resumo } = obra.montagem
  const [montador, guindaste, di] = [
    verbas.find(v => v.id === 1) ?? verbas[0] ?? {},
    verbas.find(v => v.id === 2) ?? verbas[1] ?? {},
    verbas.find(v => v.id === 3) ?? verbas[2] ?? {},
  ]
  const totalFaturado = medicoes.reduce((s, m) => s + (m.valorFaturado || 0), 0)

  return {
    id:                   obra.id,
    nome:                 obra.nome,
    local:                obra.local || '',
    status:               obra.status || '',
    caderno:              obra.caderno ?? null,
    af_fisico:            avancaFisico || 0,
    orcado_montador:      montador.orcado    || 0,
    orcado_guindaste:     guindaste.orcado   || 0,
    orcado_di:            di.orcado          || 0,
    contratado_montador:  montador.contratado  || 0,
    contratado_guindaste: guindaste.contratado || 0,
    contratado_di:        di.contratado        || 0,
    av_fin_guindaste:     guindaste.avancaFinanceiro || 0,
    av_fin_di:            di.avancaFinanceiro        || 0,
    empresa_montador:     resumo.empresaMontador    || '',
    empresa_premontagem:  resumo.empresaPreMontagem || '',
    total_bruto_montador: resumo.totalBrutoMontador || 0,
    total_retencao:       resumo.totalRetencao      || 0,
    total_premontagem:    resumo.totalPreMontagem   || 0,
    total_faturado:       totalFaturado,
  }
}

function medicaoToRow(obraId, m) {
  return {
    id:             m.id,
    obra_id:        obraId,
    numero:         m.numero        || '',
    periodo_inicio: m.periodoInicio || null,
    periodo_fim:    m.periodoFim    || null,
    valor_bruto:    m.valorBruto    || 0,
    descontos:      m.descontos     || 0,
    retencao:       m.retencao      || 0,
    valor_faturado: m.valorFaturado || 0,
  }
}

// ─── Diff de medições ────────────────────────────────────────────────────────

function diffMedicoes(oldMeds, newMeds) {
  const oldMap = new Map(oldMeds.map(m => [m.id, m]))
  const newMap = new Map(newMeds.map(m => [m.id, m]))
  return {
    addedMeds:     newMeds.filter(m => !oldMap.has(m.id)),
    deletedMedIds: oldMeds.filter(m => !newMap.has(m.id)).map(m => m.id),
    updatedMeds:   newMeds.filter(m => {
      const old = oldMap.get(m.id)
      return old && JSON.stringify(old) !== JSON.stringify(m)
    }),
  }
}

// ─── Operações públicas ──────────────────────────────────────────────────────

/** Carrega todas as obras e medições em duas queries paralelas. */
export async function carregarObras() {
  const [r1, r2] = await Promise.all([
    supabase.from('obras').select('*').order('created_at'),
    supabase.from('medicoes').select('*').order('numero'),
  ])
  if (r1.error) throw r1.error
  if (r2.error) throw r2.error

  const medPorObra = {}
  for (const m of r2.data || []) {
    if (!medPorObra[m.obra_id]) medPorObra[m.obra_id] = []
    medPorObra[m.obra_id].push(m)
  }

  return (r1.data || []).map(row => rowToObra(row, medPorObra[row.id] || []))
}

/** Cria uma obra nova (sem medições). */
export async function criarObra(obra) {
  const { error } = await supabase.from('obras').insert(obraToRow(obra))
  if (error) throw error
}

/** Sincroniza uma obra atualizada com o banco.
 *  Sempre faz upsert da linha obras.
 *  Diff nas medições: insere novas, atualiza alteradas, deleta removidas. */
export async function sincronizarObra(obraId, novaObra, antigaObra) {
  const { addedMeds, deletedMedIds, updatedMeds } = diffMedicoes(
    antigaObra.montagem.medicoes,
    novaObra.montagem.medicoes,
  )

  // Obra row sempre atualizada (cobre verbas, resumo, af_fisico, total_faturado)
  const { error: obraErr } = await supabase.from('obras').upsert(obraToRow(novaObra))
  if (obraErr) throw obraErr

  // Medições em paralelo
  const ops = [
    ...addedMeds.map(m => supabase.from('medicoes').insert(medicaoToRow(obraId, m))),
    ...updatedMeds.map(m => supabase.from('medicoes').update(medicaoToRow(obraId, m)).eq('id', m.id)),
    ...deletedMedIds.map(id => supabase.from('medicoes').delete().eq('id', id)),
  ]
  const results = await Promise.all(ops)
  const erros = results.map(r => r.error).filter(Boolean)
  if (erros.length > 0) throw erros[0]
}

/** Exclui uma obra e suas medições (delete em cascata pelo FK). */
export async function excluirObra(id) {
  // Deleta medições explicitamente (caso CASCADE não esteja configurado)
  await supabase.from('medicoes').delete().eq('obra_id', id)
  const { error } = await supabase.from('obras').delete().eq('id', id)
  if (error) throw error
}
