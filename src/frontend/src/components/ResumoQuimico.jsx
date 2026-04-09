import { useMemo } from 'react'

// ============================================================================
// MAPA DE PARÂMETROS: classificação, cor, unidade, descrição
// ============================================================================
const PARAMS = {
  pH: {
    label: 'pH (H₂O)',
    unidade: '',
    grupo: 'pH',
    cor: '#0277bd',
    faixas: [
      { ate: 4.5, label: 'Muito Ácido', cor: '#c62828' },
      { ate: 5.0, label: 'Ácido',       cor: '#ef5350' },
      { ate: 5.5, label: 'Mod. Ácido',  cor: '#ffa726' },
      { ate: 6.0, label: 'Levem. Ácido',cor: '#ffcc02' },
      { ate: 7.0, label: 'Ideal',        cor: '#66bb6a' },
      { ate: 7.5, label: 'Levem. Alc.', cor: '#42a5f5' },
      { ate: Infinity, label: 'Alcalino', cor: '#1565c0' },
    ],
  },
  pH_kcl: {
    label: 'pH KCl',
    unidade: '',
    grupo: 'pH',
    cor: '#0288d1',
    faixas: [
      { ate: 4.0, label: 'Muito Ácido', cor: '#c62828' },
      { ate: 5.0, label: 'Ácido',       cor: '#ef5350' },
      { ate: Infinity, label: 'Adequado', cor: '#66bb6a' },
    ],
  },
  pH_CaCl2: {
    label: 'pH CaCl₂',
    unidade: '',
    grupo: 'pH',
    cor: '#039be5',
    faixas: [
      { ate: 4.5, label: 'Muito Ácido', cor: '#c62828' },
      { ate: 5.0, label: 'Ácido',       cor: '#ef5350' },
      { ate: 5.5, label: 'Mod. Ácido',  cor: '#ffa726' },
      { ate: 6.0, label: 'Ideal',        cor: '#66bb6a' },
      { ate: Infinity, label: 'Alcalino', cor: '#42a5f5' },
    ],
  },
  P: {
    label: 'Fósforo',
    unidade: 'mg/dm³',
    grupo: 'Macronutrientes',
    cor: '#2e7d32',
    faixas: [
      { ate: 10,       label: 'Baixo',  cor: '#ef5350' },
      { ate: 20,       label: 'Médio',  cor: '#ffa726' },
      { ate: Infinity, label: 'Alto',   cor: '#66bb6a' },
    ],
  },
  K: {
    label: 'Potássio',
    unidade: 'mmolc/dm³',
    grupo: 'Macronutrientes',
    cor: '#ef6c00',
    faixas: [
      { ate: 1.5,      label: 'Baixo',  cor: '#ef5350' },
      { ate: 3.0,      label: 'Médio',  cor: '#ffa726' },
      { ate: Infinity, label: 'Alto',   cor: '#66bb6a' },
    ],
  },
  Ca: {
    label: 'Cálcio',
    unidade: 'mmolc/dm³',
    grupo: 'Macronutrientes',
    cor: '#d84315',
    faixas: [
      { ate: 4,        label: 'Baixo',     cor: '#ef5350' },
      { ate: 7,        label: 'Médio',     cor: '#ffa726' },
      { ate: Infinity, label: 'Adequado',  cor: '#66bb6a' },
    ],
  },
  Mg: {
    label: 'Magnésio',
    unidade: 'mmolc/dm³',
    grupo: 'Macronutrientes',
    cor: '#f57f17',
    faixas: [
      { ate: 4,        label: 'Baixo',    cor: '#ef5350' },
      { ate: 8,        label: 'Médio',    cor: '#ffa726' },
      { ate: Infinity, label: 'Adequado', cor: '#66bb6a' },
    ],
  },
  Na: {
    label: 'Sódio',
    unidade: 'mmolc/dm³',
    grupo: 'Macronutrientes',
    cor: '#0277bd',
    faixas: [
      { ate: 1,        label: 'Normal', cor: '#66bb6a' },
      { ate: Infinity, label: 'Alto',   cor: '#ef5350' },
    ],
  },
  M_O: {
    label: 'Matéria Org.',
    unidade: 'g/dm³',
    grupo: 'Orgânica & CTC',
    cor: '#558b2f',
    faixas: [
      { ate: 10,       label: 'Baixo',  cor: '#ef5350' },
      { ate: 20,       label: 'Médio',  cor: '#ffa726' },
      { ate: Infinity, label: 'Alto',   cor: '#66bb6a' },
    ],
  },
  CTC: {
    label: 'CTC',
    unidade: 'mmolc/dm³',
    grupo: 'Orgânica & CTC',
    cor: '#0288d1',
    faixas: [
      { ate: 40,       label: 'Baixa',  cor: '#ef5350' },
      { ate: 80,       label: 'Média',  cor: '#ffa726' },
      { ate: Infinity, label: 'Alta',   cor: '#66bb6a' },
    ],
  },
  Soma_Bases: {
    label: 'Soma Bases',
    unidade: 'mmolc/dm³',
    grupo: 'Bases & Saturação',
    cor: '#6a1b9a',
    faixas: [
      { ate: 25,       label: 'Baixa',    cor: '#ef5350' },
      { ate: 60,       label: 'Média',    cor: '#ffa726' },
      { ate: Infinity, label: 'Alta',     cor: '#66bb6a' },
    ],
  },
  Sat_Bases: {
    label: 'Sat. Bases',
    unidade: '%',
    grupo: 'Bases & Saturação',
    cor: '#7b1fa2',
    faixas: [
      { ate: 25,       label: 'Baixa',      cor: '#ef5350' },
      { ate: 50,       label: 'Média',      cor: '#ffa726' },
      { ate: Infinity, label: 'Adequada',   cor: '#66bb6a' },
    ],
  },
  S: {
    label: 'Enxofre',
    unidade: 'mg/dm³',
    grupo: 'Micronutrientes',
    cor: '#f9a825',
    faixas: [
      { ate: 4,        label: 'Baixo',    cor: '#ef5350' },
      { ate: Infinity, label: 'Adequado', cor: '#66bb6a' },
    ],
  },
  Al: {
    label: 'Alumínio',
    unidade: 'mmolc/dm³',
    grupo: 'Micronutrientes',
    cor: '#e53935',
    faixas: [
      { ate: 0,        label: 'Ausente',  cor: '#66bb6a' },
      { ate: 2,        label: 'Baixo',    cor: '#ffa726' },
      { ate: Infinity, label: 'Tóxico',   cor: '#ef5350' },
    ],
  },
  H_Al: {
    label: 'H+Al',
    unidade: 'mmolc/dm³',
    grupo: 'Micronutrientes',
    cor: '#c62828',
    faixas: [
      { ate: 20,       label: 'Baixo',  cor: '#66bb6a' },
      { ate: 40,       label: 'Médio',  cor: '#ffa726' },
      { ate: Infinity, label: 'Alto',   cor: '#ef5350' },
    ],
  },
  Sat_Al: {
    label: 'Sat. Al',
    unidade: '%',
    grupo: 'Micronutrientes',
    cor: '#b71c1c',
    faixas: [
      { ate: 10,       label: 'Baixa',  cor: '#66bb6a' },
      { ate: 30,       label: 'Média',  cor: '#ffa726' },
      { ate: Infinity, label: 'Alta',   cor: '#ef5350' },
    ],
  },
}

