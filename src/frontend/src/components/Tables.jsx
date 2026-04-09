import { useState, useEffect } from 'react'
import Data from './Data'

export default function Tables({ name, total, data, loading, error, forceOpen }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(forceOpen)
  }, [forceOpen])

  return (
    <div style={styles.card}>
      <button style={styles.header} onClick={() => setOpen(o => !o)}>
        <div style={styles.headerLeft}>
          <span style={styles.arrow}>{open ? '▾' : '▸'}</span>
          <span style={styles.name}>{name}</span>
          {total != null && <span style={styles.badge}>{total} linhas</span>}
        </div>
        <span style={styles.toggle}>{open ? 'fechar' : 'ver dados'}</span>
      </button>

      {open && (
        <div style={styles.body}>
          {loading && <p style={styles.status}>Carregando...</p>}
          {error   && <p style={{ ...styles.status, color: '#c0392b' }}>Erro ao carregar.</p>}
          {!loading && !error && <Data data={data} />}
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  arrow: {
    fontSize: '14px',
    color: '#888',
  },
  name: {
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: '13px',
    color: '#1a1a2e',
  },
  badge: {
    background: '#e8f5e9',
    color: '#2e7d32',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '20px',
    padding: '2px 10px',
  },
  toggle: {
    fontSize: '11px',
    color: '#aaa',
    fontWeight: '500',
  },
  body: {
    borderTop: '1px solid #f0f0f0',
    padding: '0 0 4px 0',
  },
  status: {
    color: '#888',
    fontSize: '13px',
    padding: '12px 20px',
    margin: 0,
  },
}