import { useMemo } from 'react'

// ============================================================================
// ORDEM CANÔNICA DAS PROFUNDIDADES (topo → base do solo)
// ============================================================================
const ORDEM_PROFUNDIDADE = ['0-20', '20-40', '40-60', '60-80', '80-100']

function normalizarProfundidade(raw) {
  if (!raw) return null
  // "0-20 cm", "0 a 20", "00-20", etc → "0-20"
  return String(raw)
    .replace(/\s*cm\s*/gi, '')
    .replace(/\s+a\s+/gi, '-')
    .replace(/^0+(\d)/, '$1')
    .trim()
}

function ordenarProfundidades(profundidades) {
  return [...profundidades].sort((a, b) => {
    const iA = ORDEM_PROFUNDIDADE.indexOf(a)
    const iB = ORDEM_PROFUNDIDADE.indexOf(b)
    if (iA !== -1 && iB !== -1) return iA - iB
    if (iA !== -1) return -1
    if (iB !== -1) return 1
    // fallback: ordenar pelo primeiro número
    const numA = parseInt(a.split('-')[0]) || 0
    const numB = parseInt(b.split('-')[0]) || 0
    return numA - numB
  })
}

// ============================================================================
// CONFIGURAÇÃO DOS NUTRIENTES
// ============================================================================
const NUTRIENTES = [
  {
    key: 'P',
    label: 'Fósforo',
    unidade: 'mg/dm³',
    cor: '#2e7d32',
    corClaro: '#e8f5e9',
    faixas: [
      { ate: 10, label: 'Baixo', cor: '#ef5350' },
      { ate: 20, label: 'Médio', cor: '#ffa726' },
      { ate: Infinity, label: 'Alto', cor: '#66bb6a' },
    ],
  },
  {
    key: 'K',
    label: 'Potássio',
    unidade: 'mmolc/dm³',
    cor: '#ef6c00',
    corClaro: '#fff3e0',
    faixas: [
      { ate: 1.5, label: 'Baixo', cor: '#ef5350' },
      { ate: 3, label: 'Médio', cor: '#ffa726' },
      { ate: Infinity, label: 'Alto', cor: '#66bb6a' },
    ],
  },
  {
    key: 'MO',
    label: 'Matéria Orgânica',
    unidade: 'g/dm³',
    cor: '#6a1b9a',
    corClaro: '#f3e5f5',
    faixas: [
      { ate: 10, label: 'Baixo', cor: '#ef5350' },
      { ate: 20, label: 'Médio', cor: '#ffa726' },
      { ate: Infinity, label: 'Alto', cor: '#66bb6a' },
    ],
  },
  {
    key: 'pH',
    label: 'pH (H₂O)',
    unidade: '',
    cor: '#0277bd',
    corClaro: '#e1f5fe',
    faixas: [
      { ate: 5.0, label: 'Ácido', cor: '#ef5350' },
      { ate: 6.0, label: 'Mod. Ácido', cor: '#ffa726' },
      { ate: 7.0, label: 'Ideal', cor: '#66bb6a' },
      { ate: Infinity, label: 'Alcalino', cor: '#42a5f5' },
    ],
  },
]

// ============================================================================
// HELPERS
// ============================================================================
function getClassificacao(valor, faixas) {
  if (valor == null) return null
  return faixas.find((f) => valor <= f.ate) || faixas[faixas.length - 1]
}

