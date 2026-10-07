import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowsOutSimple, Plus, Minus } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { setupLeafletDefaultIcons } from '@shared/map'

// Initialize default Leaflet marker assets safely
setupLeafletDefaultIcons()

interface PhotoLocationPickerProps {
  mode?: 'video_gpx' | 'photo_gps'
  lat?: number
  lng?: number
  endLat?: number
  endLng?: number
  routeCoordinates?: [number, number][]
  onChangeLocation?: (lat: number, lng: number) => void
  onChangeEndLocation?: (lat: number, lng: number) => void
  height?: string
}

export function PhotoLocationPicker({
  mode = 'photo_gps',
  lat,
  lng,
  endLat,
  endLng,
  routeCoordinates,
  height = '320px',
}: PhotoLocationPickerProps) {
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const startMarkerRef = useRef<L.Marker | null>(null)
  const endMarkerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const lastCenterRef = useRef<[number, number] | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialCenter: [number, number] =
      lat != null && lng != null ? [lat, lng] : [10.7769, 106.7009]
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: lat != null && lng != null ? 15 : 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    })

    // Esri World Street Map (Identical to Web ProductMap & Mobile)
    const ESRI_TILE_URL =
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    L.tileLayer(ESRI_TILE_URL, {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS',
      className: isDark ? 'dark-tiles' : '',
    }).addTo(map)

    mapInstanceRef.current = map

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
      startMarkerRef.current = null
      endMarkerRef.current = null
      polylineRef.current = null
    }
  }, [isDark])

  // Update Markers & Polyline when coordinates or mode change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const isVideo = mode === 'video_gpx'

    // If coordinates are not yet set
    if (lat == null || lng == null) {
      if (startMarkerRef.current) {
        startMarkerRef.current.remove()
        startMarkerRef.current = null
      }
      if (endMarkerRef.current) {
        endMarkerRef.current.remove()
        endMarkerRef.current = null
      }
      if (polylineRef.current) {
        polylineRef.current.remove()
        polylineRef.current = null
      }

      map.off('click')
      return
    }

    // Clean up previous markers if mode changed
    if (!isVideo && endMarkerRef.current) {
      endMarkerRef.current.remove()
      endMarkerRef.current = null
    }
    if (!isVideo && polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    // 1. Start Marker (Green dot for video start, Red pin from /product/map for photo)
    const effectiveLat = routeCoordinates && routeCoordinates.length > 0 ? routeCoordinates[0][0] : lat!
    const effectiveLng = routeCoordinates && routeCoordinates.length > 0 ? routeCoordinates[0][1] : lng!
    const isRealTrack = Boolean(routeCoordinates && routeCoordinates.length > 1)

    const startIconHtml = isVideo
      ? `
        <div style="
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
        ">
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #10b981;
            border: 2.5px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
          "></div>
        </div>
      `
      : `
        <div style="
          width: 32px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
          animation: mapPinDrop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.38)); overflow: visible;">
            <ellipse cx="16" cy="41" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/>
            <path d="M16 0C7.163 0 0 7.163 0 16c0 11.4 14.2 24.3 15.3 25.4.38.36 1.02.36 1.4 0C17.8 40.3 32 27.4 32 16 32 7.163 24.837 0 16 0z" fill="#EA4335"/>
            <path d="M16 1C7.716 1 1 7.716 1 16c0 10.8 13.5 23.2 14.7 24.3.17.16.43.16.6 0C17.5 39.2 31 26.8 31 16 31 7.716 24.284 1 16 1z" stroke="#B31412" stroke-width="1.2" fill="none"/>
            <circle cx="16" cy="15.5" r="5.5" fill="#7A0000"/>
          </svg>
        </div>
      `

    const startIcon = L.divIcon({
      className: isVideo ? 'survey-start-marker' : 'route-dest-pin-marker',
      html: startIconHtml,
      iconSize: isVideo ? [22, 22] : [32, 42],
      iconAnchor: isVideo ? [11, 11] : [16, 42],
    })

    if (!startMarkerRef.current) {
      const marker = L.marker([effectiveLat, effectiveLng], {
        icon: startIcon,
        draggable: false,
      }).addTo(map)

      startMarkerRef.current = marker
    } else {
      startMarkerRef.current.setIcon(startIcon)
      startMarkerRef.current.setLatLng([effectiveLat, effectiveLng])
    }

    // 2. End Marker & Polyline (For Video Mode: Google Maps Destination Pin from /product/map)
    const effectiveEndLat =
      routeCoordinates && routeCoordinates.length > 0
        ? routeCoordinates[routeCoordinates.length - 1][0]
        : endLat
    const effectiveEndLng =
      routeCoordinates && routeCoordinates.length > 0
        ? routeCoordinates[routeCoordinates.length - 1][1]
        : endLng

    if (isVideo && effectiveEndLat != null && effectiveEndLng != null) {
      const endIconHtml = `
        <div style="
          width: 32px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
          animation: mapPinDrop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.38)); overflow: visible;">
            <ellipse cx="16" cy="41" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/>
            <path d="M16 0C7.163 0 0 7.163 0 16c0 11.4 14.2 24.3 15.3 25.4.38.36 1.02.36 1.4 0C17.8 40.3 32 27.4 32 16 32 7.163 24.837 0 16 0z" fill="#EA4335"/>
            <path d="M16 1C7.716 1 1 7.716 1 16c0 10.8 13.5 23.2 14.7 24.3.17.16.43.16.6 0C17.5 39.2 31 26.8 31 16 31 7.716 24.284 1 16 1z" stroke="#B31412" stroke-width="1.2" fill="none"/>
            <circle cx="16" cy="15.5" r="5.5" fill="#7A0000"/>
          </svg>
        </div>
      `
      const endIcon = L.divIcon({
        className: 'route-dest-pin-marker',
        html: endIconHtml,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      })

      if (!endMarkerRef.current) {
        const marker = L.marker([effectiveEndLat, effectiveEndLng], {
          icon: endIcon,
          draggable: false,
        }).addTo(map)

        endMarkerRef.current = marker
      } else {
        endMarkerRef.current.setIcon(endIcon)
        endMarkerRef.current.setLatLng([effectiveEndLat, effectiveEndLng])
      }

      // Draw Polyline for Video Route (Full GPX Trajectory if available, else S -> D)
      const points: [number, number][] = isRealTrack
        ? routeCoordinates!
        : [
            [effectiveLat, effectiveLng],
            [effectiveEndLat, effectiveEndLng],
          ]

      if (!polylineRef.current) {
        const polyline = L.polyline(points, {
          color: isDark ? '#00c4de' : '#007b8b',
          weight: 5,
          opacity: 0.9,
          dashArray: isRealTrack ? undefined : '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map)
        polylineRef.current = polyline
        if (isRealTrack) {
          map.fitBounds(polyline.getBounds(), { padding: [35, 35], maxZoom: 17 })
        }
      } else {
        polylineRef.current.setLatLngs(points)
        polylineRef.current.setStyle({
          color: isDark ? '#00c4de' : '#007b8b',
          dashArray: isRealTrack ? undefined : '8, 8',
          opacity: 0.9,
        })
        if (isRealTrack && polylineRef.current) {
          map.fitBounds(polylineRef.current.getBounds(), { padding: [35, 35], maxZoom: 17 })
        }
      }
    } else {
      if (endMarkerRef.current) {
        endMarkerRef.current.remove()
        endMarkerRef.current = null
      }
      if (polylineRef.current) {
        polylineRef.current.remove()
        polylineRef.current = null
      }
      // Pan to new coordinate if updated from external without interrupting zoom
      const prev = lastCenterRef.current
      if (!prev || Math.abs(prev[0] - effectiveLat) > 0.0001 || Math.abs(prev[1] - effectiveLng) > 0.0001) {
        lastCenterRef.current = [effectiveLat, effectiveLng]
        map.panTo([effectiveLat, effectiveLng])
      }
    }

    map.off('click')
  }, [mode, lat, lng, endLat, endLng, routeCoordinates, isDark])

  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const map = mapInstanceRef.current
    if (map) {
      map.setZoom(map.getZoom() + 1)
    }
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const map = mapInstanceRef.current
    if (map) {
      map.setZoom(map.getZoom() - 1)
    }
  }

  const handleResetView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const map = mapInstanceRef.current
    if (!map) return
    if (mode === 'video_gpx' && lat != null && lng != null && endLat != null && endLng != null) {
      const bounds = L.latLngBounds([
        [lat, lng],
        [endLat, endLng],
      ])
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
    } else if (lat != null && lng != null) {
      map.setView([lat, lng], 16)
    }
  }

  const hasLocation = lat != null && lng != null

  return (
    <div className="relative isolate z-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Floating Map Controls: Bottom Right Stack */}
      <div className="absolute right-3.5 bottom-3.5 z-[1000] flex flex-col items-center gap-2 pointer-events-auto">
        {/* Recenter Route Bounds (Only for Video with Both S & D) */}
        {mode === 'video_gpx' && hasLocation && endLat != null && endLng != null && (
          <button
            type="button"
            onClick={handleResetView}
            title="Thu phóng toàn tuyến"
            className={`w-9 h-9 rounded-xl border shadow-md flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-[#071317] border-white/10 text-gray-200 hover:bg-white/10'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowsOutSimple size={16} weight="bold" />
          </button>
        )}

        {/* Zoom In & Zoom Out Stack (Google Maps Style) */}
        <div
          className={`flex flex-col rounded-xl border shadow-md overflow-hidden ${
            isDark
              ? 'bg-[#071317] border-white/10 text-gray-100'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            className={`w-9 h-8 flex items-center justify-center transition-colors cursor-pointer active:bg-gray-200 dark:active:bg-white/20 ${
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
            className={`w-9 h-8 flex items-center justify-center transition-colors cursor-pointer active:bg-gray-200 dark:active:bg-white/20 ${
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
