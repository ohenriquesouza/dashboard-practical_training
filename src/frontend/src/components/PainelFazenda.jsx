import { useEffect, useMemo, useRef, useState } from 'react'
import { gerarRelatorio } from '../utils/gerarRelatorio'

import AnaliseQuimica from './AnaliseQuimica'
import PerfilSolo from './PerfilSolo'
import ComparativoTalhoes from './ComparativoTalhoes'
import ResumoQuimico from './ResumoQuimico'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'


// ============================================================================
// HELPERS
// ============================================================================

function pushIfNumber(arr, value) {
  const n = Number(value)
  if (Number.isFinite(n)) arr.push(n)
}

function media(arr) {
  if (!arr?.length) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function formatNumber(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—'
  return Number(v).toFixed(2)
}

function formatHa(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—'
  return `${Number(v).toFixed(1)} ha`
}

function formatDate(data) {
  if (!data || data === 'NaT') return 'Não informado'
  const partes = String(data).split('-')
  if (partes.length !== 3) return data
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

function limitarTexto(texto, max) {
  if (!texto) return '—'
  return texto.length > max ? `${texto.slice(0, max)}…` : texto
}

function firstDefined(obj, keys) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') {
      return obj[key]
    }
  }
  return null
}

function normalizeText(value) {
  if (value == null) return ''
  return String(value).trim().toLowerCase()
}

function getGridId(row) {
  return firstDefined(row, [
    'idGrid',
    'ID_GRID',
    'id_grid',
    'cdGrid',
    'cd_grid',
    'gridId',
    'idMalha',
    'ID_MALHA',
    'id_grid_amostra',
    'idGridAmostra',
  ])
}

function getGridLabel(row) {
  const nome = firstDefined(row, [
    'nomeGrid',
    'nmGrid',
    'grid',
    'descricaoGrid',
    'descGrid',
    'labelGrid',
    'nome',
    'nm_grid',
  ])

  const id = getGridId(row)

  if (nome) return String(nome)
  if (id != null) return `Grid ${id}`
  return 'Grid não identificado'
}

function getGridColor(row) {
  const cor = firstDefined(row, [
    'cor',
    'corGrid',
    'statusCor',
    'classificacaoCor',
    'faixaCor',
    'cor_resumo',
  ])

  return normalizeText(cor)
}

function getGridColorLabel(cor) {
  const c = normalizeText(cor)

  if (!c) return 'Não definido'
  if (c.includes('vermelh')) return 'Vermelho'
  if (c.includes('amarel')) return 'Amarelo'
  if (c.includes('verde')) return 'Verde'
  if (c.includes('laranja')) return 'Laranja'
  return cor
}

function getGridColorStyle(cor) {
  const c = normalizeText(cor)

  if (c.includes('vermelh')) {
    return {
      background: '#ffebee',
      color: '#b71c1c',
      border: '1px solid #ef9a9a',
    }
  }

  if (c.includes('amarel')) {
    return {
      background: '#fff8e1',
      color: '#8d6e00',
      border: '1px solid #ffe082',
    }
  }

  if (c.includes('verde')) {
    return {
      background: '#e8f5e9',
      color: '#1b5e20',
      border: '1px solid #a5d6a7',
    }
  }

  if (c.includes('laranja')) {
    return {
      background: '#fff3e0',
      color: '#e65100',
      border: '1px solid #ffcc80',
    }
  }

  return {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
  }
}

function getCorResumoPorAlertas(alertas) {
  if (!alertas?.length) return 'verde'
  if (alertas.some((a) => a.tipo === 'alto')) return 'vermelho'
  return 'amarelo'
}

function getScoreClassificacao(totalAlertas) {
  if (!Number.isFinite(totalAlertas) || totalAlertas <= 0) {
    return {
      score: 0,
      label: 'Saudável',
      cor: 'verde',
      prioridade: 'baixa',
    }
  }

  if (totalAlertas === 1) {
    return {
      score: 1,
      label: 'Leve',
      cor: 'amarelo',
      prioridade: 'baixa',
    }
  }

  if (totalAlertas === 2) {
    return {
      score: 2,
      label: 'Moderado',
      cor: 'laranja',
      prioridade: 'media',
    }
  }

  return {
    score: 3,
    label: 'Crítico',
    cor: 'vermelho',
    prioridade: 'alta',
  }
}

function getScoreBadgeStyle(score) {
  if (score >= 3) {
    return {
      background: '#ffebee',
      color: '#b71c1c',
      border: '1px solid #ef9a9a',
    }
  }

  if (score === 2) {
    return {
      background: '#fff3e0',
      color: '#e65100',
      border: '1px solid #ffcc80',
    }
  }

  if (score === 1) {
    return {
      background: '#fff8e1',
      color: '#8d6e00',
      border: '1px solid #ffe082',
    }
  }

  return {
    background: '#e8f5e9',
    color: '#1b5e20',
    border: '1px solid #a5d6a7',
  }
}