function formatVal(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—'
  const n = Number(v)
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

// ============================================================================
// SUB-COMPONENTE: Painel de um nutriente
// ============================================================================
function PainelNutriente({ nutriente, dadosPorProfundidade, profundidades }) {
  const valores = profundidades.map((p) => dadosPorProfundidade[p]?.[nutriente.key] ?? null)
  const valoresValidos = valores.filter((v) => v != null && Number.isFinite(v))
  const maxVal = valoresValidos.length ? Math.max(...valoresValidos) : 1
  const minVal = valoresValidos.length ? Math.min(...valoresValidos) : 0

  return (
    <div style={styles.painelNutriente}>
      {/* Cabeçalho */}
      <div style={styles.painelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: nutriente.cor, flexShrink: 0 }} />
          <span style={styles.painelTitulo}>{nutriente.label}</span>
        </div>
        {nutriente.unidade && (
          <span style={styles.painelUnidade}>{nutriente.unidade}</span>
        )}
      </div>

      {/* Barras horizontais por profundidade */}
      <div style={styles.barrasWrap}>
        {profundidades.map((prof, idx) => {
          const val = dadosPorProfundidade[prof]?.[nutriente.key] ?? null
          const classe = val != null ? getClassificacao(val, nutriente.faixas) : null
          const pct = (val != null && maxVal > 0) ? Math.max(4, (val / maxVal) * 100) : 0
          const isMax = val === maxVal && valoresValidos.length > 1
          const isMin = val === minVal && valoresValidos.length > 1 && val !== maxVal

          return (
            <div key={prof} style={styles.barraRow}>
              {/* Label profundidade */}
              <div style={styles.profLabel}>
                <span style={styles.profCm}>{prof}</span>
                <span style={styles.profCmSuffix}>cm</span>
              </div>

              {/* Barra */}
              <div style={styles.barraTrack}>
                <div
                  style={{
                    ...styles.barraFill,
                    width: val != null ? `${pct}%` : '0%',
                    background: classe
                      ? `linear-gradient(90deg, ${classe.cor}cc, ${classe.cor})`
                      : '#e0e0e0',
                    opacity: val != null ? 1 : 0.3,
                  }}
                />
              </div>

              {/* Valor */}
              <div style={styles.barraValor}>
                <span style={{
                  ...styles.valorNum,
                  color: classe?.cor || '#999',
                  fontWeight: isMax ? 800 : isMin ? 400 : 600,
                }}>
                  {formatVal(val)}
                </span>
                {classe && val != null && (
                  <span style={{
                    ...styles.valorTag,
                    background: classe.cor + '22',
                    color: classe.cor,
                    border: `1px solid ${classe.cor}44`,
                  }}>
                    {classe.label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mini-escala */}
      {valoresValidos.length > 0 && (
        <div style={styles.escala}>
          <span style={styles.escalaMin}>0</span>
          <div style={styles.escalaBar}>
            {nutriente.faixas.map((f, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '100%',
                  background: f.cor + '55',
                  borderRight: i < nutriente.faixas.length - 1 ? '1px solid #fff' : 'none',
                }}
                title={f.label}
              />
            ))}
          </div>
          <span style={styles.escalaMax}>{formatVal(maxVal)}</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function PerfilSolo({ serieProfundidade }) {
  // serieProfundidade: [{ profundidade: '0-20', P: 12.3, K: 2.1, MO: 15, pH: 5.8 }, ...]

  const { dadosPorProfundidade, profundidades } = useMemo(() => {
    if (!serieProfundidade?.length) return { dadosPorProfundidade: {}, profundidades: [] }

    const mapa = {}
    const profsVistas = new Set()

    for (const row of serieProfundidade) {
      const prof = normalizarProfundidade(row.profundidade)
      if (!prof) continue
      profsVistas.add(prof)
      mapa[prof] = {
        P: row.P ?? null,
        K: row.K ?? null,
        MO: row.MO ?? null,
        pH: row.pH ?? null,
      }
    }

    const profOrdenadas = ordenarProfundidades([...profsVistas])
    return { dadosPorProfundidade: mapa, profundidades: profOrdenadas }
  }, [serieProfundidade])

  if (!profundidades.length) {
    return (
      <div style={styles.semDados}>
        Nenhum dado de profundidade disponível.
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Indicador visual de perfil do solo */}
      <div style={styles.soilProfileAside}>
        <div style={styles.soilLegendLabel}>Perfil</div>
        {profundidades.map((prof, idx) => {
          const camadas = [
            { cor: '#c8a96e', nome: 'A' },
            { cor: '#a0785a', nome: 'A/B' },
            { cor: '#8b6348', nome: 'B' },
            { cor: '#7a5540', nome: 'B/C' },
            { cor: '#6d4c3a', nome: 'C' },
          ]
          const camada = camadas[idx] || camadas[camadas.length - 1]
          const altura = (1 / profundidades.length) * 100

          return (
            <div
              key={prof}
              title={`${prof} cm — Horizonte ${camada.nome}`}
              style={{
                flex: 1,
                background: camada.cor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                borderBottom: idx < profundidades.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                position: 'relative',
              }}
            >
              {camada.nome}
            </div>
          )
        })}
      </div>

      {/* Grid de nutrientes */}
      <div style={styles.nutrientesGrid}>
        {NUTRIENTES.map((n) => (
          <PainelNutriente
            key={n.key}
            nutriente={n}
            dadosPorProfundidade={dadosPorProfundidade}
            profundidades={profundidades}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// STYLES
// ============================================================================
const styles = {
  container: {
    display: 'flex',
    gap: 12,
    alignItems: 'stretch',
  },
  soilProfileAside: {
    width: 28,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #d7b899',
    marginTop: 44, // alinha com as barras (compensa header dos painéis)
  },
  soilLegendLabel: {
    position: 'absolute',
    fontSize: 8,
    color: '#999',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 2,
    display: 'none', // simplificado
  },
  nutrientesGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
  },
  painelNutriente: {
    background: '#fff',
    border: '1px solid #ececec',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  painelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  painelTitulo: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  painelUnidade: {
    fontSize: 10,
    color: '#aaa',
    background: '#f5f5f5',
    borderRadius: 4,
    padding: '2px 5px',
  },
  barrasWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  barraRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  profLabel: {
    width: 44,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'baseline',
    gap: 1,
  },
  profCm: {
    fontSize: 11,
    fontWeight: 700,
    color: '#555',
    fontVariantNumeric: 'tabular-nums',
  },
  profCmSuffix: {
    fontSize: 8,
    color: '#bbb',
  },
  barraTrack: {
    flex: 1,
    height: 14,
    background: '#f0f0f0',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  barraFill: {
    height: '100%',
    borderRadius: 7,
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  barraValor: {
    width: 80,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  valorNum: {
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 24,
    textAlign: 'right',
  },
  valorTag: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 4,
    padding: '1px 4px',
    whiteSpace: 'nowrap',
  },
  escala: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  escalaMin: {
    fontSize: 9,
    color: '#ccc',
    width: 44, // alinha com profLabel
    flexShrink: 0,
    textAlign: 'right',
  },
  escalaBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    display: 'flex',
  },
  escalaMax: {
    fontSize: 9,
    color: '#ccc',
    width: 80,
    flexShrink: 0,
  },
  semDados: {
    padding: 20,
    textAlign: 'center',
    color: '#bbb',
    fontSize: 13,
    fontStyle: 'italic',
  },
}