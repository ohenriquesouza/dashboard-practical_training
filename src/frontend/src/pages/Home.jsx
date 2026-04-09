import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchResumoProprietarios } from '../services/api'

// Função para gerar uma cor persistente baseada no ID ou Nome
const getAvatarColor = (id) => {
  const colors = [
    '#4e73df'
  ];
  // Usa o ID como índice para escolher a cor
  return colors[id % colors.length] || colors[0];
};

function formatDate(data) {
  if (!data || data === "NaT") return "—";
  const partes = data.split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data;
}

export default function Home() {
  const [proprietarios, setProprietarios] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchResumoProprietarios()
      .then(res => setProprietarios(res.data.proprietarios))
      .catch(err => console.error("Erro ao buscar dados:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={styles.loading}>Carregando sistema...</div>

  return (
    <div style={styles.page}>
      {/* Header Minimalista */}
      <header style={styles.header}>
        <h1 style={styles.title}>AgroSyntech</h1>
        <p style={styles.subtitle}>Painel de Gestão Agrícola</p>
      </header>

      {/* Seção Principal: Visão Geral */}
      <section style={styles.section}>
        <div 
          style={styles.heroCard} 
          onClick={() => navigate('/geral')}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={styles.heroContent}>
            <div style={styles.heroIcon}>📊</div>
            <div>
              <h2 style={styles.heroTitle}>Visão Geral</h2>
              <p style={styles.heroSub}>Consolidado de todos os proprietários e talhões</p>
            </div>
          </div>
          <div style={styles.heroButton}>Ver Clientes</div>
        </div>
      </section>

      {/* Seção Secundária: Proprietários */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Acesso Rápido</h3>
          <div style={styles.line} />
        </div>
        
        <div style={styles.grid}>
          {proprietarios.map(p => (
            <ProprietarioCard 
              key={p.idProprietario} 
              data={p} 
              onClick={() => navigate(`/proprietario/${p.idProprietario}`)} 
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ProprietarioCard({ data, onClick }) {
  const inicial = data.nome_proprietario?.[0] ?? '?'
  const bgColor = getAvatarColor(data.idProprietario)

  return (
    <div 
      style={styles.card} 
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1a1a2e')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#edf2f7')}
    >
      <div style={styles.cardTop}>
        <div style={{ ...styles.avatar, backgroundColor: bgColor }}>
          {inicial}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={styles.cardNome}>{data.nome_proprietario}</div>
          <div style={styles.cardId}>ID {data.idProprietario}</div>
        </div>
      </div>
      
      <div style={styles.divider} />
      
      <div style={styles.cardMetrics}>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Fazendas</span>
          <span style={styles.metricValue}>{data.total_fazendas ?? 0}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Última análise</span>
          <span style={styles.metricValue}>{formatDate(data.ultima_analise)}</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '40px 5%',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  header: { borderLeft: '4px solid #1a1a2e', paddingLeft: '20px' },
  title: { margin: 0, fontSize: '28px', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.5px' },
  subtitle: { margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' },
  
  section: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  sectionTitle: { fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 },
  line: { flex: 1, height: '1px', background: '#e2e8f0' },

  heroCard: {
    background: '#1a1a2e',
    borderRadius: '20px',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 10px 25px -5px rgba(26, 26, 46, 0.3)',
  },
  heroContent: { display: 'flex', alignItems: 'center', gap: '20px' },
  heroIcon: { fontSize: '32px', background: 'rgba(255,255,255,0.1)', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' },
  heroTitle: { margin: 0, fontSize: '20px', fontWeight: '700' },
  heroSub: { margin: '2px 0 0', fontSize: '14px', color: '#94a3b8' },
  heroButton: { background: '#fff', color: '#1a1a2e', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    border: '2px solid #edf2f7',
    transition: 'all 0.2s ease',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: '14px' },
  avatar: { 
    width: '44px', 
    height: '44px', 
    borderRadius: '12px', 
    color: '#fff', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '700',
    fontSize: '18px',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  cardNome: { fontSize: '15px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardId: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' },
  divider: { height: '1px', background: '#f1f5f9' },
  cardMetrics: { display: 'flex', flexDirection: 'column', gap: '10px' },
  metric: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: '11px', color: '#64748b', fontWeight: '500' },
  metricValue: { fontSize: '12px', fontWeight: '600', color: '#1e293b' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px', fontWeight: '500' }
};