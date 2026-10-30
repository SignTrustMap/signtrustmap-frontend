import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, Minus, ArrowSquareOut, MapPin } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { setupLeafletDefaultIcons } from '@shared/map'

setupLeafletDefaultIcons()

const ESRI_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

function createMapPinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'sign-minimap-pin',
    html: `
      <div style="width: 26px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <svg width="26" height="34" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
          <ellipse cx="16" cy="41" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/>
          <path d="M16 0C7.163 0 0 7.163 0 16c0 11.4 14.2 24.3 15.3 25.4.38.36 1.02.36 1.4 0C17.8 40.3 32 27.4 32 16 32 7.163 24.837 0 16 0z" fill="#EA4335"/>
          <path d="M16 1C7.716 1 1 7.716 1 16c0 10.8 13.5 23.2 14.7 24.3.17.16.43.16.6 0C17.5 39.2 31 26.8 31 16 31 7.716 24.284 1 16 1z" stroke="#B31412" stroke-width="1.2" fill="none"/>
          <circle cx="16" cy="15.5" r="5" fill="#7A0000"/>
        </svg>
      </div>
    `,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
  })
}

export interface SignMiniMapProps {
  lat: number
  lng: number
  title?: string
  heightClassName?: string
}

export function SignMiniMap({
  lat,
  lng,
  title,
  heightClassName = 'h-[160px] sm:h-[180px]',
}: SignMiniMapProps) {
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const validLat = Number.isFinite(Number(lat)) && Math.abs(Number(lat)) <= 90 ? Number(lat) : 10.7769
  const validLng = Number.isFinite(Number(lng)) && Math.abs(Number(lng)) <= 180 ? Number(lng) : 106.7009

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [validLat, validLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      dragging: true,
    })

    const tile = L.tileLayer(ESRI_TILE_URL, {
      maxZoom: 19,
      attribution: 'Esri',
      className: isDark ? 'dark-tiles' : '',
    }).addTo(map)
    tileLayerRef.current = tile

    const marker = L.marker([validLat, validLng], { icon: createMapPinIcon() }).addTo(map)
    if (title) {
      marker.bindTooltip(title, { direction: 'top', offset: [0, -34] })
    }

    mapInstanceRef.current = map

    // Invalidate size after modal animation completes
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
      tileLayerRef.current = null
    }
  }, [validLat, validLng, isDark, title])

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    mapInstanceRef.current?.zoomIn()
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    mapInstanceRef.current?.zoomOut()
  }

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation()
    mapInstanceRef.current?.setView([validLat, validLng], 16)
  }

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 ${heightClassName} bg-slate-100 dark:bg-black/40 shadow-2xs group`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating GPS coordinates chip */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/80 backdrop-blur-xs border border-gray-200/80 dark:border-white/10 text-[10px] font-mono text-gray-700 dark:text-gray-200 flex items-center gap-1 shadow-2xs pointer-events-none">
        <MapPin size={11} className="text-[#EA4335]" weight="bold" />
        <span>{validLat.toFixed(5)}°, {validLng.toFixed(5)}°</span>
      </div>

      {/* Floating Controls: Recenter, Zoom In/Out, Google Maps Link */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={handleRecenter}
          className="w-6 h-6 rounded-md bg-white/90 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-xs border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 flex items-center justify-center text-[10px] shadow-2xs transition-colors cursor-pointer"
          title="Đưa về vị trí biển"
        >
          <MapPin size={12} weight="bold" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-6 h-6 rounded-md bg-white/90 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-xs border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 flex items-center justify-center text-[10px] shadow-2xs transition-colors cursor-pointer"
          title="Phóng to"
        >
          <Plus size={11} weight="bold" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-6 h-6 rounded-md bg-white/90 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-xs border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 flex items-center justify-center text-[10px] shadow-2xs transition-colors cursor-pointer"
          title="Thu nhỏ"
        >
          <Minus size={11} weight="bold" />
        </button>
        <a
          href={`https://www.google.com/maps?q=${validLat},${validLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-6 h-6 rounded-md bg-white/90 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-xs border border-gray-200/80 dark:border-white/10 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center text-[10px] shadow-2xs transition-colors cursor-pointer"
          title="Mở Google Maps"
        >
          <ArrowSquareOut size={12} weight="bold" />
        </a>
      </div>
    </div>
  )
}
export default SignMiniMap
