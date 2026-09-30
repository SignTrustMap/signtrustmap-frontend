import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { NavigationArrow, ArrowsOutSimple, Plus, Minus } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { setupLeafletDefaultIcons } from '@shared/map'

// Initialize default Leaflet marker assets safely
setupLeafletDefaultIcons()

interface PhotoLocationPickerProps {
  mode?: 'video_gpx' | 'photo_gps'
  lat: number
  lng: number
  endLat?: number
  endLng?: number
  onChangeLocation: (lat: number, lng: number) => void
  onChangeEndLocation?: (lat: number, lng: number) => void
  height?: string
}

export function PhotoLocationPicker({
  mode = 'photo_gps',
  lat,
  lng,
  endLat,
  endLng,
  onChangeLocation,
  onChangeEndLocation,
  height = '320px',
}: PhotoLocationPickerProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const startMarkerRef = useRef<L.Marker | null>(null)
  const endMarkerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialCenter: [number, number] = [lat, lng]
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    })

    // OpenStreetMap free tile server with dark filter in dark mode
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      className: isDark ? 'dark-tiles' : '',
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
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

    // Clean up previous markers if mode changed
    if (!isVideo && endMarkerRef.current) {
      endMarkerRef.current.remove()
      endMarkerRef.current = null
    }
    if (!isVideo && polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    // 1. Start Marker (Green S badge for video, Red pin for photo)
    const startIconHtml = isVideo
      ? `
        <div style="
          background: #16a34a;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-family: monospace;
          font-size: 15px;
        ">
          S
        </div>
      `
      : `
        <div style="
          background: #ef4444;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <div style="transform: rotate(45deg); width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
        </div>
      `

    const startIcon = L.divIcon({
      className: 'survey-start-marker',
      html: startIconHtml,
      iconSize: isVideo ? [32, 32] : [32, 32],
      iconAnchor: isVideo ? [16, 16] : [16, 32],
    })

    if (!startMarkerRef.current) {
      const marker = L.marker([lat, lng], {
        icon: startIcon,
        draggable: true,
      }).addTo(map)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChangeLocation(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)))
      })

      startMarkerRef.current = marker
    } else {
      startMarkerRef.current.setIcon(startIcon)
      startMarkerRef.current.setLatLng([lat, lng])
    }

    // 2. End Marker & Polyline (For Video Mode)
    if (isVideo && endLat != null && endLng != null) {
      const endIconHtml = `
        <div style="
          background: #dc2626;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-family: monospace;
          font-size: 15px;
        ">
          D
        </div>
      `
      const endIcon = L.divIcon({
        className: 'survey-end-marker',
        html: endIconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      if (!endMarkerRef.current) {
        const marker = L.marker([endLat, endLng], {
          icon: endIcon,
          draggable: true,
        }).addTo(map)

        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChangeEndLocation?.(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)))
        })

        endMarkerRef.current = marker
      } else {
        endMarkerRef.current.setLatLng([endLat, endLng])
      }

      // Draw Polyline connecting S -> D
      const points: [number, number][] = [
        [lat, lng],
        [endLat, endLng],
      ]

      if (!polylineRef.current) {
        const polyline = L.polyline(points, {
          color: isDark ? '#00c4de' : '#007b8b',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map)
        polylineRef.current = polyline
      } else {
        polylineRef.current.setLatLngs(points)
        polylineRef.current.setStyle({
          color: isDark ? '#00c4de' : '#007b8b',
        })
      }

      // Fit bounds to show both S and D
      try {
        const bounds = L.latLngBounds([
          [lat, lng],
          [endLat, endLng],
        ])
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
      } catch {
        // Ignore zoom errors on rapid updates
      }
    } else {
      map.panTo([lat, lng])
    }

    // Map Click Listener
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // In photo mode: moves marker
      if (!isVideo) {
        startMarkerRef.current?.setLatLng(e.latlng)
        onChangeLocation(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)))
      }
    }

    map.off('click')
    map.on('click', handleMapClick)
  }, [mode, lat, lng, endLat, endLng, isDark])

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = Number(pos.coords.latitude.toFixed(6))
          const newLng = Number(pos.coords.longitude.toFixed(6))
          onChangeLocation(newLat, newLng)
          mapInstanceRef.current?.setView([newLat, newLng], 16)
        },
        () => {
          // Fallback to central HCMC
          const fallbackLat = 10.7769
          const fallbackLng = 106.7009
          onChangeLocation(fallbackLat, fallbackLng)
          mapInstanceRef.current?.setView([fallbackLat, fallbackLng], 16)
        }
      )
    }
  }

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut()
  }

  const handleResetView = () => {
    const map = mapInstanceRef.current
    if (!map) return
    if (mode === 'video_gpx' && endLat != null && endLng != null) {
      const bounds = L.latLngBounds([
        [lat, lng],
        [endLat, endLng],
      ])
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
    } else {
      map.setView([lat, lng], 16)
    }
  }

  return (
    <div className="relative isolate z-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Sleek Floating Map Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 p-1 rounded-xl border shadow-md backdrop-blur-md transition-colors bg-white/95 dark:bg-black/85 border-gray-200 dark:border-white/15">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Phóng to"
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
        >
          <Plus size={14} weight="bold" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          title="Thu nhỏ"
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
        >
          <Minus size={14} weight="bold" />
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-white/15 mx-0.5" />

        <button
          type="button"
          onClick={handleResetView}
          title="Thu phóng toàn tuyến"
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
        >
          <ArrowsOutSimple size={14} weight="bold" />
        </button>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          title={t('survey.btn_get_current_loc', 'Lấy GPS hiện tại')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] hover:bg-[#007b8b]/20 dark:hover:bg-[#00c4de]/20 text-xs font-bold transition-colors cursor-pointer"
        >
          <NavigationArrow size={13} weight="bold" />
          <span className="hidden sm:inline">{t('survey.lbl_current_loc', 'GPS')}</span>
        </button>
      </div>

      {/* Legend badge bottom left */}
      <div
        className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-xl text-[11px] font-mono border backdrop-blur-md z-10 flex items-center gap-2.5 transition-colors ${
          isDark
            ? 'bg-black/80 border-white/15 text-gray-300'
            : 'bg-white/90 border-gray-200 text-gray-700 shadow-sm'
        }`}
      >
        {mode === 'video_gpx' ? (
          <>
            <span className="flex items-center gap-1 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block shadow-xs" />
              <span>S: Bắt đầu</span>
            </span>
            <span className="flex items-center gap-1 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block shadow-xs" />
              <span>D: Kết thúc</span>
            </span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              • Kéo thả điểm để chỉnh toạ độ
            </span>
          </>
        ) : (
          <span className="font-medium">Kéo thả ghim để chỉnh toạ độ</span>
        )}
      </div>
    </div>
  )
}
