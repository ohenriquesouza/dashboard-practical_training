import { useMemo, useRef, useState } from 'react'
import GeoMap from './GeoMap'
import PainelFazenda from './PainelFazenda'
import PainelResumoProprietario from './PainelResumoProprietario'

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
  const painelFazendaRef = useRef(null)
  const [showTalhoesPorFazenda, setShowTalhoesPorFazenda] = useState({})
  const [talhoesPorFazenda, setTalhoesPorFazenda] = useState({})
  const [talhaoSelecionadoPorFazenda, setTalhaoSelecionadoPorFazenda] = useState({})

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
    const aberta = fazendasAbertas.some(openId => String(openId) === String(id))
    if (aberta) {
      setFazendasInfoAbertas([])
      setFazendasAbertas([])
    } else {
      setFazendasInfoAbertas([])
      setFazendasAbertas([id])
    }
  }

  const toggleInfo = (id) => {
    setFazendasInfoAbertas(prev => {
      const aberta = prev.some(openId => String(openId) === String(id))
      if (!aberta) {
        setTimeout(() => {
          painelFazendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
      }
      return aberta
        ? prev.filter(openId => String(openId) !== String(id))
        : [...prev, id]
    })
  }

  const toggleTalhoes = async (fazenda) => {
    const idFazenda = fazenda.idPropriedade
    const novoEstado = !showTalhoesPorFazenda[idFazenda]
    setShowTalhoesPorFazenda(prev => ({ ...prev, [idFazenda]: novoEstado }))

    if (novoEstado && !talhoesPorFazenda[idFazenda]) {
      try {
        const res = await fetch(`/api/all?idProprietario=${proprietario.idProprietario}`)
        const json = await res.json()
        const unidades = json.TB_UNIDADE_PRODUCAO?.data ?? []
        const talhoes = unidades
          .filter(u => Number(u.idProriedade) === Number(idFazenda) && u.geom)
          .map(u => ({
            id: u.idUnidadeProducao,
            nome: u.nomeTalhao || u.nomeRelatorio || `Talhão ${u.idUnidadeProducao}`,
            geom: u.geom,
          }))
        setTalhoesPorFazenda(prev => ({ ...prev, [idFazenda]: talhoes }))
      } catch (e) {
        console.error('Erro ao carregar talhões:', e)
      }
    }
  }

  const handleTalhaoClick = (idFazenda, idTalhao) => {
    setTalhaoSelecionadoPorFazenda(prev => {
      const atual = prev[idFazenda]
      return {
        ...prev,
        [idFazenda]: String(atual) === String(idTalhao) ? null : idTalhao,
      }
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
        <div style={styles.colunaEsquerda}>
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
                <PrivateInfoRow label="ID" value={fazenda.idPropriedade} />
              </div>

              {mostrarMapa && (
                <>
                  <div style={styles.divider} />
                  <div style={styles.mapHeader}>
                    <div style={styles.mapLabel}>Localização</div>
                    <button
                      type="button"
                      style={{
                        ...styles.talhaoToggleBtn,
                        ...(showTalhoesPorFazenda[fazenda.idPropriedade]
                          ? styles.talhaoToggleBtnAtivo
                          : {}),
                      }}
                      onClick={() => toggleTalhoes(fazenda)}
                    >
                      {showTalhoesPorFazenda[fazenda.idPropriedade]
                        ? 'Ocultar talhões'
                        : 'Exibir talhões'}
                    </button>
                  </div>
                  <GeoMap
                    wkt={fazenda.geom}
                    talhoes={talhoesPorFazenda[fazenda.idPropriedade] || []}
                    showTalhoes={!!showTalhoesPorFazenda[fazenda.idPropriedade]}
                    onTalhaoClick={(idTalhao) =>
                      handleTalhaoClick(fazenda.idPropriedade, idTalhao)
                    }
                    talhaoSelecionado={talhaoSelecionadoPorFazenda[fazenda.idPropriedade]}
                  />
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

        <PainelResumoProprietario
          proprietario={proprietario}
          fazendas={fazendas}
        />
      </div>

      <div ref={painelFazendaRef}>
      {fazendasComInfoAberta.map(fazenda => (
        <PainelFazenda
          key={fazenda.idPropriedade}
          fazenda={fazenda}
          idProprietario={proprietario.idProprietario}
          nomeProprietario={nomeProprietario}
          apiBaseUrl="http://localhost:8000"
          talhaoSelecionado={talhaoSelecionadoPorFazenda[fazenda.idPropriedade]}
        />
      ))}
      </div>
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

function PrivateInfoRow({ label, value }) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          ...styles.infoValue,
          fontFamily: visible ? 'inherit' : 'monospace',
          letterSpacing: visible ? 'normal' : 2,
          color: visible ? styles.infoValue.color : '#bbb',
          userSelect: visible ? 'text' : 'none',
        }}>
          {visible ? (value ?? '—') : '••••••'}
        </span>
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
            fontSize: 14,
            color: '#aaa',
            display: 'flex',
            alignItems: 'center',
          }}
          title={visible ? 'Ocultar ID' : 'Revelar ID'}
        >
          {visible ? (
            /* olho aberto */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            /* olho fechado */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>
      </span>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' },

  colunaEsquerda: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '300px',
    flexShrink: 0,
  },

  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '24px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxSizing: 'border-box',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    background: '#4e73df',
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
    width: '100%',
    boxSizing: 'border-box',
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

  mapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapLabel: {
    fontSize: '11px',
    color: '#aaa',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  talhaoToggleBtn: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '999px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
  },
  talhaoToggleBtnAtivo: {
    background: '#1a1a2e',
    color: '#fff',
    border: '1px solid #1a1a2e',
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