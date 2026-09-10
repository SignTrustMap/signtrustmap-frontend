import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { NavigationArrow, MapPin } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'

interface ReviewerMiniMapProps {
  lat: number
  lng: number
  heading: number
  roadName: string
  signCode: string
  trafficFlowDirection: string
}

// Fix Leaflet default marker icons in bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export function ReviewerMiniMap({
  lat,
  lng,
  heading,
  roadName,
  signCode,
  trafficFlowDirection,
}: ReviewerMiniMapProps) {
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Add custom sign marker with directional heading cone
    const customIcon = L.divIcon({
      className: 'reviewer-map-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <!-- Heading Vector Pointer -->
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            transform: rotate(${heading}deg);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            pointer-events: none;
          ">
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-bottom: 12px solid #00c4de;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
              margin-top: -6px;
            "></div>
          </div>
          <!-- Sign Dot -->
          <div style="
            width: 26px;
            height: 26px;
            background: #ef4444;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            font-family: monospace;
            z-index: 2;
          ">
            ${signCode.split('.')[0] || 'P'}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
    markerRef.current = marker
    mapInstanceRef.current = map

    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [])

  // Update map center and marker when coordinates or heading change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    mapInstanceRef.current.setView([lat, lng], 16, { animate: true })

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      const customIcon = L.divIcon({
        className: 'reviewer-map-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 36px;
              height: 36px;
              transform: rotate(${heading}deg);
              display: flex;
              align-items: flex-start;
              justify-content: center;
              pointer-events: none;
            ">
              <div style="
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 12px solid #00c4de;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                margin-top: -6px;
              "></div>
            </div>
            <div style="
              width: 26px;
              height: 26px;
              background: #ef4444;
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 10px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 9px;
              font-weight: 800;
              font-family: monospace;
              z-index: 2;
            ">
              ${signCode.split('.')[0] || 'P'}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      markerRef.current.setIcon(customIcon)
    }
  }, [lat, lng, heading, signCode])

  return (
    <div
      className={`rounded-2xl border overflow-hidden relative shadow-md transition-colors ${
        isDark ? 'bg-[#061417] border-white/10' : 'bg-white border-gray-200'
      }`}
    >
      {/* Map Header */}
      <div
        className={`px-3.5 py-2 border-b text-[11px] flex items-center justify-between font-mono ${
          isDark ? 'bg-white/[0.03] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}
      >
        <span className="flex items-center gap-1.5 font-bold truncate max-w-[200px] text-gray-900 dark:text-gray-100">
          <MapPin size={13} className="text-red-500 shrink-0" weight="fill" />
          <span className="truncate">{roadName}</span>
        </span>
        <span className="flex items-center gap-1 text-[#007b8b] dark:text-[#00c4de] shrink-0 font-bold">
          <NavigationArrow size={12} style={{ transform: `rotate(${heading}deg)` }} weight="fill" />
          <span>{heading}° ({trafficFlowDirection})</span>
        </span>
      </div>

      {/* Map Canvas (isolate z-0 according to RULE.md) */}
      <div className="relative isolate z-0 w-full h-[150px] sm:h-[180px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        <div
          className={`absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono shadow-xs pointer-events-none ${
            isDark ? 'bg-black/80 text-gray-300 border border-white/10' : 'bg-white/95 text-gray-800 border border-gray-300 font-bold'
          }`}
        >
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      </div>
    </div>
  )
}
