import { useEffect, useRef } from 'react'

const TALHAO_COLORS = [
  '#e53935', '#8e24aa', '#1e88e5', '#00897b', '#f4511e',
  '#6d4c41', '#3949ab', '#039be5', '#43a047', '#fb8c00',
  '#d81b60', '#546e7a', '#c0ca33', '#7b1fa2', '#0288d1',
]

function parseCoordsString(str) {
  return str
    .split(',')
    .map((pair) => {
      const parts = pair.trim().split(/\s+/)
      if (parts.length < 2) return null
      const lng = Number(parts[0])
      const lat = Number(parts[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return [lat, lng]
    })
    .filter(Boolean)
}

function parseGeom(wkt) {
  if (!wkt || typeof wkt !== 'string') return []
  const clean = wkt.trim().replace(/^SRID=\d+;/i, '')

  // POLYGON ((x y, ...))
  let m = clean.match(/^POLYGON\s*\(\(\s*(.*?)\s*\)\)$/i)
  if (m) return parseCoordsString(m[1])

  // MULTIPOLYGON — usa o primeiro anel
  m = clean.match(/MULTIPOLYGON\s*\(\(\(\s*(.*?)\s*\)\)/i)
  if (m) return parseCoordsString(m[1])

  return []
}

let leafletLoaded = false
let leafletCallbacks = []

function loadLeaflet(cb) {
  if (window.L) { cb(); return }
  leafletCallbacks.push(cb)
  if (leafletLoaded) return
  leafletLoaded = true

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)

  const script = document.createElement('script')
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  script.onload = () => { leafletCallbacks.forEach(fn => fn()); leafletCallbacks = [] }
  document.head.appendChild(script)
}

export default function GeoMap({
  wkt,
  talhoes = [],
  showTalhoes = false,
  onTalhaoClick,
  talhaoSelecionado,
}) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)

  // ── Cria / recria o mapa quando a geometria ou os talhões mudam ─────────────
  useEffect(() => {
    if (!wkt) return

    loadLeaflet(() => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }

      const L = window.L
      const coords = parseGeom(wkt)
      if (!coords.length || !mapRef.current) return

      const map = L.map(mapRef.current, {
        zoomControl: showTalhoes,
        dragging: showTalhoes,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

      const fazendaPoly = L.polygon(coords, {
        color: '#2e7d32',
        fillColor: '#66bb6a',
        fillOpacity: showTalhoes ? 0.04 : 0.35,
        weight: showTalhoes ? 1 : 2,
        dashArray: showTalhoes ? '4 4' : null,
      }).addTo(map)

      // bounds inicial = fazenda; expande para incluir todos os talhões
      let bounds = fazendaPoly.getBounds()

      if (showTalhoes && talhoes.length) {
        talhoes.forEach((talhao, idx) => {
          const tc = parseGeom(talhao.geom)
          if (!tc.length) return

          const cor        = TALHAO_COLORS[idx % TALHAO_COLORS.length]
          const selecionado = talhaoSelecionado != null &&
                              String(talhao.id) === String(talhaoSelecionado)

          const poly = L.polygon(tc, {
            color: cor,
            fillColor: cor,
            fillOpacity: selecionado ? 0.7 : 0.4,
            weight: selecionado ? 3 : 1.5,
          })

          poly.bindTooltip(talhao.nome || `Talhão ${talhao.id}`, {
            sticky: true,
          })

          if (onTalhaoClick) {
            poly.on('click',     () => onTalhaoClick(talhao.id))
            poly.on('mouseover', function () { if (!selecionado) this.setStyle({ fillOpacity: 0.6 }) })
            poly.on('mouseout',  function () { if (!selecionado) this.setStyle({ fillOpacity: 0.4 }) })
          }

          poly.addTo(map)
          bounds = bounds.extend(poly.getBounds())
        })
      }

      map.fitBounds(bounds, { padding: [16, 16] })
      setTimeout(() => { map.invalidateSize(); map.fitBounds(bounds, { padding: [16, 16] }) }, 100)

      instanceRef.current = map
    })

    return () => {
      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null }
    }
  }, [wkt, talhoes, showTalhoes, talhaoSelecionado])


  if (!wkt) return null

  return (
    <div style={styles.wrapper}>
      <div
        ref={mapRef}
        style={{ ...styles.map, height: showTalhoes ? '320px' : '220px' }}
      />
      {showTalhoes && talhoes.length > 0 && (
        <div style={styles.legenda}>
          {talhoes.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              style={{
                ...styles.legendaItem,
                borderColor: String(talhaoSelecionado) === String(t.id)
                  ? TALHAO_COLORS[idx % TALHAO_COLORS.length] : 'transparent',
                background: String(talhaoSelecionado) === String(t.id)
                  ? `${TALHAO_COLORS[idx % TALHAO_COLORS.length]}18` : 'transparent',
              }}
              onClick={() => onTalhaoClick?.(t.id)}
            >
              <span style={{ ...styles.legendaDot, background: TALHAO_COLORS[idx % TALHAO_COLORS.length] }} />
              <span style={styles.legendaNome}>{t.nome || `Talhão ${t.id}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    marginTop: '8px',
    background: '#e8e8e8',
  },
  map: {
    width: '100%',
    transition: 'height 0.3s ease',
  },
  legenda: {
    background: '#fff',
    borderTop: '1px solid #f0f0f0',
    padding: '8px 10px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  legendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 7px',
    borderRadius: '999px',
    border: '1.5px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  legendaDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendaNome: {
    fontSize: 10,
    fontWeight: 600,
    color: '#374151',
    whiteSpace: 'nowrap',
  },
}
