import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPainelProprietario } from '../services/api'
import PainelProprietario from '../components/PainelProprietario'

export default function Proprietario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [painel, setPainel] = useState(null)

  useEffect(() => {
    fetchPainelProprietario(id).then(res => setPainel(res.data))
  }, [id])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/')}>← Voltar</button>
        <div>
          <p style={styles.subtitle}>ID {id}</p>
        </div>
      </div>

      {painel
        ? <PainelProprietario proprietario={painel.proprietario} fazendas={painel.fazendas} />
        : <p style={styles.loading}>Carregando...</p>
      }
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
  loading: { color: '#aaa', fontSize: '14px' },
}