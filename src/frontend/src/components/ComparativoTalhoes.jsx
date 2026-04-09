import { useMemo, useState } from 'react'

// ============================================================================
// CONFIGURAÇÃO DOS NUTRIENTES
// ============================================================================
const NUTRIENTES = [
  {
    key: 'P',
    label: 'Fósforo',
    abrev: 'P',
    unidade: 'mg/dm³',
    cor: '#2e7d32',
    corBg: '#e8f5e9',
    faixas: [
      { ate: 10, label: 'Baixo', cor: '#ef5350' },
      { ate: 20, label: 'Médio', cor: '#ffa726' },
      { ate: Infinity, label: 'Alto', cor: '#66bb6a' },
    ],
  },
  {
    key: 'K',
    label: 'Potássio',
    abrev: 'K',
    unidade: 'mmolc/dm³',
    cor: '#ef6c00',
    corBg: '#fff3e0',
    faixas: [
      { ate: 1.5, label: 'Baixo', cor: '#ef5350' },
      { ate: 3, label: 'Médio', cor: '#ffa726' },
      { ate: Infinity, label: 'Alto', cor: '#66bb6a' },
    ],
  },
  {
    key: 'MO',
    label: 'Matéria Orgânica',
    abrev: 'MO',
    unidade: 'g/dm³',
    cor: '#6a1b9a',
    corBg: '#f3e5f5',
    faixas: [
      { ate: 10, label: 'Baixo', cor: '#ef5350' },
      { ate: 20, label: 'Médio', cor: '#ffa726' },
      { ate: Infinity, label: 'Alto', cor: '#66bb6a' },
    ],
  },
]

// ============================================================================
// HELPERS
// ============================================================================
function getClassificacao(valor, faixas) {
  if (valor == null || !Number.isFinite(valor)) return null
  return faixas.find((f) => valor <= f.ate) || faixas[faixas.length - 1]
}

