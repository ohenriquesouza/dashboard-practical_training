import { useState } from 'react'
import GeoMap from './GeoMap'

const GEO_COLUMNS = ['geom']

export default function Data({ data }) {
  const [showGeomRow, setShowGeomRow] = useState({})
  const [showMapRow, setShowMapRow]   = useState({})

  if (!data || data.length === 0) return <p style={styles.empty}>Sem dados.</p>

  const allColumns = Object.keys(data[0])
  const geoCol     = allColumns.find(c => GEO_COLUMNS.includes(c.toLowerCase()))
  const columns    = allColumns.filter(c => !GEO_COLUMNS.includes(c.toLowerCase()))

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} style={styles.th}>{col}</th>
            ))}
            {geoCol && <th style={styles.th}>geom</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <>
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                {columns.map(col => (
                  <td key={col} style={styles.td}>
                    {row[col] === null || row[col] === undefined ? '—' : String(row[col])}
                  </td>
                ))}
                {geoCol && (
                  <td style={styles.td}>
                    <div style={styles.geomActions}>
                      <button
                        style={styles.geomBtn}
                        onClick={() => setShowGeomRow(s => ({ ...s, [i]: !s[i] }))}
                      >
                        {showGeomRow[i] ? 'ocultar' : 'ver WKT'}
                      </button>
                      <button
                        style={{ ...styles.geomBtn, ...styles.geomBtnMap }}
                        onClick={() => setShowMapRow(s => ({ ...s, [i]: !s[i] }))}
                      >
                        {showMapRow[i] ? '🗺 fechar' : '🗺 mapa'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
               {/* manter oculto até que seja pedido - muito grande pra grid exibir sempre */}
              {geoCol && showGeomRow[i] && (
                <tr key={`geom-wkt-${i}`} style={styles.expandRow}>
                  <td colSpan={columns.length + 1} style={styles.expandCell}>
                    <code style={styles.wkt}>{row[geoCol]}</code>
                  </td>
                </tr>
              )}

              {geoCol && showMapRow[i] && (
                <tr key={`geom-map-${i}`} style={styles.expandRow}>
                  <td colSpan={columns.length + 1} style={styles.expandCell}>
                    <GeoMap wkt={row[geoCol]} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  wrapper: {
    overflowX: 'auto',
    maxHeight: '360px',
    overflowY: 'auto',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  th: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '8px 10px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: '6px 10px',
    borderBottom: '1px solid #eee',
    whiteSpace: 'nowrap',
    color: '#333',
  },
  rowEven: { background: '#fff' },
  rowOdd:  { background: '#f7f7f7' },
  empty:   { color: '#999', fontStyle: 'italic', padding: '12px 16px', margin: 0 },
  geomActions: { display: 'flex', gap: '6px' },
  geomBtn: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    color: '#555',
    fontFamily: 'monospace',
  },
  geomBtnMap: {
    background: '#e8f5e9',
    borderColor: '#a5d6a7',
    color: '#2e7d32',
  },
  expandRow: { background: '#fafafa' },
  expandCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
  },
  wkt: {
    display: 'block',
    fontSize: '11px',
    color: '#666',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    background: '#f4f4f4',
    padding: '8px',
    borderRadius: '6px',
  },
}