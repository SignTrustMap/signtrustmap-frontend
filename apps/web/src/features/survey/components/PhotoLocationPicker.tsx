import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { NavigationArrow } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'

interface PhotoLocationPickerProps {
  lat: number
  lng: number
  onChangeLocation: (lat: number, lng: number) => void
  height?: string
}

export function PhotoLocationPicker({
  lat,
  lng,
  onChangeLocation,
  height = '240px',
}: PhotoLocationPickerProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    })

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    const markerIcon = L.divIcon({
      className: 'picker-pin-marker',
      html: `
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
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    const marker = L.marker([lat, lng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onChangeLocation(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)))
    })

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onChangeLocation(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)))
    })

    markerRef.current = marker
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [isDark])

  // Sync marker position if lat/lng changed externally
  useEffect(() => {
    if (markerRef.current) {
      const currentPos = markerRef.current.getLatLng()
      if (currentPos.lat !== lat || currentPos.lng !== lng) {
        markerRef.current.setLatLng([lat, lng])
        mapInstanceRef.current?.panTo([lat, lng])
      }
    }
  }, [lat, lng])

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
          // Fallback to central HCMC location with random slight offset
          const fallbackLat = Number((10.7769 + (Math.random() - 0.5) * 0.01).toFixed(6))
          const fallbackLng = Number((106.7009 + (Math.random() - 0.5) * 0.01).toFixed(6))
          onChangeLocation(fallbackLat, fallbackLng)
          mapInstanceRef.current?.setView([fallbackLat, fallbackLng], 16)
        }
      )
    }
  }

  return (
    <div className="relative isolate z-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Action overlay */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          title={t('survey.btn_get_current_loc')}
          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md cursor-pointer transition-all ${
            isDark
              ? 'bg-black/80 hover:bg-black border-white/20 text-[#00c4de]'
              : 'bg-white/90 hover:bg-white border-gray-200 text-[#007b8b]'
          }`}
        >
          <NavigationArrow size={14} weight="bold" />
          <span>{t('survey.lbl_current_loc')}</span>
        </button>
      </div>

      <div
        className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-mono border backdrop-blur-md z-10 ${
          isDark ? 'bg-black/75 border-white/10 text-gray-400' : 'bg-white/85 border-gray-200 text-gray-600'
        }`}
      >
        {t('survey.drag_marker_hint')}
      </div>
    </div>
  )
}