function formatVal(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—'
  const n = Number(v)
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function limitarNome(nome, max = 12) {
  if (!nome) return '—'
  return nome.length > max ? nome.slice(0, max) + '…' : nome
}

// ============================================================================
// PAINEL DE UM NUTRIENTE
// ============================================================================
function PainelNutriente({ nutriente, dados, ordenarPor }) {
  // dados: [{ talhao, P, K, MO }, ...]
  // Filtra e ordena por este nutriente
  const itens = useMemo(() => {
    return [...dados]
      .map((d) => ({ ...d, _val: d[nutriente.key] }))
      .filter((d) => d._val != null && Number.isFinite(d._val))
      .sort((a, b) => (ordenarPor === 'asc' ? a._val - b._val : b._val - a._val))
  }, [dados, nutriente.key, ordenarPor])

  if (!itens.length) {
    return (
      <div style={styles.painel}>
        <div style={styles.painelHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: nutriente.cor }} />
            <span style={styles.painelTitulo}>{nutriente.label}</span>
          </div>
          <span style={styles.unidadeBadge}>{nutriente.unidade}</span>
        </div>
        <div style={styles.semDados}>Sem dados</div>
      </div>
    )
  }

  const maxVal = Math.max(...itens.map((d) => d._val))
  const minVal = Math.min(...itens.map((d) => d._val))
  // const amplitude = maxVal - minVal || 1

  return (
    <div style={styles.painel}>
      {/* Cabeçalho */}
      <div style={styles.painelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: nutriente.cor }} />
          <span style={styles.painelTitulo}>{nutriente.label}</span>
        </div>
        <span style={styles.unidadeBadge}>{nutriente.unidade}</span>
      </div>

      {/* Lista de talhões */}
      <div style={styles.listaWrap}>
        {itens.map((item, idx) => {
          const val = item._val
          const classe = getClassificacao(val, nutriente.faixas)
          // Escala relativa dentro do painel
          const pct = Math.max(4, ((val - 0) / maxVal) * 100)
          const isTop = idx === 0 && ordenarPor === 'desc'
          const isBot = idx === itens.length - 1 && ordenarPor === 'desc'

          return (
            <div key={item.talhao} style={styles.linha}>
              {/* Rank */}
              <span style={{
                ...styles.rank,
                color: isTop ? nutriente.cor : '#ccc',
                fontWeight: isTop ? 800 : 400,
              }}>
                {idx + 1}
              </span>

              {/* Nome do talhão */}
              <div style={styles.nomeWrap} title={item.talhao}>
                <span style={{
                  ...styles.nomeTalhao,
                  fontWeight: isTop ? 700 : 500,
                  color: isTop ? '#1a1a2e' : '#555',
                }}>
                  {limitarNome(item.talhao, 14)}
                </span>
              </div>

              {/* Barra */}
              <div style={styles.barraTrack}>
                <div
                  style={{
                    ...styles.barraFill,
                    width: `${pct}%`,
                    background: classe
                      ? `linear-gradient(90deg, ${classe.cor}bb, ${classe.cor})`
                      : '#e0e0e0',
                  }}
                />
              </div>

              {/* Valor + tag */}
              <div style={styles.valorWrap}>
                <span style={{
                  ...styles.valorNum,
                  color: classe?.cor || '#999',
                  fontWeight: isTop ? 800 : 600,
                }}>
                  {formatVal(val)}
                </span>
                {classe && (
                  <span style={{
                    ...styles.classTag,
                    background: classe.cor + '1a',
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

      {/* Rodapé: min / média / max */}
      <div style={styles.rodape}>
        <Stat label="Mín" valor={formatVal(minVal)} cor="#888" />
        <Stat
          label="Média"
          valor={formatVal(itens.reduce((s, d) => s + d._val, 0) / itens.length)}
          cor={nutriente.cor}
        />
        <Stat label="Máx" valor={formatVal(maxVal)} cor="#333" />
      </div>
    </div>
  )
}

function Stat({ label, valor, cor }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: cor }}>{valor}</div>
      <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function ComparativoTalhoes({ serieTalhoes }) {
  const [ordenar, setOrdenar] = useState('desc') // 'desc' = maior primeiro

  if (!serieTalhoes?.length) {
    return (
      <div style={styles.semDadosGlobal}>
        Nenhum dado de talhão disponível.
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Controle de ordenação */}
      <div style={styles.controles}>
        <span style={styles.controleLabel}>Ordenar:</span>
        <button
          style={{ ...styles.btnOrdem, ...(ordenar === 'desc' ? styles.btnAtivo : {}) }}
          onClick={() => setOrdenar('desc')}
        >
          ↓ Maior primeiro
        </button>
        <button
          style={{ ...styles.btnOrdem, ...(ordenar === 'asc' ? styles.btnAtivo : {}) }}
          onClick={() => setOrdenar('asc')}
        >
          ↑ Menor primeiro
        </button>
      </div>

      {/* Grid de painéis */}
      <div style={styles.grid}>
        {NUTRIENTES.map((n) => (
          <PainelNutriente
            key={n.key}
            nutriente={n}
            dados={serieTalhoes}
            ordenarPor={ordenar}
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
    flexDirection: 'column',
    gap: 12,
  },
  controles: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  controleLabel: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: 600,
  },
  btnOrdem: {
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    background: '#fafafa',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnAtivo: {
    background: '#1a1a2e',
    color: '#fff',
    borderColor: '#1a1a2e',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 10,
  },
  painel: {
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
    paddingBottom: 6,
    borderBottom: '1px solid #f0f0f0',
  },
  painelTitulo: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  unidadeBadge: {
    fontSize: 10,
    color: '#aaa',
    background: '#f5f5f5',
    borderRadius: 4,
    padding: '2px 5px',
  },
  listaWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    maxHeight: 340,
    overflowY: 'auto',
  },
  linha: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    minHeight: 22,
  },
  rank: {
    fontSize: 10,
    fontVariantNumeric: 'tabular-nums',
    width: 14,
    flexShrink: 0,
    textAlign: 'right',
  },
  nomeWrap: {
    width: 90,
    flexShrink: 0,
    overflow: 'hidden',
  },
  nomeTalhao: {
    fontSize: 11,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  barraTrack: {
    flex: 1,
    height: 12,
    background: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barraFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  valorWrap: {
    width: 76,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  valorNum: {
    fontSize: 11,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 22,
    textAlign: 'right',
  },
  classTag: {
    fontSize: 8,
    fontWeight: 700,
    borderRadius: 3,
    padding: '1px 3px',
    whiteSpace: 'nowrap',
  },
  rodape: {
    display: 'flex',
    justifyContent: 'space-around',
    borderTop: '1px solid #f0f0f0',
    paddingTop: 8,
    marginTop: 2,
  },
  semDados: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 12,
    padding: '12px 0',
    fontStyle: 'italic',
  },
  semDadosGlobal: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 13,
    padding: 20,
    fontStyle: 'italic',
  },
}