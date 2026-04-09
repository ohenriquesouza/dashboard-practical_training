import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchResumoProprietarios } from '../services/api'

export default function Home() {
  const [proprietarios, setProprietarios] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchResumoProprietarios()
      .then(res => setProprietarios(res.data.proprietarios))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={styles.loading}>Carregando...</div>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>AgroSyntech</h1>
        <p style={styles.subtitle}>Selecione um proprietário ou veja a visão geral</p>
      </div>

      <div style={styles.grid}>
        {proprietarios.map(p => (
          <ProprietarioCard key={p.idProprietario} data={p} onClick={() => navigate(`/proprietario/${p.idProprietario}`)} />
        ))}

        {/* Card visão geral */}
        <div style={{ ...styles.card, ...styles.cardGeral }} onClick={() => navigate('/geral')}>
          <div style={styles.cardGeralIcon}>⊕</div>
          <div style={styles.cardGeralLabel}>Visão Geral</div>
          <div style={styles.cardGeralSub}>Todos os proprietários</div>
        </div>
      </div>
    </div>
  )
}

// function formatHa(valor) {
//   if (valor === null || valor === undefined) return "Não informado";

//   const num = Number(valor);
//   if (isNaN(num)) return "Não informado";

//   return `${num.toLocaleString("pt-BR")} ha`;
// }

function formatDate(data) {
  if (!data || data === "NaT") return "Não informado";

  const partes = data.split("-");
  if (partes.length !== 3) return data;

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

function ProprietarioCard({ data, onClick }) {
  const inicial = data.nome_proprietario?.[0] ?? '?'

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardTop}>
        <div style={styles.avatar}>{inicial}</div>
        <div>
          <div style={styles.cardNome}>{data.nome_proprietario}</div>
          <div style={styles.cardId}>ID {data.idProprietario}</div>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.cardMetrics}>
        <Metric label="Fazendas" value={data.total_fazendas ?? '—'} />
        <Metric label="Talhões" value={data.total_talhoes ?? '—'} />
        <Metric label="Última análise" value={formatDate(data.ultima_analise)} />
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div style={styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricValue}>{value}</span>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '40px 32px',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { margin: 0, fontSize: '28px', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.5px' },
  subtitle: { margin: 0, fontSize: '14px', color: '#888' },
  grid: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '24px',
    width: '220px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'transform 0.15s, box-shadow 0.15s',
    userSelect: 'none',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '42px', height: '42px',
    borderRadius: '12px',
    background: '#1a1a2e',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', fontWeight: '700',
    flexShrink: 0,
  },
  cardNome: { fontSize: '14px', fontWeight: '700', color: '#1a1a2e', lineHeight: 1.3 },
  cardId: { fontSize: '11px', color: '#aaa', fontFamily: 'monospace' },
  divider: { height: '1px', background: '#f0f0f0' },
  cardMetrics: { display: 'flex', flexDirection: 'column', gap: '8px' },
  metric: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: '11px', color: '#999' },
  metricValue: { fontSize: '12px', fontWeight: '600', color: '#333' },
  cardGeral: {
    background: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  cardGeralIcon: { fontSize: '32px', color: '#fff' },
  cardGeralLabel: { fontSize: '16px', fontWeight: '700', color: '#fff' },
  cardGeralSub: { fontSize: '11px', color: '#aaa' },
  loading: { padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
}