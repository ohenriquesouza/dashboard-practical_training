import { useEffect, useRef } from 'react'

function parseWKT(wkt) {
  if (!wkt || typeof wkt !== 'string') return []

  const cleanWkt = wkt.trim().replace(/^SRID=\d+;/i, '')

  const match = cleanWkt.match(/POLYGON\s*\(\(\s*(.*?)\s*\)\)/i)
  if (!match) return []

  return match[1]
    .split(',')
    .map((pair) => {
      const parts = pair.trim().split(/\s+/) // <- aqui está a correção principal
      if (parts.length < 2) return null

      const lng = Number(parts[0])
      const lat = Number(parts[1])

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

      return [lat, lng]
    })
    .filter(Boolean)
}

let leafletLoaded = false
let leafletCallbacks = []

function loadLeaflet(cb) {
  if (window.L) {
    cb()
    return
  }

  leafletCallbacks.push(cb)
  if (leafletLoaded) return
  leafletLoaded = true

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)

  const script = document.createElement('script')
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  script.onload = () => {
    leafletCallbacks.forEach((fn) => fn())
    leafletCallbacks = []
  }
  document.head.appendChild(script)
}

export default function GeoMap({ wkt }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!wkt) return

    loadLeaflet(() => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }

      const L = window.L
      const coords = parseWKT(wkt)

      console.log('WKT recebido:', wkt)
      console.log('Coords parseadas:', coords)

      if (!coords.length || !mapRef.current) return

      const map = L.map(mapRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

      const polygon = L.polygon(coords, {
        color: '#2e7d32',
        fillColor: '#66bb6a',
        fillOpacity: 0.35,
        weight: 2,
      }).addTo(map)

      map.fitBounds(polygon.getBounds(), { padding: [16, 16] })

      setTimeout(() => {
        map.invalidateSize()
        map.fitBounds(polygon.getBounds(), { padding: [16, 16] })
      }, 100)

      instanceRef.current = map
    })

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, [wkt])

  if (!wkt) return null

  return (
    <div style={styles.wrapper}>
      <div ref={mapRef} style={styles.map} />
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
    height: '220px',
    width: '100%',
  },
}