// Ordem dos grupos e parâmetros dentro de cada grupo
const GRUPOS = [
  { nome: 'pH',               chaves: ['pH', 'pH_kcl', 'pH_CaCl2'] },
  { nome: 'Macronutrientes',  chaves: ['P', 'K', 'Ca', 'Mg', 'Na'] },
  { nome: 'Orgânica & CTC',  chaves: ['M_O', 'CTC'] },
  { nome: 'Bases & Saturação',chaves: ['Soma_Bases', 'Sat_Bases'] },
  { nome: 'Micronutrientes',  chaves: ['S', 'Al', 'H_Al', 'Sat_Al'] },
]

// ============================================================================
// HELPERS
// ============================================================================
function getClassificacao(valor, faixas) {
  if (valor == null || !Number.isFinite(Number(valor))) return null
  return faixas.find((f) => Number(valor) <= f.ate) || faixas[faixas.length - 1]
}

function formatVal(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—'
  const n = Number(v)
  if (n === 0) return '0'
  if (Math.abs(n) < 1) return n.toFixed(2)
  if (Math.abs(n) < 10) return n.toFixed(1)
  return n.toFixed(0)
}

// ============================================================================
// CARD DE UM PARÂMETRO
// ============================================================================
function ParamCard({ chave, valor }) {
  const cfg = PARAMS[chave]
  if (!cfg) return null

  const val = valor != null ? Number(valor) : null
  const valido = val != null && Number.isFinite(val)
  const classe = valido ? getClassificacao(val, cfg.faixas) : null

  return (
    <div style={styles.card}>
      {/* Barra de cor no topo */}
      <div style={{
        ...styles.cardTopBar,
        background: classe ? classe.cor : '#e0e0e0',
        opacity: valido ? 1 : 0.3,
      }} />

      <div style={styles.cardBody}>
        {/* Label */}
        <div style={styles.cardLabel}>{cfg.label}</div>

        {/* Valor principal */}
        <div style={styles.cardValorRow}>
          <span style={{
            ...styles.cardValor,
            color: classe ? classe.cor : (valido ? '#1a1a2e' : '#ccc'),
          }}>
            {formatVal(val)}
          </span>
          {cfg.unidade && (
            <span style={styles.cardUnidade}>{cfg.unidade}</span>
          )}
        </div>

        {/* Tag de classificação */}
        {classe ? (
          <span style={{
            ...styles.cardTag,
            background: classe.cor + '1a',
            color: classe.cor,
            border: `1px solid ${classe.cor}33`,
          }}>
            {classe.label}
          </span>
        ) : (
          <span style={{ ...styles.cardTag, background: '#f5f5f5', color: '#ccc', border: '1px solid #eee' }}>
            s/d
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function ResumoQuimico({ resumoQuimicoAtual }) {
  // resumoQuimicoAtual: [{ nome: 'pH', valor: 5.8 }, { nome: 'P', valor: 40 }, ...]
  const mapaValores = useMemo(() => {
    if (!resumoQuimicoAtual?.length) return {}
    return Object.fromEntries(resumoQuimicoAtual.map((item) => [item.nome, item.valor]))
  }, [resumoQuimicoAtual])

  const temDados = resumoQuimicoAtual?.some(
    (item) => item.valor != null && Number.isFinite(Number(item.valor))
  )

  if (!temDados) {
    return (
      <div style={styles.semDados}>Nenhum dado químico disponível.</div>
    )
  }

  return (
    <div style={styles.container}>
      {GRUPOS.map((grupo) => {
        const chavesPresentess = grupo.chaves.filter(
          (k) => mapaValores[k] != null || PARAMS[k]
        )
        if (!chavesPresentess.length) return null

        return (
          <div key={grupo.nome} style={styles.grupo}>
            <div style={styles.grupoLabel}>{grupo.nome}</div>
            <div style={styles.grupoCards}>
              {chavesPresentess.map((chave) => (
                <ParamCard
                  key={chave}
                  chave={chave}
                  valor={mapaValores[chave] ?? null}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// STYLES
// ============================================================================
const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'flex-start',
  },
  grupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 200,
  },
  grupoLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    paddingLeft: 2,
  },
  grupoCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  card: {
    background: '#fff',
    border: '1px solid #ececec',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardTopBar: {
    height: 3,
    width: '100%',
  },
  cardBody: {
    padding: '10px 10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardValorRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 3,
  },
  cardValor: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  cardUnidade: {
    fontSize: 9,
    color: '#bbb',
    fontWeight: 500,
    paddingBottom: 2,
  },
  cardTag: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 4,
    padding: '2px 5px',
    alignSelf: 'flex-start',
    whiteSpace: 'nowrap',
  },
  semDados: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 13,
    padding: 24,
    fontStyle: 'italic',
  },
}