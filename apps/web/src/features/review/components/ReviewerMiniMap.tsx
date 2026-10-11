import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Minus, Plus, Stack } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { setupLeafletDefaultIcons } from '@shared/map'

// Initialize default Leaflet marker assets safely (no external CDN dependency)
setupLeafletDefaultIcons()

const ESRI_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export interface ReviewerMiniMapProps {
  lat: number
  lng: number
  heading?: number
  roadName?: string
  signCode: string
  trafficFlowDirection?: string
  signName?: string
  cropImageUrl?: string
  heightClassName?: string
}

/**
 * Creates the exact Google Maps-styled Red Location Pin used across /product/map and PhotoLocationPicker.
 */
function createMapPinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'route-dest-pin-marker',
    html: `
      <div style="
        width: 32px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation: mapPinDrop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.38)); overflow: visible;">
          <ellipse cx="16" cy="41" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/>
          <path d="M16 0C7.163 0 0 7.163 0 16c0 11.4 14.2 24.3 15.3 25.4.38.36 1.02.36 1.4 0C17.8 40.3 32 27.4 32 16 32 7.163 24.837 0 16 0z" fill="#EA4335"/>
          <path d="M16 1C7.716 1 1 7.716 1 16c0 10.8 13.5 23.2 14.7 24.3.17.16.43.16.6 0C17.5 39.2 31 26.8 31 16 31 7.716 24.284 1 16 1z" stroke="#B31412" stroke-width="1.2" fill="none"/>
          <circle cx="16" cy="15.5" r="5.5" fill="#7A0000"/>
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  })
}

/**
 * ReviewerMiniMap renders the exact map used on /product/map
 * (Leaflet canvas, Esri/OSM layer switcher, Google Maps-styled floating controls,
 * and the exact red Map Pin used by /product/map and PhotoLocationPicker),
 * focused directly on the sign coordinate without the search bar.
 */
export function ReviewerMiniMap({
  lat,
  lng,
  signCode,
  signName,
  heightClassName = 'h-[280px] sm:h-[320px]',
}: ReviewerMiniMapProps) {
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const pinMarkerRef = useRef<L.Marker | null>(null)

  const [tileMode, setTileMode] = useState<'esri' | 'osm'>('esri')

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const validLat = Number.isFinite(Number(lat)) && Math.abs(Number(lat)) <= 90 ? Number(lat) : 10.7769
    const validLng = Number.isFinite(Number(lng)) && Math.abs(Number(lng)) <= 180 ? Number(lng) : 106.7009

    const map = L.map(mapContainerRef.current, {
      center: [validLat, validLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    })

    const initialTile = L.tileLayer(ESRI_TILE_URL, {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS',
      className: isDark ? 'dark-tiles' : '',
    }).addTo(map)
    tileLayerRef.current = initialTile

    // Add Map Pin
    const marker = L.marker([validLat, validLng], { icon: createMapPinIcon() }).addTo(map)
    const label = signName ? `${signCode} - ${signName}` : signCode
    if (label) {
      marker.bindTooltip(label, {
        direction: 'top',
        offset: [0, -42],
      })
    }
    pinMarkerRef.current = marker

    mapInstanceRef.current = map

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
      pinMarkerRef.current = null
      tileLayerRef.current = null
    }
  }, [])

  // Switch Tile Layer (Esri vs OSM)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    mapInstanceRef.current.removeLayer(tileLayerRef.current)

    const newUrl = tileMode === 'osm' ? OSM_TILE_URL : ESRI_TILE_URL
    const newAttribution =
      tileMode === 'osm'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        : 'Tiles &copy; Esri &mdash; Source: Esri, USGS'

    const newLayer = L.tileLayer(newUrl, {
      attribution: newAttribution,
      maxZoom: 19,
      className: isDark ? 'dark-tiles' : '',
    }).addTo(mapInstanceRef.current)

    tileLayerRef.current = newLayer
  }, [tileMode])

  // Synchronize Dark Mode filter on map tiles
  useEffect(() => {
    if (!tileLayerRef.current) return
    const container = tileLayerRef.current.getContainer()
    if (container) {
      if (isDark) {
        container.classList.add('dark-tiles')
      } else {
        container.classList.remove('dark-tiles')
      }
    }
  }, [isDark])

  const isInitialMount = useRef(true)
  const prevCoordsRef = useRef<{ lat: number; lng: number } | null>(null)

  // Update map center and pin position smoothly when coordinates change (eliminates shaking/jitter)
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    const validLat = Number.isFinite(Number(lat)) && Math.abs(Number(lat)) <= 90 ? Number(lat) : 10.7769
    const validLng = Number.isFinite(Number(lng)) && Math.abs(Number(lng)) <= 180 ? Number(lng) : 106.7009

    // Skip on initial mount since map was already created at center [validLat, validLng]
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevCoordsRef.current = { lat: validLat, lng: validLng }
      return
    }

    const prev = prevCoordsRef.current
    const isVirtuallySame =
      prev &&
      Math.abs(prev.lat - validLat) < 0.000005 &&
      Math.abs(prev.lng - validLng) < 0.000005

    // Always update tooltip label if sign code/name changed
    if (pinMarkerRef.current) {
      const label = signName ? `${signCode} - ${signName}` : signCode
      if (label) {
        pinMarkerRef.current.setTooltipContent(label)
      }
    }

    if (isVirtuallySame) {
      return
    }

    prevCoordsRef.current = { lat: validLat, lng: validLng }

    // Cancel any ongoing pan/zoom animations immediately to prevent frame collisions & shaking
    map.stop()
    map.invalidateSize()

    const currentCenter = map.getCenter()
    const distMeters = currentCenter.distanceTo([validLat, validLng])

    if (distMeters < 0.5) {
      // Same coordinate point, no camera movement needed
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([validLat, validLng])
      }
    } else if (distMeters < 3000) {
      // Nearby point (< 3km): smooth pan at the existing zoom level (zero zoom pulsing or tile stretch)
      map.panTo([validLat, validLng], {
        animate: true,
        duration: 0.35,
        easeLinearity: 0.5,
      })
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([validLat, validLng])
      }
    } else {
      // Far point: instant clean setView without multi-zoom fly oscillation
      map.setView([validLat, validLng], map.getZoom() || 16, { animate: false })
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([validLat, validLng])
      }
    }

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 60)
    return () => clearTimeout(timer)
  }, [lat, lng, signCode, signName])

  const handleToggleTileMode = useCallback(() => {
    setTileMode((prev) => (prev === 'esri' ? 'osm' : 'esri'))
  }, [])

  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut()
  }, [])

  const handleRecenter = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.stop()
      mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.35 })
    }
  }, [lat, lng])

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden ${heightClassName} relative isolate flex flex-col transition-colors ${
        isDark
          ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
          : 'bg-white border-[#E8E4E3] shadow-xs'
      }`}
    >
      {/* Leaflet Canvas (isolate z-0 according to RULE.md) */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-Right: Map Layer Switcher (Pill Style, matching /product/map) */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          type="button"
          onClick={handleToggleTileMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-md hover:shadow-lg backdrop-blur-md transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#071317]/90 hover:bg-[#0c1e24] text-gray-100 border-white/10'
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
          }`}
          title={tileMode === 'esri' ? 'Chuyển sang OpenStreetMap' : 'Chuyển sang Esri Streets'}
        >
          <Stack
            size={15}
            weight="bold"
            className="text-[#007b8b] dark:text-[#00c4de]"
          />
          <span>{tileMode === 'esri' ? 'Esri Streets' : 'OpenStreetMap'}</span>
        </button>
      </div>

      {/* Bottom-Right: Google Maps Control Stack (matching /product/map) */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-center gap-2 pointer-events-auto">
        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 text-[#007b8b] dark:text-[#00c4de] ${
            isDark
              ? 'bg-[#071317]/90 hover:bg-[#0c1e24] border-white/10'
              : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
          title="Căn giữa vị trí biển báo"
        >
          <Crosshair size={18} weight="bold" />
        </button>

        {/* Zoom In & Zoom Out Stack */}
        <div
          className={`flex flex-col rounded-xl border shadow-md overflow-hidden ${
            isDark
              ? 'bg-[#071317]/90 border-white/10 text-gray-100'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            className={`w-9 h-9 flex items-center justify-center transition-colors cursor-pointer active:bg-gray-200 dark:active:bg-white/20 ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            title="Phóng to"
          >
            <Plus size={16} weight="bold" />
          </button>

          <div className={`w-full h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

          <button
            type="button"
            onClick={handleZoomOut}
            className={`w-9 h-9 flex items-center justify-center transition-colors cursor-pointer active:bg-gray-200 dark:active:bg-white/20 ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            title="Thu nhỏ"
          >
            <Minus size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
