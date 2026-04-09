import { useNavigate } from 'react-router-dom'

export default function Geral() {
  const navigate = useNavigate()

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/')}>← Voltar</button>
        <div>
          <h1 style={styles.title}>Visão Geral</h1>
          <p style={styles.subtitle}>Em construção — análises comparativas entre proprietários</p>
        </div>
      </div>

      <div style={styles.placeholder}>
        <span style={styles.placeholderIcon}>🚧</span>
        <p>Esta seção receberá os gráficos comparativos entre proprietários.</p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '32px 24px',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  header: { display: 'flex', alignItems: 'center', gap: '20px' },
  back: {
    padding: '8px 16px', borderRadius: '10px', border: '1px solid #ddd',
    background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#444',
  },
  title: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a1a2e' },
  subtitle: { margin: 0, fontSize: '13px', color: '#aaa' },
  placeholder: {
    background: '#fff', borderRadius: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    padding: '60px', textAlign: 'center',
    color: '#aaa', fontSize: '14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  placeholderIcon: { fontSize: '36px' },
}