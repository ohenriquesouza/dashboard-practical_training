import { useEffect, useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as RechartTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

// ── helpers ───────────────────────────────────────────────────────────────────

function scoreCategoria(n) {
  if (n <= 0) return { score: 0, label: 'Saudável', cor: '#22c55e' }
  if (n === 1) return { score: 1, label: 'Leve',     cor: '#eab308' }
  if (n === 2) return { score: 2, label: 'Moderado', cor: '#f97316' }
  return          { score: 3, label: 'Crítico',   cor: '#ef4444' }
}

function formatHa(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${n.toFixed(0)} ha` : '—'
}

function formatDate(d) {
  if (!d || d === 'NaT') return '—'
  const p = String(d).split('-')
  return p.length === 3 ? `${p[2].slice(0, 2)}/${p[1]}/${p[0]}` : d
}

const CHECKS = [
  { n: 'P', field: 'P', min: 'vlr_minimo_P', max: 'vlr_maximo_P' },
  { n: 'K', field: 'K', min: 'vlr_minimo_K', max: 'vlr_maximo_K' },
  { n: 'M', field: 'M', min: 'vlr_minimo_M', max: 'vlr_maximo_M' },
  { n: 'V', field: 'V', min: 'vlr_minimo_V', max: 'vlr_maximo_V' },
]

const DIST_ORDER  = ['Saudável', 'Leve', 'Moderado', 'Crítico']
const DIST_COLORS = ['#22c55e',  '#eab308', '#f97316', '#ef4444']
const POR_PAGINA  = 5

// ── component ─────────────────────────────────────────────────────────────────

export default function PainelResumoProprietario({ proprietario, fazendas = [] }) {
  const [allData, setAllData]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [pagina, setPagina]     = useState(0)

  useEffect(() => {
    if (!proprietario?.idProprietario) return
    setLoading(true)
    setPagina(0)
    fetch(`/api/all?idProprietario=${proprietario.idProprietario}`)
      .then(r => r.json())
      .then(json => { setAllData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [proprietario?.idProprietario])

  const analise = useMemo(() => {
    if (!allData) return null

    const fert = allData.VW_DASH_FERTILIDADE_SOLO?.data ?? []

    // ── grids individuais (chave composta para não colidir entre talhões) ─────
    const gridMap = new Map()

    // ── talhões agregados (para a lista de atenção) ───────────────────────────
    const talhaoMap = new Map()

    for (const row of fert) {
      const gid = `${row.idUnidadeProducao}-${row.idGrid ?? 'x'}`
      const tid = String(row.idUnidadeProducao ?? 'x')

      // ── nível grid ──────────────────────────────────────────────────────────
      if (!gridMap.has(gid)) {
        gridMap.set(gid, { vistos: new Set(), alertas: 0 })
      }
      const g = gridMap.get(gid)

      // ── nível talhão ────────────────────────────────────────────────────────
      if (!talhaoMap.has(tid)) {
        talhaoMap.set(tid, {
          tid,
          fazenda:      row.nome_fazenda || '—',
          talhao:       row.nomeTalhao   || '—',
          vistos:       new Set(),
          detalhes:     [],
          gridsUnicos:  new Set(),
        })
      }
      const t = talhaoMap.get(tid)
      if (row.idGrid) t.gridsUnicos.add(String(row.idGrid))

      for (const c of CHECKS) {
        const v   = Number(row[c.field])
        const min = Number(row[c.min])
        const max = Number(row[c.max])
        if (!Number.isFinite(v)) continue

        let tipo = null
        if (Number.isFinite(min) && v < min) tipo = 'baixo'
        else if (Number.isFinite(max) && v > max) tipo = 'alto'
        if (!tipo) continue

        const key = `${c.n}-${tipo}`

        // conta no grid (para KPIs e donut)
        if (!g.vistos.has(key)) { g.vistos.add(key); g.alertas++ }

        // agrega no talhão (para a lista)
        if (!t.vistos.has(key)) { t.vistos.add(key); t.detalhes.push({ n: c.n, tipo }) }
      }
    }

    // ── métricas por grid ─────────────────────────────────────────────────────
    const grids = [...gridMap.values()].map(g => scoreCategoria(g.alertas))

    const totalGrids     = grids.length
    const gridsComAlerta = grids.filter(g => g.score > 0).length
    const gridsCriticos  = grids.filter(g => g.score >= 3).length
    const scoreMedio     = totalGrids
      ? grids.reduce((a, g) => a + g.score, 0) / totalGrids
      : 0

    const areaTotal = fazendas.reduce((s, f) => s + (Number(f.areaTotal) || 0), 0)

    const ultimaAnalise = fert.map(r => r.DT_FIM_Ensaios).filter(Boolean).sort().at(-1)

    // ── donut ─────────────────────────────────────────────────────────────────
    const contagem = { Saudável: 0, Leve: 0, Moderado: 0, Crítico: 0 }
    for (const g of grids) contagem[g.label] = (contagem[g.label] || 0) + 1

    const dist = DIST_ORDER
      .map((name, i) => ({ name, value: contagem[name] || 0 }))
      .filter(d => d.value > 0)

    // ── comparativo por fazenda ───────────────────────────────────────────────
    const fazMap = new Map()
    for (const g of grids) {
      // not ideal — we lost the fazenda reference at grid level
      // use talhaoMap to get fazenda names per group
    }
    // rebuild from talhaoMap
    const fazMapB = new Map()
    for (const [, t] of talhaoMap) {
      if (!fazMapB.has(t.fazenda)) fazMapB.set(t.fazenda, { scores: [], criticos: 0 })
      const f = fazMapB.get(t.fazenda)
      const sc = scoreCategoria(t.detalhes.length)
      f.scores.push(sc.score)
      if (sc.score >= 3) f.criticos++
    }
    const comparativo = [...fazMapB.entries()]
      .map(([nome, f]) => ({
        fazenda:    nome.length > 14 ? nome.slice(0, 14) + '…' : nome,
        nomeFull:   nome,
        scoreMedio: f.scores.length
          ? +(f.scores.reduce((a, b) => a + b, 0) / f.scores.length).toFixed(2)
          : 0,
        criticos:   f.criticos,
        grids:      f.scores.length,
      }))
      .sort((a, b) => b.scoreMedio - a.scoreMedio)

    // ── top talhões com alerta (1 entrada por talhão) ─────────────────────────
    const topAlertas = [...talhaoMap.values()]
      .map(t => {
        const sc = scoreCategoria(t.detalhes.length)
        return { ...t, ...sc, totalGrids: t.gridsUnicos.size }
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.detalhes.length - a.detalhes.length || b.score - a.score)

    return {
      totalGrids, gridsComAlerta, gridsCriticos, scoreMedio,
      areaTotal, ultimaAnalise, dist, comparativo, topAlertas,
    }
  }, [allData, fazendas])

  const totalPaginas = analise ? Math.ceil(analise.topAlertas.length / POR_PAGINA) : 0
  const alertasPagina = analise
    ? analise.topAlertas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)
    : []

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.painel}>
      <div style={styles.titulo}>Visão geral — {proprietario?.Nome ?? '—'}</div>

      {loading && <div style={styles.nota}>Carregando dados consolidados…</div>}
      {!loading && !analise && <div style={styles.nota}>Nenhum dado disponível.</div>}

      {analise && (
        <div style={styles.scroll}>
          {/* KPIs */}
          <div style={styles.kpiRow}>
            <Kpi label="Área total"       value={formatHa(analise.areaTotal)} />
            <Kpi label="Fazendas"         value={fazendas.length} />
            <Kpi label="Grids"            value={analise.totalGrids} />
            <Kpi
              label="Em alerta"
              value={`${analise.gridsComAlerta} (${analise.totalGrids ? Math.round(analise.gridsComAlerta / analise.totalGrids * 100) : 0}%)`}
              destaque={analise.gridsComAlerta > 0}
            />
            <Kpi label="Críticos"         value={analise.gridsCriticos}            destaque={analise.gridsCriticos > 0} />
            <Kpi label="Score médio"      value={analise.scoreMedio.toFixed(2)} />
            <Kpi label="Última análise"   value={formatDate(analise.ultimaAnalise)} />
          </div>

          {/* Charts */}
          <div style={styles.chartsRow}>
            <div style={styles.chartCard}>
              <div style={styles.chartTitulo}>Saúde dos grids</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={analise.dist} cx="50%" cy="50%"
                    innerRadius={36} outerRadius={58}
                    dataKey="value" paddingAngle={2}
                  >
                    {analise.dist.map((d) => (
                      <Cell key={d.name} fill={DIST_COLORS[DIST_ORDER.indexOf(d.name)]} />
                    ))}
                  </Pie>
                  <RechartTooltip formatter={(v, name) => [`${v} grids`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.legendaRow}>
                {analise.dist.map(d => (
                  <span key={d.name} style={styles.legendaItem}>
                    <span style={{ ...styles.legendaDot, background: DIST_COLORS[DIST_ORDER.indexOf(d.name)] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            {analise.comparativo.length > 1 && (
              <div style={styles.chartCard}>
                <div style={styles.chartTitulo}>Score médio por fazenda</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={analise.comparativo} layout="vertical"
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 3]} tick={{ fontSize: 10 }} tickCount={4} />
                    <YAxis type="category" dataKey="fazenda" tick={{ fontSize: 10 }} width={80} />
                    <RechartTooltip
                      formatter={(v, _, p) => [
                        `Score: ${v} · ${p.payload.grids} talhões · ${p.payload.criticos} críticos`,
                        p.payload.nomeFull,
                      ]}
                    />
                    <Bar dataKey="scoreMedio" radius={[0, 4, 4, 0]}>
                      {analise.comparativo.map((e, i) => (
                        <Cell key={i} fill={
                          e.scoreMedio >= 2.5 ? '#ef4444'
                          : e.scoreMedio >= 1.5 ? '#f97316'
                          : e.scoreMedio >= 0.5 ? '#eab308'
                          : '#22c55e'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top alertas por talhão */}
          {analise.topAlertas.length > 0 && (
            <div style={styles.alertasSection}>
              <div style={styles.alertasHeader}>
                <div style={styles.chartTitulo}>
                  Talhões que precisam de atenção
                  <span style={styles.totalBadge}>{analise.topAlertas.length}</span>
                </div>
                {totalPaginas > 1 && (
                  <div style={styles.paginacao}>
                    <button
                      style={styles.pgBtn}
                      disabled={pagina === 0}
                      onClick={() => setPagina(p => p - 1)}
                    >‹</button>
                    <span style={styles.pgLabel}>{pagina + 1} / {totalPaginas}</span>
                    <button
                      style={styles.pgBtn}
                      disabled={pagina >= totalPaginas - 1}
                      onClick={() => setPagina(p => p + 1)}
                    >›</button>
                  </div>
                )}
              </div>

              <div style={styles.alertasList}>
                {alertasPagina.map(t => (
                  <div key={t.tid} style={styles.alertaRow}>
                    <div style={{
                      ...styles.alertaScore,
                      background: t.cor + '22',
                      color: t.cor,
                      border: `1px solid ${t.cor}55`,
                    }}>
                      {t.label}
                    </div>

                    <div style={styles.alertaInfo}>
                      <span style={styles.alertaFazenda}>{t.fazenda}</span>
                      <span style={styles.alertaSep}>›</span>
                      <span style={styles.alertaTalhao}>{t.talhao}</span>
                      {t.totalGrids > 1 && (
                        <span style={styles.gridCount}>{t.totalGrids} grids</span>
                      )}
                    </div>

                    <div style={styles.alertaNutrientes}>
                      {t.detalhes.map(d => (
                        <span key={`${d.n}-${d.tipo}`} style={{
                          ...styles.nutriBadge,
                          background: d.tipo === 'alto' ? '#fef2f2' : '#fefce8',
                          color:      d.tipo === 'alto' ? '#b91c1c' : '#854d0e',
                          border:     `1px solid ${d.tipo === 'alto' ? '#fecaca' : '#fde68a'}`,
                        }}>
                          {d.n}{d.tipo === 'alto' ? '↑' : '↓'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, destaque = false }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiValor, color: destaque ? '#ef4444' : '#1a1a2e' }}>{value}</div>
      <div style={styles.kpiLabel}>{label}</div>
    </div>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = {
  painel: {
    flex: 1,
    minWidth: 340,
    maxHeight: 'calc(100vh - 80px)',
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '20px 20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1a1a2e',
    paddingBottom: 14,
    borderBottom: '1px solid #f0f0f0',
    flexShrink: 0,
  },
  nota: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
    padding: '12px 0',
  },
  scroll: {
    overflowY: 'auto',
    flex: 1,
    paddingBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingTop: 14,
  },

  // KPIs
  kpiRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    background: '#f7f7f7',
    borderRadius: 12,
    padding: '10px 12px',
    minWidth: 80,
    flex: '1 1 80px',
    textAlign: 'center',
  },
  kpiValor: {
    fontSize: 16,
    fontWeight: 800,
  },
  kpiLabel: {
    fontSize: 9,
    color: '#aaa',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Charts
  chartsRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  chartCard: {
    flex: '1 1 180px',
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: 12,
    padding: '10px 8px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  chartTitulo: {
    fontSize: 11,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3px 8px',
    justifyContent: 'center',
  },
  legendaItem: {
    fontSize: 10,
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  legendaDot: {
    width: 6, height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },

  // Alertas
  alertasSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  alertasHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBadge: {
    fontSize: 10,
    fontWeight: 700,
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 999,
    padding: '1px 7px',
  },
  paginacao: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  pgBtn: {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    width: 24, height: 24,
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    color: '#374151',
  },
  pgLabel: {
    fontSize: 10,
    color: '#6b7280',
    minWidth: 36,
    textAlign: 'center',
  },
  alertasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  alertaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: 10,
    flexWrap: 'wrap',
  },
  alertaScore: {
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 999,
    padding: '2px 8px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  alertaInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 100,
  },
  alertaFazenda: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1f2937',
  },
  alertaSep: {
    fontSize: 10,
    color: '#9ca3af',
  },
  alertaTalhao: {
    fontSize: 11,
    color: '#6b7280',
  },
  gridCount: {
    fontSize: 9,
    color: '#9ca3af',
    background: '#f3f4f6',
    borderRadius: 999,
    padding: '1px 6px',
  },
  alertaNutrientes: {
    display: 'flex',
    gap: 3,
    flexWrap: 'wrap',
  },
  nutriBadge: {
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 6,
    padding: '2px 5px',
  },
}
