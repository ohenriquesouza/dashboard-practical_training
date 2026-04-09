import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchResumoProprietarios } from '../services/api'

// Função de cor persistente (A mesma da Home para manter consistência)
const getAvatarColor = (id, nome = "") => {
  const colors = [
    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', 
    '#5a5c69', '#6f42c1', '#fd7e14', '#20c997', '#f473b9',
    '#2e59d9', '#17a673', '#2c9faf', '#5bc0de', '#d9534f'
  ];
  const hash = id + nome.length; 
  return colors[hash % colors.length];
};

// Helper para formatação de data
function formatDate(data) {
  if (!data || data === "NaT") return "—";
  const partes = data.split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data;
}

export default function Geral() {
  const [proprietarios, setProprietarios] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchResumoProprietarios()
      .then(res => setProprietarios(res.data.proprietarios))
      .catch(err => {
        console.error("Erro ao buscar dados gerais:", err)
        setProprietarios([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={styles.loading}>Carregando banco de dados...</div>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button 
          style={styles.back} 
          onClick={() => navigate('/')}
          onMouseEnter={(e) => (e.target.style.background = '#f1f5f9')}
          onMouseLeave={(e) => (e.target.style.background = '#fff')}
        >
          ← Voltar para Início
        </button>
        <div style={styles.headerText}>
          <h1 style={styles.title}>Visão Geral</h1>
          <p style={styles.subtitle}>Relatório consolidado de todos os clientes</p>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, ...styles.thLeft}}>Proprietário</th>
              <th style={styles.th}>Fazendas</th>
              <th style={styles.th}>Talhões</th>
              <th style={{...styles.th, ...styles.thRight}}>Última Análise</th>
            </tr>
          </thead>
          <tbody>
            {proprietarios.map(p => {
              const bgColor = getAvatarColor(p.idProprietario, p.nome_proprietario);
              return (
                <tr 
                  key={p.idProprietario} 
                  style={styles.tr} 
                  onClick={() => navigate(`/proprietario/${p.idProprietario}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={{ ...styles.avatar, backgroundColor: bgColor }}>
                        {p.nome_proprietario?.[0] ?? '?'}
                      </div>
                      <div>
                        <div style={styles.nome}>{p.nome_proprietario}</div>
                        <div style={styles.id}>ID {p.idProprietario}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{p.total_fazendas ?? 0}</span>
                  </td>
                  <td style={styles.td}>{p.total_talhoes ?? 0}</td>
                  <td style={styles.td}>
                    <span style={styles.dateText}>{formatDate(p.ultima_analise)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '40px 5%',
    fontFamily: '"Inter", system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  header: { display: 'flex', alignItems: 'center', gap: '24px' },
  headerText: { borderLeft: '3px solid #e2e8f0', paddingLeft: '20px' },
  back: {
    padding: '10px 18px', 
    borderRadius: '12px', 
    border: '1px solid #e2e8f0',
    background: '#fff', 
    cursor: 'pointer', 
    fontSize: '13px', 
    fontWeight: '700', 
    color: '#1a1a2e',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  title: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.5px' },
  subtitle: { margin: '2px 0 0', fontSize: '14px', color: '#64748b' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
  
  tableContainer: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 4px 25px rgba(0,0,0,0.05)',
    border: '1px solid #edf2f7',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    background: '#fcfcfd',
    borderBottom: '1px solid #f1f5f9',
  },
  tr: {
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  td: {
    padding: '16px 24px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
    color: '#334155',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '38px', height: '38px',
    borderRadius: '10px',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: '700',
    flexShrink: 0,
    textShadow: '0 1px 2px rgba(0,0,0,0.15)',
  },
  nome: { fontWeight: '700', color: '#1a1a2e', fontSize: '14px' },
  id: { fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' },
  badge: {
    background: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#475569',
    fontSize: '12px',
  },
  dateText: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
  }
}