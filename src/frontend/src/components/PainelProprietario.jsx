import { useMemo, useState } from 'react'
import GeoMap from './GeoMap'
import PainelFazenda from './PainelFazenda'

function nomeValido(nome) {
  if (nome === null || nome === undefined) return false
  const texto = String(nome).trim()
  return texto !== '' && texto !== '-'
}

function geomValido(geom) {
  if (geom === null || geom === undefined) return false
  const texto = String(geom).trim()
  return texto !== '' && texto !== '-'
}

function resolverNomeProprietario(proprietario, fazendas) {
  const fazendaComNome = fazendas?.find(f => nomeValido(f.proprietario))
  return fazendaComNome?.proprietario || proprietario.Nome || '—'
}

export default function PainelProprietario({ proprietario, fazendas = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [fazendasAbertas, setFazendasAbertas] = useState([])
  const [fazendasInfoAbertas, setFazendasInfoAbertas] = useState([])

  if (!proprietario) return null

  const nomeProprietario = useMemo(
    () => resolverNomeProprietario(proprietario, fazendas),
    [proprietario, fazendas]
  )

  const inicial = nomeProprietario?.[0] ?? '?'

  const isFazendaAberta = (id) =>
    fazendasAbertas.some(openId => String(openId) === String(id))

  const isInfoAberta = (id) =>
    fazendasInfoAbertas.some(openId => String(openId) === String(id))

  const toggleFazenda = (id) => {
    setFazendasAbertas(prev => {
      const aberta = prev.some(openId => String(openId) === String(id))

      if (aberta) {
        setFazendasInfoAbertas(infoPrev =>
          infoPrev.filter(infoId => String(infoId) !== String(id))
        )
        return prev.filter(openId => String(openId) !== String(id))
      }

      return [...prev, id]
    })
  }

  const toggleInfo = (id) => {
    setFazendasInfoAbertas(prev => {
      const aberta = prev.some(openId => String(openId) === String(id))
      return aberta
        ? prev.filter(openId => String(openId) !== String(id))
        : [...prev, id]
    })
  }

  const fazendasSelecionadas = fazendas.filter(f =>
    fazendasAbertas.some(id => String(id) === String(f.idPropriedade))
  )

  const fazendasComInfoAberta = fazendas.filter(f =>
    fazendasInfoAbertas.some(id => String(id) === String(f.idPropriedade))
  )

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.avatar}>{inicial}</div>
            <div>
              <div style={styles.nome}>{nomeProprietario}</div>
              <div style={styles.idLabel}>ID {proprietario.idProprietario}</div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.infoList}>
            <InfoRow
              label="Situação"
              value={
                proprietario.Ativo === 'True' || proprietario.Ativo === true
                  ? '🟢 Ativo'
                  : '🔴 Inativo'
              }
            />
            <InfoRow
              label="Membro desde"
              value={
                proprietario.tsInclusao && proprietario.tsInclusao !== 'NaT'
                  ? proprietario.tsInclusao.slice(0, 10)
                  : 'Não informado'
              }
            />
          </div>

          <div style={styles.divider} />

          <button
            type="button"
            style={styles.expandBtn}
            onClick={() => setExpanded(o => !o)}
          >
            <span>Propriedades <strong>({fazendas.length})</strong></span>
            <span>{expanded ? '▾' : '▸'}</span>
          </button>

          {expanded && (
            <div style={styles.fazendaList}>
              {fazendas.map(f => (
                <div key={f.idPropriedade} style={styles.fazendaItemWrapper}>
                  <button
                    type="button"
                    style={{
                      ...styles.fazendaItem,
                      ...(isFazendaAberta(f.idPropriedade) ? styles.fazendaItemAtiva : {})
                    }}
                    onClick={() => toggleFazenda(f.idPropriedade)}
                  >
                    <span style={styles.fazendaNome}>{f.nome_Fazenda ?? '—'}</span>
                    <span>{isFazendaAberta(f.idPropriedade) ? '▾' : '›'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {fazendasSelecionadas.map(fazenda => {
          const mostrarMapa = geomValido(fazenda?.geom)

          return (
            <div key={fazenda.idPropriedade} style={styles.fazendaPanel}>
              <div style={styles.fazendaPanelHeader}>
                <div style={styles.fazendaPanelNome}>
                  {fazenda.nome_Fazenda ?? '—'}
                </div>
                <button
                  type="button"
                  style={styles.closeBtn}
                  onClick={() => toggleFazenda(fazenda.idPropriedade)}
                >
                  ✕
                </button>
              </div>

              <div style={styles.infoList}>
                <InfoRow
                  label="Área total"
                  value={
                    fazenda.areaTotal !== null &&
                    fazenda.areaTotal !== undefined
                      ? `${Number(fazenda.areaTotal).toFixed(1)} ha`
                      : '—'
                  }
                />
                <InfoRow label="Talhões" value={fazenda.total_talhoes ?? '—'} />
                <InfoRow label="ID" value={fazenda.idPropriedade} />
              </div>

              {mostrarMapa && (
                <>
                  <div style={styles.divider} />
                  <div style={styles.mapLabel}>Localização</div>
                  <GeoMap wkt={fazenda.geom} />
                </>
              )}

              <div style={styles.divider} />

              <button
                type="button"
                style={{
                  ...styles.exibirBtn,
                  ...(isInfoAberta(fazenda.idPropriedade)
                    ? styles.exibirBtnAtivo
                    : {})
                }}
                onClick={() => toggleInfo(fazenda.idPropriedade)}
              >
                {isInfoAberta(fazenda.idPropriedade)
                  ? '▴ Ocultar informações'
                  : '▾ Expandir informações ⌕ '}
              </button>
            </div>
          )
        })}
      </div>

      {fazendasComInfoAberta.map(fazenda => (
        <PainelFazenda
          key={fazenda.idPropriedade}
          fazenda={fazenda}
          idProprietario={proprietario.idProprietario}
          apiBaseUrl="http://localhost:8000"
        />
      ))}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value ?? '—'}</span>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' },

  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '24px',
    width: '260px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    background: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    flexShrink: 0,
  },
  nome: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e' },
  idLabel: { fontSize: '11px', color: '#aaa', fontFamily: 'monospace' },
  divider: { height: '1px', background: '#f0f0f0' },
  infoList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '12px', color: '#999' },
  infoValue: { fontSize: '12px', fontWeight: '600', color: '#333' },

  expandBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#1a1a2e',
    padding: '2px 0',
    width: '100%',
  },

  fazendaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '-6px',
  },

  fazendaItemWrapper: {},

  fazendaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f7f7f7',
    border: '1px solid #eee',
    borderRadius: '10px',
    padding: '9px 12px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },

  fazendaItemAtiva: {
    background: '#e8f5e9',
    borderColor: '#a5d6a7',
  },

  fazendaNome: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333',
  },

  fazendaPanel: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '24px',
    width: '320px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  fazendaPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  fazendaPanelNome: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a2e',
  },

  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#aaa',
  },

  mapLabel: {
    fontSize: '11px',
    color: '#aaa',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  exibirBtn: {
  width: '100%',
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  background: '#fff',
  color: '#1a1a2e',
  cursor: 'pointer',
  },

  exibirBtnAtivo: {
    border: '1px solid #1a1a2e',
    background: '#f3f4f6',
  },
}