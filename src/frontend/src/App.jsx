import { useState } from 'react'
import { fetchAll } from './services/api'
import Filters from './components/Filters'
import Tables from './components/Tables'

const ALL_TABLES = [
  'TB_PROPRIETARIO',
  'TB_PROPRIEDADE',
  'TB_UNIDADE_PRODUCAO',
  'TB_GRID_FULL',
  'TB_CULTURA_QUIMICA_FULL',
  'VW_TB_CULTURA_QUIMICA',
  'VW_DASH_FERTILIDADE_SOLO',
]

export default function App() {
  const [ano, setAno] = useState('')
  const [idProprietario, setIdProprietario] = useState('')
  const [tableData, setTableData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [allOpen, setAllOpen] = useState(false)

  const load = async ({ ano: a, idProprietario: p }) => {
    setLoading(true)
    setError(null)
    setAllOpen(false)
    try {
      // TB_PROPRIETARIO sempre sem filtro de idProprietario
      const res = await fetchAll(a || null, p || null)
      setTableData(res.data)
      setLoaded(true)
    } catch {
      setError('Erro ao conectar na API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <h1 style={styles.title}>AgroSyntech</h1>
        <p style={styles.subtitle}>Exploração de dados</p>
      </div>

      <Filters
        ano={ano}
        setAno={setAno}
        idProprietario={idProprietario}
        setIdProprietario={setIdProprietario}
        onApply={load}
        loading={loading}
      />

      {error && <p style={styles.error}>{error}</p>}

      {!loaded && !loading && (
        <p style={styles.hint}>Use os filtros acima e clique em <strong>Aplicar</strong> para carregar os dados.</p>
      )}

      {loaded && (
        <>
          <div style={styles.toolbar}>
            <span style={styles.toolbarInfo}>{ALL_TABLES.length} tabelas carregadas</span>
            <button style={styles.btnExpand} onClick={() => setAllOpen(o => !o)}>
              {allOpen ? '▴ Recolher tudo' : '▾ Expandir tudo'}
            </button>
          </div>

          <div style={styles.grid}>
            {ALL_TABLES.map(name => {
              const entry = tableData[name]
              return (
                <Tables
                  key={name}
                  name={name}
                  total={entry?.total}
                  data={entry?.data}
                  loading={loading}
                  error={!entry}
                  forceOpen={allOpen}
                />
              )
            })}
          </div>
        </>
      )}

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
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#888',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarInfo: {
    fontSize: '13px',
    color: '#aaa',
  },
  btnExpand: {
    padding: '7px 16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(560px, 1fr))',
    gap: '16px',
  },
  hint: {
    color: '#aaa',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '40px',
  },
  error: {
    color: '#c0392b',
    fontSize: '13px',
    background: '#fdecea',
    borderRadius: '8px',
    padding: '10px 16px',
  },
}