function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 700,
        background: '#e0e0e0',
        borderRadius: '50%',
        width: 16,
        height: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#555',
        userSelect: 'none',
      }}>
        i
      </span>

      {visible && (
        <div style={{
          position: 'absolute',
          top: 22,
          right: 0,
          background: '#333',
          color: '#fff',
          padding: '6px 8px',
          borderRadius: 6,
          fontSize: 11,
          width: 210,
          zIndex: 10,
          lineHeight: 1.4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PainelFazenda({
  fazenda,
  idProprietario,
  nomeProprietario,
  ano,
  apiBaseUrl = 'http://localhost:8000',
  talhaoSelecionado,
}) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [allData, setAllData] = useState(null)
  const [modalTalhao, setModalTalhao] = useState(null)   // talhão aberto no modal
  const talhaoCardRefs = useRef({})

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!fazenda?.idPropriedade || !idProprietario) return

      setLoading(true)
      setErro(null)

      try {
        const res = await fetch(`${apiBaseUrl}/api/all`)
        if (!res.ok) {
          throw new Error(`Falha ao carregar dados: ${res.status}`)
        }

        const json = await res.json()
        if (ativo) setAllData(json)
      } catch (e) {
        if (ativo) setErro(e.message || 'Erro ao carregar dados.')
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [fazenda?.idPropriedade, idProprietario, apiBaseUrl])

  useEffect(() => {
    if (talhaoSelecionado == null) return
    const el = talhaoCardRefs.current[talhaoSelecionado]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [talhaoSelecionado])

  // Abre automaticamente o modal quando o talhão é selecionado no mapa
  useEffect(() => {
    if (talhaoSelecionado == null || !resumoTalhoes?.length) return
    const found = resumoTalhoes.find(t => String(t.idUnidadeProducao) === String(talhaoSelecionado))
    if (found) setModalTalhao(found)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talhaoSelecionado])

  const dataset = useMemo(() => {
    if (!allData || !fazenda?.idPropriedade) return null

    const upRows = allData?.TB_UNIDADE_PRODUCAO?.data ?? []
    const cqRows = allData?.VW_TB_CULTURA_QUIMICA?.data ?? []
    const gridRows = allData?.TB_GRID_FULL?.data ?? []
    const fertRows = allData?.VW_DASH_FERTILIDADE_SOLO?.data ?? []

    const unidadesRaw = upRows.filter(
      (u) => Number(u.idProriedade) === Number(fazenda.idPropriedade)
    )
    const vistos = new Set()
    const unidades = unidadesRaw.filter((u) => {
      const id = Number(u.idUnidadeProducao)
      if (vistos.has(id)) return false
      vistos.add(id)
      return true
    })

    const unidadeIds = new Set(unidades.map((u) => Number(u.idUnidadeProducao)))

    const cq = cqRows.filter((r) => unidadeIds.has(Number(r.idUnidadeProducao)))
    const grids = gridRows.filter((r) => unidadeIds.has(Number(r.idUnidadeProducao)))
    const fert = fertRows.filter((r) => unidadeIds.has(Number(r.idUnidadeProducao)))

    return {
      unidades,
      unidadeIds,
      cq,
      grids,
      fert,
    }
  }, [allData, fazenda?.idPropriedade])

const resumo = useMemo(() => {
  if (!dataset) return null

  const { unidades, grids, cq, fert } = dataset

  const ultimaAnalise = cq
    .map((r) => r.DT_FIM_Ensaios)
    .filter(Boolean)
    .sort()
    .at(-1)

  const avg = (rows, field) => {
    const nums = rows
      .map((r) => Number(r[field]))
      .filter((v) => Number.isFinite(v))

    if (!nums.length) return null
    return nums.reduce((a, b) => a + b, 0) / nums.length
  }

  const totalGrids = grids.length

  let gridsComAlerta = 0
  let gridsLeves = 0
  let gridsModerados = 0
  let gridsCriticos = 0
  let somaScore = 0

  for (const row of fert) {
    const regras = [
      {
        valor: Number(row.P),
        min: Number(row.vlr_minimo_P),
        max: Number(row.vlr_maximo_P),
      },
      {
        valor: Number(row.K),
        min: Number(row.vlr_minimo_K),
        max: Number(row.vlr_maximo_K),
      },
      {
        valor: Number(row.M),
        min: Number(row.vlr_minimo_M),
        max: Number(row.vlr_maximo_M),
      },
      {
        valor: Number(row.V),
        min: Number(row.vlr_minimo_V),
        max: Number(row.vlr_maximo_V),
      },
    ]

    let totalAlertasGrid = 0

    for (const r of regras) {
      if (!Number.isFinite(r.valor)) continue
      if (Number.isFinite(r.min) && r.valor < r.min) totalAlertasGrid++
      else if (Number.isFinite(r.max) && r.valor > r.max) totalAlertasGrid++
    }

    if (totalAlertasGrid > 0) gridsComAlerta++

    const classificacao = getScoreClassificacao(totalAlertasGrid)
    somaScore += classificacao.score

    if (classificacao.score === 1) gridsLeves++
    else if (classificacao.score === 2) gridsModerados++
    else if (classificacao.score >= 3) gridsCriticos++
  }

  const percentualRisco = totalGrids
    ? (gridsComAlerta / totalGrids) * 100
    : 0

  const percentualCriticoReal = totalGrids
    ? (gridsCriticos / totalGrids) * 100
    : 0

  const scoreMedio = totalGrids
    ? somaScore / totalGrids
    : 0

  return {
    areaTotal: Number(fazenda.areaTotal) || 0,
    totalTalhoes: unidades.length,
    totalGrids,
    gridsComAlerta,
    gridsLeves,
    gridsModerados,
    gridsCriticos,
    percentualRisco,
    percentualCriticoReal,
    scoreMedio,
    ultimaAnalise,
    pH: avg(cq, 'pH_H2O'),
    P: avg(cq, 'P'),
    K: avg(cq, 'K'),
    MO: avg(cq, 'M_O'),
    CTC: avg(cq, 'CTC'),
    V: avg(cq, 'Sat_Bases'),
  }
}, [dataset, fazenda.areaTotal])

  const serieTemporal = useMemo(() => {
    if (!dataset) return []

    const grupos = {}

    for (const row of dataset.cq) {
      const chave = String(row.ano ?? 'Sem ano')

      if (!grupos[chave]) {
        grupos[chave] = { ano: chave, pH: [], P: [], K: [], MO: [] }
      }

      pushIfNumber(grupos[chave].pH, row.pH_H2O)
      pushIfNumber(grupos[chave].P, row.P)
      pushIfNumber(grupos[chave].K, row.K)
      pushIfNumber(grupos[chave].MO, row.M_O)
    }

    return Object.values(grupos)
      .map((g) => ({
        ano: g.ano,
        pH: media(g.pH),
        P: media(g.P),
        K: media(g.K),
        MO: media(g.MO),
      }))
      .sort((a, b) => Number(a.ano) - Number(b.ano))
  }, [dataset])

  const serieProfundidade = useMemo(() => {
    if (!dataset) return []

    const grupos = {}

    for (const row of dataset.cq) {
      const chave = row.Profundidade || 'Não informado'

      if (!grupos[chave]) {
        grupos[chave] = { profundidade: chave, pH: [], P: [], K: [], MO: [] }
      }

      pushIfNumber(grupos[chave].pH, row.pH_H2O)
      pushIfNumber(grupos[chave].P, row.P)
      pushIfNumber(grupos[chave].K, row.K)
      pushIfNumber(grupos[chave].MO, row.M_O)
    }

    return Object.values(grupos).map((g) => ({
      profundidade: g.profundidade,
      pH: media(g.pH),
      P: media(g.P),
      K: media(g.K),
      MO: media(g.MO),
    }))
  }, [dataset])

  const serieTalhoes = useMemo(() => {
    if (!dataset) return []

    const nomesTalhao = new Map(
      dataset.unidades.map((u) => [
        Number(u.idUnidadeProducao),
        u.nomeTalhao || `Talhão ${u.idUnidadeProducao}`,
      ])
    )

    const grupos = {}

    for (const row of dataset.cq) {
      const id = Number(row.idUnidadeProducao)

      if (!grupos[id]) {
        grupos[id] = {
          talhao: nomesTalhao.get(id) || `Talhão ${id}`,
          P: [],
          K: [],
          MO: [],
        }
      }

      pushIfNumber(grupos[id].P, row.P)
      pushIfNumber(grupos[id].K, row.K)
      pushIfNumber(grupos[id].MO, row.M_O)
    }

    return Object.values(grupos)
      .map((g) => ({
        talhao: limitarTexto(g.talhao, 18),
        P: media(g.P),
        K: media(g.K),
        MO: media(g.MO),
      }))
      .sort((a, b) => (b.P ?? 0) - (a.P ?? 0))
  }, [dataset])

  const resumoQuimicoAtual = useMemo(() => {
    if (!dataset) return []

    return [
      { nome: 'pH', valor: media(dataset.cq.map((r) => Number(r.pH_H2O)).filter(Number.isFinite)) },
      { nome: 'P', valor: media(dataset.cq.map((r) => Number(r.P)).filter(Number.isFinite)) },
      { nome: 'K', valor: media(dataset.cq.map((r) => Number(r.K)).filter(Number.isFinite)) },
      { nome: 'M.O', valor: media(dataset.cq.map((r) => Number(r.M_O)).filter(Number.isFinite)) },
      { nome: 'CTC', valor: media(dataset.cq.map((r) => Number(r.CTC)).filter(Number.isFinite)) },
      { nome: 'Ca', valor: media(dataset.cq.map((r) => Number(r.Ca)).filter(Number.isFinite)) },
      { nome: 'Mg', valor: media(dataset.cq.map((r) => Number(r.Mg)).filter(Number.isFinite)) },
      { nome: 'pH_kcl', valor: media(dataset.cq.map((r) => Number(r.pH_kcl)).filter(Number.isFinite)) },
      { nome: 'pH_CaCl2', valor: media(dataset.cq.map((r) => Number(r.pH_CaCl2)).filter(Number.isFinite)) },
      { nome: 'Na', valor: media(dataset.cq.map((r) => Number(r.Na)).filter(Number.isFinite)) },
      { nome: 'Al', valor: media(dataset.cq.map((r) => Number(r.Al)).filter(Number.isFinite)) },
      { nome: 'H_Al', valor: media(dataset.cq.map((r) => Number(r.H_Al)).filter(Number.isFinite)) },
      { nome: 'S', valor: media(dataset.cq.map((r) => Number(r.S)).filter(Number.isFinite)) },
      { nome: 'Soma_Bases', valor: media(dataset.cq.map((r) => Number(r.Soma_Bases)).filter(Number.isFinite)) },
      { nome: 'Sat_Bases', valor: media(dataset.cq.map((r) => Number(r.Sat_Bases)).filter(Number.isFinite)) },
      { nome: 'Sat_Al', valor: media(dataset.cq.map((r) => Number(r.Sat_Al)).filter(Number.isFinite)) },
    ].map((item) => ({
      ...item,
      valor: item.valor == null ? null : Number(item.valor.toFixed(2)),
    }))
  }, [dataset])

  const resumoTalhoes = useMemo(() => {
  if (!dataset) return []

  const nomesTalhao = new Map(
    dataset.unidades.map((u) => [
      Number(u.idUnidadeProducao),
      u.nomeTalhao || `Talhão ${u.idUnidadeProducao}`,
    ])
  )

  const talhoes = new Map()

  for (const unidade of dataset.unidades) {
    const idUnidade = Number(unidade.idUnidadeProducao)
    if (!Number.isFinite(idUnidade)) continue

    talhoes.set(idUnidade, {
      idUnidadeProducao: idUnidade,
      nomeTalhao: nomesTalhao.get(idUnidade) || `Talhão ${idUnidade}`,
      quantidadeGrids: 0,
      corResumo: 'verde',
      grids: [],
      totalAlertas: 0,
      prioridade: 'baixa',
    })
  }

  const gridsPorTalhao = new Map()

  for (const row of dataset.grids) {
    const idUnidade = Number(row.idUnidadeProducao)
    if (!talhoes.has(idUnidade)) continue

    if (!gridsPorTalhao.has(idUnidade)) {
      gridsPorTalhao.set(idUnidade, new Map())
    }

    const mapaGrids = gridsPorTalhao.get(idUnidade)
    const rawGridId = getGridId(row)
    const gridId =
      rawGridId != null
        ? String(rawGridId)
        : `grid-sem-id-${mapaGrids.size + 1}`

    if (!mapaGrids.has(gridId)) {
      mapaGrids.set(gridId, {
        idGrid: gridId,
        nomeGrid: getGridLabel(row),
        corGrid: getGridColor(row),
        alertas: [],
      })
    } else {
      const existente = mapaGrids.get(gridId)

      if (
        !existente.nomeGrid ||
        existente.nomeGrid === 'Grid não identificado'
      ) {
        existente.nomeGrid = getGridLabel(row)
      }

      if (!existente.corGrid) {
        existente.corGrid = getGridColor(row)
      }
    }
  }

  for (const row of dataset.fert) {
    const idUnidade = Number(row.idUnidadeProducao)
    if (!talhoes.has(idUnidade)) continue

    if (!gridsPorTalhao.has(idUnidade)) {
      gridsPorTalhao.set(idUnidade, new Map())
    }

    const mapaGrids = gridsPorTalhao.get(idUnidade)
    const rawGridId = getGridId(row)
    const gridId =
      rawGridId != null
        ? String(rawGridId)
        : `grid-fallback-${mapaGrids.size + 1}`

    if (!mapaGrids.has(gridId)) {
      mapaGrids.set(gridId, {
        idGrid: gridId,
        nomeGrid: getGridLabel(row),
        corGrid: getGridColor(row),
        alertas: [],
      })
    }

    const grid = mapaGrids.get(gridId)

    const regras = [
      {
        nome: 'P',
        valor: Number(row.P),
        min: Number(row.vlr_minimo_P),
        max: Number(row.vlr_maximo_P),
      },
      {
        nome: 'K',
        valor: Number(row.K),
        min: Number(row.vlr_minimo_K),
        max: Number(row.vlr_maximo_K),
      },
      {
        nome: 'M',
        valor: Number(row.M),
        min: Number(row.vlr_minimo_M),
        max: Number(row.vlr_maximo_M),
      },
      {
        nome: 'V',
        valor: Number(row.V),
        min: Number(row.vlr_minimo_V),
        max: Number(row.vlr_maximo_V),
      },
    ]

    if (!grid.valores) grid.valores = {}
    for (const r of regras) {
      if (Number.isFinite(r.valor)) {
        grid.valores[r.nome] = { valor: r.valor, min: r.min, max: r.max }
      }
    }


    for (const r of regras) {
      if (!Number.isFinite(r.valor)) continue

      if (Number.isFinite(r.min) && r.valor < r.min) {
        grid.alertas.push({
          tipo: 'baixo',
          nutriente: r.nome,
          mensagem: `${r.nome} abaixo do ideal`,
          valor: r.valor,
          referencia: r.min,
        })
      } else if (Number.isFinite(r.max) && r.valor > r.max) {
        grid.alertas.push({
          tipo: 'alto',
          nutriente: r.nome,
          mensagem: `${r.nome} acima do ideal`,
          valor: r.valor,
          referencia: r.max,
        })
      }
    }
  }

  const resultado = [...talhoes.values()]
    .map((talhao) => {
      const mapaGrids =
        gridsPorTalhao.get(talhao.idUnidadeProducao) || new Map()

      const grids = [...mapaGrids.values()]
        .map((grid) => {
          const unicos = new Map()

          for (const alerta of grid.alertas) {
            const chave = `${alerta.nutriente}-${alerta.tipo}`
            if (!unicos.has(chave)) {
              unicos.set(chave, alerta)
            }
          }

          const alertas = [...unicos.values()]
          const corGrid = grid.corGrid || getCorResumoPorAlertas(alertas)

          return {
            ...grid,
            corGrid,
            alertas,
          }
        })
        .sort((a, b) => b.alertas.length - a.alertas.length)

      const contadorCores = {}

      for (const grid of grids) {
        const cor = normalizeText(grid.corGrid || 'nao definido')
        contadorCores[cor] = (contadorCores[cor] || 0) + 1
      }

      let corResumo = 'verde'
      let maior = -1

      for (const [cor, quantidade] of Object.entries(contadorCores)) {
        if (quantidade > maior) {
          maior = quantidade
          corResumo = cor
        }
      }

      const totalAlertas = grids.reduce(
      (acc, grid) => acc + grid.alertas.length,
      0
    )

      const scoreTalhao = grids.length
      ? grids.reduce(
            (acc, grid) => acc + getScoreClassificacao(grid.alertas.length).score,
            0
          ) / grids.length
      : 0

      const gridsCriticos = grids.filter(
        (grid) => getScoreClassificacao(grid.alertas.length).score >= 3
      ).length

      let prioridade = 'baixa'
      if (scoreTalhao >= 2.2 || gridsCriticos >= Math.ceil(grids.length * 0.3)) {
        prioridade = 'alta'
      } else if (scoreTalhao >= 1.2) {
        prioridade = 'media'
      }

      if (totalAlertas > 20) prioridade = 'alta'
      else if (totalAlertas > 5) prioridade = 'media'

      return {
        ...talhao,
        grids,
        quantidadeGrids: grids.length,
        corResumo,
        totalAlertas,
        prioridade,
        scoreMedio: Number(scoreTalhao.toFixed(2)),
        gridsCriticos,
      }
    })
    .filter((talhao) => talhao.quantidadeGrids > 0 || talhao.totalAlertas > 0)
    .sort((a, b) => b.totalAlertas - a.totalAlertas)

  return resultado
}, [dataset])

  const abrirModalTalhao = (talhao) => setModalTalhao(talhao)
  const fecharModalTalhao = () => setModalTalhao(null)

  if (loading) {
    return (
      <div style={styles.infoPanel}>
        <div style={styles.infoPanelTitulo}>📋 Informações — {fazenda.nome_Fazenda}</div>
        <div style={styles.infoPanelNote}>Carregando análises da propriedade...</div>
      </div>
    )
  }

  if (erro) {
    return (
      <div style={styles.infoPanel}>
        <div style={styles.infoPanelTitulo}>📋 Informações — {fazenda.nome_Fazenda}</div>
        <div style={{ ...styles.infoPanelNote, color: '#c62828' }}>{erro}</div>
      </div>
    )
  }

  if (!dataset) return null

  return (
    <div style={styles.infoPanel}>
      <div style={styles.infoPanelHeader}>
        <span style={styles.infoPanelTitulo}>📋 Informações — {fazenda.nome_Fazenda}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={styles.badge}>
            {ano ? `Ano ${ano}` : 'Visão consolidada'}
          </span>
          <button
            type="button"
            style={styles.relatorioBtn}
            onClick={() => gerarRelatorio({
              fazenda,
              nomeProprietario: nomeProprietario ?? '—',
              ultimaAnalise: resumo?.ultimaAnalise,
            })}
          >
            ⬇ Emitir relatório
          </button>
        </div>
      </div>

      <div id={`terreno-${fazenda.idPropriedade}`}>
        <div style={styles.infoPanelGrid}>
          <InfoCard label="Área total" value={formatHa(resumo?.areaTotal)} />
          <InfoCard label="Talhões" value={resumo?.totalTalhoes ?? '—'} />
          <InfoCard label="Grids" value={resumo?.totalGrids ?? '—'} />
          <InfoCard label="Grids com alerta" value={resumo?.gridsComAlerta ?? '—'} />
          <InfoCard label="Grids críticos" value={resumo?.gridsCriticos ?? '—'} />
          <div style={{ position: 'relative' }}>
            <InfoCard
              label="% área crítica real"
              value={`${resumo?.percentualCriticoReal?.toFixed(1) ?? 0}%`}
            />
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <InfoTooltip text="Percentual da área total do talhão que está em condição crítica com base nas análises de solo." />
            </div>
          </div>
          <InfoCard label="Score médio" value={formatNumber(resumo?.scoreMedio)} />
          <InfoCard label="Última análise" value={formatDate(resumo?.ultimaAnalise)} />
        </div>

        <div style={{ ...styles.infoPanelGrid, marginTop: 16 }}>
          <InfoCard label="pH médio" value={formatNumber(resumo?.pH)} />
          <InfoCard label="P médio" value={formatNumber(resumo?.P)} sublabel="Fósforo" />
          <InfoCard label="K médio" value={formatNumber(resumo?.K)} sublabel="Potássio" />
          <InfoCard label="M.O média" value={formatNumber(resumo?.MO)} sublabel="Matéria Orgânica" />
        </div>
      </div>

      <div id={`talhoes-${fazenda.idPropriedade}`}>
      <Section title="Relatório de talhões">
        {resumoTalhoes.length ? (
          <div style={styles.subcardsGrid}>
            {resumoTalhoes.map((talhao) => {
              const corStyle = getGridColorStyle(talhao.corResumo)
              const isSelected = String(talhaoSelecionado) === String(talhao.idUnidadeProducao)

              return (
                <div
                  key={talhao.idUnidadeProducao}
                  ref={el => { talhaoCardRefs.current[talhao.idUnidadeProducao] = el }}
                  style={{
                    ...styles.subcard,
                    ...(isSelected ? { border: '2px solid #1a1a2e', background: '#f0f4ff' } : {}),
                  }}
                >
                  <div style={styles.subcardHeader}>
                    <div>
                      <div style={styles.subcardTitle}>{talhao.nomeTalhao}</div>
                      <div style={styles.subcardMeta}>
                        Score médio: <strong>{formatNumber(talhao.scoreMedio)}</strong> • Grids críticos: <strong>{talhao.gridsCriticos}</strong>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        marginTop: '4px',
                        color: talhao.prioridade === 'alta' ? '#c62828'
                          : talhao.prioridade === 'media' ? '#ef6c00'
                          : '#2e7d32',
                      }}>
                        Prioridade: {talhao.prioridade.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ ...styles.colorBadge, ...corStyle }}>
                      Resumo geral: {getGridColorLabel(talhao.corResumo)}
                    </div>
                  </div>

                  <div style={styles.subcardActions}>
                    <button
                      type="button"
                      style={styles.actionButton}
                      onClick={() => abrirModalTalhao(talhao)}
                    >
                      Detalhes do talhão ›
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={styles.infoPanelNote}>
            Nenhum dado de talhão/grid encontrado para os filtros atuais.
          </div>
        )}

        {/* Modal flutuante de detalhes */}
        {modalTalhao && (
          <TalhaoModal talhao={modalTalhao} onClose={fecharModalTalhao} />
        )}
      </Section>
      </div>

      <div id={`solo-${fazenda.idPropriedade}`}>
        <AnaliseQuimica
          idPropriedade={fazenda.idPropriedade}
          // apiBaseUrl={apiBaseUrl}
        />

        <Section title="Evolução temporal dos indicadores">
          <ChartBox>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={serieTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis />
                <Tooltip formatter={(value) => value ?? '—'} />
                <Legend />
                <Line type="monotone" dataKey="pH" name="Potencial Hidrogeniônico (pH)" stroke="#1a1a2e" strokeWidth={2} />
                <Line type="monotone" dataKey="P" name="Fósforo (P)" stroke="#2e7d32" strokeWidth={2} />
                <Line type="monotone" dataKey="K" name="Potássio (K)" stroke="#ef6c00" strokeWidth={2} />
                <Line type="monotone" dataKey="MO" name="Matéria Orgânica (MO)" stroke="#6a1b9a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </Section>

        <div style={styles.chartGrid}>
          <Section title="Perfil do solo por profundidade">
            <PerfilSolo serieProfundidade={serieProfundidade} />
          </Section>

          <Section title="Comparativo entre talhões">
            <ComparativoTalhoes serieTalhoes={serieTalhoes} />
          </Section>
        </div>

        <Section title="Resumo químico médio atual">
          <ResumoQuimico resumoQuimicoAtual={resumoQuimicoAtual} />
        </Section>
      </div>
    </div>
  )
}

// ============================================================================
// SUB COMPONENTS
// ============================================================================

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function ChartBox({ children }) {
  return <div style={styles.chartBox}>{children}</div>
}

function InfoCard({ label, value, sublabel }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoCardValue}>{value}</div>
      <div style={styles.infoCardLabel}>{label}</div>
      {sublabel && <div style={styles.infoCardSublabel}>{sublabel}</div>}
    </div>
  )
}

// ============================================================================
// TALHAO MODAL
// ============================================================================

const NUTRIENTES_META = [
  { key: 'P', nome: 'Fósforo',          unidade: 'mg/dm³' },
  { key: 'K', nome: 'Potássio',         unidade: 'mg/dm³' },
  { key: 'M', nome: 'Matéria Orgânica', unidade: 'dag/kg' },
  { key: 'V', nome: 'Sat. de Bases',    unidade: '%'      },
]

function GridDetailCard({ grid }) {
  const scoreInfo = getScoreClassificacao(grid.alertas.length)
  const porNutriente = {}
  for (const a of grid.alertas) {
    if (!porNutriente[a.nutriente]) porNutriente[a.nutriente] = []
    porNutriente[a.nutriente].push(a)
  }

  return (
    <div style={mStyles.gridCard}>
      {/* Cabeçalho do grid */}
      <div style={mStyles.gridCardHeader}>
        <span style={mStyles.gridCardTitle}>{grid.nomeGrid}</span>
        <span style={{ ...mStyles.colorBadge, ...getGridColorStyle(grid.corGrid) }}>
          {getGridColorLabel(grid.corGrid)}
        </span>
      </div>

      <div style={{ ...mStyles.scoreBadge, ...getScoreBadgeStyle(scoreInfo.score) }}>
        Score {scoreInfo.score} · {scoreInfo.label}
      </div>

      {/* Nutrientes */}
      <div style={mStyles.nutrientesWrap}>
        {NUTRIENTES_META.map(({ key, nome, unidade }) => {
          const alertas  = porNutriente[key] || []
          const temBaixo = alertas.some(a => a.tipo === 'baixo')
          const temAlto  = alertas.some(a => a.tipo === 'alto')
          const dados    = grid.valores?.[key]

          let bg = '#f0fdf4', corTexto = '#166534', bordaCor = '#bbf7d0'
          let statusLabel = 'Dentro do ideal'
          let statusIcon  = '✓'
          let refTexto    = null

          if (temBaixo && !temAlto) {
            bg = '#fefce8'; corTexto = '#854d0e'; bordaCor = '#fde68a'
            statusLabel = 'Deficiência'
            statusIcon  = '↓'
          } else if (temAlto && !temBaixo) {
            bg = '#fff1f2'; corTexto = '#9f1239'; bordaCor = '#fecdd3'
            statusLabel = 'Excesso'
            statusIcon  = '↑'
          } else if (temBaixo && temAlto) {
            bg = '#f3f4f6'; corTexto = '#374151'; bordaCor = '#d1d5db'
            statusLabel = 'Conflito'
            statusIcon  = '?'
          }

          if (dados) {
            const valorFmt = `${formatNumber(dados.valor)} ${unidade}`
            if (temBaixo && Number.isFinite(dados.min)) {
              refTexto = `${valorFmt} · ideal ≥ ${formatNumber(dados.min)}`
            } else if (temAlto && Number.isFinite(dados.max)) {
              refTexto = `${valorFmt} · ideal ≤ ${formatNumber(dados.max)}`
            } else {
              refTexto = valorFmt
            }
          }

          return (
            <div key={key} style={{ background: bg, border: `1px solid ${bordaCor}`, borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: bordaCor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: corTexto, flexShrink: 0 }}>
                {statusIcon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: corTexto }}>
                  {nome} <span style={{ opacity: 0.55, fontWeight: 400 }}>({key})</span>
                  <span style={{ float: 'right', fontWeight: 400 }}>{statusLabel}</span>
                </div>
                {refTexto && (
                  <div style={{ fontSize: 10, color: corTexto, opacity: 0.7, marginTop: 2 }}>{refTexto}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TalhaoModal({ talhao, onClose }) {
  const corStyle = getGridColorStyle(talhao.corResumo)
  const scoreInfo = getScoreClassificacao(talhao.scoreMedio)

  // colunas de até 5 grids
  const GRIDS_POR_COLUNA = 5
  const grids = talhao.grids || []
  const numColunas = Math.max(1, Math.ceil(grids.length / GRIDS_POR_COLUNA))
  const colunas = Array.from({ length: numColunas }, (_, col) =>
    grids.slice(col * GRIDS_POR_COLUNA, (col + 1) * GRIDS_POR_COLUNA)
  )

  // fechar com Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={mStyles.overlay} onClick={onClose}>
      <div style={mStyles.dialog} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={mStyles.dialogHeader}>
          <div>
            <div style={mStyles.dialogTitle}>{talhao.nomeTalhao}</div>
            <div style={mStyles.dialogMeta}>
              Score médio: <strong>{formatNumber(talhao.scoreMedio)}</strong>
              &nbsp;·&nbsp;
              Grids: <strong>{grids.length}</strong>
              &nbsp;·&nbsp;
              Grids críticos: <strong>{talhao.gridsCriticos}</strong>
              &nbsp;·&nbsp;
              <span style={{
                color: talhao.prioridade === 'alta' ? '#c62828'
                  : talhao.prioridade === 'media' ? '#ef6c00'
                  : '#2e7d32',
                fontWeight: 700,
              }}>
                Prioridade {talhao.prioridade.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ ...mStyles.colorBadge, ...corStyle }}>
              {getGridColorLabel(talhao.corResumo)}
            </span>
            <button type="button" style={mStyles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Grids */}
        {grids.length === 0 ? (
          <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', padding: '16px 0' }}>
            Nenhum grid encontrado para este talhão.
          </div>
        ) : (
          <div style={mStyles.columnsWrap}>
            {colunas.map((colGrids, ci) => (
              <div key={ci} style={mStyles.column}>
                {colGrids.map(grid => (
                  <GridDetailCard key={`${talhao.idUnidadeProducao}-${grid.idGrid}`} grid={grid} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// estilos do modal
const mStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  },
  dialog: {
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    padding: 28,
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    minWidth: 360,
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 16,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1a1a2e',
  },
  dialogMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  closeBtn: {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '50%',
    width: 30,
    height: 30,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  colorBadge: {
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: '5px 10px',
    whiteSpace: 'nowrap',
  },
  scoreBadge: {
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: '4px 10px',
    width: 'fit-content',
  },
  columnsWrap: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    overflowX: 'auto',
  },
  column: {
    flex: '0 0 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  gridCard: {
    background: '#fafafa',
    border: '1px solid #ececec',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  gridCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1f2937',
  },
  nutrientesWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    marginTop: 2,
  },
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  infoPanel: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  infoPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  infoPanelTitulo: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1a1a2e',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '999px',
    padding: '6px 10px',
  },
  relatorioBtn: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#fff',
    background: '#1a1a2e',
    border: 'none',
    borderRadius: '999px',
    padding: '6px 14px',
    cursor: 'pointer',
  },
  infoPanelGrid: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  infoCard: {
    background: '#f7f7f7',
    borderRadius: '14px',
    padding: '16px 24px',
    textAlign: 'center',
    minWidth: '130px',
  },
  infoCardValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a1a2e',
  },
  infoCardLabel: {
    fontSize: '11px',
    color: '#aaa',
    marginTop: '4px',
  },
  infoCardSublabel: {
    fontSize: '10px',
    color: '#c0c0c0',
    marginTop: '2px',
    fontStyle: 'italic',
  },
  infoPanelNote: {
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '16px',
  },
  chartBox: {
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: '16px',
    padding: '16px',
  },
  subcardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  subcard: {
    background: '#fafafa',
    border: '1px solid #ececec',
    borderRadius: '18px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  subcardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  subcardTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subcardMeta: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  subcardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  actionButton: {
    background: '#f3f4f6',
    color: '#1a1a2e',
    border: '1px solid #e5e7eb',
    borderRadius: '999px',
    padding: '7px 12px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  scoreBadge: {
  fontSize: '11px',
  fontWeight: '700',
  borderRadius: '999px',
  padding: '6px 10px',
  width: 'fit-content',
  },
  colorBadge: {
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '999px',
    padding: '6px 10px',
    whiteSpace: 'nowrap',
  },
  gridDetailsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  gridDetailCard: {
    background: '#ffffff',
    border: '1px solid #ececec',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  gridDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  gridDetailTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1f2937',
  },
  alertGridInterna: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
  },
  alertCard: {
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid transparent',
  },
  alertWarn: {
    background: '#fff8e1',
    borderColor: '#ffe082',
  },
  alertHigh: {
    background: '#ffebee',
    borderColor: '#ef9a9a',
  },
  alertTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '4px',
  },
  alertText: {
    fontSize: '11px',
    color: '#666',
  },
}